/* Tests du moteur de réponse de l'assistant (assistant.js).
 *
 * Rejoue des questions telles qu'un visiteur les écrit — pas les intitulés de
 * la FAQ — et vérifie que la bonne réponse remonte, ET qu'une question hors
 * sujet déclenche bien l'escalade vers un humain plutôt qu'une réponse
 * inventée.
 *
 * Le moteur est dupliqué ici volontairement : assistant.js est écrit pour le
 * navigateur (IIFE, pas d'export). Si le score change dans assistant.js, le
 * reporter ici. Toute évolution de la FAQ doit être suivie d'un run.
 *
 * Usage : node scripts/test-assistant.mjs   (sortie non nulle si un cas échoue)
 */
import fs from 'fs';
const win={};
new Function('window', fs.readFileSync('/home/ubuntu/aircraft2sell/faq-data.js','utf8'))(win);
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const STOP=norm('le la les un une des du de a au aux et ou est sont ce cette ces mon ma mes votre vos je vous il elle on nous que qui quoi comment pourquoi quand ou pour par sur dans avec sans plus moins tres etre avoir faire puis peux peut the a an of to in on for with and or is are do does can i my your it this that what how why when where').split(' ');
const stem=w=>w.length>5?w.slice(0,5):w;
const tok=s=>norm(s).split(' ').filter(w=>w.length>2&&!STOP.includes(w));
const stems=s=>norm(s).split(' ').filter(Boolean).map(stem);
function score(q,e){const qt=tok(q);if(!qt.length)return 0;
 e._sq=e._sq||stems(e.q);e._sa=e._sa||stems(e.a);e._sk=e._sk||stems(e.k||'');
 let hits=0,total=0;
 qt.forEach(w=>{const t=stem(w);let s=0;
  if(e._sq.includes(t))s=3;else if(e._sk.includes(t))s=2.6;else if(e._sa.includes(t))s=1.1;
  if(s)hits++;total+=s;});
 if(!hits)return 0;
 return total*Math.sqrt(hits/qt.length);}
const TH=2.2;
function run(lang,tests){
 const data=win.A2S_FAQ.map(e=>({...e[lang]}));
 let ok=0;
 for(const [q,expect] of tests){
  const r=data.map(e=>({e,s:score(q,e)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
  const b=r[0]; const answered=b&&b.s>=TH;
  const nz=x=>String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const good = expect===null ? !answered : (answered && nz(b.e.q).includes(nz(expect)));
  if(good)ok++;
  console.log(`${good?'  OK':'FAIL'}  ${q}\n        -> ${answered?'['+b.s.toFixed(1)+'] '+b.e.q:'escalade email'}`);
 }
 console.log(`\n${lang.toUpperCase()} : ${ok}/${tests.length}\n`);
 return ok===tests.length;
}
const fr=[["c'est quoi vos frais ?","commission"],["vous prenez une commission ?","commission"],
["comment je vends mon avion","deposer"],["combien ça coûte","commission"],
["mon annonce a été refusée pourquoi","validee"],["est-ce que c'est fiable, y a des arnaques ?","verifiees"],
["je peux mettre combien de photos","photos"],["comment annuler mon abonnement","resilier"],
["j'ai perdu mon mot de passe","mot de passe"],["vous revendez mes données ?","donnees"],
["ça marche sur téléphone ?","mobile"],["quelle est la météo à Paris",null]];
const en=[["do you take a commission?","commission"],["how do i sell my plane","listing"],
["is it safe? any scams?","verified"],["how do i cancel my subscription","cancel"],
["does it work on mobile","mobile"],["what is the weather in paris",null]];
const a=run('fr',fr), b=run('en',en);
process.exit(a&&b?0:1);
