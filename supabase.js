/* Aircraft2Sell — Supabase Client */
var _SB='https://hlivysnlzlqdjcigqgvk.supabase.co',_SK='sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';

/* ── Jeton de session ───────────────────────────────────────────────
   Les tables protégées par RLS (messages, favoris…) ne renvoient rien
   si l'on présente la clé publique : il faut le jeton de l'utilisateur.
   Le jeton d'accès expire au bout d'une heure ; on le renouvelle avec le
   refresh_token plutôt que de laisser la boîte de réception se vider
   silencieusement. */
function _a2sToken(){
  try{ return sessionStorage.getItem('a2s_auth_token'); }catch(e){ return null; }
}
function _a2sExpire(tk){
  try{
    var p = JSON.parse(atob(tk.split('.')[1]));
    return !p.exp || (p.exp * 1000) < (Date.now() + 60000);   /* marge d'1 min */
  }catch(e){ return true; }
}
async function _a2sRenouveler(){
  var rt = null;
  try{ rt = localStorage.getItem('a2s_refresh_token'); }catch(e){}
  if(!rt) return null;
  try{
    var r = await fetch(_SB + '/auth/v1/token?grant_type=refresh_token', {
      method:'POST',
      headers:{ 'apikey': _SK, 'Content-Type':'application/json' },
      body: JSON.stringify({ refresh_token: rt })
    });
    if(!r.ok) return null;
    var d = await r.json();
    if(d.access_token){
      try{
        sessionStorage.setItem('a2s_auth_token', d.access_token);
        if(d.refresh_token) localStorage.setItem('a2s_refresh_token', d.refresh_token);
      }catch(e){}
      return d.access_token;
    }
  }catch(e){}
  return null;
}
async function _a2sAuth(){
  var tk = _a2sToken();
  if(tk && !_a2sExpire(tk)) return tk;
  var neuf = await _a2sRenouveler();
  return neuf || tk || _SK;
}

async function sbReq(m,t,p,b){var url=_SB+'/rest/v1/'+t+(p?'?'+p:'');var tk=await _a2sAuth();var h={'apikey':_SK,'Authorization':'Bearer '+tk,'Content-Type':'application/json','Prefer':'return=representation'};var r=await fetch(url,{method:m,headers:h,body:b?JSON.stringify(b):undefined});var tx=await r.text();if(!r.ok)throw new Error(tx);return tx?JSON.parse(tx):[];}
function sbGet(t,p){return sbReq('GET',t,p);}
function sbPost(t,b){return sbReq('POST',t,null,b);}
function sbPatch(t,p,b){return sbReq('PATCH',t,p,b);}
function sbDelete(t,p){return sbReq('DELETE',t,p);}

/* ── Profil vendeur public ──────────────────────────────────────────
   La table `users` contient des données personnelles (email, nom) et ne
   doit pas être lisible par un visiteur anonyme : la clé publique du site
   permettrait sinon de télécharger la liste des membres.

   On passe par la fonction get_seller_public(), qui renvoie le profil
   affichable SANS l'email. Repli sur la lecture directe tant que le SQL
   (supabase/fuite-users.sql) n'est pas appliqué : les pages vendeur
   fonctionnent donc avant comme après le verrouillage. */
async function sbSellerPublic(email){
  if(!email) return null;
  try{
    var tk = await _a2sAuth();
    var r = await fetch(_SB + '/rest/v1/rpc/get_seller_public', {
      method:'POST',
      headers:{ 'apikey': _SK, 'Authorization': 'Bearer ' + tk, 'Content-Type':'application/json' },
      body: JSON.stringify({ p_email: email })
    });
    if(r.ok){
      var d = await r.json();
      if(Array.isArray(d) && d.length) return d[0];
      if(d && !Array.isArray(d) && d.name !== undefined) return d;
      return null;                       /* fonction présente, vendeur inconnu */
    }
  }catch(e){}
  /* Repli : fonction pas encore créée en base */
  try{
    var rows = await sbGet('users','email=eq.'+encodeURIComponent(email)+'&select=name,pseudo,certified,is_pro,seller_type,company,rating,plan,registered_at&limit=1');
    return (rows && rows.length) ? rows[0] : null;
  }catch(e){ return null; }
}
function sbRowListing(r){var ph=Array.isArray(r.photos)?r.photos:[];var th=ph.length?ph[0]:(r.icon||'✈');var sym={EUR:'€',USD:'$',GBP:'£',CHF:'Fr'}[r.currency||'EUR']||'€';var pn=r.price&&!isNaN(Number(r.price))?Number(r.price):null;return{id:r.id,make:r.make||'',model:r.model||'',year:r.year||'',price:r.price||'--',priceDisplay:pn?sym+pn.toLocaleString('fr-FR'):(r.price||'--'),currency:r.currency||'EUR',category:r.category||'light',catDisp:r.category||'light',airport:r.airport||'',loc:r.airport||r.country||'--',country:r.country||'',desc:r.description||'',description:r.description||'',status:r.status||'pending',sellerName:r.seller_name||'',sellerEmail:r.seller_email||'',seller_name:r.seller_name||'',seller_email:r.seller_email||'',views:r.views||0,enquiries:r.enquiries||0,hours:r.hours||'--',icon:th,photos:ph,submittedAt:r.submitted_at||r.created_at||'',submitted_at:r.submitted_at||r.created_at||'',seller_rating:r.seller_rating||0,seller_certified:r.seller_certified||false,title:[r.make,r.model,r.year?'('+r.year+')':''].filter(Boolean).join(' ')||'--'};}
function sbRowUser(r){return{id:r.id,name:r.name||'',email:r.email||'',plan:r.plan||'Essentiel',status:r.status||'active',registeredAt:r.registered_at||r.created_at||'',registered_at:r.registered_at||r.created_at||'',rating:r.rating||0,certified:r.certified||false};}
var sbRow=sbRowListing;
function fmtDate(iso){if(!iso)return'--';try{return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});}catch(e){return'--';}}
function sbEnsureUser(name,email,plan){if(!email)return;sbGet('users','email=eq.'+encodeURIComponent(email)+'&limit=1').then(function(ex){if(ex&&ex.length){if(name&&ex[0].name!==name)sbPatch('users','email=eq.'+encodeURIComponent(email),{name:name});}else{sbPost('users',{id:Date.now(),name:name||email.split('@')[0],email:email,plan:plan||'Essentiel',status:'active',registered_at:new Date().toISOString()});}}).catch(function(){});}
