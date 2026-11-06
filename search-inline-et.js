/* Externalisé le 06/11/26 depuis le <script> inline de et/search.html (audit CSP
   unsafe-inline, phase 1 étendue aux locales). Copier-coller strict de la version
   ET existante, AUCUNE modification de logique/traduction — même position
   d'exécution relative. Voir search-inline.js (racine FR) pour le même
   traitement sur la version française. Structure légèrement différente de
   FR/EN (pas de carte Leaflet ni de widget de taux de change sur cette page). */
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}
function airportLabel(code){if(!code)return'';var c=String(code).toUpperCase().trim();var ap=(typeof A2S_AIRPORTS!=='undefined')?A2S_AIRPORTS[c]:null;return ap&&ap.name?c+' — '+ap.name:c;}
var SB='https://hlivysnlzlqdjcigqgvk.supabase.co';
var SK='sb_publishable_ZxG0uz1u36X-y_JrAs_g6g_CAwFFRSe';
async function sbGet(t,p){try{var r=await fetch(SB+'/rest/v1/'+t+(p?'?'+p:''),{headers:{'apikey':SK,'Authorization':'Bearer '+SK}});return r.ok?await r.json():[];}catch(e){return[];}}

/* ── ÜLDINE OLEK ── */
var ALL=[],FILTERED=[],viewMode='grid',selCat='',curPage=1,PER_PAGE=12;
var _exRates={};
var LOCALE='et-EE';

