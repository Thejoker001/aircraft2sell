#!/usr/bin/env python3
"""Étend aux pages restantes (home, détail annonce, dashboard, vendeur, alertes,
carte, estimation, onboarding, tendances) les 4 catégories qui existaient déjà
en base mais manquaient dans leurs maps JS/UI : planeur, voltige, experimental,
et le renommage airliner -> warbird (page avions-de-ligne.html repurposée).
Remplacements littéraux exacts (un par ligne grep'ée), idempotent (skip si déjà appliqué)."""
import re

ROOT = "/home/ubuntu/workspace/aircraft2sell"

REPL = [
# ---- FR ----
("index.html", [
  ('<option value="airliner">Avions de ligne</option>',
   '<option value="planeur">Planeurs</option>\n              <option value="voltige">Voltige</option>\n              <option value="experimental">Expérimental</option>\n              <option value="warbird">Avions militaires</option>'),
  ('data-action="filterListings" data-args=\'["__this__","airliner"]\' data-cat="airliner">Avions de ligne</button>',
   'data-action="filterListings" data-args=\'["__this__","warbird"]\' data-cat="warbird">Avions militaires</button>'),
  ('<i data-icon="airliner"></i></span><div class="cat-name">Avions de ligne</div>',
   '<i data-icon="rocket"></i></span><div class="cat-name">Avions militaires</div>'),
  ("var CAT_LABEL={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turboprop',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var CAT_LABEL={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turboprop',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("['light','jet','turbo','heli','ulm','airliner'].forEach",
   "['light','jet','turbo','heli','ulm','planeur','voltige','experimental','warbird'].forEach"),
]),
("listing-page.html", [
  ("var CAT_NAMES={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var CAT_NAMES={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var catLabels={light:'Avions légers',jet:\"Jets d'affaires\",turbo:'Turboprops',heli:'Hélicoptères',ulm:'ULM',airliner:'Avions de ligne'};",
   "var catLabels={light:'Avions légers',jet:\"Jets d'affaires\",turbo:'Turboprops',heli:'Hélicoptères',ulm:'ULM',planeur:'Planeurs',voltige:'Voltige',experimental:'Expérimental',warbird:'Avions militaires'};"),
  ("var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',airliner:'avions-de-ligne'};",
   "var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',planeur:'planeurs',voltige:'voltige',experimental:'experimental',warbird:'avions-de-ligne'};"),
]),
("seller.html", [
  ('data-cat="airliner" data-action="filterCat" data-args=\'["__this__","airliner"]\'>Avions de ligne</button>',
   'data-cat="warbird" data-action="filterCat" data-args=\'["__this__","warbird"]\'>Avions militaires</button>'),
  ("var CAT_LABELS={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var CAT_LABELS={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
]),
("map.html", [
  ('data-cat="airliner" aria-pressed="false" data-action="filterMap" data-args=\'["__this__","airliner"]\'><i data-icon="airliner"></i>Avions de ligne</button>',
   'data-cat="warbird" aria-pressed="false" data-action="filterMap" data-args=\'["__this__","warbird"]\'><i data-icon="rocket"></i>Avions militaires</button>'),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_LABEL={light:'avion léger',jet:'jet',turbo:'turboprop',heli:'hélicoptère',ulm:'ULM',airliner:'avion de ligne'};",
   "var CAT_LABEL={light:'avion léger',jet:'jet',turbo:'turboprop',heli:'hélicoptère',ulm:'ULM',planeur:'planeur',voltige:'voltige',experimental:'expérimental',warbird:'avion militaire'};"),
]),
("estimation.html", [
  ('<option value="airliner">Avion de ligne</option>',
   '<option value="planeur">Planeur</option>\n                <option value="voltige">Voltige</option>\n                <option value="experimental">Expérimental</option>\n                <option value="warbird">Avion militaire</option>'),
]),
("onboarding.html", [
  ('<input type="checkbox" value="airliner" data-action="toggleInterest" data-args=\'["__this__","airliner"]\'><span class="icon-box"><i data-icon="airliner"></i></span><span class="choice-title">Avions de ligne</span></label>',
   '<input type="checkbox" value="warbird" data-action="toggleInterest" data-args=\'["__this__","warbird"]\'><span class="icon-box"><i data-icon="rocket"></i></span><span class="choice-title">Avions militaires</span></label>'),
]),
("dashboard.html", [
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_LABEL={light:'Avion léger',jet:'Jet d\\'affaires',turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var CAT_LABEL={light:'Avion léger',jet:'Jet d\\'affaires',turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
  ("var ALERT_CAT={light:'Avion léger',jet:'Jet d\\'affaires',turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var ALERT_CAT={light:'Avion léger',jet:'Jet d\\'affaires',turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
]),
("alerts.html", [
  ('<option value="airliner">Avion de ligne</option>',
   '<option value="planeur">Planeur</option>\n                <option value="voltige">Voltige</option>\n                <option value="experimental">Expérimental</option>\n                <option value="warbird">Avion militaire</option>'),
  ("var CAT_LABEL={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',airliner:'Avion de ligne'};",
   "var CAT_LABEL={light:'Avion léger',jet:\"Jet d'affaires\",turbo:'Turbopropulseur',heli:'Hélicoptère',ulm:'ULM',planeur:'Planeur',voltige:'Voltige',experimental:'Expérimental',warbird:'Avion militaire'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
]),
("tendances-marche.html", [
  ("var CAT_LABELS={light:'Avions légers',jet:\"Jets d'affaires\",turbo:'Turbopropulseurs',heli:'Hélicoptères',ulm:'ULM',airliner:'Avions de ligne'};",
   "var CAT_LABELS={light:'Avions légers',jet:\"Jets d'affaires\",turbo:'Turbopropulseurs',heli:'Hélicoptères',ulm:'ULM',planeur:'Planeurs',voltige:'Voltige',experimental:'Expérimental',warbird:'Avions militaires'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_ORDER=['light','jet','turbo','heli','ulm','airliner'];",
   "var CAT_ORDER=['light','jet','turbo','heli','ulm','planeur','voltige','experimental','warbird'];"),
]),
("guide-acheteur.html", [
  ('<tr><td><i data-icon="airliner"></i>Avion de ligne</td><td>Transport commercial, cargo, ACMI</td><td>ATPL + qualification de type</td><td>500 000 € – 80 M€</td></tr>',
   '<tr><td><i data-icon="rocket"></i>Avion militaire / Warbird</td><td>Collection, voltige, aviation historique</td><td>Qualification de type spécifique</td><td>30 000 € – 2 M€</td></tr>'),
]),
("admin-a2s00760.html", [
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("  'ATR':'airliner','Bombardier Q (Dash 8)':'airliner','Embraer ERJ':'airliner',\n  'Embraer E-Jet':'airliner','Boeing':'airliner','Airbus':'airliner',\n  'De Havilland Canada':'airliner','Fokker':'airliner','BAe / British Aerospace':'airliner',",
   "  'MiG':'warbird','FOUGA':'warbird','Ryan':'warbird','Yakovlev':'warbird','Aero Vodochody':'warbird','North American':'warbird',\n  'ATR':'warbird','Bombardier Q (Dash 8)':'warbird','Embraer ERJ':'warbird',\n  'Embraer E-Jet':'warbird','Boeing':'warbird','Airbus':'warbird',\n  'De Havilland Canada':'warbird','Fokker':'warbird','BAe / British Aerospace':'warbird',"),
  ("  heli:'Hélicoptère', ulm:'ULM', planeur:'Planeur', voltige:'Voltige', experimental:'Expérimental', airliner:'Avion de ligne'\n};",
   "  heli:'Hélicoptère', ulm:'ULM', planeur:'Planeur', voltige:'Voltige', experimental:'Expérimental', warbird:'Avion militaire'\n};"),
  ("      var catIcons={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',airliner:'airliner'};",
   "      var catIcons={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
]),
# ---- EN ----
("en/index.html", [
  ('<option value="airliner">Airliners</option>',
   '<option value="planeur">Gliders</option>\n              <option value="voltige">Aerobatics</option>\n              <option value="experimental">Experimental</option>\n              <option value="warbird">Military aircraft</option>'),
  ('data-action="filterListings" data-args=\'["__this__","airliner"]\' data-cat="airliner">Airliners</button>',
   'data-action="filterListings" data-args=\'["__this__","warbird"]\' data-cat="warbird">Military aircraft</button>'),
  ('<i data-icon="airliner"></i></span><div class="cat-name">Airliners</div>',
   '<i data-icon="rocket"></i></span><div class="cat-name">Military aircraft</div>'),
  ("var CAT_LABEL={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Light sport-ULM',airliner:'Airliner'};",
   "var CAT_LABEL={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Light sport-ULM',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("['light','jet','turbo','heli','ulm','airliner'].forEach",
   "['light','jet','turbo','heli','ulm','planeur','voltige','experimental','warbird'].forEach"),
]),
("en/listing-page.html", [
  ("var CAT_NAMES={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'ULM',airliner:'Airliner'};",
   "var CAT_NAMES={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'ULM',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var catLabels={light:'Light aircraft',jet:'Business jets',turbo:'Turboprops',heli:'Helicopters',ulm:'ULM',airliner:'Airliners'};",
   "var catLabels={light:'Light aircraft',jet:'Business jets',turbo:'Turboprops',heli:'Helicopters',ulm:'ULM',planeur:'Gliders',voltige:'Aerobatics',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',airliner:'avions-de-ligne'};",
   "var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',planeur:'planeurs',voltige:'voltige',experimental:'experimental',warbird:'avions-de-ligne'};"),
]),
("en/seller.html", [
  ('data-cat="airliner" data-action="filterCat" data-args=\'["__this__","airliner"]\'>Airliners</button>',
   'data-cat="warbird" data-action="filterCat" data-args=\'["__this__","warbird"]\'>Military aircraft</button>'),
  ("var CAT_LABELS={light:'Light aircraft',jet:\"Business jet\",turbo:'Turboprop',heli:'Helicopter',ulm:'Light sport/ULM',airliner:'Airliner'};",
   "var CAT_LABELS={light:'Light aircraft',jet:\"Business jet\",turbo:'Turboprop',heli:'Helicopter',ulm:'Light sport/ULM',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
]),
("en/map.html", [
  ('data-cat="airliner" aria-pressed="false" data-action="filterMap" data-args=\'["__this__","airliner"]\'><i data-icon="airliner"></i>Airliners</button>',
   'data-cat="warbird" aria-pressed="false" data-action="filterMap" data-args=\'["__this__","warbird"]\'><i data-icon="rocket"></i>Military aircraft</button>'),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_LABEL={light:'light aircraft',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ULM',airliner:'airliner'};",
   "var CAT_LABEL={light:'light aircraft',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ULM',planeur:'glider',voltige:'aerobatic',experimental:'experimental',warbird:'military aircraft'};"),
]),
("en/estimation.html", [
  ('<option value="airliner">Airliner</option>',
   '<option value="planeur">Glider</option>\n                <option value="voltige">Aerobatic</option>\n                <option value="experimental">Experimental</option>\n                <option value="warbird">Military aircraft</option>'),
]),
("en/onboarding.html", [
  ('<input type="checkbox" value="airliner" data-action="toggleInterest" data-args=\'["__this__","airliner"]\'><span class="icon-box"><i data-icon="airliner"></i></span><span class="choice-title">Airliners</span></label>',
   '<input type="checkbox" value="warbird" data-action="toggleInterest" data-args=\'["__this__","warbird"]\'><span class="icon-box"><i data-icon="rocket"></i></span><span class="choice-title">Military aircraft</span></label>'),
]),
("en/dashboard.html", [
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_LABEL={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',airliner:'Airliner'};",
   "var CAT_LABEL={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var ALERT_CAT={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',airliner:'Airliner'};",
   "var ALERT_CAT={light:'Light aircraft',jet:'Business jet',turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
]),
("en/alerts.html", [
  ('<option value="airliner">Airliner</option>',
   '<option value="planeur">Glider</option>\n                <option value="voltige">Aerobatic</option>\n                <option value="experimental">Experimental</option>\n                <option value="warbird">Military aircraft</option>'),
  ("var CAT_LABEL={light:'Light aircraft',jet:\"Business jet\",turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',airliner:'Airliner'};",
   "var CAT_LABEL={light:'Light aircraft',jet:\"Business jet\",turbo:'Turboprop',heli:'Helicopter',ulm:'Microlight',planeur:'Glider',voltige:'Aerobatic',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
]),
("en/tendances-marche.html", [
  ("var CAT_LABELS={light:'Light aircraft',jet:\"Business jets\",turbo:'Turboprops',heli:'Helicopters',ulm:'Microlights',airliner:'Airliners'};",
   "var CAT_LABELS={light:'Light aircraft',jet:\"Business jets\",turbo:'Turboprops',heli:'Helicopters',ulm:'Microlights',planeur:'Gliders',voltige:'Aerobatics',experimental:'Experimental',warbird:'Military aircraft'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var CAT_ORDER=['light','jet','turbo','heli','ulm','airliner'];",
   "var CAT_ORDER=['light','jet','turbo','heli','ulm','planeur','voltige','experimental','warbird'];"),
]),
("en/guide-acheteur.html", [
  ('<tr><td><i data-icon="airliner"></i>Airliner</td><td>Commercial transport, cargo, ACMI</td><td>ATPL + type rating</td><td>€500,000 – €80M</td></tr>',
   '<tr><td><i data-icon="rocket"></i>Military aircraft / Warbird</td><td>Collecting, aerobatics, historic aviation</td><td>Specific type rating</td><td>€30,000 – €2M</td></tr>'),
]),
# ---- ET ----
("et/index.html", [
  ('<option value="airliner">Reisilennukid</option>',
   '<option value="planeur">Purilennukid</option>\n              <option value="voltige">Akrolennukid</option>\n              <option value="experimental">Eksperimentaallennukid</option>\n              <option value="warbird">Militaarlennukid</option>'),
  ('data-action="filterListings" data-args=\'["__this__","airliner"]\' data-cat="airliner">Reisilennukid</button>',
   'data-action="filterListings" data-args=\'["__this__","warbird"]\' data-cat="warbird">Militaarlennukid</button>'),
  ('<i data-icon="airliner"></i></span><div class="cat-name">Reisilennukid</div>',
   '<i data-icon="rocket"></i></span><div class="cat-name">Militaarlennukid</div>'),
  ("var CAT_LABEL={light:'Kerglennuk',jet:'Ärijet',turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk-ULM',airliner:'Reisilennuk'};",
   "var CAT_LABEL={light:'Kerglennuk',jet:'Ärijet',turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk-ULM',planeur:'Purilennuk',voltige:'Akrolennuk',experimental:'Eksperimentaallennuk',warbird:'Militaarlennuk'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("['light','jet','turbo','heli','ulm','airliner'].forEach",
   "['light','jet','turbo','heli','ulm','planeur','voltige','experimental','warbird'].forEach"),
]),
("et/post-listing.html", [
  ("var catLabels={light:'Kerge lennuk',jet:'Ärijet',turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk',airliner:'Reisilennuk'};",
   "var catLabels={light:'Kerge lennuk',jet:'Ärijet',turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk',planeur:'Purilennuk',voltige:'Akrolennuk',experimental:'Eksperimentaallennuk',warbird:'Militaarlennuk'};"),
]),
("et/guide-acheteur.html", [
  ('<tr><td><i data-icon="airliner"></i>Reisilennuk</td><td>Kommertstransport, lastivedu, ACMI</td><td>ATPL + tüübikvalifikatsioon</td><td>500 000 € – 80 M€</td></tr>',
   '<tr><td><i data-icon="rocket"></i>Militaarlennuk / Warbird</td><td>Kollektsioneerimine, akrobaatika, ajalooline lennundus</td><td>Spetsiifiline tüübikvalifikatsioon</td><td>30 000 € – 2 M€</td></tr>'),
]),
("et/listing-page.html", [
  ("var CAT_NAMES={light:'Kerglennuk',jet:\"Ärijet'id\",turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk-ULM',airliner:'Reisilennuk'};",
   "var CAT_NAMES={light:'Kerglennuk',jet:\"Ärijet'id\",turbo:'Turbopropeller',heli:'Helikopter',ulm:'Mikrolennuk-ULM',planeur:'Purilennuk',voltige:'Akrolennuk',experimental:'Eksperimentaallennuk',warbird:'Militaarlennuk'};"),
  ("var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',airliner:'airliner'};",
   "var CAT_ICON={light:'plane-light',jet:'jet',turbo:'turboprop',heli:'helicopter',ulm:'ulm',planeur:'ulm',voltige:'refresh',experimental:'wrench',warbird:'rocket'};"),
  ("var catLabels={light:'Kerglennukid',jet:\"Ärijet'id\",turbo:'Turbopropellerid',heli:'Helikopterid',ulm:'Mikrolennukid / ULM',airliner:'Reisilennukid'};",
   "var catLabels={light:'Kerglennukid',jet:\"Ärijet'id\",turbo:'Turbopropellerid',heli:'Helikopterid',ulm:'Mikrolennukid / ULM',planeur:'Purilennukid',voltige:'Akrolennukid',experimental:'Eksperimentaallennukid',warbird:'Militaarlennukid'};"),
  ("var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',airliner:'avions-de-ligne'};",
   "var catSlug={light:'avions-legers',jet:'jets-affaires',turbo:'turboprops',heli:'helicopteres',ulm:'ulm',planeur:'planeurs',voltige:'voltige',experimental:'experimental',warbird:'avions-de-ligne'};"),
]),
]

total_applied = 0
total_skipped = 0
for relpath, pairs in REPL:
    path = f"{ROOT}/{relpath}"
    with open(path, encoding="utf-8") as f:
        html = f.read()
    for old, new in pairs:
        if old in html:
            html = html.replace(old, new)
            total_applied += 1
        elif new in html:
            total_skipped += 1  # already applied
        else:
            print(f"!! NOT FOUND in {relpath}: {old[:80]!r}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)

print(f"Applied: {total_applied}, already-applied(skipped): {total_skipped}")
