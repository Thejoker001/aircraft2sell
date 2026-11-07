/* a2s-actions.js — Dispatcher A2SActions autonome pour pages SANS nav.js
   (admin-a2s00760.html : panneau admin, structure DOM propre, ne charge pas
   la navbar publique). Copie EXACTE du bloc A2SActions de nav.js (06/11/26) —
   si le mécanisme du dispatcher évolue dans nav.js, répercuter le changement
   ICI AUSSI (duplication volontaire pour éviter de coupler ce fichier à la
   logique navbar de nav.js, qui s'attend à une structure DOM publique absente
   en admin). */
/* ============================================================
   A2SActions — délégation d'événements CSP-safe (remplace onclick=/
   onchange=/oninput=/onsubmit=/onkeydown= inline, chantier retrait
   unsafe-inline de script-src, 06/11/26).

   Attributs lus sur l'élément (ou le plus proche ancêtre qui les porte) :
     data-action="fn"            -> appelle window['fn'](...)
     data-action="fn1,fn2,fn3"   -> appelle chaque fonction listée, dans
                                     l'ordre, avec les MÊMES arguments résolus
     data-args='["mod","__this__"]'
                                  -> JSON (valeur unique ou tableau), décodé puis
                                     passé en arguments. Jetons spéciaux reconnus :
                                     "__this__"       -> l'élément cible lui-même
                                     "__value__"      -> el.value (champs de formulaire)
                                     "__files__"      -> el.files (FileList, input type=file)
                                     "__parentNode__" -> el.parentNode
                                     "__byId:xxx__"   -> document.getElementById('xxx')
                                     "__dataset:xxx__"-> el.dataset.xxx
                                     "__event__"      -> l'objet Event natif
     data-prevent="1"            -> event.preventDefault() avant d'invoquer
     data-stop="1"               -> event.stopPropagation() avant d'invoquer
     data-self-only="1"          -> n'invoque QUE si evt.target === el (remplace le
                                     garde "if(event.target===this)" des overlays de
                                     modale : clic sur le fond ferme, clic sur le
                                     contenu à l'intérieur ne ferme pas)
     data-key="Enter"            -> pour un événement keydown UNIQUEMENT, n'invoque
                                     que si evt.key correspond (liste séparée par
                                     virgules acceptée, ex. "Enter,Spacebar"). Ignoré
                                     pour les autres types d'événement.
     data-action-<type>="fn"     -> SURCHARGE data-action pour un type d'événement
     data-args-<type>='[...]'       précis (ex. data-action-dragover, data-action-drop)
                                     quand UN MÊME élément a besoin d'actions DIFFÉRENTES
                                     selon l'événement (ex. une dropzone : click->ouvre
                                     le sélecteur de fichier, dragover/dragleave/drop->
                                     logique de glisser-déposer). Nécessaire car un
                                     attribut HTML ne peut porter qu'UNE SEULE valeur :
                                     data-action="a" data-action="b" sur le même tag ne
                                     garde que "a", la 2e occurrence est silencieusement
                                     ignorée par le parser HTML -- piège réel rencontré
                                     avec une dropzone photo (06/11/26). data-args-<type>
                                     suit la même règle ; data-prevent/data-stop/
                                     data-self-only/data-key restent génériques (partagés
                                     par tous les types d'événement de l'élément).
     data-confirm="Texte ?"      -> affiche un confirm() natif AVANT d'invoquer ;
                                     n'invoque que si l'utilisateur clique OK (remplace
                                     if(confirm('...'))fn()). Bloquant (confirm() natif),
                                     à réserver aux actions destructives rares (ex. panel
                                     admin) -- jamais sur une page à fort trafic public.

   Seules des fonctions DÉJÀ déclarées comme globales (window.xxx, définies
   dans le <script> propre à la page) sont appelables : jamais d'eval/Function
   sur une chaîne arbitraire -> aucune régression de sécurité introduite,
   data-args ne transporte que des DONNÉES (JSON), jamais du code.
   ============================================================ */
(function(){
  function resolveToken(tok, el, evt){
    if(tok === '__this__')       return el;
    if(tok === '__value__')      return el.value;
    if(tok === '__files__')      return el.files;
    if(tok === '__parentNode__') return el.parentNode;
    if(tok === '__event__')      return evt;
    if(typeof tok === 'string' && tok.indexOf('__byId:') === 0){
      return document.getElementById(tok.slice(7, -2));
    }
    if(typeof tok === 'string' && tok.indexOf('__dataset:') === 0){
      return el.dataset[tok.slice(10, -2)];
    }
    return tok;
  }
  function resolveArgs(el, evt, argsAttrName){
    var raw = el.getAttribute(argsAttrName);
    if(raw === null) return [];
    var parsed;
    try { parsed = JSON.parse(raw); }
    catch(e){ return [raw]; }
    var arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map(function(v){ return resolveToken(v, el, evt); });
  }
  function dispatch(evt, selector){
    var el = evt.target.closest(selector);
    if(!el) return;
    if(el.getAttribute('data-self-only') === '1' && evt.target !== el) return;
    if(evt.type === 'keydown'){
      var keyFilter = el.getAttribute('data-key');
      if(keyFilter){
        var keyMatches = keyFilter.split(',').some(function(k){
          if(k === 'Space') return evt.key === ' ' || evt.code === 'Space';
          return k === evt.key;
        });
        if(!keyMatches) return;
      }
    }
    // data-action-<type>/data-args-<type> surchargent data-action/data-args pour CE
    // type d'événement précis (nécessaire quand un même élément a des actions
    // différentes selon l'événement, ex. dropzone click vs dragover vs drop).
    var typedActionAttr = 'data-action-' + evt.type;
    var hasTyped = el.getAttribute(typedActionAttr) !== null;
    var actionAttr = hasTyped ? typedActionAttr : 'data-action';
    var argsAttr   = hasTyped ? ('data-args-' + evt.type) : 'data-args';
    var names = (el.getAttribute(actionAttr) || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
    if(!names.length) return;
    var confirmMsg = el.getAttribute('data-confirm');
    if(confirmMsg && !window.confirm(confirmMsg)) return;
    if(el.getAttribute('data-prevent') === '1') evt.preventDefault();
    if(el.getAttribute('data-stop') === '1') evt.stopPropagation();
    var args = resolveArgs(el, evt, argsAttr);
    names.forEach(function(name){
      var fn = window[name];
      if(typeof fn !== 'function'){
        if(window.console) console.warn('A2SActions: fonction introuvable ->', name);
        return;
      }
      fn.apply(el, args);
    });
  }
  document.addEventListener('click',     function(e){ dispatch(e, '[data-action],[data-action-click]'); }, false);
  document.addEventListener('change',    function(e){ dispatch(e, '[data-action],[data-action-change]'); }, false);
  document.addEventListener('input',     function(e){ dispatch(e, '[data-action],[data-action-input]'); }, false);
  document.addEventListener('keydown',   function(e){ dispatch(e, '[data-action],[data-action-keydown]'); }, false);
  document.addEventListener('dragover',  function(e){ dispatch(e, '[data-action],[data-action-dragover]'); }, false);
  document.addEventListener('dragleave', function(e){ dispatch(e, '[data-action],[data-action-dragleave]'); }, false);
  document.addEventListener('drop',      function(e){ dispatch(e, '[data-action],[data-action-drop]'); }, false);
  // submit en phase de capture : doit pouvoir preventDefault() avant la soumission native
  document.addEventListener('submit',    function(e){ dispatch(e, '[data-action],[data-action-submit]'); }, true);
})();