/* ── RIIGI ISO-KOOD → NIMI ── */
var COUNTRY_NAMES={AF:'Afganistan',AX:'Ahvenamaa',AL:'Albaania',DZ:'Alžeeria',AS:'Ameerika Samoa',US:'Ameerika Ühendriigid',AD:'Andorra',AO:'Angola',AI:'Anguilla',AQ:'Antarktika',AG:'Antigua ja Barbuda',AE:'Araabia Ühendemiraadid',AR:'Argentina',AM:'Armeenia',AW:'Aruba',AZ:'Aserbaidžaan',AU:'Austraalia',AT:'Austria',BS:'Bahama',BH:'Bahrein',BD:'Bangladesh',BB:'Barbados',PW:'Belau',BE:'Belgia',BZ:'Belize',BJ:'Benin',BM:'Bermuda',BT:'Bhutan',BO:'Boliivia',BA:'Bosnia ja Hertsegoviina',BW:'Botswana',BV:'Bouvet’ saar',BR:'Brasiilia',IO:'Briti India ookeani ala',VG:'Briti Neitsisaared',BN:'Brunei',BG:'Bulgaaria',BF:'Burkina Faso',BI:'Burundi',CO:'Colombia',CK:'Cooki saared',CR:'Costa Rica',CW:'Curaçao',CI:'Côte d’Ivoire',DJ:'Djibouti',DM:'Dominica',DO:'Dominikaani Vabariik',EC:'Ecuador',EE:'Eesti',EG:'Egiptus',GQ:'Ekvatoriaal-Guinea',SV:'El Salvador',ER:'Eritrea',ET:'Etioopia',FK:'Falklandi saared',FJ:'Fidži',PH:'Filipiinid',FO:'Fääri saared',GA:'Gabon',GM:'Gambia',GH:'Ghana',GI:'Gibraltar',GD:'Grenada',GE:'Gruusia',GL:'Gröönimaa',GP:'Guadeloupe',GU:'Guam',GT:'Guatemala',GG:'Guernsey',GN:'Guinea',GW:'Guinea-Bissau',GY:'Guyana',HT:'Haiti',HM:'Heardi ja McDonaldi saared',CN:'Hiina',ES:'Hispaania',NL:'Holland',BQ:'Hollandi Kariibi mere saared',HN:'Honduras',HK:'Hongkongi erihalduspiirkond',HR:'Horvaatia',TL:'Ida-Timor',IE:'Iirimaa',IL:'Iisrael',IN:'India',ID:'Indoneesia',IQ:'Iraak',IR:'Iraan',IS:'Island',IT:'Itaalia',JP:'Jaapan',JM:'Jamaica',YE:'Jeemen',JE:'Jersey',JO:'Jordaania',CX:'Jõulusaar',KY:'Kaimanisaared',KH:'Kambodža',CM:'Kamerun',CA:'Kanada',KZ:'Kasahstan',QA:'Katar',KE:'Keenia',CF:'Kesk-Aafrika Vabariik',KI:'Kiribati',KM:'Komoorid',CD:'Kongo DV',CG:'Kongo Vabariik',CC:'Kookossaared',GR:'Kreeka',CU:'Kuuba',KW:'Kuveit',KG:'Kõrgõzstan',CY:'Küpros',LA:'Laos',LT:'Leedu',LS:'Lesotho',LR:'Libeeria',LI:'Liechtenstein',LB:'Liibanon',LY:'Liibüa',LU:'Luksemburg',LV:'Läti',EH:'Lääne-Sahara',ZA:'Lõuna-Aafrika Vabariik',GS:'Lõuna-Georgia ja Lõuna-Sandwichi saared',KR:'Lõuna-Korea',SS:'Lõuna-Sudaan',MO:'Macau erihalduspiirkond',MG:'Madagaskar',MY:'Malaisia',MW:'Malawi',MV:'Maldiivid',ML:'Mali',MT:'Malta',IM:'Mani saar',MA:'Maroko',MH:'Marshalli Saared',MQ:'Martinique',MR:'Mauritaania',MU:'Mauritius',YT:'Mayotte',MX:'Mehhiko',FM:'Mikroneesia',MD:'Moldova',MC:'Monaco',MN:'Mongoolia',ME:'Montenegro',MS:'Montserrat',MZ:'Mosambiik',MM:'Myanmar (Birma)',NA:'Namiibia',NR:'Nauru',NP:'Nepal',NI:'Nicaragua',NG:'Nigeeria',NE:'Niger',NU:'Niue',NF:'Norfolk',NO:'Norra',OM:'Omaan',PG:'Paapua Uus-Guinea',PK:'Pakistan',PS:'Palestiina alad',PA:'Panama',PY:'Paraguay',PE:'Peruu',PN:'Pitcairni saared',PL:'Poola',PT:'Portugal',GF:'Prantsuse Guajaana',TF:'Prantsuse Lõunaalad',PF:'Prantsuse Polüneesia',FR:'Prantsusmaa',PR:'Puerto Rico',KP:'Põhja-Korea',MK:'Põhja-Makedoonia',MP:'Põhja-Mariaanid',CV:'Roheneemesaared',SE:'Rootsi',RO:'Rumeenia',RW:'Rwanda',RE:'Réunion',SB:'Saalomoni Saared',SH:'Saint Helena',KN:'Saint Kitts ja Nevis',LC:'Saint Lucia',VC:'Saint Vincent ja Grenadiinid',BL:'Saint-Barthélemy',MF:'Saint-Martin',PM:'Saint-Pierre ja Miquelon',DE:'Saksamaa',ZM:'Sambia',WS:'Samoa',SM:'San Marino',SA:'Saudi Araabia',SC:'Seišellid',SN:'Senegal',RS:'Serbia',SL:'Sierra Leone',SG:'Singapur',SX:'Sint Maarten',SK:'Slovakkia',SI:'Sloveenia',SO:'Somaalia',FI:'Soome',LK:'Sri Lanka',SD:'Sudaan',SR:'Suriname',GB:'Suurbritannia',SZ:'Svaasimaa',SJ:'Svalbard ja Jan Mayen',ST:'São Tomé ja Príncipe',SY:'Süüria',DK:'Taani',TJ:'Tadžikistan',TH:'Tai',TW:'Taiwan',TZ:'Tansaania',TG:'Togo',TK:'Tokelau',TO:'Tonga',TT:'Trinidad ja Tobago',TN:'Tuneesia',TC:'Turks ja Caicos',TV:'Tuvalu',TR:'Türgi',TM:'Türkmenistan',TD:'Tšaad',CZ:'Tšehhi',CL:'Tšiili',VI:'USA Neitsisaared',UG:'Uganda',UA:'Ukraina',HU:'Ungari',UY:'Uruguay',UZ:'Usbekistan',NC:'Uus-Kaledoonia',NZ:'Uus-Meremaa',BY:'Valgevene',VU:'Vanuatu',VA:'Vatikan',RU:'Venemaa',VE:'Venezuela',VN:'Vietnam',WF:'Wallis ja Futuna',ZW:'Zimbabwe',UM:'Ühendriikide hajasaared',CH:'Šveits',OTHER:'Muu / Rahvusvaheline'};
function countryLabel(code){if(!code)return'';return COUNTRY_NAMES[code]||code;}

