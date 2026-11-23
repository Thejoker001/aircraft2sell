#!/usr/bin/env python3
"""Génère planeurs.html, voltige.html, experimental.html (fr/en/et) en clonant
turboprops.html et en remplaçant tout le contenu spécifique turbo. Script
ponctuel, appelé une fois puis gardé comme trace pour audit."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATEGORIES = {
    "planeur": {"file": "planeurs"},
    "voltige": {"file": "voltige"},
    "experimental": {"file": "experimental"},
}

# ---------- contenu par langue par catégorie ----------
CONTENT = {
"fr": {
 "planeur": dict(
   meta_desc="Planeurs et motoplaneurs d'occasion en Europe : Schleicher, Stemme, Valentin. Annonces vérifiées, zéro commission.",
   keywords="planeur occasion, motoplaneur, Schleicher, Stemme, Valentin Taifun, vol à voile, aéronef sans moteur",
   og_title="Planeurs & motoplaneurs à vendre en Europe – Schleicher, Stemme | A2S",
   title="Planeurs & motoplaneurs à vendre en Europe – Schleicher, Stemme | A2S",
   breadcrumb_item="Planeurs & motoplaneurs à vendre en Europe",
   coll_name="Planeurs & motoplaneurs à vendre en Europe — Aircraft2Sell",
   faq=[
     ("Planeur pur ou motoplaneur ?","Le planeur pur dépend d'un treuil ou d'un remorqueur pour décoller, tandis que le motoplaneur embarque un moteur (souvent rétractable) qui permet un décollage autonome et des vols retour sans dépendre d'un remorqueur."),
     ("Quelles heures et visites vérifier avant d'acheter ?","Les heures cellule, la date de la dernière visite périodique (CN/ARC), l'état du revêtement (composite, métal ou toile) et, pour un motoplaneur, les heures et l'entretien du moteur."),
     ("Faut-il une licence spécifique pour voler en planeur ?","Oui, une licence de pilote de planeur (SPL) est requise pour un planeur pur ; pour un motoplaneur, une licence avion (LAPL/PPL) peut parfois suffire selon la motorisation — vérifiez la réglementation applicable."),
     ("Comment vendre rapidement mon planeur ?","Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché font la différence. Votre annonce est visible dans plus de 30 pays, sans commission. Notre outil d'estimation vous aide à fixer le prix."),
   ],
   breadcrumb_label="Planeurs",
   h1="Planeurs & motoplaneurs à vendre en Europe",
   subtitle="Schleicher, Stemme, Valentin — des machines pensées pour le vol à voile et le vol plané longue distance. Zéro commission sur la vente.",
   search_placeholder="Ka8, Stemme S10, ASW…",
   models=[("Schleicher Ka8","Schleicher+Ka8"),("Stemme S10","Stemme+S10"),("Valentin Taifun","Valentin+Taifun"),("Schleicher ASW","Schleicher+ASW"),("DG Flugzeugbau","DG+Flugzeugbau")],
   buy_h2="Acheter un planeur ou un motoplaneur en Europe",
   buy_p="Le marché du planeur et du motoplaneur réunit des pilotes passionnés de vol à voile, en club ou en propriété privée. Toutes nos annonces sont vérifiées manuellement ; vous traitez en direct avec le vendeur, sans commission.",
   buy_list=["Planeurs purs et motoplaneurs à décollage autonome","Heures cellule, visites périodiques et état du revêtement précisés","Contact direct avec le propriétaire ou le club"],
   sell_h2="Vendre sans commission",
   sell_p="Vendez votre planeur ou motoplaneur à des pilotes et clubs qualifiés à travers l'Europe. Fiche technique complète (heures cellule, dernière visite, finesse, moteur si équipé), jusqu'à 20 photos, zéro commission sur la vente finale.",
   sell_list=["Publication de base gratuite, annonce vérifiée sous 24 h","Visibilité dans 30+ pays européens","Options de mise en avant pour vendre plus vite"],
   alert="Bon à savoir : la finesse et l'état du revêtement (composite ou métal/toile) sont déterminants pour la valeur d'un planeur. Vérifiez la date de la dernière visite périodique (CN/ARC) avant de faire une offre.",
   models_h2="Modèles recherchés",
   faq_h2="Questions fréquentes", faq_sub="Ce que se demandent le plus souvent les acheteurs et vendeurs de planeurs.",
   eyebrow="Vous vendez ?", cta_h2="Vous vendez un planeur ou un motoplaneur ?",
   cta_p="Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l'Europe, sans prélever de commission sur la vente.",
   empty_title="Aucune annonce pour le moment",
   no_aircraft="Aéronef",
 ),
 "voltige": dict(
   meta_desc="Avions de voltige d'occasion en Europe : Extra 300/330, Pitts Special. Annonces vérifiées, zéro commission.",
   keywords="avion de voltige occasion, Extra 300, Extra 330, Pitts Special, acrobatie aérienne, aviation sportive",
   og_title="Avions de voltige à vendre en Europe – Extra, Pitts | A2S",
   title="Avions de voltige à vendre en Europe – Extra, Pitts | A2S",
   breadcrumb_item="Avions de voltige à vendre en Europe",
   coll_name="Avions de voltige à vendre en Europe — Aircraft2Sell",
   faq=[
     ("Quelle différence entre un Extra et un Pitts Special ?","L'Extra est un monoplan composite moderne optimisé pour la compétition de haut niveau, tandis que le Pitts Special est un biplan traditionnel, plus léger et souvent utilisé pour l'apprentissage de la voltige ou le loisir."),
     ("Quels facteurs de charge ces avions supportent-ils ?","Typiquement de l'ordre de +/-10G selon le modèle. La structure est renforcée en conséquence, d'où l'importance de suivre l'historique des charges subies via le carnet G."),
     ("Quels points techniques vérifier avant d'acheter ?","Les heures cellule et moteur, l'historique des facteurs de charge (carnet G), l'état du fuselage (composite ou toile), ainsi que l'hélice et le moteur haute performance."),
     ("Comment vendre rapidement mon avion de voltige ?","Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché font la différence. Votre annonce est visible dans plus de 30 pays, sans commission. Notre outil d'estimation vous aide à fixer le prix."),
   ],
   breadcrumb_label="Voltige",
   h1="Avions de voltige à vendre en Europe",
   subtitle="Extra, Pitts Special — des machines taillées pour l'acrobatie aérienne et la compétition. Zéro commission sur la vente.",
   search_placeholder="Extra 330, Pitts Special…",
   models=[("Extra 300","Extra+300"),("Extra 330","Extra+330"),("Pitts Special","Pitts+Special"),("Zivko Edge 540","Zivko+Edge+540"),("CAP 232","CAP+232")],
   buy_h2="Acheter un avion de voltige en Europe",
   buy_p="Le marché de la voltige aérienne réunit pilotes de compétition et amateurs passionnés d'acrobatie. Toutes nos annonces sont vérifiées manuellement ; vous traitez en direct avec le vendeur, sans commission.",
   buy_list=["Monoplaces et biplaces conçus pour les facteurs de charge élevés","Heures cellule, moteur et historique des G précisés","Contact direct avec le propriétaire ou l'équipe"],
   sell_h2="Vendre sans commission",
   sell_p="Vendez votre avion de voltige à des pilotes de compétition et clubs qualifiés à travers l'Europe. Fiche technique complète (heures TT, carnet G, moteur, hélice), jusqu'à 20 photos, zéro commission sur la vente finale.",
   sell_list=["Publication de base gratuite, annonce vérifiée sous 24 h","Visibilité dans 30+ pays européens","Options de mise en avant pour vendre plus vite"],
   alert="Bon à savoir : le carnet de suivi des facteurs de charge (G-meter log) pèse autant que les heures de vol dans la valeur d'un avion de voltige. Demandez-le systématiquement avant de faire une offre.",
   models_h2="Modèles recherchés",
   faq_h2="Questions fréquentes", faq_sub="Ce que se demandent le plus souvent les acheteurs et vendeurs d'avions de voltige.",
   eyebrow="Vous vendez ?", cta_h2="Vous vendez un avion de voltige ?",
   cta_p="Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l'Europe, sans prélever de commission sur la vente.",
   empty_title="Aucune annonce pour le moment",
   no_aircraft="Aéronef",
 ),
 "experimental": dict(
   meta_desc="Avions expérimentaux et kits d'occasion en Europe : Rutan, Alpi, KIS. Annonces vérifiées, zéro commission.",
   keywords="avion expérimental, kit avion, Rutan Cozy, Alpi Pioneer, construction amateur, CNRA",
   og_title="Avions expérimentaux & kits à vendre en Europe – Rutan, Alpi | A2S",
   title="Avions expérimentaux & kits à vendre en Europe – Rutan, Alpi | A2S",
   breadcrumb_item="Avions expérimentaux & kits à vendre en Europe",
   coll_name="Avions expérimentaux & kits à vendre en Europe — Aircraft2Sell",
   faq=[
     ("Qu'est-ce qu'un avion CNRA (Certificat de Navigabilité Restreint Aéronef) ?","C'est le statut français (et ses équivalents européens) pour les avions construits en amateur ou en kit, suivis par un constructeur identifié plutôt que certifiés selon les normes de l'aviation générale classique."),
     ("Faut-il une qualification particulière pour piloter un expérimental ?","Une licence avion classique suffit généralement, mais un lâcher spécifique par type est souvent recommandé compte tenu de la sensibilité des commandes propre à certains kits."),
     ("Quels points vérifier avant d'acheter un kit ou un expérimental ?","La qualité de construction, le dossier de construction complet, les heures et l'entretien, ainsi que la conformité au plan ou au kit d'origine."),
     ("Comment vendre rapidement mon avion expérimental ?","Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché font la différence. Votre annonce est visible dans plus de 30 pays, sans commission. Notre outil d'estimation vous aide à fixer le prix."),
   ],
   breadcrumb_label="Expérimental",
   h1="Avions expérimentaux & kits à vendre en Europe",
   subtitle="Rutan, Alpi, KIS — des appareils construits en amateur ou en petite série, homologués CNRA ou équivalent. Zéro commission sur la vente.",
   search_placeholder="Rutan Cozy, Alpi Pioneer…",
   models=[("Rutan Cozy","Rutan+Cozy"),("Rutan Long-EZ","Rutan+Long-EZ"),("Alpi Pioneer","Alpi+Pioneer"),("KIS TR4","KIS+TR4"),("Van's RV","Van%27s+RV")],
   buy_h2="Acheter un avion expérimental ou un kit en Europe",
   buy_p="Le marché de l'expérimental et des kits réunit constructeurs amateurs et pilotes en quête de performance ou d'appareils uniques. Toutes nos annonces sont vérifiées manuellement ; vous traitez en direct avec le vendeur, sans commission.",
   buy_list=["Kits homologués et constructions amateur (CNRA ou équivalent)","Dossier de construction, heures et entretien précisés","Contact direct avec le constructeur ou le propriétaire"],
   sell_h2="Vendre sans commission",
   sell_p="Vendez votre avion expérimental ou kit à des pilotes et constructeurs qualifiés à travers l'Europe. Dossier de construction complet, heures TT, moteur et avionique, jusqu'à 20 photos, zéro commission sur la vente finale.",
   sell_list=["Publication de base gratuite, annonce vérifiée sous 24 h","Visibilité dans 30+ pays européens","Options de mise en avant pour vendre plus vite"],
   alert="Bon à savoir : le dossier de construction complet (photos, étapes, inspections) est souvent aussi déterminant que les heures de vol pour la valeur d'un expérimental. Demandez-le avant de faire une offre.",
   models_h2="Modèles recherchés",
   faq_h2="Questions fréquentes", faq_sub="Ce que se demandent le plus souvent les acheteurs et vendeurs d'avions expérimentaux.",
   eyebrow="Vous vendez ?", cta_h2="Vous vendez un avion expérimental ou un kit ?",
   cta_p="Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l'Europe, sans prélever de commission sur la vente.",
   empty_title="Aucune annonce pour le moment",
   no_aircraft="Aéronef",
 ),
},
"en": {
 "planeur": dict(
   meta_desc="Used gliders and motor gliders for sale in Europe: Schleicher, Stemme, Valentin. Verified listings, zero commission.",
   keywords="glider for sale, motor glider, Schleicher, Stemme, Valentin Taifun, soaring, sailplane",
   og_title="Used Gliders & Motor Gliders for Sale in Europe – Schleicher, Stemme | A2S",
   title="Used Gliders & Motor Gliders for Sale in Europe – Schleicher, Stemme | A2S",
   breadcrumb_item="Gliders & Motor Gliders for Sale in Europe",
   coll_name="Gliders & Motor Gliders for Sale in Europe — Aircraft2Sell",
   faq=[
     ("Pure glider or motor glider?","A pure glider relies on a winch or tow plane to launch, while a motor glider carries an engine (often retractable) that allows a self-launch and return flights without depending on a tow."),
     ("Which hours and inspections should I check before buying?","Airframe hours, the date of the last periodic inspection (ARC), the condition of the covering (composite, metal or fabric) and, for a motor glider, engine hours and maintenance."),
     ("Do I need a specific licence to fly a glider?","Yes, a glider pilot licence (SPL) is required for a pure glider; for a motor glider, a PPL/LAPL may sometimes suffice depending on the powerplant — check applicable regulations."),
     ("How can I sell my glider quickly?","A complete sheet, quality photos, up-to-date records and a price in line with the market make the difference. Your listing is visible in more than 30 countries, with no commission. Our valuation tool helps you set the price."),
   ],
   breadcrumb_label="Gliders",
   h1="Gliders & Motor Gliders for Sale in Europe",
   subtitle="Schleicher, Stemme, Valentin — aircraft built for soaring and long-distance gliding. Zero commission on the sale.",
   search_placeholder="Ka8, Stemme S10, ASW…",
   models=[("Schleicher Ka8","Schleicher+Ka8"),("Stemme S10","Stemme+S10"),("Valentin Taifun","Valentin+Taifun"),("Schleicher ASW","Schleicher+ASW"),("DG Flugzeugbau","DG+Flugzeugbau")],
   buy_h2="Buying a glider or motor glider in Europe",
   buy_p="The glider and motor glider market brings together soaring enthusiasts, whether flying from a club or owning privately. All our listings are manually verified; you deal directly with the seller, with no commission.",
   buy_list=["Pure gliders and self-launching motor gliders","Airframe hours, periodic inspections and covering condition stated","Direct contact with the owner or club"],
   sell_h2="Selling with zero commission",
   sell_p="Sell your glider or motor glider to qualified pilots and clubs across Europe. Complete technical sheet (airframe hours, last inspection, glide ratio, engine if equipped), up to 20 photos, zero commission on the final sale.",
   sell_list=["Free basic listing, verified within 24 hours","Visibility across 30+ European countries","Promotion options to sell faster"],
   alert="Good to know: glide ratio and covering condition (composite or metal/fabric) are key drivers of a glider's value. Check the date of the last periodic inspection (ARC) before making an offer.",
   models_h2="Popular models",
   faq_h2="Frequently asked questions", faq_sub="The questions glider buyers and sellers ask most often.",
   eyebrow="Selling?", cta_h2="Selling a glider or motor glider?",
   cta_p="Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.",
   empty_title="No listings yet",
   no_aircraft="Aircraft",
 ),
 "voltige": dict(
   meta_desc="Used aerobatic aircraft for sale in Europe: Extra 300/330, Pitts Special. Verified listings, zero commission.",
   keywords="aerobatic aircraft for sale, Extra 300, Extra 330, Pitts Special, airshow aircraft, competition aerobatics",
   og_title="Used Aerobatic Aircraft for Sale in Europe – Extra, Pitts | A2S",
   title="Used Aerobatic Aircraft for Sale in Europe – Extra, Pitts | A2S",
   breadcrumb_item="Aerobatic Aircraft for Sale in Europe",
   coll_name="Aerobatic Aircraft for Sale in Europe — Aircraft2Sell",
   faq=[
     ("What's the difference between an Extra and a Pitts Special?","The Extra is a modern composite monoplane optimised for top-level competition, while the Pitts Special is a traditional biplane, lighter and often used for aerobatic training or leisure flying."),
     ("What load factors do these aircraft handle?","Typically around +/-10G depending on the model. The structure is reinforced accordingly, which is why tracking the load history via the G-meter log matters."),
     ("What should I check before buying?","Airframe and engine hours, the load factor history (G-log), the condition of the fuselage (composite or fabric), and the high-performance engine and propeller."),
     ("How can I sell my aerobatic aircraft quickly?","A complete sheet, quality photos, up-to-date records and a price in line with the market make the difference. Your listing is visible in more than 30 countries, with no commission. Our valuation tool helps you set the price."),
   ],
   breadcrumb_label="Aerobatics",
   h1="Aerobatic Aircraft for Sale in Europe",
   subtitle="Extra, Pitts Special — aircraft built for competition and airshow aerobatics. Zero commission on the sale.",
   search_placeholder="Extra 330, Pitts Special…",
   models=[("Extra 300","Extra+300"),("Extra 330","Extra+330"),("Pitts Special","Pitts+Special"),("Zivko Edge 540","Zivko+Edge+540"),("CAP 232","CAP+232")],
   buy_h2="Buying an aerobatic aircraft in Europe",
   buy_p="The aerobatics market brings together competition pilots and aerobatics enthusiasts. All our listings are manually verified; you deal directly with the seller, with no commission.",
   buy_list=["Single and two-seat aircraft built for high load factors","Airframe hours, engine and G-log history stated","Direct contact with the owner or team"],
   sell_h2="Selling with zero commission",
   sell_p="Sell your aerobatic aircraft to qualified competition pilots and clubs across Europe. Complete technical sheet (TT hours, G-log, engine, propeller), up to 20 photos, zero commission on the final sale.",
   sell_list=["Free basic listing, verified within 24 hours","Visibility across 30+ European countries","Promotion options to sell faster"],
   alert="Good to know: the G-meter logbook matters as much as flight hours for an aerobatic aircraft's value. Always ask for it before making an offer.",
   models_h2="Popular models",
   faq_h2="Frequently asked questions", faq_sub="The questions aerobatic aircraft buyers and sellers ask most often.",
   eyebrow="Selling?", cta_h2="Selling an aerobatic aircraft?",
   cta_p="Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.",
   empty_title="No listings yet",
   no_aircraft="Aircraft",
 ),
 "experimental": dict(
   meta_desc="Used experimental and kit aircraft for sale in Europe: Rutan, Alpi, KIS. Verified listings, zero commission.",
   keywords="experimental aircraft for sale, kit aircraft, Rutan Cozy, Alpi Pioneer, amateur-built, homebuilt",
   og_title="Used Experimental & Kit Aircraft for Sale in Europe – Rutan, Alpi | A2S",
   title="Used Experimental & Kit Aircraft for Sale in Europe – Rutan, Alpi | A2S",
   breadcrumb_item="Experimental & Kit Aircraft for Sale in Europe",
   coll_name="Experimental & Kit Aircraft for Sale in Europe — Aircraft2Sell",
   faq=[
     ("What is an amateur-built / experimental certificate?","It's the status (CNRA in France, and equivalents elsewhere in Europe) for aircraft built by amateurs or from kits, tracked by an identified builder rather than certified under standard general aviation rules."),
     ("Do I need a special qualification to fly an experimental aircraft?","A standard pilot licence is usually enough, but a type-specific check flight is often recommended given the handling characteristics unique to some kits."),
     ("What should I check before buying a kit or experimental aircraft?","Build quality, the complete build log, hours and maintenance, and compliance with the original kit plans."),
     ("How can I sell my experimental aircraft quickly?","A complete sheet, quality photos, up-to-date records and a price in line with the market make the difference. Your listing is visible in more than 30 countries, with no commission. Our valuation tool helps you set the price."),
   ],
   breadcrumb_label="Experimental",
   h1="Experimental & Kit Aircraft for Sale in Europe",
   subtitle="Rutan, Alpi, KIS — amateur-built or small-series aircraft, homebuilt-certified. Zero commission on the sale.",
   search_placeholder="Rutan Cozy, Alpi Pioneer…",
   models=[("Rutan Cozy","Rutan+Cozy"),("Rutan Long-EZ","Rutan+Long-EZ"),("Alpi Pioneer","Alpi+Pioneer"),("KIS TR4","KIS+TR4"),("Van's RV","Van%27s+RV")],
   buy_h2="Buying an experimental or kit aircraft in Europe",
   buy_p="The experimental and kit aircraft market brings together amateur builders and pilots seeking performance or unique aircraft. All our listings are manually verified; you deal directly with the seller, with no commission.",
   buy_list=["Certified kits and amateur-built aircraft (homebuilt category)","Build log, hours and maintenance stated","Direct contact with the builder or owner"],
   sell_h2="Selling with zero commission",
   sell_p="Sell your experimental or kit aircraft to qualified pilots and builders across Europe. Complete build log, TT hours, engine and avionics, up to 20 photos, zero commission on the final sale.",
   sell_list=["Free basic listing, verified within 24 hours","Visibility across 30+ European countries","Promotion options to sell faster"],
   alert="Good to know: a complete build log (photos, steps, inspections) often matters as much as flight hours for an experimental aircraft's value. Ask for it before making an offer.",
   models_h2="Popular models",
   faq_h2="Frequently asked questions", faq_sub="The questions experimental and kit aircraft buyers and sellers ask most often.",
   eyebrow="Selling?", cta_h2="Selling an experimental or kit aircraft?",
   cta_p="Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.",
   empty_title="No listings yet",
   no_aircraft="Aircraft",
 ),
},
"et": {
 "planeur": dict(
   meta_desc="Kasutatud purilennukid ja mootorpurilennukid Euroopas: Schleicher, Stemme, Valentin. Kontrollitud kuulutused, null vahendustasu.",
   keywords="purilennuk müügiks, mootorpurilennuk, Schleicher, Stemme, Valentin Taifun, liuglemine",
   og_title="Kasutatud purilennukid ja mootorpurilennukid müügil Euroopas – Schleicher, Stemme | A2S",
   title="Kasutatud purilennukid ja mootorpurilennukid müügil Euroopas – Schleicher, Stemme | A2S",
   breadcrumb_item="Purilennukid ja mootorpurilennukid müügil Euroopas",
   coll_name="Purilennukid ja mootorpurilennukid müügil Euroopas — Aircraft2Sell",
   faq=[
     ("Puhas purilennuk või mootorpurilennuk?","Puhas purilennuk vajab stardiks vintsi või vedajat, mootorpurilennukil on (sageli sissetõmmatav) mootor, mis võimaldab iseseisvat starti ja tagasilendu ilma vedajata."),
     ("Mida kontrollida enne ostu?","Kere lennutunnid, viimase perioodilise ülevaatuse (ARC) kuupäeva, katte seisukorda (komposiit, metall või riie) ning mootorpurilennuki puhul mootori tunde ja hooldust."),
     ("Kas vajan purilennuki lendamiseks eraldi lennundusluba?","Jah, puhta purilennuki jaoks on vajalik purilennuki piloodiluba (SPL); mootorpurilennuki jaoks võib mõnel juhul piisata PPL/LAPL load, sõltuvalt mootorist — kontrolli kehtivaid eeskirju."),
     ("Kuidas müüa oma purilennuk kiiresti?","Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja turuga kooskõlas olev hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta. Meie hindamistööriist aitab hinna paika panna."),
   ],
   breadcrumb_label="Purilennukid",
   h1="Purilennukid ja mootorpurilennukid müügil Euroopas",
   subtitle="Schleicher, Stemme, Valentin — õhusõidukid, mis on loodud liuglemiseks ja kaugliuglemiseks. Müük vahendustasuta.",
   search_placeholder="Ka8, Stemme S10, ASW…",
   models=[("Schleicher Ka8","Schleicher+Ka8"),("Stemme S10","Stemme+S10"),("Valentin Taifun","Valentin+Taifun"),("Schleicher ASW","Schleicher+ASW"),("DG Flugzeugbau","DG+Flugzeugbau")],
   buy_h2="Purilennuki või mootorpurilennuki ostmine Euroopas",
   buy_p="Purilennukite ja mootorpurilennukite turg koondab liuglemishuvilisi, kes lendavad klubis või omavad õhusõidukit eraomanduses. Kõik meie kuulutused on käsitsi kontrollitud; suhtled otse müüjaga, ilma vahendustasuta.",
   buy_list=["Puhtad purilennukid ja iseseisva stardiga mootorpurilennukid","Kere tunnid, perioodilised ülevaatused ja katte seisukord märgitud","Otsekontakt omaniku või klubiga"],
   sell_h2="Müük vahendustasuta",
   sell_p="Müü oma purilennuk või mootorpurilennuk kvalifitseeritud pilootidele ja klubidele üle Euroopa. Täielik tehniline kirjeldus (kere tunnid, viimane ülevaatus, libisemissuhe, mootor), kuni 20 fotot, lõppmüügilt vahendustasu pole.",
   sell_list=["Tasuta põhikuulutus, kontrollitud 24 tunni jooksul","Nähtavus enam kui 30 Euroopa riigis","Esiletõstmise valikud kiiremaks müügiks"],
   alert="Hea teada: libisemissuhe ja katte seisukord (komposiit või metall/riie) mõjutavad oluliselt purilennuki väärtust. Kontrolli viimase perioodilise ülevaatuse (ARC) kuupäeva enne pakkumise tegemist.",
   models_h2="Populaarsed mudelid",
   faq_h2="Korduma kippuvad küsimused", faq_sub="Küsimused, mida purilennukite ostjad ja müüjad kõige sagedamini esitavad.",
   eyebrow="Müüd?", cta_h2="Müüd purilennukit või mootorpurilennukit?",
   cta_p="Loo oma kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.",
   empty_title="Kuulutusi veel pole",
   no_aircraft="Õhusõiduk",
 ),
 "voltige": dict(
   meta_desc="Kasutatud akrolennukid Euroopas: Extra 300/330, Pitts Special. Kontrollitud kuulutused, null vahendustasu.",
   keywords="akrolennuk müügiks, Extra 300, Extra 330, Pitts Special, lennuakrobaatika",
   og_title="Kasutatud akrolennukid müügil Euroopas – Extra, Pitts | A2S",
   title="Kasutatud akrolennukid müügil Euroopas – Extra, Pitts | A2S",
   breadcrumb_item="Akrolennukid müügil Euroopas",
   coll_name="Akrolennukid müügil Euroopas — Aircraft2Sell",
   faq=[
     ("Mis vahe on Extral ja Pitts Specialil?","Extra on tänapäevane komposiitmaterjalist monoplaan, mis on optimeeritud tippklassi võistlusteks, Pitts Special on traditsiooniline, kergem biplaan, mida kasutatakse sageli akrobaatika õppimiseks või harrastuseks."),
     ("Milliseid koormustegureid need õhusõidukid taluvad?","Tüüpiliselt umbes +/-10G, sõltuvalt mudelist. Konstruktsioon on vastavalt tugevdatud, mistõttu on oluline jälgida koormuste ajalugu G-meetri logi kaudu."),
     ("Mida kontrollida enne ostu?","Kere ja mootori tunnid, koormustegurite ajalugu (G-logi), kere seisukord (komposiit või riie) ning kõrgjõudluse mootor ja propeller."),
     ("Kuidas müüa oma akrolennukit kiiresti?","Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja turuga kooskõlas olev hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta. Meie hindamistööriist aitab hinna paika panna."),
   ],
   breadcrumb_label="Akrolennukid",
   h1="Akrolennukid müügil Euroopas",
   subtitle="Extra, Pitts Special — võistlusteks ja lennunäitusteks loodud masinad. Müük vahendustasuta.",
   search_placeholder="Extra 330, Pitts Special…",
   models=[("Extra 300","Extra+300"),("Extra 330","Extra+330"),("Pitts Special","Pitts+Special"),("Zivko Edge 540","Zivko+Edge+540"),("CAP 232","CAP+232")],
   buy_h2="Akrolennuki ostmine Euroopas",
   buy_p="Akrobaatikaturg koondab võistluspiloote ja lennuakrobaatika entusiaste. Kõik meie kuulutused on käsitsi kontrollitud; suhtled otse müüjaga, ilma vahendustasuta.",
   buy_list=["Üks- ja kaksikistmelised kõrgeteks koormusteguriteks ehitatud õhusõidukid","Kere tunnid, mootor ja G-logi ajalugu märgitud","Otsekontakt omaniku või meeskonnaga"],
   sell_h2="Müük vahendustasuta",
   sell_p="Müü oma akrolennuk kvalifitseeritud võistluspilootidele ja klubidele üle Euroopa. Täielik tehniline kirjeldus (kere tunnid, G-logi, mootor, propeller), kuni 20 fotot, lõppmüügilt vahendustasu pole.",
   sell_list=["Tasuta põhikuulutus, kontrollitud 24 tunni jooksul","Nähtavus enam kui 30 Euroopa riigis","Esiletõstmise valikud kiiremaks müügiks"],
   alert="Hea teada: G-meetri logi on akrolennuki väärtuse hindamisel vähemalt nii oluline kui lennutunnid. Küsi see alati enne pakkumise tegemist.",
   models_h2="Populaarsed mudelid",
   faq_h2="Korduma kippuvad küsimused", faq_sub="Küsimused, mida akrolennukite ostjad ja müüjad kõige sagedamini esitavad.",
   eyebrow="Müüd?", cta_h2="Müüd akrolennukit?",
   cta_p="Loo oma kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.",
   empty_title="Kuulutusi veel pole",
   no_aircraft="Õhusõiduk",
 ),
 "experimental": dict(
   meta_desc="Kasutatud eksperimentaal- ja komplektlennukid Euroopas: Rutan, Alpi, KIS. Kontrollitud kuulutused, null vahendustasu.",
   keywords="eksperimentaallennuk müügiks, komplektlennuk, Rutan Cozy, Alpi Pioneer, amatöörehitus",
   og_title="Kasutatud eksperimentaal- ja komplektlennukid müügil Euroopas – Rutan, Alpi | A2S",
   title="Kasutatud eksperimentaal- ja komplektlennukid müügil Euroopas – Rutan, Alpi | A2S",
   breadcrumb_item="Eksperimentaal- ja komplektlennukid müügil Euroopas",
   coll_name="Eksperimentaal- ja komplektlennukid müügil Euroopas — Aircraft2Sell",
   faq=[
     ("Mis on amatöörehituse / eksperimentaalsertifikaat?","See on staatus (Prantsusmaal CNRA ja samaväärsed mujal Euroopas) amatööride või komplektidest ehitatud õhusõidukitele, mida jälgib konkreetne ehitaja, mitte standardsete üldlennunduse eeskirjade alusel sertifitseeritud õhusõiduk."),
     ("Kas lendamiseks on vaja eriluba?","Tavaline piloodiluba piisab enamasti, kuid tüübipõhine kontroll-lend on sageli soovitatav, arvestades mõnede komplektide eripärast käsitsemist."),
     ("Mida kontrollida enne komplekt- või eksperimentaallennuki ostu?","Ehituskvaliteeti, täielikku ehituspäevikut, tunde ja hooldust, ning vastavust algse komplekti plaanidele."),
     ("Kuidas müüa oma eksperimentaallennukit kiiresti?","Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja turuga kooskõlas olev hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta. Meie hindamistööriist aitab hinna paika panna."),
   ],
   breadcrumb_label="Eksperimentaallennukid",
   h1="Eksperimentaal- ja komplektlennukid müügil Euroopas",
   subtitle="Rutan, Alpi, KIS — amatööride või väikeseeriana ehitatud õhusõidukid. Müük vahendustasuta.",
   search_placeholder="Rutan Cozy, Alpi Pioneer…",
   models=[("Rutan Cozy","Rutan+Cozy"),("Rutan Long-EZ","Rutan+Long-EZ"),("Alpi Pioneer","Alpi+Pioneer"),("KIS TR4","KIS+TR4"),("Van's RV","Van%27s+RV")],
   buy_h2="Eksperimentaal- või komplektlennuki ostmine Euroopas",
   buy_p="Eksperimentaal- ja komplektlennukite turg koondab amatöörehitajaid ja piloote, kes otsivad jõudlust või unikaalseid õhusõidukeid. Kõik meie kuulutused on käsitsi kontrollitud; suhtled otse müüjaga, ilma vahendustasuta.",
   buy_list=["Sertifitseeritud komplektid ja amatöörehitatud õhusõidukid (homebuilt kategooria)","Ehituspäevik, tunnid ja hooldus märgitud","Otsekontakt ehitaja või omanikuga"],
   sell_h2="Müük vahendustasuta",
   sell_p="Müü oma eksperimentaal- või komplektlennuk kvalifitseeritud pilootidele ja ehitajatele üle Euroopa. Täielik ehituspäevik, lennutunnid, mootor ja avioonika, kuni 20 fotot, lõppmüügilt vahendustasu pole.",
   sell_list=["Tasuta põhikuulutus, kontrollitud 24 tunni jooksul","Nähtavus enam kui 30 Euroopa riigis","Esiletõstmise valikud kiiremaks müügiks"],
   alert="Hea teada: täielik ehituspäevik (fotod, etapid, ülevaatused) on eksperimentaallennuki väärtuse hindamisel sageli nii oluline kui lennutunnid. Küsi see enne pakkumise tegemist.",
   models_h2="Populaarsed mudelid",
   faq_h2="Korduma kippuvad küsimused", faq_sub="Küsimused, mida eksperimentaal- ja komplektlennukite ostjad ja müüjad kõige sagedamini esitavad.",
   eyebrow="Müüd?", cta_h2="Müüd eksperimentaal- või komplektlennukit?",
   cta_p="Loo oma kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.",
   empty_title="Kuulutusi veel pole",
   no_aircraft="Õhusõiduk",
 ),
},
}

ICON_MAP = {"planeur": "ulm", "voltige": "refresh", "experimental": "wrench"}

def build_faq_schema(faq):
    items = []
    for q, a in faq:
        q_e = q.replace('"', '\\"')
        a_e = a.replace('"', '\\"')
        items.append('{"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}' % (q_e, a_e))
    return "[" + ",".join(items) + "]"

def build_faq_html(faq):
    parts = []
    for q, a in faq:
        parts.append(
            '<details><summary>%s<i data-icon="chevron-down"></i></summary><div class="faq-a">%s</div></details>' % (q, a)
        )
    return "".join(parts)

def build_pills(cat, models):
    return "".join(
        '<a href="search.html?cat=%s&amp;q=%s" class="pill">%s</a>' % (cat, q, label)
        for label, q in models
    )

def build_checklist(items):
    return "".join('<li><i data-icon="check"></i>%s</li>' % x for x in items)


def gen_fr(cat, c, out_path):
    src_path = os.path.join(ROOT, "turboprops.html")
    html = open(src_path, encoding="utf-8").read()
    slug = CATEGORIES[cat]["file"]
    icon = ICON_MAP[cat]
    # TRANSLATED_PAGES: add new slug.html after 'turboprops.html'
    html = html.replace(
        "'ulm.html', 'avions-de-ligne.html',",
        f"'ulm.html', 'avions-de-ligne.html', '{slug}.html',"
    )
    html = html.replace('<meta name="description" content="Pilatus PC-12, TBM, King Air à vendre en Europe. Turboprops pour particuliers et pros. Vente avion occasion, aircraft for sale Europe, sans commission.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="Pilatus PC-12, TBM 930, Beechcraft King Air, Daher TBM, Socata, turbopropulseurs à vendre en europe, marketplace aéronautique">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Turbopropulseurs à vendre en Europe – Pilatus, TBM | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="Pilatus PC-12, TBM, King Air à vendre en Europe. Turboprops pour particuliers et pros. Vente avion occasion, aircraft for sale Europe, sans commission.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('https://aircraft2sell.eu/turboprops.html', f'https://aircraft2sell.eu/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/en/turboprops.html', f'https://aircraft2sell.eu/en/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/et/turboprops.html', f'https://aircraft2sell.eu/et/{slug}.html')
    html = html.replace('<title>Turbopropulseurs à vendre en Europe – Pilatus, TBM | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Turbopropulseurs à vendre en Europe","item":"https://aircraft2sell.eu/%s.html"' % slug,
                         '"name":"%s","item":"https://aircraft2sell.eu/%s.html"' % (c["breadcrumb_item"], slug))
    html = html.replace('"name":"Turbopropulseurs à vendre en Europe — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"Pilatus PC-12, TBM, King Air à vendre en Europe. Turboprops pour particuliers et pros. Vente avion occasion, aircraft for sale Europe, sans commission."', f'"description":"{c["meta_desc"]}"')
    faq_json = build_faq_schema(c["faq"])
    html = html.replace(
        '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Pourquoi choisir un turbopropulseur plutôt qu\u2019un jet ?","acceptedAnswer":{"@type":"Answer","text":"Des coûts d\u2019exploitation plus faibles, la possibilité d\u2019utiliser des pistes courtes ou non revêtues et une bonne charge utile. Les turbopropulseurs sont particulièrement adaptés aux liaisons régionales de 300 à 1 500 km."}},{"@type":"Question","name":"Monomoteur ou bimoteur ?","acceptedAnswer":{"@type":"Answer","text":"Le PC-12 et les TBM offrent des performances élevées avec un seul moteur, et l\u2019exploitation commerciale monomoteur en IFR (SET-IMC) est désormais autorisée en Europe. Le King Air reste la référence bimoteur pour ceux qui privilégient la redondance."}},{"@type":"Question","name":"Quels points techniques vérifier avant d\u2019acheter ?","acceptedAnswer":{"@type":"Answer","text":"Les heures et cycles cellule, le temps moteur depuis révision et depuis l\u2019inspection à mi-vie (HSI), l\u2019adhésion à un programme de maintenance, l\u2019état de l\u2019hélice et de la pressurisation, ainsi que la génération d\u2019avionique installée."}},{"@type":"Question","name":"Comment vendre rapidement mon turbopropulseur ?","acceptedAnswer":{"@type":"Answer","text":"Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché font la différence. Votre annonce est visible dans plus de 30 pays, sans commission. Notre outil d\u2019estimation vous aide à fixer le prix."}}]}',
        '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + faq_json + '}'
    )
    html = html.replace('var CAT_ICON=\'turboprop\';', f"var CAT_ICON='{icon}';")
    html = html.replace('category=eq.turbo', f'category=eq.{cat}')
    html = html.replace('name="cat" value="turbo"', f'name="cat" value="{cat}"')
    html = html.replace('search.html?cat=turbo', f'search.html?cat={cat}')
    html = html.replace('<i data-icon="turboprop"></i>', f'<i data-icon="{icon}"></i>')
    html = html.replace('<span aria-current="page">Turbopropulseurs</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Turbopropulseurs à vendre en Europe</h1>\n        <p>Pilatus PC-12, Daher TBM, Beechcraft King Air — des appareils polyvalents prisés des pilotes privés expérimentés comme des opérateurs professionnels (évacuation sanitaire, transport régional, fret léger). Zéro commission sur la vente.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="PC-12, TBM 940, King Air 350…"', f'placeholder="{c["search_placeholder"]}"')
    html = html.replace('<h2>Dernières annonces</h2><p>Les turbopropulseurs publiés récemment par des particuliers et des professionnels vérifiés.</p>',
                         f'<h2>Dernières annonces</h2><p>{c["faq_sub"].replace("Ce que se demandent le plus souvent les acheteurs et vendeurs","Les annonces publiées récemment,")} vérifiées.</p>' if False else f'<h2>Dernières annonces</h2><p>Dernières annonces vérifiées pour cette catégorie.</p>')
    html = html.replace('<h2>Acheter un turbopropulseur en Europe</h2>\n        <p>Les turbopropulseurs combinent autonomie, capacité de charge et coûts d\u2019exploitation maîtrisés — un choix populaire pour particuliers exigeants et opérateurs professionnels. Toutes nos annonces sont vérifiées manuellement ; vous traitez en direct avec le vendeur, sans commission.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Monomoteurs (PC-12, TBM) et bimoteurs (King Air) de toutes générations</li><li><i data-icon="check"></i>Heures cellule, temps moteur depuis révision, avionique renseignés</li><li><i data-icon="check"></i>Contact direct avec le propriétaire ou l\u2019opérateur</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Vendre sans commission</h2>\n        <p>Vendez votre turbopropulseur à des acheteurs qualifiés : particuliers fortunés, opérateurs et flottes d\u2019entreprise. Fiche technique complète (heures TT, SMOH, avionique, RVSM), jusqu\u2019à 20 photos, zéro commission sur la vente finale.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Publication de base gratuite, annonce vérifiée sous 24 h</li><li><i data-icon="check"></i>Visibilité dans 30+ pays européens</li><li><i data-icon="check"></i>Options de mise en avant pour vendre plus vite</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Bon à savoir :</strong> le coût d\u2019une révision moteur (PT6, TPE331) pèse lourd dans le prix d\u2019un turbopropulseur. Vérifiez le temps restant avant révision et l\u2019inspection à mi-vie (HSI) avant de faire une offre.',
                         f'<strong>Bon à savoir :</strong> {c["alert"].split(": ",1)[1] if ": " in c["alert"] else c["alert"]}')
    html = html.replace('<h2>Modèles recherchés</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=%s&amp;q=Pilatus+PC-12" class="pill">Pilatus PC-12</a><a href="search.html?cat=%s&amp;q=TBM+930" class="pill">TBM 930</a><a href="search.html?cat=%s&amp;q=Beechcraft+King+Air" class="pill">Beechcraft King Air</a><a href="search.html?cat=%s&amp;q=Daher+TBM" class="pill">Daher TBM</a><a href="search.html?cat=%s&amp;q=Socata" class="pill">Socata</a></div>' % (cat, cat, cat, cat, cat)
    html = html.replace(old_pills, f'<div class="pills">{build_pills(cat, c["models"])}</div>')
    html = html.replace('<a href="turbopropulseur-ou-jet-affaires.html" class="card card-hover guide-link"><span class="icon-box"><i data-icon="plane"></i></span>Turbopropulseur ou jet d\'affaires ?<i data-icon="chevron-right" class="chev"></i></a>', '')
    html = html.replace('<h2>Questions fréquentes</h2><p>Ce que se demandent le plus souvent les acheteurs et vendeurs de turbopropulseurs.</p>',
                         f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = '<div class="card faq"><details><summary>Pourquoi choisir un turbopropulseur plutôt qu\u2019un jet ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Des coûts d\u2019exploitation plus faibles, la possibilité d\u2019utiliser des pistes courtes ou non revêtues et une bonne charge utile. Les turbopropulseurs sont particulièrement adaptés aux liaisons régionales de 300 à 1 500 km.</div></details><details><summary>Monomoteur ou bimoteur ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Le PC-12 et les TBM offrent des performances élevées avec un seul moteur, et l\u2019exploitation commerciale monomoteur en IFR (SET-IMC) est désormais autorisée en Europe. Le King Air reste la référence bimoteur pour ceux qui privilégient la redondance.</div></details><details><summary>Quels points techniques vérifier avant d\u2019acheter ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Les heures et cycles cellule, le temps moteur depuis révision et depuis l\u2019inspection à mi-vie (HSI), l\u2019adhésion à un programme de maintenance, l\u2019état de l\u2019hélice et de la pressurisation, ainsi que la génération d\u2019avionique installée.</div></details><details><summary>Comment vendre rapidement mon turbopropulseur ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché font la différence. Votre annonce est visible dans plus de 30 pays, sans commission. Notre <a href="estimation.html">outil d\u2019estimation</a> vous aide à fixer le prix.</div></details></div>'
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Vous vendez ?</span>\n        <h2>Vous vendez un turbopropulseur ?</h2>\n        <p>Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l\u2019Europe, sans prélever de commission sur la vente.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(html)
    return html


def gen_en(cat, c, out_path):
    src_path = os.path.join(ROOT, "en", "turboprops.html")
    html = open(src_path, encoding="utf-8").read()
    slug = CATEGORIES[cat]["file"]
    icon = ICON_MAP[cat]
    html = html.replace("'ulm.html', 'avions-de-ligne.html',", f"'ulm.html', 'avions-de-ligne.html', '{slug}.html',")
    html = html.replace('<meta name="description" content="Browse turboprop aircraft for sale across Europe: King Air, TBM, PC-12 and more. Verified listings, detailed specifications, zero commission.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="Pilatus PC-12, TBM 930, Beechcraft King Air, Daher TBM, Socata, turboprops for sale Europe, aviation marketplace">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Turboprops for Sale in Europe – Pilatus, TBM | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="Browse turboprop aircraft for sale across Europe: King Air, TBM, PC-12 and more. Verified listings, detailed specifications, zero commission.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('https://aircraft2sell.eu/turboprops.html', f'https://aircraft2sell.eu/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/en/turboprops.html', f'https://aircraft2sell.eu/en/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/et/turboprops.html', f'https://aircraft2sell.eu/et/{slug}.html')
    html = html.replace('<title>Turboprops for Sale in Europe – Pilatus, TBM | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Turboprops for Sale in Europe","item":"https://aircraft2sell.eu/en/%s.html"' % slug,
                         '"name":"%s","item":"https://aircraft2sell.eu/en/%s.html"' % (c["breadcrumb_item"], slug))
    html = html.replace('"name":"Turboprops for Sale in Europe — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"Pilatus PC-12, TBM, King Air for sale in Europe. Turboprops for private owners and professionals. Used aircraft sales, aircraft for sale Europe, zero commission."', f'"description":"{c["meta_desc"]}"')
    faq_json = build_faq_schema(c["faq"])
    old_faq_schema = '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Why choose a turboprop over a jet?","acceptedAnswer":{"@type":"Answer","text":"Lower operating costs, the ability to use short or unpaved runways and a good payload. Turboprops are particularly well suited to regional trips of 300 to 1,500 km."}},{"@type":"Question","name":"Single-engine or twin-engine?","acceptedAnswer":{"@type":"Answer","text":"The PC-12 and TBM family deliver high performance on a single engine, and commercial single-engine IFR operations (SET-IMC) are now permitted in Europe. The King Air remains the twin-engine benchmark for those who prioritise redundancy."}},{"@type":"Question","name":"Which technical points should I check before buying?","acceptedAnswer":{"@type":"Answer","text":"Airframe hours and cycles, engine time since overhaul and since hot section inspection (HSI), enrolment in a maintenance programme, propeller and pressurisation condition, and the generation of avionics installed."}},{"@type":"Question","name":"How can I sell my turboprop quickly?","acceptedAnswer":{"@type":"Answer","text":"A complete sheet, quality photos, up-to-date records and a price in line with the market make the difference. Your listing is visible in more than 30 countries, with no commission. Our valuation tool helps you set the price."}}]}'
    html = html.replace(old_faq_schema, '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + faq_json + '}')
    html = html.replace("var CAT_ICON='turboprop';", f"var CAT_ICON='{icon}';")
    html = html.replace('category=eq.turbo', f'category=eq.{cat}')
    html = html.replace('name="cat" value="turbo"', f'name="cat" value="{cat}"')
    html = html.replace('search.html?cat=turbo', f'search.html?cat={cat}')
    html = html.replace('<i data-icon="turboprop"></i>', f'<i data-icon="{icon}"></i>')
    html = html.replace('<span aria-current="page">Turboprops</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Turboprops for Sale in Europe</h1>\n        <p>Pilatus PC-12, Daher TBM, Beechcraft King Air — versatile aircraft favoured by experienced private pilots and professional operators alike (air ambulance, regional transport, light cargo). Zero commission on the sale.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="PC-12, TBM 940, King Air 350…"', f'placeholder="{c["search_placeholder"]}"')
    html = html.replace('<h2>Latest listings</h2><p>Turboprops recently listed by verified private sellers and professionals.</p>',
                         '<h2>Latest listings</h2><p>Recently listed by verified private sellers and professionals.</p>')
    html = html.replace('<h2>Buying a turboprop in Europe</h2>\n        <p>Turboprops combine range, payload capacity and controlled operating costs — a popular choice for demanding private owners and professional operators. All our listings are manually verified; you deal directly with the seller, with no commission.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Single-engine (PC-12, TBM) and twin-engine (King Air) aircraft of all generations</li><li><i data-icon="check"></i>Airframe hours, engine time since overhaul and avionics stated</li><li><i data-icon="check"></i>Direct contact with the owner or operator</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Selling with zero commission</h2>\n        <p>Sell your turboprop to qualified buyers: high-net-worth individuals, operators and corporate fleets. Complete technical sheet (TT hours, SMOH, avionics, RVSM), up to 20 photos, zero commission on the final sale.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Free basic listing, verified within 24 hours</li><li><i data-icon="check"></i>Visibility across 30+ European countries</li><li><i data-icon="check"></i>Promotion options to sell faster</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Good to know:</strong> the cost of an engine overhaul (PT6, TPE331) weighs heavily on a turboprop\u2019s price. Check the time remaining before overhaul and the hot section inspection (HSI) before making an offer.',
                         f'<strong>Good to know:</strong> {c["alert"].split(": ",1)[1] if ": " in c["alert"] else c["alert"]}')
    html = html.replace('<h2>Popular models</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=%s&amp;q=Pilatus+PC-12" class="pill">Pilatus PC-12</a><a href="search.html?cat=%s&amp;q=TBM+930" class="pill">TBM 930</a><a href="search.html?cat=%s&amp;q=Beechcraft+King+Air" class="pill">Beechcraft King Air</a><a href="search.html?cat=%s&amp;q=Daher+TBM" class="pill">Daher TBM</a><a href="search.html?cat=%s&amp;q=Socata" class="pill">Socata</a></div>' % (cat, cat, cat, cat, cat)
    html = html.replace(old_pills, f'<div class="pills">{build_pills(cat, c["models"])}</div>')
    html = html.replace('<a href="aircraft-for-sale-europe.html" class="card card-hover guide-link"><span class="icon-box"><i data-icon="globe"></i></span>Aircraft for sale in Europe<i data-icon="chevron-right" class="chev"></i></a>', '')
    html = html.replace('<h2>Frequently asked questions</h2><p>The questions turboprop buyers and sellers ask most often.</p>',
                         f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = '<div class="card faq"><details><summary>Why choose a turboprop over a jet?<i data-icon="chevron-down"></i></summary><div class="faq-a">Lower operating costs, the ability to use short or unpaved runways and a good payload. Turboprops are particularly well suited to regional trips of 300 to 1,500 km.</div></details><details><summary>Single-engine or twin-engine?<i data-icon="chevron-down"></i></summary><div class="faq-a">The PC-12 and TBM family deliver high performance on a single engine, and commercial single-engine IFR operations (SET-IMC) are now permitted in Europe. The King Air remains the twin-engine benchmark for those who prioritise redundancy.</div></details><details><summary>Which technical points should I check before buying?<i data-icon="chevron-down"></i></summary><div class="faq-a">Airframe hours and cycles, engine time since overhaul and since hot section inspection (HSI), enrolment in a maintenance programme, propeller and pressurisation condition, and the generation of avionics installed.</div></details><details><summary>How can I sell my turboprop quickly?<i data-icon="chevron-down"></i></summary><div class="faq-a">A complete sheet, quality photos, up-to-date records and a price in line with the market make the difference. Your listing is visible in more than 30 countries, with no commission. Our <a href="/estimation.html">valuation tool</a> helps you set the price.</div></details></div>'
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Selling?</span>\n        <h2>Selling a turboprop?</h2>\n        <p>Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(html)
    return html


def gen_et(cat, c, out_path):
    src_path = os.path.join(ROOT, "et", "turboprops.html")
    html = open(src_path, encoding="utf-8").read()
    slug = CATEGORIES[cat]["file"]
    icon = ICON_MAP[cat]
    html = html.replace("'ulm.html', 'avions-de-ligne.html',", f"'ulm.html', 'avions-de-ligne.html', '{slug}.html',")
    html = html.replace('<meta name="description" content="Sirvi müügil olevaid turbopropellerlennukeid üle Euroopa: King Air, TBM, PC-12 ja palju muud. Kontrollitud kuulutused, üksikasjalikud tehnilised andmed, vahendustasuta.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="Pilatus PC-12, TBM 930, Beechcraft King Air, Daher TBM, Socata, turbopropellerid müügil Euroopas, lennunduse kuulutusteportaal">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Turbopropellerid müügil Euroopas – Pilatus, TBM | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="Sirvi müügil olevaid turbopropellerlennukeid üle Euroopa: King Air, TBM, PC-12 ja palju muud. Kontrollitud kuulutused, üksikasjalikud tehnilised andmed, vahendustasuta.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('https://aircraft2sell.eu/turboprops.html', f'https://aircraft2sell.eu/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/en/turboprops.html', f'https://aircraft2sell.eu/en/{slug}.html')
    html = html.replace('https://aircraft2sell.eu/et/turboprops.html', f'https://aircraft2sell.eu/et/{slug}.html')
    html = html.replace('<title>Turbopropellerid müügil Euroopas – Pilatus, TBM | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Turbopropellerid müügil Euroopas","item":"https://aircraft2sell.eu/et/%s.html"' % slug,
                         '"name":"%s","item":"https://aircraft2sell.eu/et/%s.html"' % (c["breadcrumb_item"], slug))
    html = html.replace('"name":"Turbopropellerid müügil Euroopas — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"Pilatus PC-12, TBM, King Air müügil Euroopas. Turbopropellerid eraomanikele ja professionaalidele. Kasutatud õhusõidukite müük, õhusõidukid müügil Euroopas, vahendustasuta."', f'"description":"{c["meta_desc"]}"')
    faq_json = build_faq_schema(c["faq"])
    old_faq_schema = '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Miks eelistada turbopropellerit jet\'ile?","acceptedAnswer":{"@type":"Answer","text":"Madalamad tegevuskulud, võimalus kasutada lühikesi või katmata lennuradasid ja hea kandevõime. Turbopropellerid sobivad eriti hästi 300–1500 km pikkusteks piirkondlikeks lendudeks."}},{"@type":"Question","name":"Ühe- või kahemootoriline?","acceptedAnswer":{"@type":"Answer","text":"PC-12 ja TBM\'i perekond pakuvad ühe mootoriga kõrget jõudlust ning kaubanduslikud ühemootorilised IFR-lennud (SET-IMC) on Euroopas nüüd lubatud. King Air on jäänud kahemootoriliste võrdlusmudeliks neile, kes hindavad varuturvalisust."}},{"@type":"Question","name":"Milliseid tehnilisi punkte peaksin enne ostmist kontrollima?","acceptedAnswer":{"@type":"Answer","text":"Kere lennutunnid ja tsüklid, mootori tööaeg pärast kapitaalremonti ja kuumaosa ülevaatust (HSI), hooldusprogrammiga liitumine, propelleri ja rõhustussüsteemi seisukord ning paigaldatud avioonika põlvkond."}},{"@type":"Question","name":"Kuidas müüa oma turbopropeller kiiresti?","acceptedAnswer":{"@type":"Answer","text":"Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja turuga kooskõlas olev hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta. Meie hindamistööriist aitab hinna paika panna."}}]}'
    html = html.replace(old_faq_schema, '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + faq_json + '}')
    html = html.replace("var CAT_ICON='turboprop';", f"var CAT_ICON='{icon}';")
    html = html.replace('category=eq.turbo', f'category=eq.{cat}')
    html = html.replace('name="cat" value="turbo"', f'name="cat" value="{cat}"')
    html = html.replace('search.html?cat=turbo', f'search.html?cat={cat}')
    html = html.replace('<i data-icon="turboprop"></i>', f'<i data-icon="{icon}"></i>')
    html = html.replace('<span aria-current="page">Turbopropellerid</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Turbopropellerid müügil Euroopas</h1>\n        <p>Pilatus PC-12, Daher TBM, Beechcraft King Air — mitmekülgsed õhusõidukid, mida hindavad nii kogenud erapiloodid kui ka professionaalsed operaatorid (kiirabilennud, piirkondlik transport, kerge kaubavedu). Müük vahendustasuta.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="PC-12, TBM 940, King Air 350…"', f'placeholder="{c["search_placeholder"]}"')
    html = html.replace('<h2>Uusimad kuulutused</h2><p>Kontrollitud eramüüjate ja professionaalide hiljuti avaldatud turbopropellerid.</p>',
                         '<h2>Uusimad kuulutused</h2><p>Kontrollitud eramüüjate ja professionaalide hiljuti avaldatud kuulutused.</p>')
    html = html.replace('<h2>Turbopropelleri ostmine Euroopas</h2>\n        <p>Turbopropellerid ühendavad lennukauguse, kandevõime ja kontrollitud tegevuskulud — populaarne valik nõudlikele eraomanikele ja professionaalsetele operaatoritele. Kõik meie kuulutused on käsitsi kontrollitud; suhtled otse müüjaga, ilma vahendustasuta.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Kõigi põlvkondade ühemootorilised (PC-12, TBM) ja kahemootorilised (King Air) õhusõidukid</li><li><i data-icon="check"></i>Kere lennutunnid, mootori tööaeg pärast kapitaalremonti ja avioonika on välja toodud</li><li><i data-icon="check"></i>Otsene kontakt omaniku või operaatoriga</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Müük vahendustasuta</h2>\n        <p>Müü oma turbopropeller kvalifitseeritud ostjatele: suure varandusega eraisikud, operaatorid ja ettevõtete lennukipargid. Täielik tehniline leht (TT tunnid, SMOH, avioonika, RVSM), kuni 20 fotot, lõppmüügilt vahendustasu pole.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Tasuta põhikuulutus, kontrollitud 24 tunni jooksul</li><li><i data-icon="check"></i>Nähtavus enam kui 30 Euroopa riigis</li><li><i data-icon="check"></i>Reklaamivõimalused kiiremaks müügiks</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Hea teada:</strong> mootori kapitaalremondi hind (PT6, TPE331) mõjutab tugevalt turbopropelleri hinda. Enne pakkumise tegemist kontrolli, kui palju aega on jäänud kapitaalremondini ja kuumaosa ülevaatuseni (HSI).',
                         f'<strong>Hea teada:</strong> {c["alert"].split(": ",1)[1] if ": " in c["alert"] else c["alert"]}')
    html = html.replace('<h2>Populaarsed mudelid</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=%s&amp;q=Pilatus+PC-12" class="pill">Pilatus PC-12</a><a href="search.html?cat=%s&amp;q=TBM+930" class="pill">TBM 930</a><a href="search.html?cat=%s&amp;q=Beechcraft+King+Air" class="pill">Beechcraft King Air</a><a href="search.html?cat=%s&amp;q=Daher+TBM" class="pill">Daher TBM</a><a href="search.html?cat=%s&amp;q=Socata" class="pill">Socata</a></div>' % (cat, cat, cat, cat, cat)
    html = html.replace(old_pills, f'<div class="pills">{build_pills(cat, c["models"])}</div>')
    html = html.replace('<h2>Korduma kippuvad küsimused</h2><p>Küsimused, mida turbopropelleri ostjad ja müüjad kõige sagedamini esitavad.</p>',
                         f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = "<div class=\"card faq\"><details><summary>Miks eelistada turbopropellerit jet'ile?<i data-icon=\"chevron-down\"></i></summary><div class=\"faq-a\">Madalamad tegevuskulud, võimalus kasutada lühikesi või katmata lennuradasid ja hea kandevõime. Turbopropellerid sobivad eriti hästi 300–1500 km pikkusteks piirkondlikeks lendudeks.</div></details><details><summary>Ühe- või kahemootoriline?<i data-icon=\"chevron-down\"></i></summary><div class=\"faq-a\">PC-12 ja TBM'i perekond pakuvad ühe mootoriga kõrget jõudlust ning kaubanduslikud ühemootorilised IFR-lennud (SET-IMC) on Euroopas nüüd lubatud. King Air on jäänud kahemootoriliste võrdlusmudeliks neile, kes hindavad varuturvalisust.</div></details><details><summary>Milliseid tehnilisi punkte peaksin enne ostmist kontrollima?<i data-icon=\"chevron-down\"></i></summary><div class=\"faq-a\">Kere lennutunnid ja tsüklid, mootori tööaeg pärast kapitaalremonti ja kuumaosa ülevaatust (HSI), hooldusprogrammiga liitumine, propelleri ja rõhustussüsteemi seisukord ning paigaldatud avioonika põlvkond.</div></details><details><summary>Kuidas müüa oma turbopropeller kiiresti?<i data-icon=\"chevron-down\"></i></summary><div class=\"faq-a\">Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja turuga kooskõlas olev hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta. Meie <a href=\"/estimation.html\">hindamistööriist</a> aitab hinna paika panna.</div></details></div>"
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Müüd?</span>\n        <h2>Müüd turbopropellerit?</h2>\n        <p>Loo oma kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(html)
    return html


def main():
    report = []
    for cat, meta in CATEGORIES.items():
        slug = meta["file"]
        html_fr = gen_fr(cat, CONTENT["fr"][cat], os.path.join(ROOT, f"{slug}.html"))
        html_en = gen_en(cat, CONTENT["en"][cat], os.path.join(ROOT, "en", f"{slug}.html"))
        html_et = gen_et(cat, CONTENT["et"][cat], os.path.join(ROOT, "et", f"{slug}.html"))
        for lang, html in (("fr", html_fr), ("en", html_en), ("et", html_et)):
            leftover = "turbo" in html.lower().replace("turboprop", "").replace("liuglemine", "")
            report.append((cat, lang, "turboprops.html" in html or "cat=turbo" in html or "eq.turbo" in html))
    return report

if __name__ == "__main__":
    r = main()
    for row in r:
        print(row)
