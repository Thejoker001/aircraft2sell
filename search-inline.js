/* Externalisé le 06/11/26 depuis le <script> inline de search.html (audit CSP
   unsafe-inline, phase 1). Copier-coller strict, AUCUNE modification de logique —
   même position d'exécution relative (non deferré, charge après airports-data.js/
   icons.js comme avant). Si recherche.html (EN/ET) a le même bloc dupliqué, il
   n'est PAS encore migré par ce commit — vérifier avant de considérer le chantier
   CSP terminé pour toutes les locales. */
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function airportLabel(code){if(!code)return'';var c=String(code).toUpperCase().trim();var ap=(typeof A2S_AIRPORTS!=='undefined')?A2S_AIRPORTS[c]:null;return ap&&ap.name?c+' — '+ap.name:c;}
var SB='https://hlivysnlzlqdjcigqgvk.supabase.co';
var SK='sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
async function sbGet(t,p){try{var r=await fetch(SB+'/rest/v1/'+t+(p?'?'+p:''),{headers:{'apikey':SK,'Authorization':'Bearer '+SK}});return r.ok?await r.json():[];}catch(e){return[];}}

/* ── ÉTAT GLOBAL ── */
var ALL=[],FILTERED=[],viewMode='grid',selCat='',curPage=1,PER_PAGE=12;
var _exRates={};
var LOCALE='fr-FR';