/* ── KATEGOORIAD ── */
var CAT_LABELS={light:'Kerglennuk',jet:'Ärijet',turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk',airliner:'Reisilennuk'};
var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};
var CAT_SYMS={EUR:'€',USD:'$',GBP:'£',CHF:'Fr',CAD:'CA$',AUD:'AU$'};

/* ── TOAST ── */
var _tt;
function showToast(msg){var el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){el.classList.remove('show');},3000);}

/* ── MOBIILIFILTRID ── */
function closeMobileFilters(){
  if(window.innerWidth>768)return;
  var s=document.getElementById('sidebar');if(s)s.classList.remove('open');
  var b=document.querySelector('.mob-filter-btn');if(b)b.setAttribute('aria-expanded','false');
}

/* ── LEMMIKUD ── */
function getFavs(){try{return JSON.parse(localStorage.getItem('a2s_favs')||'[]');}catch(e){return[];}}
function saveFavs(f){localStorage.setItem('a2s_favs',JSON.stringify(f));}
function isFav(id){return getFavs().indexOf(String(id))!==-1;}
function toggleFav(id,btn){
  var favs=getFavs();var sid=String(id);
  if(favs.indexOf(sid)!==-1){favs=favs.filter(function(x){return x!==sid;});btn.classList.remove('liked');btn.setAttribute('aria-pressed','false');showToast('Eemaldatud lemmikutest');}
  else{favs.push(sid);btn.classList.add('liked');btn.setAttribute('aria-pressed','true');showToast('Lisatud lemmikutesse');}
  saveFavs(favs);
  document.dispatchEvent(new Event('a2s:favs-updated'));
}

/* ── SUPABASE'I LAADIMINE ── */
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

/* ── KATEGOORIATE LOENDURID ── */
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

/* ── TA ASTA URL-IST ── */
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

/* ── KATEGOORIA VALIMINE ── */
function setCat(el,cat){
  selCat=cat;
  document.querySelectorAll('.fcat').forEach(function(f){f.classList.remove('active');});
  el.classList.add('active');
  curPage=1;
  applyFilters();
}

/* ── FILTRITE LÄHTESTAMINE ── */
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

/* ── VALUUTA ── */
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
  if(_budgetCur==='EUR'){n.textContent='Summad konverteeritakse võrdluseks eurodesse.';return;}
  var rate=_exRates[_budgetCur];
  n.textContent=rate?('1 EUR = '+rate.toFixed(3)+' '+_budgetCur):'Summad konverteeritakse võrdluseks eurodesse.';
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

/* ── FILTRITE RAKENDAMINE ── */
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

  /* Eelarve teisendamine eurodesse ühtseks võrdluseks */
  var minPeur=minP?toEUR(minP,_budgetCur):null;
  var maxPeur=maxP?toEUR(maxP,_budgetCur):null;

  /* Valitud riigi ISO-kood (juba ISO-kood, nt FR/DE) */
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
    /* Riigifilter: võrreldakse Supabase'is salvestatud ISO-koodi */
    if(countryCode&&l.country&&l.country.toUpperCase()!==countryCode.toUpperCase())return false;
    if(needIFR&&!l.ifr)return false;
    if(needRVSM&&!l.rvsm)return false;
    if(needADSB&&!l.adsb)return false;
    return true;
  });

  /* Sorteerimine */
  FILTERED.sort(function(a,b){
    if(sort==='price_asc'){var pa=toEUR(a.price,a.currency)||Infinity;var pb=toEUR(b.price,b.currency)||Infinity;return pa-pb;}
    if(sort==='price_desc'){var pa2=toEUR(a.price,a.currency)||0;var pb2=toEUR(b.price,b.currency)||0;return pb2-pa2;}
    if(sort==='year_desc'){return(Number(b.year)||0)-(Number(a.year)||0);}
    if(sort==='hours_asc'){return(Number(a.hours)||Infinity)-(Number(b.hours)||Infinity);}
    /* recent: submitted_at kahanevas järjekorras */
    return new Date(b.submitted_at||0)-new Date(a.submitted_at||0);
  });

  curPage=1;
  updateAlertBtn();
  renderPage();
}

