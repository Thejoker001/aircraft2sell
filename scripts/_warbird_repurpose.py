#!/usr/bin/env python3
"""Repurpose avions-de-ligne.html (fr/en/et) en page Warbird / Avion militaire.
La catégorie 'airliner' est vide (0 annonce réelle depuis le lancement) ; les
3 annonces concernées (MiG-21, Fouga Magister, Ryan PT22) ont été reclassées
en category='warbird' côté Supabase. On réutilise le plumbing existant de
cette page (nav/footer/search/post-listing/admin déjà câblés sur
avions-de-ligne.html) plutôt que de créer un nouveau fichier, pour éviter
d'avoir deux pages mortes (airliner vide ET warbird sans page)."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONTENT = {
"fr": dict(
  meta_desc="Avions militaires et warbirds à vendre en Europe : chasseurs-écoles, avions d'entraînement, appareils de collection. Annonces vérifiées, zéro commission.",
  keywords="avion militaire occasion, warbird à vendre, MiG-21, Fouga Magister, avion de collection, chasseur-école, CNRA",
  og_title="Avions militaires & warbirds à vendre en Europe | A2S",
  title="Avions militaires & warbirds à vendre en Europe | A2S",
  breadcrumb_item="Avions militaires & warbirds à vendre en Europe",
  coll_name="Avions militaires & warbirds à vendre en Europe — Aircraft2Sell",
  breadcrumb_label="Warbirds",
  h1="Avions militaires & warbirds à vendre en Europe",
  subtitle="MiG, Fouga Magister, avions d'entraînement militaire — des appareils de collection pour pilotes et musées passionnés d'aviation historique. Zéro commission sur la vente.",
  qs_placeholder="MiG-21, Fouga Magister, L-39…",
  qs_label="Recherche rapide",
  budget_label="Budget maximum",
  nolimit="Sans limite",
  search_cta="Rechercher",
  latest_h2="Dernières annonces",
  latest_p="Les avions militaires et warbirds publiés récemment par des particuliers et collectionneurs vérifiés.",
  viewall="Voir toutes les annonces",
  buy_h2="Acheter un warbird en Europe",
  buy_p="Le marché du warbird réunit collectionneurs, pilotes passionnés et musées aéronautiques. Toutes nos annonces sont vérifiées manuellement ; vous traitez en direct avec le vendeur, sans commission.",
  buy_list=["Chasseurs-écoles, avions d'entraînement et appareils de collection","Historique de restauration, heures moteur et statut d'immatriculation (CNRA/civil) précisés","Contact direct avec le propriétaire ou le collectionneur"],
  sell_h2="Vendre sans commission",
  sell_p="Vendez votre avion militaire ou warbird à des collectionneurs qualifiés à travers l'Europe. Fiche technique complète (heures TT, historique de restauration, documentation d'origine), jusqu'à 20 photos, zéro commission sur la vente finale.",
  sell_list=["Publication de base gratuite, annonce vérifiée sous 24 h","Visibilité dans 30+ pays européens","Options de mise en avant pour vendre plus vite"],
  alert="Bon à savoir : le statut d'immatriculation (collection/CNRA en France, équivalents ailleurs en Europe) et l'historique de maintenance par un spécialiste du type sont déterminants pour la valeur d'un warbird. Vérifiez la documentation d'origine avant de faire une offre.",
  models_h2="Modèles recherchés",
  models=[("MiG-21","MiG-21"),("Fouga Magister","Fouga+Magister"),("L-39 Albatros","L-39+Albatros"),("Yak-52","Yak-52"),("T-6 Texan","T-6+Texan")],
  guides_h2="Nos guides pour vous aider",
  faq_h2="Questions fréquentes", faq_sub="Ce que se demandent le plus souvent les acheteurs et vendeurs d'avions militaires.",
  faq=[
    ("Un warbird peut-il voler avec une licence pilote classique ?","Dans la plupart des cas, un warbird à réaction ou à moteur à pistons puissant nécessite une qualification de type spécifique et une expérience significative, au-delà d'une licence PPL/CPL standard — vérifiez la réglementation applicable à l'appareil visé."),
    ("Quel statut réglementaire pour un ex-avion militaire ?","En France, le régime CNRA (Certificat de Navigabilité Restreint Aéronef) couvre la plupart des warbirds et avions de collection ; d'autres pays européens ont des équivalents (ex. Permit to Fly au Royaume-Uni). Le statut exact dépend du pays d'immatriculation."),
    ("Quels documents vérifier avant d'acheter ?","L'historique complet de restauration, le carnet moteur et cellule, la documentation d'origine (militaire ou civile), et la conformité au régime de navigabilité du pays d'immatriculation."),
    ("Comment vendre rapidement mon warbird ?","Une fiche complète, des photos de qualité, une documentation à jour et un prix cohérent avec le marché collector font la différence. Votre annonce est visible dans plus de 30 pays, sans commission."),
  ],
  eyebrow="Vous vendez ?", cta_h2="Vous vendez un avion militaire ou un warbird ?",
  cta_p="Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l'Europe, sans prélever de commission sur la vente.",
  empty_title="Aucune annonce pour le moment",
),
"en": dict(
  meta_desc="Military aircraft and warbirds for sale in Europe: trainer jets, ex-military aircraft, collector-grade airframes. Verified listings, zero commission.",
  keywords="warbird for sale, military aircraft, MiG-21, Fouga Magister, collector aircraft, trainer jet, homebuilt military",
  og_title="Military Aircraft & Warbirds for Sale in Europe | A2S",
  title="Military Aircraft & Warbirds for Sale in Europe | A2S",
  breadcrumb_item="Military Aircraft & Warbirds for Sale in Europe",
  coll_name="Military Aircraft & Warbirds for Sale in Europe — Aircraft2Sell",
  breadcrumb_label="Warbirds",
  h1="Military Aircraft & Warbirds for Sale in Europe",
  subtitle="MiG, Fouga Magister, military trainers — collector-grade aircraft for pilots and museums passionate about historic aviation. Zero commission on the sale.",
  qs_placeholder="MiG-21, Fouga Magister, L-39…",
  qs_label="Quick search",
  budget_label="Maximum budget",
  nolimit="No limit",
  search_cta="Search",
  latest_h2="Latest listings",
  latest_p="Military aircraft and warbirds recently listed by verified private sellers and collectors.",
  viewall="View all listings",
  buy_h2="Buying a warbird in Europe",
  buy_p="The warbird market brings together collectors, aviation enthusiasts and museums. All our listings are manually verified; you deal directly with the seller, with no commission.",
  buy_list=["Trainer jets, military trainers and collector-grade airframes","Restoration history, engine hours and registration status (homebuilt/civil) stated","Direct contact with the owner or collector"],
  sell_h2="Selling with zero commission",
  sell_p="Sell your military aircraft or warbird to qualified collectors across Europe. Complete technical sheet (TT hours, restoration history, original documentation), up to 20 photos, zero commission on the final sale.",
  sell_list=["Free basic listing, verified within 24 hours","Visibility across 30+ European countries","Promotion options to sell faster"],
  alert="Good to know: registration status (homebuilt/experimental in most of Europe) and maintenance history with a type specialist matter as much as flight hours for a warbird's value. Check the original documentation before making an offer.",
  models_h2="Popular models",
  models=[("MiG-21","MiG-21"),("Fouga Magister","Fouga+Magister"),("L-39 Albatros","L-39+Albatros"),("Yak-52","Yak-52"),("T-6 Texan","T-6+Texan")],
  guides_h2="Our guides to help you",
  faq_h2="Frequently asked questions", faq_sub="The questions military aircraft buyers and sellers ask most often.",
  faq=[
    ("Can a warbird be flown with a standard pilot licence?","In most cases a jet-powered or high-performance piston warbird requires a specific type rating and significant experience, beyond a standard PPL/CPL — check the regulation applicable to the specific aircraft."),
    ("What regulatory status applies to an ex-military aircraft?","Most European countries have a dedicated regime for warbirds and collector aircraft (e.g. homebuilt/experimental category, Permit to Fly in the UK). The exact status depends on the country of registration."),
    ("What documents should I check before buying?","The complete restoration history, engine and airframe logbooks, original documentation (military or civil), and compliance with the airworthiness regime of the registration country."),
    ("How can I sell my warbird quickly?","A complete sheet, quality photos, up-to-date records and a price in line with the collector market make the difference. Your listing is visible in more than 30 countries, with no commission."),
  ],
  eyebrow="Selling?", cta_h2="Selling a military aircraft or warbird?",
  cta_p="Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.",
  empty_title="No listings yet",
),
"et": dict(
  meta_desc="Militaarlennukid ja warbird'id müügil Euroopas: väljaõppelennukid, endised sõjalennukid, kollektsioonilennukid. Kontrollitud kuulutused, null vahendustasu.",
  keywords="warbird müügiks, militaarlennuk, MiG-21, Fouga Magister, kollektsioonilennuk, väljaõppejet",
  og_title="Militaarlennukid ja warbird'id müügil Euroopas | A2S",
  title="Militaarlennukid ja warbird'id müügil Euroopas | A2S",
  breadcrumb_item="Militaarlennukid ja warbird'id müügil Euroopas",
  coll_name="Militaarlennukid ja warbird'id müügil Euroopas — Aircraft2Sell",
  breadcrumb_label="Warbirdid",
  h1="Militaarlennukid ja warbird'id müügil Euroopas",
  subtitle="MiG, Fouga Magister, sõjaväe väljaõppelennukid — kollektsiooniväärtuslikud õhusõidukid pilootidele ja muuseumidele, kes hindavad ajaloolist lennundust. Müük vahendustasuta.",
  qs_placeholder="MiG-21, Fouga Magister, L-39…",
  qs_label="Kiirotsing",
  budget_label="Max eelarve",
  nolimit="Piiramata",
  search_cta="Otsi",
  latest_h2="Uusimad kuulutused",
  latest_p="Kontrollitud eramüüjate ja kollektsionääride hiljuti avaldatud militaarlennukid ja warbird'id.",
  viewall="Vaata kõiki kuulutusi",
  buy_h2="Warbirdi ostmine Euroopas",
  buy_p="Warbird'ide turg koondab kollektsionääre, lennundushuvilisi ja muuseume. Kõik meie kuulutused on käsitsi kontrollitud; suhtled otse müüjaga, ilma vahendustasuta.",
  buy_list=["Väljaõppejetid, sõjaväe väljaõppelennukid ja kollektsiooniõhusõidukid","Restaureerimise ajalugu, mootori tunnid ja registreerimisstaatus välja toodud","Otsekontakt omaniku või kollektsionääriga"],
  sell_h2="Müük vahendustasuta",
  sell_p="Müü oma militaarlennuk või warbird kvalifitseeritud kollektsionääridele üle Euroopa. Täielik tehniline kirjeldus (lennutunnid, restaureerimise ajalugu, originaaldokumendid), kuni 20 fotot, lõppmüügilt vahendustasu pole.",
  sell_list=["Tasuta põhikuulutus, kontrollitud 24 tunni jooksul","Nähtavus enam kui 30 Euroopa riigis","Esiletõstmise valikud kiiremaks müügiks"],
  alert="Hea teada: registreerimisstaatus ja hooldusajalugu tüübispetsialisti juures mõjutavad warbird'i väärtust vähemalt nii palju kui lennutunnid. Kontrolli originaaldokumente enne pakkumise tegemist.",
  models_h2="Populaarsed mudelid",
  models=[("MiG-21","MiG-21"),("Fouga Magister","Fouga+Magister"),("L-39 Albatros","L-39+Albatros"),("Yak-52","Yak-52"),("T-6 Texan","T-6+Texan")],
  guides_h2="Meie juhendid, mis aitavad sind",
  faq_h2="Korduma kippuvad küsimused", faq_sub="Küsimused, mida militaarlennukite ostjad ja müüjad kõige sagedamini esitavad.",
  faq=[
    ("Kas warbirdiga saab lennata tavalise piloodilubaga?","Enamasti vajab reaktiivmootoriga või võimsa kolbmootoriga warbird spetsiifilist tüübikvalifikatsiooni ja märkimisväärset kogemust, rohkem kui tavaline PPL/CPL — kontrolli konkreetsele õhusõidukile kehtivaid eeskirju."),
    ("Milline regulatiivne staatus kehtib endisele sõjalennukile?","Enamikus Euroopa riikides on warbirdidele ja kollektsioonilennukitele eraldi režiim (nt amatöörehituse kategooria, Suurbritannias Permit to Fly). Täpne staatus sõltub registreerimisriigist."),
    ("Mida kontrollida enne ostu?","Täielik restaureerimise ajalugu, mootori ja kere logiraamatud, originaaldokumendid (militaar- või tsiviil-) ning vastavus registreerimisriigi lennukõlblikkuse režiimile."),
    ("Kuidas müüa oma warbird kiiresti?","Vahe teevad täielik tehniline leht, kvaliteetsed fotod, ajakohased dokumendid ja kollektsiooniturule vastav hind. Sinu kuulutus on nähtav enam kui 30 riigis, ilma vahendustasuta."),
  ],
  eyebrow="Müüd?", cta_h2="Müüd militaarlennukit või warbirdi?",
  cta_p="Loo oma kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.",
  empty_title="Kuulutusi veel pole",
),
}

def build_faq_schema(faq):
    items = []
    for q, a in faq:
        q_e = q.replace('"', '\\"')
        a_e = a.replace('"', '\\"')
        items.append('{"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}' % (q_e, a_e))
    return "[" + ",".join(items) + "]"

def build_faq_html(faq):
    return "".join(
        '<details><summary>%s<i data-icon="chevron-down"></i></summary><div class="faq-a">%s</div></details>' % (q, a)
        for q, a in faq
    )

def build_pills(models):
    return "".join('<a href="search.html?cat=warbird&amp;q=%s" class="pill">%s</a>' % (q, label) for label, q in models)

def build_checklist(items):
    return "".join('<li><i data-icon="check"></i>%s</li>' % x for x in items)


def transform_fr():
    path = os.path.join(ROOT, "avions-de-ligne.html")
    html = open(path, encoding="utf-8").read()
    c = CONTENT["fr"]
    html = html.replace('<meta name="description" content="ATR, Airbus, Boeing, Embraer à vendre pour compagnies et loueurs. Avions de ligne d’occasion en Europe, cessna for sale europe, zéro commission vendeur.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="ATR 72, Embraer E190, Airbus A320, Boeing 737, Bombardier Q400, avions de ligne à vendre en europe, marketplace aéronautique">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Avions de ligne à vendre – ATR, Airbus, Boeing | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="ATR, Airbus, Boeing, Embraer à vendre pour compagnies et loueurs. Avions de ligne d’occasion en Europe, cessna for sale europe, zéro commission vendeur.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('<title>Avions de ligne à vendre – ATR, Airbus, Boeing | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Avions de ligne à vendre en Europe","item":"https://aircraft2sell.eu/avions-de-ligne.html"',
                         '"name":"%s","item":"https://aircraft2sell.eu/avions-de-ligne.html"' % c["breadcrumb_item"])
    html = html.replace('"name":"Avions de ligne à vendre en Europe — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"ATR, Airbus, Boeing, Embraer à vendre pour compagnies et loueurs. Avions de ligne d’occasion en Europe, cessna for sale europe, zéro commission vendeur."', f'"description":"{c["meta_desc"]}"')
    old_faq_schema = '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Qui achète des avions de ligne d’occasion ?","acceptedAnswer":{"@type":"Answer","text":"Des compagnies régionales et low-cost, des sociétés de leasing, des opérateurs cargo, des entreprises de conversion passagers-cargo (P2F) et des sociétés de démantèlement pour la revente de pièces."}},{"@type":"Question","name":"Quelles données techniques sont attendues dans une annonce ?","acceptedAnswer":{"@type":"Answer","text":"Les heures et cycles cellule, le type et le statut des moteurs (heures et cycles depuis la dernière visite atelier, pièces à vie limitée restantes), le statut des grandes visites (C-check, D-check), la configuration cabine ainsi que l’historique de propriété et d’exploitation."}},{"@type":"Question","name":"Les transactions passent-elles par Aircraft2Sell ?","acceptedAnswer":{"@type":"Answer","text":"Non. La plateforme met en relation vendeur et acheteur ; la négociation, l’inspection, la lettre d’intention et le contrat de vente se font directement entre les parties, sans commission prélevée par Aircraft2Sell."}},{"@type":"Question","name":"Peut-on publier plusieurs appareils depuis un même compte ?","acceptedAnswer":{"@type":"Answer","text":"Oui. Les compagnies, loueurs et brokers publient plusieurs annonces depuis un compte professionnel, avec des options de mise en avant. Voir la page des tarifs."}}]}'
    html = html.replace(old_faq_schema, '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + build_faq_schema(c["faq"]) + '}')
    html = html.replace("var CAT_ICON='airliner';", "var CAT_ICON='warbird';")
    html = html.replace('category=eq.airliner', 'category=eq.warbird')
    html = html.replace('name="cat" value="airliner"', 'name="cat" value="warbird"')
    html = html.replace('search.html?cat=airliner', 'search.html?cat=warbird')
    html = html.replace('<i data-icon="airliner"></i>', '<i data-icon="rocket"></i>')
    html = html.replace('<span aria-current="page">Avions de ligne</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Avions de ligne à vendre en Europe</h1>\n        <p>ATR, Embraer E-Jet, Airbus A320, Boeing 737 — pour compagnies aériennes régionales, sociétés de leasing et opérateurs cargo. Une marketplace B2B sans commission pour les transactions d’avions de ligne d’occasion.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="ATR 72-600, A320, 737-800…"', f'placeholder="{c["qs_placeholder"]}"')
    html = html.replace('<div class="field">\n        <label for="qsMax">Budget maximum</label>\n        <select class="sel" id="qsMax" name="max"><option value="">Sans limite</option><option value="5000000">5 M€</option><option value="20000000">20 M€</option><option value="50000000">50 M€</option><option value="100000000">100 M€</option></select>',
                         '<div class="field">\n        <label for="qsMax">Budget maximum</label>\n        <select class="sel" id="qsMax" name="max"><option value="">Sans limite</option><option value="100000">100 000 €</option><option value="300000">300 000 €</option><option value="500000">500 000 €</option><option value="1000000">1 M€</option></select>')
    html = html.replace('<h2>Dernières annonces</h2><p>Les avions de ligne publiés récemment par des compagnies, loueurs et brokers vérifiés.</p>', f'<h2>{c["latest_h2"]}</h2><p>{c["latest_p"]}</p>')
    html = html.replace('<h2>Acheter un avion de ligne en Europe</h2>\n        <p>Aircraft2Sell met en relation compagnies aériennes, sociétés de leasing et opérateurs cargo avec des vendeurs d’avions de ligne d’occasion vérifiés — dealers, brokers et compagnies en cession de flotte. Aucune commission n’est prélevée sur la transaction, contrairement aux courtiers traditionnels du secteur B2B aviation.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Turbopropulseurs régionaux, jets régionaux, narrow-body et wide-body</li><li><i data-icon="check"></i>Heures et cycles cellule, statut moteurs et grandes visites renseignés</li><li><i data-icon="check"></i>Négociation directe entre professionnels</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Vendre sans commission</h2>\n        <p>Compagnies, loueurs et brokers : listez vos avions de ligne (ATR, régionaux, narrow/wide-body) avec fiche technique complète — heures cellule, cycles, statut de révision, configuration cabine. Visibilité auprès d’acheteurs professionnels qualifiés dans 30+ pays, zéro commission sur la vente.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Compte professionnel multi-annonces pour flottes</li><li><i data-icon="check"></i>Fiche détaillée : cellule, moteurs, LLP, C-check, cabine</li><li><i data-icon="check"></i>Options de mise en avant pour une visibilité maximale</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Bon à savoir :</strong> la plateforme met en relation ; lettre d’intention, inspection, dépôt de garantie et contrat de vente se règlent directement entre les parties et leurs conseils.', f'<strong>Bon à savoir :</strong> {c["alert"].split(": ",1)[1]}')
    html = html.replace('<h2>Modèles recherchés</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=airliner&amp;q=ATR+72" class="pill">ATR 72</a><a href="search.html?cat=airliner&amp;q=Embraer+E190" class="pill">Embraer E190</a><a href="search.html?cat=airliner&amp;q=Airbus+A320" class="pill">Airbus A320</a><a href="search.html?cat=airliner&amp;q=Boeing+737" class="pill">Boeing 737</a><a href="search.html?cat=airliner&amp;q=Bombardier+Q400" class="pill">Bombardier Q400</a></div>'
    html = html.replace(old_pills, f'<div class="pills">{build_pills(c["models"])}</div>')
    html = html.replace('<h2>Questions fréquentes</h2><p>Ce que se demandent le plus souvent les acheteurs et vendeurs d’avions de ligne.</p>', f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = '<div class="card faq"><details><summary>Qui achète des avions de ligne d’occasion ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Des compagnies régionales et low-cost, des sociétés de leasing, des opérateurs cargo, des entreprises de conversion passagers-cargo (P2F) et des sociétés de démantèlement pour la revente de pièces.</div></details><details><summary>Quelles données techniques sont attendues dans une annonce ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Les heures et cycles cellule, le type et le statut des moteurs (heures et cycles depuis la dernière visite atelier, pièces à vie limitée restantes), le statut des grandes visites (C-check, D-check), la configuration cabine ainsi que l’historique de propriété et d’exploitation.</div></details><details><summary>Les transactions passent-elles par Aircraft2Sell ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Non. La plateforme met en relation vendeur et acheteur ; la négociation, l’inspection, la lettre d’intention et le contrat de vente se font directement entre les parties, sans commission prélevée par Aircraft2Sell.</div></details><details><summary>Peut-on publier plusieurs appareils depuis un même compte ?<i data-icon="chevron-down"></i></summary><div class="faq-a">Oui. Les compagnies, loueurs et brokers publient plusieurs annonces depuis un compte professionnel, avec des options de mise en avant. Voir la <a href="pricing.html">page des tarifs</a>.</div></details></div>'
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Vous vendez ?</span>\n        <h2>Vous vendez un avion de ligne ?</h2>\n        <p>Créez votre annonce en dix minutes. Nous la vérifions et la diffusons dans toute l’Europe, sans prélever de commission sur la vente.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    html = html.replace('<div class="empty-title">Aucune annonce pour le moment</div>', f'<div class="empty-title">{c["empty_title"]}</div>')
    open(path, "w", encoding="utf-8").write(html)
    return html


def transform_en():
    path = os.path.join(ROOT, "en", "avions-de-ligne.html")
    html = open(path, encoding="utf-8").read()
    c = CONTENT["en"]
    html = html.replace('<meta name="description" content="ATR, Airbus, Boeing, Embraer for sale to airlines and lessors. Used airliners in Europe, aircraft for sale Europe, zero seller commission.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="ATR 72, Embraer E190, Airbus A320, Boeing 737, Bombardier Q400, airliners for sale Europe, aviation marketplace">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Airliners for Sale – ATR, Airbus, Boeing | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="ATR, Airbus, Boeing, Embraer for sale to airlines and lessors. Used airliners in Europe, aircraft for sale Europe, zero seller commission.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('<title>Airliners for Sale – ATR, Airbus, Boeing | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Airliners for Sale in Europe","item":"https://aircraft2sell.eu/en/avions-de-ligne.html"',
                         '"name":"%s","item":"https://aircraft2sell.eu/en/avions-de-ligne.html"' % c["breadcrumb_item"])
    html = html.replace('"name":"Airliners for Sale in Europe — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"ATR, Airbus, Boeing, Embraer for sale to airlines and lessors. Used airliners in Europe, aircraft for sale Europe, zero seller commission."', f'"description":"{c["meta_desc"]}"')
    old_faq_schema = '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Who buys used airliners?","acceptedAnswer":{"@type":"Answer","text":"Regional and low-cost airlines, leasing companies, cargo operators, passenger-to-freighter (P2F) conversion companies and teardown companies for parts resale."}},{"@type":"Question","name":"Which technical data is expected in a listing?","acceptedAnswer":{"@type":"Answer","text":"Airframe hours and cycles, engine type and status (hours and cycles since last shop visit, remaining life-limited parts), heavy-check status (C-check, D-check), cabin configuration, and ownership and operating history."}},{"@type":"Question","name":"Do transactions go through Aircraft2Sell?","acceptedAnswer":{"@type":"Answer","text":"No. The platform connects seller and buyer; negotiation, inspection, letter of intent and sale agreement are handled directly between the parties, with no commission taken by Aircraft2Sell."}},{"@type":"Question","name":"Can I list several aircraft from the same account?","acceptedAnswer":{"@type":"Answer","text":"Yes. Airlines, lessors and brokers post multiple listings from a professional account, with promotion options. See the pricing page."}}]}'
    html = html.replace(old_faq_schema, '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + build_faq_schema(c["faq"]) + '}')
    html = html.replace("var CAT_ICON='airliner';", "var CAT_ICON='warbird';")
    html = html.replace('category=eq.airliner', 'category=eq.warbird')
    html = html.replace('name="cat" value="airliner"', 'name="cat" value="warbird"')
    html = html.replace('search.html?cat=airliner', 'search.html?cat=warbird')
    html = html.replace('<i data-icon="airliner"></i>', '<i data-icon="rocket"></i>')
    html = html.replace('<span aria-current="page">Airliners</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Airliners for Sale in Europe</h1>\n        <p>ATR, Embraer E-Jet, Airbus A320, Boeing 737 — for regional airlines, leasing companies and cargo operators. A commission-free B2B marketplace for used airliner transactions.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="ATR 72-600, A320, 737-800…"', f'placeholder="{c["qs_placeholder"]}"')
    html = html.replace('<div class="field">\n        <label for="qsMax">Maximum budget</label>\n        <select class="sel" id="qsMax" name="max"><option value="">No limit</option><option value="5000000">€5M</option><option value="20000000">€20M</option><option value="50000000">€50M</option><option value="100000000">€100M</option></select>',
                         '<div class="field">\n        <label for="qsMax">Maximum budget</label>\n        <select class="sel" id="qsMax" name="max"><option value="">No limit</option><option value="100000">€100k</option><option value="300000">€300k</option><option value="500000">€500k</option><option value="1000000">€1M</option></select>')
    html = html.replace('<h2>Latest listings</h2><p>Airliners recently listed by verified airlines, lessors and brokers.</p>', f'<h2>{c["latest_h2"]}</h2><p>{c["latest_p"]}</p>')
    html = html.replace('<h2>Buying an airliner in Europe</h2>\n        <p>Aircraft2Sell connects airlines, leasing companies and cargo operators with verified used airliner sellers — dealers, brokers and airlines divesting fleet. No commission is charged on the transaction, unlike traditional brokers in the B2B aviation sector.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Regional turboprops, regional jets, narrow-body and wide-body</li><li><i data-icon="check"></i>Airframe hours and cycles, engine status and heavy checks stated</li><li><i data-icon="check"></i>Direct negotiation between professionals</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Selling with zero commission</h2>\n        <p>Airlines, lessors and brokers: list your airliners (ATR, regional jets, narrow/wide-body) with a complete technical sheet — airframe hours, cycles, maintenance status, cabin configuration. Visibility to qualified professional buyers in 30+ countries, zero commission on the sale.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Multi-listing professional account for fleets</li><li><i data-icon="check"></i>Detailed sheet: airframe, engines, LLPs, C-check, cabin</li><li><i data-icon="check"></i>Promotion options for maximum visibility</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Good to know:</strong> the platform connects the parties; letter of intent, inspection, deposit and sale agreement are handled directly between buyer, seller and their advisers.', f'<strong>Good to know:</strong> {c["alert"].split(": ",1)[1]}')
    html = html.replace('<h2>Popular models</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=airliner&amp;q=ATR+72" class="pill">ATR 72</a><a href="search.html?cat=airliner&amp;q=Embraer+E190" class="pill">Embraer E190</a><a href="search.html?cat=airliner&amp;q=Airbus+A320" class="pill">Airbus A320</a><a href="search.html?cat=airliner&amp;q=Boeing+737" class="pill">Boeing 737</a><a href="search.html?cat=airliner&amp;q=Bombardier+Q400" class="pill">Bombardier Q400</a></div>'
    html = html.replace(old_pills, f'<div class="pills">{build_pills(c["models"])}</div>')
    html = html.replace('<h2>Frequently asked questions</h2><p>The questions airliner buyers and sellers ask most often.</p>', f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = '<div class="card faq"><details><summary>Who buys used airliners?<i data-icon="chevron-down"></i></summary><div class="faq-a">Regional and low-cost airlines, leasing companies, cargo operators, passenger-to-freighter (P2F) conversion companies and teardown companies for parts resale.</div></details><details><summary>Which technical data is expected in a listing?<i data-icon="chevron-down"></i></summary><div class="faq-a">Airframe hours and cycles, engine type and status (hours and cycles since last shop visit, remaining life-limited parts), heavy-check status (C-check, D-check), cabin configuration, and ownership and operating history.</div></details><details><summary>Do transactions go through Aircraft2Sell?<i data-icon="chevron-down"></i></summary><div class="faq-a">No. The platform connects seller and buyer; negotiation, inspection, letter of intent and sale agreement are handled directly between the parties, with no commission taken by Aircraft2Sell.</div></details><details><summary>Can I list several aircraft from the same account?<i data-icon="chevron-down"></i></summary><div class="faq-a">Yes. Airlines, lessors and brokers post multiple listings from a professional account, with promotion options. See the <a href="/pricing.html">pricing page</a>.</div></details></div>'
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Selling?</span>\n        <h2>Selling an airliner?</h2>\n        <p>Create your listing in ten minutes. We verify it and publish it across Europe, with no commission on the sale.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    html = html.replace('<div class="empty-title">No listings yet</div>', f'<div class="empty-title">{c["empty_title"]}</div>')
    open(path, "w", encoding="utf-8").write(html)
    return html


def transform_et():
    path = os.path.join(ROOT, "et", "avions-de-ligne.html")
    html = open(path, encoding="utf-8").read()
    c = CONTENT["et"]
    html = html.replace('<meta name="description" content="ATR, Airbus, Boeing, Embraer müügil lennufirmadele ja liisingufirmadele. Kasutatud reisilennukid Euroopas, õhusõidukid müügil Euroopas, müüjale vahendustasuta.">',
                         f'<meta name="description" content="{c["meta_desc"]}">')
    html = html.replace('<meta name="keywords" content="ATR 72, Embraer E190, Airbus A320, Boeing 737, Bombardier Q400, reisilennukid müügil Euroopas, lennundusturg">',
                         f'<meta name="keywords" content="{c["keywords"]}">')
    html = html.replace('<meta property="og:title" content="Reisilennukid müügil – ATR, Airbus, Boeing | A2S">',
                         f'<meta property="og:title" content="{c["og_title"]}">')
    html = html.replace('<meta property="og:description" content="ATR, Airbus, Boeing, Embraer müügil lennufirmadele ja liisingufirmadele. Kasutatud reisilennukid Euroopas, õhusõidukid müügil Euroopas, müüjale vahendustasuta.">',
                         f'<meta property="og:description" content="{c["meta_desc"]}">')
    html = html.replace('<title>Reisilennukid müügil – ATR, Airbus, Boeing | A2S</title>', f'<title>{c["title"]}</title>')
    html = html.replace('"name":"Reisilennukid müügil Euroopas","item":"https://aircraft2sell.eu/et/avions-de-ligne.html"',
                         '"name":"%s","item":"https://aircraft2sell.eu/et/avions-de-ligne.html"' % c["breadcrumb_item"])
    html = html.replace('"name":"Reisilennukid müügil Euroopas — Aircraft2Sell"', f'"name":"{c["coll_name"]}"')
    html = html.replace('"description":"ATR, Airbus, Boeing, Embraer müügil lennufirmadele ja liisingufirmadele. Kasutatud reisilennukid Euroopas, õhusõidukid müügil Euroopas, müüjale vahendustasuta."', f'"description":"{c["meta_desc"]}"')
    old_faq_schema = '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":[{"@type":"Question","name":"Kes ostavad kasutatud reisilennukeid?","acceptedAnswer":{"@type":"Answer","text":"Regionaallennufirmad ja odavlennufirmad, liisingufirmad, kaubalennufirmad, reisilennukite kaubalennukiteks (P2F) ümberehitamise ettevõtted ning varuosade edasimüügiks lammutamisega tegelevad firmad."}},{"@type":"Question","name":"Milliseid tehnilisi andmeid kuulutuselt oodatakse?","acceptedAnswer":{"@type":"Answer","text":"Kere lennutunnid ja tsüklid, mootori tüüp ja seisukord (tunnid ja tsüklid alates viimasest remondist, ülejäänud elueaga piiratud osad), raskema hoolduse staatus (C-check, D-check), salongi konfiguratsioon ning omandi- ja käitamisajalugu."}},{"@type":"Question","name":"Kas tehingud käivad Aircraft2Selli kaudu?","acceptedAnswer":{"@type":"Answer","text":"Ei. Platvorm ühendab müüja ja ostja; läbirääkimised, ülevaatus, kavatsuste protokoll ja müügileping toimuvad otse osapoolte vahel ning Aircraft2Sell ei võta vahendustasu."}},{"@type":"Question","name":"Kas ühelt kontolt saab kuulutada mitu õhusõidukit?","acceptedAnswer":{"@type":"Answer","text":"Jah. Lennufirmad, liisingufirmad ja vahendajad avaldavad professionaalselt kontolt mitu kuulutust koos reklaamivõimalustega. Vaata hinnalehte."}}]}'
    html = html.replace(old_faq_schema, '{"@type":"FAQPage","@context":"https://schema.org","mainEntity":' + build_faq_schema(c["faq"]) + '}')
    html = html.replace("var CAT_ICON='airliner';", "var CAT_ICON='warbird';")
    html = html.replace('category=eq.airliner', 'category=eq.warbird')
    html = html.replace('name="cat" value="airliner"', 'name="cat" value="warbird"')
    html = html.replace('search.html?cat=airliner', 'search.html?cat=warbird')
    html = html.replace('<i data-icon="airliner"></i>', '<i data-icon="rocket"></i>')
    html = html.replace('<span aria-current="page">Reisilennukid</span>', f'<span aria-current="page">{c["breadcrumb_label"]}</span>')
    html = html.replace('<h1>Reisilennukid müügil Euroopas</h1>\n        <p>ATR, Embraer E-Jet, Airbus A320, Boeing 737 — regionaallennufirmadele, liisingufirmadele ja kaubalennufirmadele. Vahendustasuta B2B-turg kasutatud reisilennukite tehinguteks.</p>',
                         f'<h1>{c["h1"]}</h1>\n        <p>{c["subtitle"]}</p>')
    html = html.replace('placeholder="ATR 72-600, A320, 737-800…"', f'placeholder="{c["qs_placeholder"]}"')
    html = html.replace('<div class="field">\n        <label for="qsMax">Maksimaalne eelarve</label>\n        <select class="sel" id="qsMax" name="max"><option value="">Piiramata</option><option value="5000000">€5M</option><option value="20000000">€20M</option><option value="50000000">€50M</option><option value="100000000">€100M</option></select>',
                         '<div class="field">\n        <label for="qsMax">Maksimaalne eelarve</label>\n        <select class="sel" id="qsMax" name="max"><option value="">Piiramata</option><option value="100000">€100k</option><option value="300000">€300k</option><option value="500000">€500k</option><option value="1000000">€1M</option></select>')
    html = html.replace('<h2>Uusimad kuulutused</h2><p>Hiljuti kontrollitud lennufirmade, liisingufirmade ja vahendajate avaldatud reisilennukid.</p>', f'<h2>{c["latest_h2"]}</h2><p>{c["latest_p"]}</p>')
    html = html.replace('<h2>Reisilennuki ostmine Euroopas</h2>\n        <p>Aircraft2Sell ühendab lennufirmad, liisingufirmad ja kaubalennufirmad kontrollitud kasutatud reisilennukite müüjatega — edasimüüjad, vahendajad ja lennufirmad, kes müüvad oma lennukiparki. Erinevalt traditsioonilistest B2B-lennundussektori vahendajatest tehingult vahendustasu ei võeta.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Regionaalsed turbopropellerid, regionaaljet\'id, kitsa- ja laiakerega lennukid</li><li><i data-icon="check"></i>Kere lennutunnid ja tsüklid, mootori seisukord ja rasked hooldused on välja toodud</li><li><i data-icon="check"></i>Otsesed läbirääkimised professionaalide vahel</li></ul>',
                         f'<h2>{c["buy_h2"]}</h2>\n        <p>{c["buy_p"]}</p>\n        <ul class="check-list">{build_checklist(c["buy_list"])}</ul>')
    html = html.replace('<h2>Müük ilma vahendustasuta</h2>\n        <p>Lennufirmad, liisingufirmad ja vahendajad: pange oma reisilennukid (ATR, regionaaljet\'id, kitsa-/laiakerega) kuulutusele koos täieliku tehnilise andmelehega — kere lennutunnid, tsüklid, hooldusseisund, salongi konfiguratsioon. Nähtavus kvalifitseeritud professionaalsetele ostjatele enam kui 30 riigis, müügilt vahendustasu null.</p>\n        <ul class="check-list"><li><i data-icon="check"></i>Professionaalne mitme kuulutusega konto lennukiparkidele</li><li><i data-icon="check"></i>Üksikasjalik andmeleht: kere, mootorid, LLP-d, C-check, salong</li><li><i data-icon="check"></i>Reklaamivõimalused maksimaalseks nähtavuseks</li></ul>',
                         f'<h2>{c["sell_h2"]}</h2>\n        <p>{c["sell_p"]}</p>\n        <ul class="check-list">{build_checklist(c["sell_list"])}</ul>')
    html = html.replace('<strong>Hea teada:</strong> platvorm ühendab osapooled; kavatsuste protokoll, ülevaatus, deposiit ja müügileping toimuvad otse ostja, müüja ja nende nõustajate vahel.', f'<strong>Hea teada:</strong> {c["alert"].split(": ",1)[1]}')
    html = html.replace('<h2>Populaarsed mudelid</h2>', f'<h2>{c["models_h2"]}</h2>')
    old_pills = '<div class="pills"><a href="search.html?cat=airliner&amp;q=ATR+72" class="pill">ATR 72</a><a href="search.html?cat=airliner&amp;q=Embraer+E190" class="pill">Embraer E190</a><a href="search.html?cat=airliner&amp;q=Airbus+A320" class="pill">Airbus A320</a><a href="search.html?cat=airliner&amp;q=Boeing+737" class="pill">Boeing 737</a><a href="search.html?cat=airliner&amp;q=Bombardier+Q400" class="pill">Bombardier Q400</a></div>'
    html = html.replace(old_pills, f'<div class="pills">{build_pills(c["models"])}</div>')
    html = html.replace('<h2>Korduma kippuvad küsimused</h2><p>Küsimused, mida reisilennukite ostjad ja müüjad kõige sagedamini esitavad.</p>', f'<h2>{c["faq_h2"]}</h2><p>{c["faq_sub"]}</p>')
    old_faq_html = '<div class="card faq"><details><summary>Kes ostavad kasutatud reisilennukeid?<i data-icon="chevron-down"></i></summary><div class="faq-a">Regionaallennufirmad ja odavlennufirmad, liisingufirmad, kaubalennufirmad, reisilennukite kaubalennukiteks (P2F) ümberehitamise ettevõtted ning varuosade edasimüügiks lammutamisega tegelevad firmad.</div></details><details><summary>Milliseid tehnilisi andmeid kuulutuselt oodatakse?<i data-icon="chevron-down"></i></summary><div class="faq-a">Kere lennutunnid ja tsüklid, mootori tüüp ja seisukord (tunnid ja tsüklid alates viimasest remondist, ülejäänud elueaga piiratud osad), raskema hoolduse staatus (C-check, D-check), salongi konfiguratsioon ning omandi- ja käitamisajalugu.</div></details><details><summary>Kas tehingud käivad Aircraft2Selli kaudu?<i data-icon="chevron-down"></i></summary><div class="faq-a">Ei. Platvorm ühendab müüja ja ostja; läbirääkimised, ülevaatus, kavatsuste protokoll ja müügileping toimuvad otse osapoolte vahel ning Aircraft2Sell ei võta vahendustasu.</div></details><details><summary>Kas ühelt kontolt saab kuulutada mitu õhusõidukit?<i data-icon="chevron-down"></i></summary><div class="faq-a">Jah. Lennufirmad, liisingufirmad ja vahendajad avaldavad professionaalselt kontolt mitu kuulutust koos reklaamivõimalustega. Vaata <a href="/pricing.html">hinnalehte</a>.</div></details></div>'
    html = html.replace(old_faq_html, '<div class="card faq">' + build_faq_html(c["faq"]) + '</div>')
    html = html.replace('<span class="eyebrow" style="color:#FFB37A">Müüd?</span>\n        <h2>Müüd reisilennukit?</h2>\n        <p>Loo kuulutus kümne minutiga. Me kontrollime selle ja avaldame üle Euroopa, ilma müügilt vahendustasuta.</p>',
                         f'<span class="eyebrow" style="color:#FFB37A">{c["eyebrow"]}</span>\n        <h2>{c["cta_h2"]}</h2>\n        <p>{c["cta_p"]}</p>')
    html = html.replace('<div class="empty-title">Kuulutusi veel pole</div>', f'<div class="empty-title">{c["empty_title"]}</div>')
    open(path, "w", encoding="utf-8").write(html)
    return html


if __name__ == "__main__":
    for name, fn in [("fr", transform_fr), ("en", transform_en), ("et", transform_et)]:
        html = fn()
        leftover = "airliner" in html.lower().replace("category=eq.warbird", "")
        print(name, "done, leftover 'airliner' token:", leftover)