/* ── MAPPING PAYS ISO → Nom ── */
var COUNTRY_NAMES={AF:'Afghanistan',ZA:'Afrique du Sud',AL:'Albanie',DZ:'Algérie',DE:'Allemagne',AD:'Andorre',AO:'Angola',AI:'Anguilla',AQ:'Antarctique',AG:'Antigua-et-Barbuda',SA:'Arabie saoudite',AR:'Argentine',AM:'Arménie',AW:'Aruba',AU:'Australie',AT:'Autriche',AZ:'Azerbaïdjan',BS:'Bahamas',BH:'Bahreïn',BD:'Bangladesh',BB:'Barbade',BE:'Belgique',BZ:'Belize',BM:'Bermudes',BT:'Bhoutan',BY:'Biélorussie',BO:'Bolivie',BA:'Bosnie-Herzégovine',BW:'Botswana',BN:'Brunéi Darussalam',BR:'Brésil',BG:'Bulgarie',BF:'Burkina Faso',BI:'Burundi',BJ:'Bénin',KH:'Cambodge',CM:'Cameroun',CA:'Canada',CV:'Cap-Vert',CL:'Chili',CN:'Chine',CY:'Chypre',CO:'Colombie',KM:'Comores',CG:'Congo-Brazzaville',CD:'Congo-Kinshasa',KP:'Corée du Nord',KR:'Corée du Sud',CR:'Costa Rica',HR:'Croatie',CU:'Cuba',CW:'Curaçao',CI:'Côte d’Ivoire',DK:'Danemark',DJ:'Djibouti',DM:'Dominique',ES:'Espagne',EE:'Estonie',SZ:'Eswatini',FJ:'Fidji',FI:'Finlande',FR:'France',GA:'Gabon',GM:'Gambie',GH:'Ghana',GI:'Gibraltar',GD:'Grenade',GL:'Groenland',GR:'Grèce',GP:'Guadeloupe',GU:'Guam',GT:'Guatemala',GG:'Guernesey',GN:'Guinée',GQ:'Guinée équatoriale',GW:'Guinée-Bissau',GY:'Guyana',GF:'Guyane française',GE:'Géorgie',GS:'Géorgie du Sud et îles Sandwich du Sud',HT:'Haïti',HN:'Honduras',HU:'Hongrie',IN:'Inde',ID:'Indonésie',IQ:'Irak',IR:'Iran',IE:'Irlande',IS:'Islande',IL:'Israël',IT:'Italie',JM:'Jamaïque',JP:'Japon',JE:'Jersey',JO:'Jordanie',KZ:'Kazakhstan',KE:'Kenya',KG:'Kirghizistan',KI:'Kiribati',KW:'Koweït',RE:'La Réunion',LA:'Laos',LS:'Lesotho',LV:'Lettonie',LB:'Liban',LY:'Libye',LR:'Libéria',LI:'Liechtenstein',LT:'Lituanie',LU:'Luxembourg',MK:'Macédoine du Nord',MG:'Madagascar',MY:'Malaisie',MW:'Malawi',MV:'Maldives',ML:'Mali',MT:'Malte',MA:'Maroc',MQ:'Martinique',MU:'Maurice',MR:'Mauritanie',YT:'Mayotte',MX:'Mexique',MD:'Moldavie',MC:'Monaco',MN:'Mongolie',MS:'Montserrat',ME:'Monténégro',MZ:'Mozambique',MM:'Myanmar (Birmanie)',NA:'Namibie',NR:'Nauru',NI:'Nicaragua',NE:'Niger',NG:'Nigéria',NU:'Niue',NO:'Norvège',NC:'Nouvelle-Calédonie',NZ:'Nouvelle-Zélande',NP:'Népal',OM:'Oman',UG:'Ouganda',UZ:'Ouzbékistan',PK:'Pakistan',PW:'Palaos',PA:'Panama',PG:'Papouasie-Nouvelle-Guinée',PY:'Paraguay',NL:'Pays-Bas',BQ:'Pays-Bas caribéens',PH:'Philippines',PL:'Pologne',PF:'Polynésie française',PR:'Porto Rico',PT:'Portugal',PE:'Pérou',QA:'Qatar',HK:'R.A.S. chinoise de Hong Kong',MO:'R.A.S. chinoise de Macao',RO:'Roumanie',GB:'Royaume-Uni',RU:'Russie',RW:'Rwanda',CF:'République centrafricaine',DO:'République dominicaine',EH:'Sahara occidental',BL:'Saint-Barthélemy',KN:'Saint-Christophe-et-Niévès',SM:'Saint-Marin',MF:'Saint-Martin',SX:'Saint-Martin (partie néerlandaise)',PM:'Saint-Pierre-et-Miquelon',VC:'Saint-Vincent-et-les-Grenadines',SH:'Sainte-Hélène',LC:'Sainte-Lucie',SV:'Salvador',WS:'Samoa',AS:'Samoa américaines',ST:'Sao Tomé-et-Principe',RS:'Serbie',SC:'Seychelles',SL:'Sierra Leone',SG:'Singapour',SK:'Slovaquie',SI:'Slovénie',SO:'Somalie',SD:'Soudan',SS:'Soudan du Sud',LK:'Sri Lanka',CH:'Suisse',SR:'Suriname',SE:'Suède',SJ:'Svalbard et Jan Mayen',SY:'Syrie',SN:'Sénégal',TJ:'Tadjikistan',TZ:'Tanzanie',TW:'Taïwan',TD:'Tchad',CZ:'Tchéquie',TF:'Terres australes françaises',IO:'Territoire britannique de l’océan Indien',PS:'Territoires palestiniens',TH:'Thaïlande',TL:'Timor oriental',TG:'Togo',TK:'Tokelau',TO:'Tonga',TT:'Trinité-et-Tobago',TN:'Tunisie',TM:'Turkménistan',TR:'Turquie',TV:'Tuvalu',UA:'Ukraine',UY:'Uruguay',VU:'Vanuatu',VE:'Venezuela',VN:'Vietnam',WF:'Wallis-et-Futuna',YE:'Yémen',ZM:'Zambie',ZW:'Zimbabwe',EG:'Égypte',AE:'Émirats arabes unis',EC:'Équateur',ER:'Érythrée',VA:'État de la Cité du Vatican',FM:'États fédérés de Micronésie',US:'États-Unis',ET:'Éthiopie',BV:'Île Bouvet',CX:'Île Christmas',NF:'Île Norfolk',IM:'Île de Man',KY:'Îles Caïmans',CC:'Îles Cocos',CK:'Îles Cook',FO:'Îles Féroé',HM:'Îles Heard et McDonald',FK:'Îles Malouines',MP:'Îles Mariannes du Nord',MH:'Îles Marshall',PN:'Îles Pitcairn',SB:'Îles Salomon',TC:'Îles Turques-et-Caïques',VG:'Îles Vierges britanniques',VI:'Îles Vierges des États-Unis',UM:'Îles mineures éloignées des États-Unis',AX:'Îles Åland',OTHER:'Autre / International'};
function countryLabel(code){if(!code)return'';return COUNTRY_NAMES[code]||code;}

/* ── CATÉGORIES ── */
var CAT_LABELS={light:'Avion léger',jet:"Jet d'affaires",turbo:'Turboprop',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};
var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};
var CAT_SYMS={EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$'};

/* ── TOAST ── */
var _tt;
function showToast(msg){var el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){el.classList.remove('show');},3000);}

/* ── FILTRES MOBILE ── */
function closeMobileFilters(){
  if(window.innerWidth>768)return;
  var s=document.getElementById('sidebar');if(s)s.classList.remove('open');
  var b=document.querySelector('.mob-filter-btn');if(b)b.setAttribute('aria-expanded','false');
}

/* ── FAVORIS ── */
function getFavs(){try{return JSON.parse(localStorage.getItem('a2s_favs')||'[]');}catch(e){return[];}}
function saveFavs(f){localStorage.setItem('a2s_favs',JSON.stringify(f));}
function isFav(id){return getFavs().indexOf(String(id))!==-1;}
function toggleFav(id,btn){
  var favs=getFavs();var sid=String(id);
  if(favs.indexOf(sid)!==-1){favs=favs.filter(function(x){return x!==sid;});btn.classList.remove('liked');btn.setAttribute('aria-pressed','false');showToast('Retiré des favoris');}
  else{favs.push(sid);btn.classList.add('liked');btn.setAttribute('aria-pressed','true');showToast('Ajouté aux favoris');}
  saveFavs(favs);
  document.dispatchEvent(new Event('a2s:favs-updated'));
}