/* ── RUUDUSTIKU RENDIMINE ── */
function renderPage(){
  var grid=document.getElementById('cardsGrid');
  var rc=document.getElementById('resultCount');
  if(!grid)return;

  var total=FILTERED.length;
  var pages=Math.ceil(total/PER_PAGE)||1;
  if(curPage>pages)curPage=pages;
  var start=(curPage-1)*PER_PAGE;
  var slice=FILTERED.slice(start,start+PER_PAGE);

  if(rc)rc.innerHTML=total+' '+(total===1?'kuulutus':'kuulutust')+(pages>1?' <small>leht '+curPage+' / '+pages+'</small>':'');

  grid.className='listings-grid'+(viewMode==='list'?' listings-list':'');

  if(!slice.length){
    var none=(total===0&&ALL.length===0);
    grid.innerHTML='<div class="empty-state">'
      +'<span class="icon-box">'+A2SIcon(none?'plane':'search')+'</span>'
      +'<div class="empty-title">'+(none?'Kuulutusi veel pole':'Nendele kriteeriumitele vastavaid tulemusi pole')+'</div>'
      +'<p class="empty-sub">'+(none?'Esimesed kuulutused on teel. Loo tasuta teavitus ja anname kohe teada, kui üks avaldatakse.':'Laienda filtreid või loo tasuta teavitus: anname kohe teada, kui mõni kuulutus vastab sinu otsingule.')+'</p>'
      +'<div class="empty-ctas">'
      +'<a href="/alerts.html" class="btn-primary">'+A2SIcon('bell')+'Loo teavitus</a>'
      +(none?'<a href="post-listing.html" class="btn-secondary">'+A2SIcon('plus')+'Avalda õhusõiduki kuulutus</a>':'<button type="button" class="btn-secondary" onclick="resetFilters()">'+A2SIcon('refresh')+'Lähtesta filtrid</button>')
      +'</div>'
      +'</div>';
    renderPagination(0,1);
    return;
  }

  grid.innerHTML=slice.map(function(l){return renderCard(l);}).join('');
  renderPagination(total,pages);
  injectSearchSchema(slice);
}

/* ── KUULUTUSE KAART ── */
function renderCard(l){
  var sym=CAT_SYMS[_dispCur]||'€';
  var priceEUR=toEUR(l.price,l.currency);
  var displayPrice=priceEUR?fromEUR(priceEUR,_dispCur):null;
  var pr=displayPrice?Math.round(displayPrice).toLocaleString(LOCALE)+' '+sym:'Hind kokkuleppel';
  var title=esc(l.title||[l.make,l.model].filter(Boolean).join(' ')||'Nimetu');
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
  var trust='<span class="badge-verified">'+(l.seller_certified?'Sertifitseeritud müüja':'Kontrollitud müüja')+'</span>';
  return '<a class="lc" href="listing.html?id='+encodeURIComponent(l.id)+'">'
    +'<div class="lc-img">'+img
    +(cat?'<span class="lc-cat-badge">'+cat+'</span>':'')
    +'<button type="button" class="lc-fav'+(fav?' liked':'')+'" aria-pressed="'+(fav?'true':'false')+'" aria-label="Lisa lemmikutesse" onclick="event.preventDefault();event.stopPropagation();toggleFav(\''+esc(String(l.id))+'\',this)">'+A2SIcon('heart')+'</button>'
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
    +'<div class="lc-price">'+pr+'</div>'
    +(loc?'<div class="lc-loc">'+A2SIcon('map-pin')+loc+'</div>':'')
    +'</div></div></a>';
}

