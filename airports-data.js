/* ==========================================================================
   Aircraft2Sell — Coordonnées des aérodromes OACI européens courants
   --------------------------------------------------------------------------
   Source de vérité partagée entre map.html et search.html (vue carte).
   Ne pas dupliquer cette table ailleurs : un seul point d'édition pour
   ajouter un aéroport (ex. si de nouvelles annonces couvrent un aérodrome
   absent de cette liste, elles restent invisibles sur les cartes).
   ========================================================================== */
var A2S_AIRPORTS = {
  LFPG:{lat:49.009,lng:2.547,name:'Paris CDG'},LFPB:{lat:48.969,lng:2.441,name:'Paris Le Bourget'},
  LFMN:{lat:43.658,lng:7.215,name:'Nice'},LFML:{lat:43.436,lng:5.214,name:'Marseille'},
  LFBO:{lat:43.629,lng:1.363,name:'Toulouse'},LFBD:{lat:44.828,lng:-0.715,name:'Bordeaux'},
  LFLL:{lat:45.726,lng:5.090,name:'Lyon'},LFRS:{lat:47.153,lng:-1.610,name:'Nantes'},
  LFQQ:{lat:50.561,lng:3.086,name:'Lille'},LFRB:{lat:48.447,lng:-4.418,name:'Brest'},
  EDDF:{lat:50.033,lng:8.570,name:'Francfort'},EDDB:{lat:52.366,lng:13.503,name:'Berlin'},
  EDDM:{lat:48.353,lng:11.786,name:'Munich'},EDDL:{lat:51.289,lng:6.767,name:'Düsseldorf'},
  EBBR:{lat:50.902,lng:4.484,name:'Bruxelles'},EBOS:{lat:51.199,lng:2.862,name:'Ostende'},
  LSGG:{lat:46.238,lng:6.109,name:'Genève'},LSZH:{lat:47.458,lng:8.548,name:'Zürich'},
  LEMD:{lat:40.472,lng:-3.561,name:'Madrid'},LEBL:{lat:41.297,lng:2.078,name:'Barcelone'},
  LIRF:{lat:41.800,lng:12.247,name:'Rome Fiumicino'},LIML:{lat:45.445,lng:9.276,name:'Milan'},
  EHAM:{lat:52.308,lng:4.764,name:'Amsterdam'},EGLL:{lat:51.477,lng:-0.461,name:'Londres Heathrow'},
  EGKB:{lat:51.331,lng:0.032,name:'Biggin Hill'}
};