/* ── CHARGEMENT SUPABASE ── */
async function loadAll(){
  renderSkeletons();
  var rows=await sbGet('listings_public','order=submitted_at.desc&select=*');
  ALL=rows.map(function(r){
    return{
      id:r.id,make:r.make||'',model:r.model||'',year:r.year||'',
      price:r.price||null,currency:r.currency||'EUR',
      category:r.category||'',airport:r.airport||'',
      country:r.country||'',hours:r.hours||null,smoh:r.smoh||null,
      ifr:r.ifr||false,rvsm:r.rvsm||false,adsb:r.adsb||false,
      photos:r.photos||[],description:r.description||'',
      seller_is_pro:r.seller_is_pro||false,seller_certified:r.seller_certified||false,
      submitted_at:r.submitted_at||r.created_at||'',
      title:[r.make,r.model,r.year?'('+r.year+')':''].filter(Boolean).join(' ')
    };
  });
  updateCounts();
  restoreFromURL();
  applyFilters();
}

/* ── COMPTEURS CATÉGORIES ── */
function updateCounts(){
  var cats=['light','jet','turbo','heli','ulm','airliner'];
  var el=document.getElementById('cnt-all');
  if(el)el.textContent=ALL.length;
  cats.forEach(function(c){
    var n=ALL.filter(function(x){return x.category===c;}).length;
    var el2=document.getElementById('cnt-'+c);
    if(el2)el2.textContent=n;
  });
}

/* ── RESTAURER DEPUIS URL ── */
function restoreFromURL(){
  var p=new URLSearchParams(window.location.search);
  var cat=p.get('cat')||'';
  var q=p.get('q')||'';
  var maxP=p.get('max')||'';
  if(cat){
    selCat=cat;
    document.querySelectorAll('.fcat').forEach(function(el){
      el.classList.toggle('active',el.dataset.cat===cat);
    });
  }
  if(q){var si=document.getElementById('searchInput');if(si)si.value=q;}
  if(maxP){var mp=document.getElementById('maxPrice');if(mp)mp.value=maxP;}
  var cur=p.get('cur')||'';
  if(cur){var dc=document.getElementById('displayCurrency');if(dc){dc.value=cur;_dispCur=dc.value||'EUR';fetchRate(_dispCur,function(){renderPage();});}}
  updateAlertBtn();
}

/* ── SET CATÉGORIE ── */
function setCat(el,cat){
  selCat=cat;
  document.querySelectorAll('.fcat').forEach(function(f){f.classList.remove('active');});
  el.classList.add('active');
  curPage=1;
  applyFilters();
}