/* ── LEHEKÜLJENUMBRID ── */
function renderPagination(total,pages){
  var el=document.getElementById('pagination');
  if(!el||pages<=1){if(el)el.innerHTML='';return;}
  var h='';
  if(curPage>1)h+='<button type="button" class="pgbtn" onclick="goPage('+(curPage-1)+')" aria-label="Eelmine">'+A2SIcon('chevron-left')+'<span>Eelmine</span></button>';
  for(var i=1;i<=pages;i++){
    if(pages>7&&i>2&&i<pages-1&&Math.abs(i-curPage)>1){if(i===3||i===pages-2)h+='<span class="pg-dots">…</span>';continue;}
    h+='<button type="button" class="pgbtn'+(i===curPage?' active':'')+'" onclick="goPage('+i+')"'+(i===curPage?' aria-current="page"':'')+'>'+i+'</button>';
  }
  if(curPage<pages)h+='<button type="button" class="pgbtn" onclick="goPage('+(curPage+1)+')" aria-label="Järgmine"><span>Järgmine</span>'+A2SIcon('chevron-right')+'</button>';
  el.innerHTML=h;
}
function goPage(n){curPage=n;renderPage();window.scrollTo({top:0,behavior:'smooth'});}

/* ── SKELETONID ── */
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
  var rc=document.getElementById('resultCount');if(rc)rc.textContent='Laadimine…';
}

/* ── RUUDUSTIKU / LOENDI VAADE ── */
function setView(v){
  viewMode=v;
  var g=document.getElementById('gridBtn'),lb=document.getElementById('listBtn');
  if(g){g.classList.toggle('active',v==='grid');g.setAttribute('aria-pressed',v==='grid'?'true':'false');}
  if(lb){lb.classList.toggle('active',v==='list');lb.setAttribute('aria-pressed',v==='list'?'true':'false');}
  try{localStorage.setItem('a2s_search_view',v);}catch(e){}
  renderPage();
}

/* ── TEAVITUSE NIPP (link eeltäidetud praeguse otsinguga) ── */
function updateAlertBtn(){
  var btn=document.getElementById('alertBtn');
  if(!btn)return;
  var si=document.getElementById('searchInput');
  var q=si?(si.value||'').trim():'';
  var params=new URLSearchParams();
  if(q)params.set('q',q);
  if(selCat)params.set('cat',selCat);
  btn.href='/alerts.html'+(params.toString()?'?'+params.toString():'');
}

/* ── ITEMLIST SEO SKEEM ── */
function injectSearchSchema(listings){
  var existing=document.getElementById('search-schema');
  if(existing)existing.remove();
  if(!listings||!listings.length)return;
  var items=listings.slice(0,10).map(function(l,i){
    var title=[l.make,l.model,l.year?'('+l.year+')':''].filter(Boolean).join(' ')||'Õhusõiduk';
    return {
      "@type":"ListItem",
      "position":i+1,
      "name":title,
      "url":"https://aircraft2sell.eu//listing.html?id="+l.id,
      "description":l.description?l.description.slice(0,120):''
    };
  });
  var schema={"@type":"ItemList","name":"Müügil olevad õhusõidukid — Aircraft2Sell","itemListElement":items,"@context":"https://schema.org"};
  var s=document.createElement('script');
  s.type='application/ld+json';s.id='search-schema';
  s.textContent=JSON.stringify(schema);
  document.head.appendChild(s);
}

/* ── KÄIVITUS ── */
window.addEventListener('DOMContentLoaded',function(){
  try{var v=localStorage.getItem('a2s_search_view');if(v==='list'){viewMode='list';var g=document.getElementById('gridBtn'),lb=document.getElementById('listBtn');if(g)g.classList.remove('active');if(lb)lb.classList.add('active');}}catch(e){}
  var si=document.getElementById('searchInput');
  if(si)si.addEventListener('input',function(){clearTimeout(si._t);si._t=setTimeout(applyFilters,250);});
  loadAll();
});

function toggleMobileFilters(btn){
  var s=document.getElementById('sidebar');
  var o=s.classList.toggle('open');
  btn.setAttribute('aria-expanded',o?'true':'false');
}
