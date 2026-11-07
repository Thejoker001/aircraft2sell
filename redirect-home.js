/* Externalisé le 06/11/26 (audit CSP unsafe-inline, phase 1) : ancienne page
   homepage.html, remplacée par index.html. Le 301 vercel.json couvre déjà la
   quasi-totalité des cas ; ce script est un filet de sécurité côté client
   (ex. lien externe obsolète, cache). Comportement inchangé, code identique
   à l'ancien <script>location.replace('/');</script> inline. */
location.replace('/');