/* ── RESET FILTRES ── */
function resetFilters(){
  selCat='';curPage=1;
  document.querySelectorAll('.fcat').forEach(function(f){f.classList.toggle('active',f.dataset.cat==='');});
  ['searchInput','minPrice','maxPrice','minYear','maxYear','minHours','maxHours','minSmoh','maxSmoh'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var fc=document.getElementById('filterCountry');if(fc)fc.value='';
  var fi=document.getElementById('fIFR');if(fi)fi.checked=false;
  var fr=document.getElementById('fRVSM');if(fr)fr.checked=false;
  var fa=document.getElementById('fADSB');if(fa)fa.checked=false;
  var ss=document.getElementById('sortSel');if(ss)ss.value='recent';
  applyFilters();
}

/* ── DEVISE ── */
var _dispCur='EUR',_budgetCur='EUR';
function onDisplayCurrencyChange(){
  var el=document.getElementById('displayCurrency');
  _dispCur=el?el.value:'EUR';
  fetchRate(_dispCur,function(){renderPage();});
}
function onBudgetCurrencyChange(){
  var el=document.getElementById('budgetCurrency');
  _budgetCur=el?el.value:'EUR';
  fetchRate(_budgetCur,function(){updateBudgetNote();applyFilters();});
}
function updateBudgetNote(){
  var n=document.getElementById('budgetRateNote');if(!n)return;
  if(_budgetCur==='EUR'){n.textContent='Montants convertis en euros pour la comparaison.';return;}
  var rate=_exRates[_budgetCur];
  n.textContent=rate?('1 EUR = '+rate.toFixed(3)+' '+_budgetCur):'Montants convertis en euros pour la comparaison.';
}
function fetchRate(to,cb){
  if(to==='EUR'||_exRates[to]){if(cb)cb();return;}
  fetch('https://api.frankfurter.app/latest?base=EUR&symbols='+to)
    .then(function(r){return r.json();})
    .then(function(d){if(d.rates&&d.rates[to])_exRates[to]=d.rates[to];if(cb)cb();})
    .catch(function(){if(cb)cb();});
}
function toEUR(price,cur){
  if(!price||isNaN(price))return null;
  if(!cur||cur==='EUR')return Number(price);
  var rate=_exRates[cur];
  return rate?Number(price)/rate:Number(price);
}
function fromEUR(priceEUR,cur){
  if(!cur||cur==='EUR')return priceEUR;
  var rate=_exRates[cur];
  return rate?priceEUR*rate:priceEUR;
}

/* ── APPLIQUER FILTRES ── */
function applyFilters(){
  var q=(document.getElementById('searchInput')||{value:''}).value.toLowerCase().trim();
  var minP=parseFloat((document.getElementById('minPrice')||{value:''}).value)||null;
  var maxP=parseFloat((document.getElementById('maxPrice')||{value:''}).value)||null;
  var minY=parseInt((document.getElementById('minYear')||{value:''}).value)||null;
  var maxY=parseInt((document.getElementById('maxYear')||{value:''}).value)||null;
  var minH=parseFloat((document.getElementById('minHours')||{value:''}).value)||null;
  var maxH=parseFloat((document.getElementById('maxHours')||{value:''}).value)||null;
  var minS=parseFloat((document.getElementById('minSmoh')||{value:''}).value)||null;
  var maxS=parseFloat((document.getElementById('maxSmoh')||{value:''}).value)||null;
  var countryFilter=(document.getElementById('filterCountry')||{value:''}).value||'';
  var needIFR=(document.getElementById('fIFR')||{checked:false}).checked;
  var needRVSM=(document.getElementById('fRVSM')||{checked:false}).checked;
  var needADSB=(document.getElementById('fADSB')||{checked:false}).checked;
  var sort=(document.getElementById('sortSel')||{value:'recent'}).value;

  /* Convertir budget en EUR pour comparaison uniforme */
  var minPeur=minP?toEUR(minP,_budgetCur):null;
  var maxPeur=maxP?toEUR(maxP,_budgetCur):null;

  /* Code ISO du pays sélectionné (déjà un code ISO, ex. FR/DE) */
  var countryCode=countryFilter;

  FILTERED=ALL.filter(function(l){
    if(selCat&&l.category!==selCat)return false;
    if(q){var t=(l.title+' '+l.make+' '+l.model+' '+l.description+' '+l.airport).toLowerCase();if(!t.includes(q))return false;}
    var priceEUR=toEUR(l.price,l.currency);
    if(minPeur&&priceEUR&&priceEUR<minPeur)return false;
    if(maxPeur&&priceEUR&&priceEUR>maxPeur)return false;
    if(minY&&l.year&&Number(l.year)<minY)return false;
    if(maxY&&l.year&&Number(l.year)>maxY)return false;
    if(minH&&l.hours&&Number(l.hours)<minH)return false;
    if(maxH&&l.hours&&Number(l.hours)>maxH)return false;
    if(minS&&l.smoh&&Number(l.smoh)<minS)return false;
    if(maxS&&l.smoh&&Number(l.smoh)>maxS)return false;
    /* Filtre pays : on compare le code ISO stocké dans Supabase */
    if(countryCode&&l.country&&l.country.toUpperCase()!==countryCode.toUpperCase())return false;
    if(needIFR&&!l.ifr)return false;
    if(needRVSM&&!l.rvsm)return false;
    if(needADSB&&!l.adsb)return false;
    return true;
  });

  /* Tri */
  FILTERED.sort(function(a,b){
    if(sort==='price_asc'){var pa=toEUR(a.price,a.currency)||Infinity;var pb=toEUR(b.price,b.currency)||Infinity;return pa-pb;}
    if(sort==='price_desc'){var pa2=toEUR(a.price,a.currency)||0;var pb2=toEUR(b.price,b.currency)||0;return pb2-pa2;}
    if(sort==='year_desc'){return(Number(b.year)||0)-(Number(a.year)||0);}
    if(sort==='hours_asc'){return(Number(a.hours)||Infinity)-(Number(b.hours)||Infinity);}
    /* recent : par submitted_at décroissant */
    return new Date(b.submitted_at||0)-new Date(a.submitted_at||0);
  });

  curPage=1;
  updateAlertBtn();
  if(viewMode==='map'){renderSearchMap();}else{renderPage();}
}

/* ── RENDU GRILLE ── */
function renderPage(){
  var grid=document.getElementById('cardsGrid');
  var rc=document.getElementById('resultCount');
  if(!grid)return;

  var total=FILTERED.length;
  var pages=Math.ceil(total/PER_PAGE)||1;
  if(curPage>pages)curPage=pages;
  var start=(curPage-1)*PER_PAGE;
  var slice=FILTERED.slice(start,start+PER_PAGE);

  if(rc)rc.innerHTML=total+' '+(total>1?'annonces':'annonce')+(pages>1?' <small>page '+curPage+' / '+pages+'</small>':'');

  grid.className='listings-grid'+(viewMode==='list'?' listings-list':'');

  if(!slice.length){
    var none=(total===0&&ALL.length===0);
    grid.innerHTML='<div class="empty-state">'
      +'<span class="icon-box">'+A2SIcon(none?'plane':'search')+'</span>'
      +'<div class="empty-title">'+(none?'Aucune annonce pour le moment':'Aucun résultat pour ces critères')+'</div>'
      +'<p class="empty-sub">'+(none?'Les premières annonces arrivent. Créez une alerte gratuite pour être prévenu dès la publication.':'Élargissez vos filtres ou créez une alerte gratuite : nous vous préviendrons dès qu\'une annonce correspond.')+'</p>'
      +'<div class="empty-ctas">'
      +'<a href="alerts.html" class="btn-primary">'+A2SIcon('bell')+'Créer une alerte</a>'
      +(none?'<a href="post-listing.html" class="btn-secondary">'+A2SIcon('plus')+'Déposer une annonce</a>':'<button type="button" class="btn-secondary" onclick="resetFilters()">'+A2SIcon('refresh')+'Réinitialiser les filtres</button>')
      +'</div>'
      +'</div>';
    renderPagination(0,1);
    return;
  }

  grid.innerHTML=slice.map(function(l){return renderCard(l);}).join('');
  renderPagination(total,pages);
  injectSearchSchema(slice);
}

/* ── CARTE ANNONCE ── */
function renderCard(l){
  var sym=CAT_SYMS[_dispCur]||'€';
  var priceEUR=toEUR(l.price,l.currency);
  var displayPrice=priceEUR?fromEUR(priceEUR,_dispCur):null;
  var pr=displayPrice?Math.round(displayPrice).toLocaleString(LOCALE)+' '+sym:'Prix sur demande';
  var usdApprox=(window.A2SExchangeRate&&priceEUR)?window.A2SExchangeRate.usdApproxText(priceEUR,_dispCur):null;
  var title=esc(l.title||[l.make,l.model].filter(Boolean).join(' ')||'Sans titre');
  var cat=CAT_LABELS[l.category]||esc(l.category||'');
  var loc=l.airport?airportLabel(l.airport):countryLabel(l.country);
  var img=l.photos&&l.photos[0]
    ?'<img src="'+esc(l.photos[0])+'?width=480&format=webp" alt="'+title+'" loading="lazy">'
    :'<span class="lc-placeholder">'+A2SIcon(CAT_ICON[l.category]||'plane')+'</span>';
  var fav=isFav(l.id);
  var badges='';
  if(l.ifr)badges+='<span class="badge badge-navy">IFR</span>';
  if(l.rvsm)badges+='<span class="badge">RVSM</span>';
  if(l.adsb)badges+='<span class="badge">ADS-B</span>';
  if(l.seller_is_pro)badges+='<span class="badge badge-accent">PRO</span>';
  var trust='<span class="badge-verified">'+(l.seller_certified?'Vendeur certifié':'Vendeur vérifié')+'</span>';
  return '<a class="lc" href="listing.html?id='+encodeURIComponent(l.id)+'">'
    +'<div class="lc-img">'+img
    +(cat?'<span class="lc-cat-badge">'+cat+'</span>':'')
    +'<button type="button" class="lc-fav'+(fav?' liked':'')+'" aria-pressed="'+(fav?'true':'false')+'" aria-label="Ajouter aux favoris" onclick="event.preventDefault();event.stopPropagation();toggleFav(\''+esc(String(l.id))+'\',this)">'+A2SIcon('heart')+'</button>'
    +'</div>'
    +'<div class="lc-body">'
    +'<div class="lc-title">'+title+'</div>'
    +'<div class="lc-specs">'
    +(l.year?'<span class="lc-spec">'+A2SIcon('calendar')+esc(String(l.year))+'</span>':'')
    +(l.hours?'<span class="lc-spec">'+A2SIcon('clock')+Number(l.hours).toLocaleString(LOCALE)+' h TT</span>':'')
    +(l.smoh?'<span class="lc-spec">'+A2SIcon('gauge')+Number(l.smoh).toLocaleString(LOCALE)+' h SMOH</span>':'')
    +'</div>'
    +'<div class="lc-trust lc-badges">'+trust+badges+'</div>'
    +'<div class="lc-footer">'
    +'<div class="lc-price">'+pr+(usdApprox?'<span class="lc-price-usd">'+usdApprox+'</span>':'')+'</div>'
    +(loc?'<div class="lc-loc">'+A2SIcon('map-pin')+loc+'</div>':'')
    +'</div></div></a>';
}

/* ── PAGINATION ── */
function renderPagination(total,pages){
  var el=document.getElementById('pagination');
  if(!el||pages<=1){if(el)el.innerHTML='';return;}
  var h='';
  if(curPage>1)h+='<button type="button" class="pgbtn" onclick="goPage('+(curPage-1)+')" aria-label="Précédent">'+A2SIcon('chevron-left')+'<span>Précédent</span></button>';
  for(var i=1;i<=pages;i++){
    if(pages>7&&i>2&&i<pages-1&&Math.abs(i-curPage)>1){if(i===3||i===pages-2)h+='<span class="pg-dots">…</span>';continue;}
    h+='<button type="button" class="pgbtn'+(i===curPage?' active':'')+'" onclick="goPage('+i+')"'+(i===curPage?' aria-current="page"':'')+'>'+i+'</button>';
  }
  if(curPage<pages)h+='<button type="button" class="pgbtn" onclick="goPage('+(curPage+1)+')" aria-label="Suivant"><span>Suivant</span>'+A2SIcon('chevron-right')+'</button>';
  el.innerHTML=h;
}
function goPage(n){curPage=n;renderPage();window.scrollTo({top:0,behavior:'smooth'});}

/* ── SQUELETTES ── */
function renderSkeletons(){
  var grid=document.getElementById('cardsGrid');
  if(!grid)return;
  grid.className='listings-grid';
  grid.innerHTML=Array(6).fill(0).map(function(){
    return'<div class="card"><div class="shimmer" style="aspect-ratio:4/3;border-radius:12px 12px 0 0"></div><div style="padding:1rem 1.1rem">'
      +'<div class="shimmer" style="height:12px;width:70%;margin-bottom:.6rem"></div>'
      +'<div class="shimmer" style="height:10px;width:45%;margin-bottom:1rem"></div>'
      +'<div class="shimmer" style="height:18px;width:40%"></div>'
      +'</div></div>';
  }).join('');
  var rc=document.getElementById('resultCount');if(rc)rc.textContent='Chargement…';
}

/* ── VUE GRILLE / LISTE / CARTE ── */
function setView(v){
  viewMode=v;
  var g=document.getElementById('gridBtn'),lb=document.getElementById('listBtn'),mb=document.getElementById('mapViewBtn');
  if(g){g.classList.toggle('active',v==='grid');g.setAttribute('aria-pressed',v==='grid'?'true':'false');}
  if(lb){lb.classList.toggle('active',v==='list');lb.setAttribute('aria-pressed',v==='list'?'true':'false');}
  if(mb){mb.classList.toggle('active',v==='map');mb.setAttribute('aria-pressed',v==='map'?'true':'false');}
  var grid=document.getElementById('cardsGrid'),mapWrap=document.getElementById('searchMapWrap'),pag=document.getElementById('pagination');
  if(v==='map'){
    if(grid)grid.style.display='none';
    if(pag)pag.style.display='none';
    if(mapWrap)mapWrap.style.display='';
    renderSearchMap();
    /* localStorage ne mémorise QUE grid/list (la carte n'a pas la même
       pagination) : ne pas piéger un futur visiteur dans une vue carte
       vide par défaut si aucun aérodrome n'est encore connu. */
    return;
  }
  if(grid)grid.style.display='';
  if(pag)pag.style.display='';
  if(mapWrap)mapWrap.style.display='none';
  try{localStorage.setItem('a2s_search_view',v);}catch(e){}
  renderPage();
}

/* ── VUE CARTE (résultats filtrés) ──
   Réutilise le tableau FILTERED déjà calculé par applyFilters() et la même
   table d'aérodromes que map.html (airports-data.js, A2S_AIRPORTS) : pas
   de nouvel appel réseau, la carte est purement une re-projection des
   résultats déjà chargés côté client. */
var _searchMap=null,_searchMarkerLayer=null;
var SEARCH_CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};
function ensureSearchMap(){
  if(_searchMap)return;
  _searchMap=L.map('searchMap',{center:[47,6],zoom:5,zoomControl:true,scrollWheelZoom:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap',maxZoom:18}).addTo(_searchMap);
  _searchMap.on('focus',function(){_searchMap.scrollWheelZoom.enable();});
  _searchMap.on('blur',function(){_searchMap.scrollWheelZoom.disable();});
  _searchMarkerLayer=L.layerGroup().addTo(_searchMap);
}
function renderSearchMap(){
  ensureSearchMap();
  /* Un conteneur affiché après avoir été display:none nécessite un
     invalidateSize(), sinon Leaflet calcule ses dimensions à 0 et la carte
     reste grise/coupée. */
  setTimeout(function(){_searchMap.invalidateSize();},50);
  _searchMarkerLayer.clearLayers();
  var byAirport={};
  FILTERED.forEach(function(l){
    if(!l.airport)return;
    var code=l.airport.toUpperCase().trim();
    if(!byAirport[code])byAirport[code]=[];
    byAirport[code].push(l);
  });
  var placed=0;
  Object.keys(byAirport).forEach(function(code){
    var ap=A2S_AIRPORTS[code];
    if(!ap)return;
    var listings=byAirport[code];
    var count=listings.length;
    var inner=count>1?String(count):A2SIcon(SEARCH_CAT_ICON[listings[0].category]||'plane');
    var icon=L.divIcon({
      html:'<div class="a2s-marker'+(count>1?' multi':'')+'" title="'+esc(ap.name)+'">'+inner+'</div>',
      className:'',iconSize:[count>1?32:26,count>1?32:26],iconAnchor:[count>1?16:13,count>1?16:13]
    });
    var popupHtml=listings.slice(0,3).map(function(l){
      var title=l.title||[l.make,l.model,l.year?'('+l.year+')':''].filter(Boolean).join(' ')||'Aéronef';
      var priceStr=fmtPriceForMap(l);
      return'<div class="a2s-popup"><div class="title">'+esc(title)+'</div><div class="price">'+priceStr+'</div><div class="meta">'+A2SIcon('map-pin')+esc(ap.name)+' · '+esc(code)+'</div><a class="btn-navy" href="listing.html?id='+encodeURIComponent(l.id)+'">Voir l\'annonce'+A2SIcon('arrow-right')+'</a></div>';
    }).join('');
    if(listings.length>3)popupHtml+='<div class="a2s-popup-more"><a href="search.html?q='+encodeURIComponent(code)+'">'+(listings.length-3)+' autre'+(listings.length-3>1?'s':'')+' à '+esc(ap.name)+'</a></div>';
    L.marker([ap.lat,ap.lng],{icon:icon,title:ap.name}).bindPopup(popupHtml,{maxWidth:260,minWidth:220}).addTo(_searchMarkerLayer);
    placed++;
  });
  if(placed===0&&FILTERED.length>0){
    /* Résultats existants mais aucun n'a d'aérodrome reconnu : le signaler
       plutôt que laisser une carte vide sans explication. */
    showToast('Aucune annonce filtrée n\'est rattachée à un aérodrome connu.');
  }
}
function fmtPriceForMap(l){
  var symMap={EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$',AED:'AED '};
  if(!l.price)return'Prix sur demande';
  var p=toEUR(l.price,l.currency);
  return p?Math.round(p).toLocaleString('fr-FR')+' €':Number(l.price).toLocaleString('fr-FR')+' '+(symMap[l.currency||'EUR']||'€');
}

/* ── BOUTON ALERTE (lien pré-rempli avec la recherche courante) ── */
function updateAlertBtn(){
  var btn=document.getElementById('alertBtn');
  if(!btn)return;
  var si=document.getElementById('searchInput');
  var q=si?(si.value||'').trim():'';
  var params=new URLSearchParams();
  if(q)params.set('q',q);
  if(selCat)params.set('cat',selCat);
  btn.href='alerts.html'+(params.toString()?'?'+params.toString():'');
}

/* ── RECHERCHES SAUVEGARDÉES ──
   Distinct des alertes (qui envoient un email à chaque nouvelle annonce
   correspondante) : ici on rejoue simplement des critères en un clic, sans
   email ni engagement, purement côté navigateur (localStorage). */
var SAVED_SEARCHES_KEY='a2s_saved_searches';
var SAVED_SEARCHES_MAX=10;
function currentSearchCriteria(){
  var g=function(id){var el=document.getElementById(id);return el?el.value:'';};
  var gc=function(id){var el=document.getElementById(id);return el?el.checked:false;};
  return{
    cat:selCat||'',
    q:g('searchInput').trim(),
    minPrice:g('minPrice'),maxPrice:g('maxPrice'),
    minYear:g('minYear'),maxYear:g('maxYear'),
    minHours:g('minHours'),maxHours:g('maxHours'),
    minSmoh:g('minSmoh'),maxSmoh:g('maxSmoh'),
    country:g('filterCountry'),
    ifr:gc('fIFR'),rvsm:gc('fRVSM'),adsb:gc('fADSB'),
    sort:g('sortSel')
  };
}
function searchCriteriaLabel(c){
  var CAT_LABELS={light:'Avion léger',jet:'Jet d\'affaires',turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};
  var parts=[];
  if(c.cat)parts.push(CAT_LABELS[c.cat]||c.cat);
  if(c.q)parts.push('« '+c.q+' »');
  if(c.maxPrice)parts.push('< '+Number(c.maxPrice).toLocaleString('fr-FR')+' €');
  else if(c.minPrice)parts.push('> '+Number(c.minPrice).toLocaleString('fr-FR')+' €');
  if(c.country)parts.push(c.country);
  return parts.length?parts.join(' · '):'Toutes les annonces';
}
function getSavedSearches(){
  try{return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY)||'[]');}catch(e){return[];}
}
function saveCurrentSearch(){
  var c=currentSearchCriteria();
  var hasAnyCriteria=c.cat||c.q||c.minPrice||c.maxPrice||c.minYear||c.maxYear||c.country||c.ifr||c.rvsm||c.adsb;
  if(!hasAnyCriteria){showToast('Ajoutez au moins un filtre avant de sauvegarder.');return;}
  var list=getSavedSearches();
  var label=searchCriteriaLabel(c);
  /* Évite les doublons exacts (mêmes critères) plutôt que d'empiler des
     chips identiques à chaque clic. */
  var key=JSON.stringify(c);
  if(list.some(function(s){return JSON.stringify(s.criteria)===key;})){
    showToast('Cette recherche est déjà sauvegardée.');
    return;
  }
  list.unshift({label:label,criteria:c,savedAt:new Date().toISOString()});
  if(list.length>SAVED_SEARCHES_MAX)list=list.slice(0,SAVED_SEARCHES_MAX);
  try{localStorage.setItem(SAVED_SEARCHES_KEY,JSON.stringify(list));}catch(e){}
  renderSavedSearches();
  showToast('Recherche sauvegardée.');
}
function applySavedSearch(i){
  var list=getSavedSearches();
  var s=list[i];if(!s)return;
  var c=s.criteria;
  selCat=c.cat||'';
  document.querySelectorAll('.fcat').forEach(function(el){el.classList.toggle('active',el.dataset.cat===selCat);});
  var set=function(id,v){var el=document.getElementById(id);if(el)el.value=v||'';};
  var setChk=function(id,v){var el=document.getElementById(id);if(el)el.checked=!!v;};
  var si=document.getElementById('searchInput');if(si)si.value=c.q||'';
  set('minPrice',c.minPrice);set('maxPrice',c.maxPrice);
  set('minYear',c.minYear);set('maxYear',c.maxYear);
  set('minHours',c.minHours);set('maxHours',c.maxHours);
  set('minSmoh',c.minSmoh);set('maxSmoh',c.maxSmoh);
  set('filterCountry',c.country);
  setChk('fIFR',c.ifr);setChk('fRVSM',c.rvsm);setChk('fADSB',c.adsb);
  if(c.sort)set('sortSel',c.sort);
  curPage=1;
  applyFilters();
  showToast('Recherche appliquée : '+s.label);
}
function deleteSavedSearch(i,ev){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  var list=getSavedSearches();
  list.splice(i,1);
  try{localStorage.setItem(SAVED_SEARCHES_KEY,JSON.stringify(list));}catch(e){}
  renderSavedSearches();
}
function renderSavedSearches(){
  var bar=document.getElementById('savedSearchesBar');
  var list=document.getElementById('savedSearchesList');
  if(!bar||!list)return;
  var searches=getSavedSearches();
  if(!searches.length){bar.style.display='none';return;}
  bar.style.display='flex';
  list.innerHTML=searches.map(function(s,i){
    return'<span class="ssb-chip" onclick="applySavedSearch('+i+')" title="Appliquer cette recherche">'
      +esc(s.label)
      +'<i data-icon="close" onclick="deleteSavedSearch('+i+',event)" title="Supprimer" aria-label="Supprimer cette recherche"></i>'
      +'</span>';
  }).join('');
  if(window.A2SIcon&&window.A2SIcon.hydrate)window.A2SIcon.hydrate(list);
}

/* ── SCHEMA ITEMLIST SEO ── */
function injectSearchSchema(listings){
  var existing=document.getElementById('search-schema');
  if(existing)existing.remove();
  if(!listings||!listings.length)return;
  var items=listings.slice(0,10).map(function(l,i){
    var title=[l.make,l.model,l.year?'('+l.year+')':''].filter(Boolean).join(' ')||'Aéronef';
    return {
      "@type":"ListItem",
      "position":i+1,
      "name":title,
      "url":"https://aircraft2sell.eu/listing.html?id="+l.id,
      "description":l.description?l.description.slice(0,120):''
    };
  });
  var schema={"@type":"ItemList","name":"Aéronefs à vendre — Aircraft2Sell","itemListElement":items,"@context":"https://schema.org"};
  var s=document.createElement('script');
  s.type='application/ld+json';s.id='search-schema';
  s.textContent=JSON.stringify(schema);
  document.head.appendChild(s);
}

/* ── BOOT ── */
window.addEventListener('DOMContentLoaded',function(){
  try{var v=localStorage.getItem('a2s_search_view');if(v==='list'){viewMode='list';var g=document.getElementById('gridBtn'),lb=document.getElementById('listBtn');if(g)g.classList.remove('active');if(lb)lb.classList.add('active');}}catch(e){}
  var si=document.getElementById('searchInput');
  if(si)si.addEventListener('input',function(){clearTimeout(si._t);si._t=setTimeout(applyFilters,250);});
  renderSavedSearches();
  loadAll();
});

function toggleMobileFilters(btn){
  var s=document.getElementById('sidebar');
  var o=s.classList.toggle('open');
  btn.setAttribute('aria-expanded',o?'true':'false');
}
