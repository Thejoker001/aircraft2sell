#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère les pages "Vendre son avion en [pays]" (FR racine + variantes EN
prioritaires), sur le même gabarit que les pages acheteurs
(acheter-avion-occasion-*.html) : Article+BreadcrumbList schema.org,
TOC, sections H2, CTA, "guides associés". Contenu rédigé spécifiquement
par pays côté VENDEUR (fixer son prix, documents à réunir, fiscalité de
la vente, délai de vente, pièges vendeur) — jamais un recyclage du
contenu acheteur.

Usage : python3 scripts/gen-seller-country-pages.py
"""
import os

TODAY = "2026-11-07"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Données par pays (FR). Chaque entrée alimente le gabarit ci-dessous.
# ---------------------------------------------------------------------------
COUNTRIES = [
    {
        "slug": "france", "name": "France", "gentile": "française",
        "authority": "DGAC (Direction générale de l'Aviation civile)",
        "prefix": "F-", "tax_name": "TVA", "tax_rate": "20 %",
        "market": "La France est le plus grand marché aéronautique privé d'Europe continentale, avec un maillage dense d'aéroclubs et d'aérodromes qui favorise une circulation rapide de l'information sur les annonces. Les acheteurs français sont en moyenne bien informés et comparent plusieurs offres avant de se décider, ce qui valorise une annonce complète et transparente (photos nombreuses, carnet de route à jour, historique de maintenance détaillé).",
        "docs": ["Certificat de navigabilité et CDN de révision (ARC) en cours de validité", "Carnet de route et carnet moteur à jour, sans rupture de suivi", "Certificat d'immatriculation au fichier français des aéronefs", "Dernier rapport de visite 100h/annuelle (programme d'entretien)"],
        "tax_detail": "Une vente entre particuliers résidents français n'est en principe pas soumise à la TVA si l'appareil a déjà été mis en circulation avec la TVA acquittée dans l'UE. Un vendeur professionnel (dealer, société de leasing) doit en revanche facturer la TVA au taux normal de 20 %. Il est recommandé de conserver la preuve du statut TVA de l'appareil (facture d'achat initiale) pour la transmettre à l'acheteur, qui en aura besoin pour sa propre immatriculation.",
        "delay": "4 à 10 semaines en moyenne sur le segment avions légers, davantage pour les appareils de niche ou haut de gamme.",
        "pitfalls": "Fixer un prix de départ trop optimiste par attachement sentimental à l'appareil, négliger de mettre à jour le carnet de route avant la mise en vente (un historique incomplet fait fuir les acheteurs sérieux), ou accepter un acompte sans acte de vente écrit mentionnant le numéro de série et les conditions suspensives (financement, inspection pré-achat).",
    },
    {
        "slug": "suisse", "name": "Suisse", "gentile": "suisse",
        "authority": "OFAC (Office fédéral de l'aviation civile)",
        "prefix": "HB-", "tax_name": "TVA", "tax_rate": "8,1 %",
        "market": "Le marché suisse se caractérise par un parc d'appareils globalement plus récent et mieux entretenu que la moyenne européenne, porté par un pouvoir d'achat élevé. Les acheteurs suisses accordent une attention particulière à la traçabilité de l'entretien et au potentiel moteur restant, et sont prêts à payer une prime pour un appareil à l'historique irréprochable.",
        "docs": ["Certificat de navigabilité et ARC suisses en cours de validité", "Carnet de route et carnet moteur complets", "Certificat d'immatriculation au registre matricule suisse des aéronefs", "Attestation d'entretien par un atelier agréé OFAC"],
        "tax_detail": "La Suisse applique sa propre TVA (8,1 % en 2026), distincte du régime européen. Une vente entre particuliers résidents suisses n'est généralement pas soumise à la TVA. Si l'acheteur réside dans l'UE, le transfert de l'appareil hors de Suisse constitue une exportation et peut déclencher une TVA à l'importation dans le pays de destination — à anticiper dans la négociation du prix net vendeur.",
        "delay": "4 à 8 semaines, le marché suisse étant relativement liquide pour les appareils bien entretenus.",
        "pitfalls": "Sous-estimer le temps de transfert au registre matricule suisse pour un appareil destiné à l'export, omettre de préciser dans l'annonce si le prix est HT ou TTC (source fréquente de malentendu avec des acheteurs de l'UE), ou négliger de faire constater par écrit l'état des équipements optionnels avant la signature.",
    },
    {
        "slug": "allemagne", "name": "Allemagne", "gentile": "allemande",
        "authority": "LBA (Luftfahrt-Bundesamt)",
        "prefix": "D-", "tax_name": "TVA (Mehrwertsteuer)", "tax_rate": "19 %",
        "market": "L'Allemagne dispose du plus grand parc d'aviation légère d'Europe continentale et d'un réseau d'aéroclubs très structuré. Les acheteurs allemands sont réputés rigoureux sur la documentation technique : un dossier d'entretien incomplet ou en désordre peut faire perdre plusieurs semaines de négociation, voire faire échouer la vente.",
        "docs": ["Lufttüchtigkeitszeugnis (certificat de navigabilité) et ARC à jour", "Bordbuch (carnet de route) et carnet moteur complets", "Zulassungsschein (certificat d'immatriculation) du LBA", "Historique des Service Bulletins et Airworthiness Directives appliqués"],
        "tax_detail": "La TVA allemande standard est de 19 %. Une vente entre particuliers n'est en principe pas soumise à la TVA si celle-ci a déjà été acquittée dans l'UE lors de la première mise en circulation de l'appareil. Un vendeur agissant à titre professionnel doit facturer la TVA. Conservez la preuve du statut TVA (facture d'origine ou attestation) pour la transmettre à l'acheteur.",
        "delay": "4 à 9 semaines en moyenne, un peu plus long pour les appareils haut de gamme ou les bimoteurs.",
        "pitfalls": "Présenter un Bordbuch incomplet ou avec des pages manquantes (rédhibitoire pour un acheteur allemand), tarder à répondre aux questions techniques détaillées qu'un acheteur sérieux posera systématiquement, ou négocier sans avoir anticipé le coût d'une éventuelle pré-visite d'achat à distance.",
    },
    {
        "slug": "belgique", "name": "Belgique", "gentile": "belge",
        "authority": "DGTA/BCAA (Direction générale Transport Aérien)",
        "prefix": "OO-", "tax_name": "TVA", "tax_rate": "21 %",
        "market": "Marché de taille modeste mais actif, la Belgique bénéficie d'une position centrale en Europe qui attire aussi des acheteurs des pays voisins (France, Pays-Bas, Allemagne). Les appareils bien positionnés géographiquement (proximité d'un aérodrome avec hangar disponible) se vendent souvent plus vite.",
        "docs": ["Certificat de navigabilité et ARC belges en cours de validité", "Carnet de route et carnet moteur à jour", "Certificat d'immatriculation DGTA", "Attestation d'assurance en cours jusqu'à la vente"],
        "tax_detail": "La TVA belge standard est de 21 %. Comme ailleurs dans l'UE, une revente entre particuliers d'un appareil déjà en libre circulation TVA n'est en principe pas re-taxée. Un vendeur professionnel doit facturer la TVA au taux normal. La position frontalière de la Belgique rend fréquentes les ventes transfrontalières : vérifiez le statut TVA de l'appareil avant toute négociation avec un acheteur étranger.",
        "delay": "5 à 10 semaines, la Belgique étant un marché de transit pour de nombreux acheteurs européens.",
        "pitfalls": "Ne pas préciser la langue de la documentation technique (néerlandais/français selon la région d'immatriculation), sous-estimer l'intérêt d'une annonce bilingue FR/EN pour capter les acheteurs transfrontaliers, ou négliger l'état du hangar/parking qui influence la perception de l'entretien global de l'appareil.",
    },
    {
        "slug": "espagne", "name": "Espagne", "gentile": "espagnole",
        "authority": "AESA (Agencia Estatal de Seguridad Aérea)",
        "prefix": "EC-", "tax_name": "IVA", "tax_rate": "21 %",
        "market": "Le marché espagnol combine une forte activité d'aviation de loisir (sud et est du pays, climat favorable à l'usage toute l'année) et une demande professionnelle pour les écoles de pilotage. Les appareils basés dans le sud de l'Espagne, moins exposés à la corrosion saisonnière que dans d'autres régions, bénéficient souvent d'une bonne image auprès des acheteurs.",
        "docs": ["Certificado de Aeronavegabilidad et ARC en cours de validité", "Carnet de route et carnet moteur complets", "Certificado de Matrícula délivré par l'AESA", "Historique de maintenance par un atelier agréé"],
        "tax_detail": "L'IVA (TVA espagnole) standard est de 21 %. Une vente entre particuliers d'un appareil déjà en libre circulation dans l'UE n'est en principe pas soumise à l'IVA. Un vendeur professionnel doit la facturer. Les transactions impliquant des sociétés d'aéroclub nécessitent souvent une vérification fiscale préalable auprès d'un conseil local.",
        "delay": "5 à 12 semaines, variable selon la saison (la demande est plus forte au printemps, avant la saison de vol).",
        "pitfalls": "Lister un appareil sans mentionner son exposition climatique (corrosion, UV) alors que c'est un critère de choix important en Espagne, négliger les visites d'entretien pendant la basse saison (elles rassurent sur la régularité du suivi), ou sous-évaluer les délais administratifs de l'AESA pour le transfert d'immatriculation.",
    },
    {
        "slug": "italie", "name": "Italie", "gentile": "italienne",
        "authority": "ENAC (Ente Nazionale per l'Aviazione Civile)",
        "prefix": "I-", "tax_name": "IVA", "tax_rate": "22 %",
        "market": "L'Italie a un marché de l'aviation légère dynamique mais plus fragmenté géographiquement, avec de fortes disparités régionales (nord industriel très actif, sud plus orienté loisir). Les acheteurs italiens valorisent fortement la réputation de l'atelier de maintenance ayant suivi l'appareil.",
        "docs": ["Certificato di Navigabilità et ARC en cours de validité", "Carnet de route et carnet moteur complets", "Certificato di Immatricolazione ENAC", "Attestations des ateliers de maintenance agréés (CAMO/Part-M)"],
        "tax_detail": "L'IVA standard italienne est de 22 %. Comme dans le reste de l'UE, une revente entre particuliers d'un appareil déjà en libre circulation TVA n'est en principe pas re-taxée. Un vendeur professionnel ou une società doit facturer l'IVA. Faites valider le statut fiscal exact de l'appareil par un commercialista si la vente implique une structure professionnelle.",
        "delay": "6 à 12 semaines en moyenne, un des marchés les plus longs d'Europe occidentale pour conclure une vente.",
        "pitfalls": "Négliger la traduction en italien des points clés de l'annonce (un frein réel pour une partie des acheteurs locaux), sous-estimer les délais ENAC pour le transfert d'immatriculation, ou accepter une négociation orale sans formaliser rapidement un compromis écrit.",
    },
    {
        "slug": "royaume-uni", "name": "Royaume-Uni", "gentile": "britannique",
        "authority": "UK CAA (Civil Aviation Authority)",
        "prefix": "G-", "tax_name": "VAT", "tax_rate": "20 %",
        "market": "Depuis le Brexit, le Royaume-Uni constitue un marché distinct de l'espace réglementaire UE/EASA, avec ses propres règles de navigabilité (UK CAA) tout en restant très actif pour l'aviation légère et les jets d'affaires. Les acheteurs britanniques sont habitués aux transactions internationales et posent systématiquement la question du statut TVA/VAT post-Brexit de l'appareil.",
        "docs": ["Certificate of Airworthiness et ARC UK CAA en cours de validité", "Logbooks (cellule, moteur, hélice) complets et sans rupture", "Certificate of Registration UK CAA", "Preuve du statut VAT post-Brexit de l'appareil (paid/unpaid status)"],
        "tax_detail": "Le VAT britannique standard est de 20 %, appliqué sous un régime désormais totalement séparé de la TVA de l'UE depuis le Brexit. Un appareil transitant entre le Royaume-Uni et l'UE est traité comme une importation/exportation, avec paiement potentiel du VAT/TVA à l'entrée sur chaque territoire. C'est un point de négociation fréquent et déterminant sur ce marché : clarifiez le statut VAT dès l'annonce pour éviter les négociations qui échouent tardivement.",
        "delay": "4 à 9 semaines, le marché britannique restant liquide malgré la complexité douanière post-Brexit.",
        "pitfalls": "Omettre le statut VAT post-Brexit dans l'annonce (cause fréquente de négociations qui n'aboutissent pas), sous-estimer les formalités douanières pour un acheteur basé dans l'UE, ou négliger la différence entre immatriculation CAA et immatriculation EASA pour un acheteur qui prévoit de rebasculer l'appareil en Europe continentale.",
    },
    {
        "slug": "pays-bas", "name": "Pays-Bas", "gentile": "néerlandaise",
        "authority": "ILT (Inspectie Leefomgeving en Transport)",
        "prefix": "PH-", "tax_name": "BTW", "tax_rate": "21 %",
        "market": "Marché compact mais très organisé, les Pays-Bas bénéficient d'infrastructures aéroportuaires de qualité et d'une forte proportion d'acheteurs expérimentés, souvent membres d'aéroclubs structurés. La rigueur documentaire est, comme en Allemagne, un facteur déterminant dans la rapidité de conclusion d'une vente.",
        "docs": ["Luchtwaardigheidscertificaat et ARC en cours de validité", "Carnet de route et carnet moteur complets", "Certificaat van Inschrijving (certificat d'immatriculation) ILT", "Historique de maintenance par un atelier agréé Part-M"],
        "tax_detail": "La BTW (TVA néerlandaise) standard est de 21 %. Une vente entre particuliers d'un appareil déjà en libre circulation dans l'UE n'est en principe pas re-taxée. Un vendeur professionnel doit facturer la BTW au taux normal. La densité du territoire fait que de nombreuses ventes se font avec des acheteurs des pays limitrophes — vérifiez le statut TVA avant toute négociation transfrontalière.",
        "delay": "4 à 8 semaines, un des marchés les plus rapides d'Europe pour un appareil correctement documenté.",
        "pitfalls": "Fournir une documentation technique incomplète (les acheteurs néerlandais vérifient systématiquement chaque entrée du carnet), sous-estimer la concurrence d'autres annonces bien présentées sur un marché étroit, ou tarder à répondre aux demandes d'information détaillées.",
    },
    {
        "slug": "canada", "name": "Canada", "gentile": "canadienne",
        "authority": "Transport Canada",
        "prefix": "C-", "tax_name": "TPS/TVH (GST/HST)", "tax_rate": "5 % à 15 % selon la province",
        "market": "Le Canada a un parc d'aviation privée important, concentré en Ontario, au Québec, en Alberta et en Colombie-Britannique, avec une forte culture du pilotage privé liée aux grandes distances du territoire. Les acheteurs canadiens sont habitués à des transactions à distance (le pays est vaste) et accordent une grande importance aux rapports de pré-achat réalisés par un AME (Aircraft Maintenance Engineer) agréé.",
        "docs": ["Certificate of Airworthiness Transport Canada en cours de validité", "Journey logbook, engine logbook et propeller logbook complets", "Certificate of Registration Transport Canada", "Rapport de pré-achat par un AME (Aircraft Maintenance Engineer) agréé"],
        "tax_detail": "Il n'y a pas de TVA au sens européen au Canada : la vente est soumise à la TPS fédérale (GST, 5 %) et, selon la province, à une taxe de vente harmonisée (TVH/HST) ou provinciale (PST) pouvant porter le total à 13-15 %. Une vente entre particuliers peut dans certains cas être exonérée de taxe de vente provinciale — faites valider le traitement applicable par un comptable canadien avant de fixer le prix net.",
        "delay": "6 à 14 semaines, les distances géographiques et les inspections pré-achat à distance pouvant allonger le délai par rapport à l'Europe.",
        "pitfalls": "Ne pas préciser si le prix annoncé est en dollars canadiens ou américains (source classique de confusion pour les acheteurs internationaux), sous-estimer le coût et le délai d'un rapport AME pour un acheteur situé dans une autre province, ou négliger les particularités d'immatriculation pour un appareil initialement certifié aux normes FAA (fréquent au Canada) plutôt que Transport Canada.",
    },
    {
        "slug": "etats-unis", "name": "États-Unis", "gentile": "américaine",
        "authority": "FAA (Federal Aviation Administration)",
        "prefix": "N-", "tax_name": "Sales tax (taxe de vente d'État)", "tax_rate": "0 % à environ 8 % selon l'État",
        "market": "Les États-Unis constituent de loin le plus grand marché d'aviation générale au monde, avec un volume d'appareils en circulation sans équivalent et une culture de transaction très standardisée (title search, escrow, pre-buy inspection systématique). Un acheteur américain s'attend à un dossier complet dès la première prise de contact : logbooks scannés, rapport AD/SB à jour, et souvent un pre-buy par un A&P/IA indépendant avant tout engagement financier.",
        "docs": ["Certificate of Airworthiness (standard ou expérimental selon la catégorie) FAA", "Aircraft, engine et propeller logbooks complets, sans rupture de suivi", "Certificate of Registration FAA (numéro N-) et vérification de titre (title search) sans gage (lien/lien-free)", "Dernier rapport d'Annual Inspection et suivi des Airworthiness Directives (AD)"],
        "tax_detail": "Il n'existe pas de TVA fédérale aux États-Unis. La vente peut être soumise à une sales tax prélevée par l'État où la transaction est réputée avoir lieu (de 0 % dans certains États à environ 8 % ailleurs), avec des règles de \"fly-away exemption\" variables selon l'État si l'appareil quitte immédiatement le territoire après la vente. Faites valider le traitement fiscal applicable par un avocat ou CPA spécialisé en aviation avant de finaliser le prix.",
        "delay": "4 à 10 semaines pour un appareil correctement documenté, le marché américain étant très liquide et habitué aux transactions rapides.",
        "pitfalls": "Ne pas effectuer de title search (vérification de titre) avant la mise en vente, ce qui peut révéler tardivement un gage ou un litige bloquant la transaction, sous-estimer l'importance d'un dossier de logbooks scanné et organisé dès la publication de l'annonce, ou négliger de préciser l'état FAA exact de l'appareil (standard, experimental, LSA) qui conditionne fortement le profil des acheteurs potentiels.",
    },
]

# Pays à décliner en EN (marchés les plus anglophones/internationaux).
EN_SLUGS = {"suisse", "allemagne", "royaume-uni", "canada", "etats-unis"}

EN_OVERRIDES = {
    "suisse": {"name_en": "Switzerland"},
    "allemagne": {"name_en": "Germany"},
    "royaume-uni": {"name_en": "the United Kingdom"},
    "canada": {"name_en": "Canada"},
    "etats-unis": {"name_en": "the United States"},
}

NAV_SCRIPT_TAG_VERSION = "20261107a"

def related_cards(c, lang):
    """3 cartes « guides associés » : vendre générique EU, 1 pays acheteur du
    même pays si dispo, 1 autre pays vendeur pour maillage croisé."""
    if lang == "fr":
        return (
            '<a href="vendre-avion-particulier-europe.html" class="card">'
            '<span class="icon-box"><i data-icon="tag"></i></span>'
            '<span class="eyebrow">Vente</span>'
            '<strong>Vendre son avion en particulier : le guide complet</strong>'
            '<p>Les étapes clés pour vendre un aéronef en Europe sans commission.</p>'
            '<span class="btn-link">Lire le guide <i data-icon="arrow-right"></i></span></a>'
            f'<a href="estimation.html" class="card"><span class="icon-box"><i data-icon="calculator"></i></span>'
            '<span class="eyebrow">Vente</span><strong>Estimation gratuite de votre aéronef</strong>'
            '<p>Obtenez une fourchette de prix réaliste avant de publier votre annonce.</p>'
            '<span class="btn-link">Estimer mon appareil <i data-icon="arrow-right"></i></span></a>'
            f'<a href="vendre-avion-rapidement-erreurs-eviter.html" class="card"><span class="icon-box"><i data-icon="alert-triangle"></i></span>'
            '<span class="eyebrow">Vente</span><strong>Vendre rapidement : les erreurs à éviter</strong>'
            '<p>Les pièges les plus fréquents qui ralentissent ou font échouer une vente.</p>'
            '<span class="btn-link">Lire le guide <i data-icon="arrow-right"></i></span></a>'
        )
    else:
        return (
            '<a href="/vendeur.html" class="card">'
            '<span class="icon-box"><i data-icon="tag"></i></span>'
            '<span class="eyebrow">Selling</span>'
            '<strong>Sell your aircraft in Europe, zero commission</strong>'
            '<p>How to list your aircraft and reach qualified buyers across 32 countries.</p>'
            '<span class="btn-link">Read more <i data-icon="arrow-right"></i></span></a>'
            '<a href="/en/estimation.html" class="card"><span class="icon-box"><i data-icon="calculator"></i></span>'
            '<span class="eyebrow">Selling</span><strong>Free aircraft valuation</strong>'
            '<p>Get a realistic price range before publishing your listing.</p>'
            '<span class="btn-link">Estimate my aircraft <i data-icon="arrow-right"></i></span></a>'
            '<a href="/en/search.html" class="card"><span class="icon-box"><i data-icon="search"></i></span>'
            '<span class="eyebrow">Buy</span><strong>Browse all listings</strong>'
            '<p>See every verified aircraft currently for sale on Aircraft2Sell.</p>'
            '<span class="btn-link">See listings <i data-icon="arrow-right"></i></span></a>'
        )

def render_fr(c):
    slug, name, gentile = c["slug"], c["name"], c["gentile"]
    title = f"Vendre son avion en {name} : démarches, prix et fiscalité 2026"
    desc = f"Vendre un avion d'occasion en {name} en 2026 : fixer le bon prix, documents à réunir auprès de {c['authority']}, fiscalité de la vente ({c['tax_name']}) et délai moyen. Guide complet pour vendeurs."
    docs_html = "".join(f'<li><i data-icon="check"></i><span><strong>{d}</strong></span></li>' for d in c["docs"])
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<script src="/confirm-handler.js"></script>
<script src="/lang-redirect.js"></script>
<meta charset="UTF-8">
<meta name="robots" content="index, follow">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="{desc}">
<meta property="og:title" content="{title} | Aircraft2Sell">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://aircraft2sell.eu/vendre-avion-{slug}.html">
<meta property="og:image" content="https://aircraft2sell.eu/og-image.png?v=3">
<meta property="og:site_name" content="Aircraft2Sell">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://aircraft2sell.eu/vendre-avion-{slug}.html">
{'<link rel="alternate" hreflang="fr" href="https://aircraft2sell.eu/vendre-avion-' + slug + '.html">' + chr(10) + '<link rel="alternate" hreflang="en" href="https://aircraft2sell.eu/en/vendre-avion-' + slug + '.html">' + chr(10) + '<link rel="alternate" hreflang="x-default" href="https://aircraft2sell.eu/vendre-avion-' + slug + '.html">' if slug in EN_SLUGS else '<link rel="alternate" hreflang="fr" href="https://aircraft2sell.eu/vendre-avion-' + slug + '.html">' + chr(10) + '<link rel="alternate" hreflang="x-default" href="https://aircraft2sell.eu/vendre-avion-' + slug + '.html">'}
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<title>{title}</title>
<script type="application/ld+json">
{{"@type": "Article", "@context": "https://schema.org", "headline": "{title}", "description": "{desc}", "datePublished": "{TODAY}", "dateModified": "{TODAY}", "inLanguage": "fr", "author": {{"@type": "Organization", "name": "Aircraft2Sell"}}, "publisher": {{"@type": "Organization", "name": "Aircraft2Sell", "logo": {{"@type": "ImageObject", "url": "https://aircraft2sell.eu/icon-512.png"}}, "url": "https://aircraft2sell.eu"}}, "mainEntityOfPage": {{"@type": "WebPage", "@id": "https://aircraft2sell.eu/vendre-avion-{slug}.html"}}}}
</script>
<script type="application/ld+json">
{{"@type": "BreadcrumbList", "@context": "https://schema.org", "itemListElement": [{{"@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://aircraft2sell.eu/"}}, {{"@type": "ListItem", "position": 2, "name": "Guides & Conseils", "item": "https://aircraft2sell.eu/blog.html"}}, {{"@type": "ListItem", "position": 3, "name": "Vendre son avion en {name}", "item": "https://aircraft2sell.eu/vendre-avion-{slug}.html"}}]}}
</script>
<link rel="stylesheet" href="styles.css?v=20261106a">
<link rel="stylesheet" href="mobile.css?v=20260909a" media="(max-width: 1024px)">
<style>
.page-head .eyebrow{{display:block;margin-bottom:.5rem}}
.guide-meta{{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;font-size:.84rem;color:var(--a2s-text-muted);margin-top:.9rem}}
.guide-meta span{{display:inline-flex;align-items:center;gap:.4rem}}
.guide-meta .ic{{width:16px;height:16px}}
.toc{{margin-bottom:2.25rem}}
.toc .card-body{{padding:1.1rem 1.35rem}}
.toc-title{{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--a2s-text-muted);margin-bottom:.65rem}}
.toc ol{{counter-reset:toc;display:flex;flex-direction:column;gap:.4rem}}
.toc li{{counter-increment:toc;display:flex;gap:.6rem;font-size:.92rem;line-height:1.45}}
.toc li::before{{content:counter(toc) ".";font-weight:700;color:var(--a2s-text-faint);min-width:1.3rem}}
.toc a{{color:var(--a2s-blue);font-weight:600}}
.toc a:hover{{text-decoration:underline}}
.article h2{{font-size:1.5rem;margin:2.5rem 0 .9rem;scroll-margin-top:calc(var(--nav-h) + 1.25rem)}}
.article h2:first-child{{margin-top:0}}
.article h3{{font-size:1.12rem;margin:1.6rem 0 .6rem}}
.article p{{font-size:1.02rem;line-height:1.75;margin-bottom:1.1rem}}
.article ul.checks{{display:flex;flex-direction:column;gap:.6rem;margin:0 0 1.35rem}}
.article ul.checks li{{display:flex;gap:.65rem;align-items:flex-start;line-height:1.6;font-size:1rem}}
.article ul.checks .ic{{width:18px;height:18px;color:var(--a2s-success);margin-top:.25rem}}
.article .alert{{margin:1.5rem 0;font-size:.95rem}}
.article .table-wrap{{margin:1rem 0 1.5rem;border:1px solid var(--a2s-border);border-radius:var(--a2s-radius-card);background:var(--a2s-surface)}}
.article .table{{font-size:.92rem}}
.guide-cta{{margin-top:3rem}}
.guide-cta .card-body{{padding:1.75rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}}
.guide-cta .icon-box{{width:52px;height:52px}}
.guide-cta h3{{margin-bottom:.3rem}}
.guide-cta p{{color:var(--a2s-text-muted);margin:0;max-width:460px}}
.guide-cta .cta-text{{display:flex;align-items:center;gap:1.1rem}}
.related a.card{{display:flex;flex-direction:column;gap:.55rem;padding:1.35rem;color:inherit;transition:box-shadow .15s,border-color .15s}}
.related a.card:hover{{border-color:var(--a2s-border-2);box-shadow:var(--a2s-shadow)}}
.related .card .icon-box{{width:40px;height:40px;margin-bottom:.2rem}}
.related .card .icon-box .ic{{width:20px;height:20px}}
.related .card strong{{color:var(--a2s-navy);font-size:1rem;line-height:1.35}}
.related .card p{{font-size:.86rem;color:var(--a2s-text-muted);line-height:1.55;margin:0}}
.related .card .btn-link{{margin-top:auto;padding-top:.5rem}}
@media(max-width:768px){{.guide-cta .card-body{{padding:1.5rem}}.article p{{font-size:.98rem}}}}
</style>
<script defer src="https://cloud.umami.is/script.js" data-website-id="6fa26d01-f284-48ca-814b-ad6cf8dcee84"></script>
</head>
<body>
<!-- nav injectée par nav.js -->

<div class="page-head">
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><i data-icon="chevron-right"></i><a href="blog.html">Guides</a><i data-icon="chevron-right"></i><span aria-current="page">Vendre en {name}</span></nav>
    <span class="eyebrow">Vente</span>
    <h1>{title}</h1>
    <p>Marché, prix, documents à réunir auprès de {c['authority']} et fiscalité : tout ce qu'il faut savoir pour vendre efficacement son aéronef en {name}.</p>
    <div class="guide-meta">
      <span><i data-icon="clock"></i>7 min de lecture</span>
      <span><i data-icon="calendar"></i>Publié le {TODAY[8:10]} novembre 2026</span>
      <span><i data-icon="user-check"></i>Rédigé par l'équipe Aircraft2Sell</span>
    </div>
  </div>
</div>

<section class="section">
  <div class="container-narrow">

    <div class="card toc">
      <div class="card-body">
        <div class="toc-title">Sommaire</div>
        <ol><li><a href="#marche">Le marché {gentile} côté vendeur</a></li><li><a href="#prix">Comment fixer le bon prix</a></li><li><a href="#documents">Documents à réunir</a></li><li><a href="#fiscalite">Fiscalité de la vente</a></li><li><a href="#delai">Délai de vente moyen</a></li><li><a href="#pieges">Les pièges à éviter côté vendeur</a></li></ol>
      </div>
    </div>

    <article class="article">
<h2 id="marche">Le marché {gentile} côté vendeur</h2>
<p>{c['market']}</p>

<h2 id="prix">Comment fixer le bon prix</h2>
<p>Le prix d'un aéronef se détermine avant tout par son potentiel moteur restant (heures avant TBO/révision), la qualité et la continuité de son carnet d'entretien, et son équipement (avionique, options). L'année de construction joue un rôle secondaire par rapport à ces critères. Comparez votre appareil à plusieurs annonces similaires publiées récemment pour vous positionner avec réalisme — un prix de départ surévalué allonge mécaniquement le délai de vente.</p>
<div class="alert alert-info"><i data-icon="info"></i><div><strong>Conseil</strong> — Utilisez l'<a href="estimation.html">estimation gratuite Aircraft2Sell</a> pour obtenir une fourchette de prix réaliste avant de publier votre annonce.</div></div>

<h2 id="documents">Documents à réunir</h2>
<p>Préparez ce dossier avant même de publier votre annonce : un acheteur sérieux le demandera dès les premiers échanges, et l'avoir prêt accélère considérablement la négociation.</p>
<ul class="checks">
  {docs_html}
</ul>

<h2 id="fiscalite">Fiscalité de la vente</h2>
<p>{c['tax_detail']}</p>
<div class="table-wrap"><table class="table">
<thead><tr><th>Autorité compétente</th><th>Préfixe d'immatriculation</th><th>Taxe applicable</th></tr></thead>
<tbody>
<tr><td>{c['authority']}</td><td>{c['prefix']}</td><td>{c['tax_name']} ({c['tax_rate']})</td></tr>
</tbody>
</table></div>

<h2 id="delai">Délai de vente moyen</h2>
<p>Comptez en moyenne {c['delay']} Une annonce complète (photos nombreuses, description précise, documents à jour) réduit sensiblement ce délai par rapport à une annonce minimaliste.</p>

<h2 id="pieges">Les pièges à éviter côté vendeur</h2>
<p>{c['pitfalls']}</p>
<div class="alert alert-info"><i data-icon="info"></i><div><strong>Conseil</strong> — Publiez votre annonce sur Aircraft2Sell pour la diffuser auprès d'acheteurs qualifiés dans toute l'Europe, sans commission sur la vente.</div></div>
    </article>

    <div class="card guide-cta">
      <div class="card-body">
        <div class="cta-text">
          <span class="icon-box accent"><i data-icon="tag"></i></span>
          <div>
            <h3>Vendez votre avion en {name}</h3>
            <p>Déposez votre annonce gratuitement sur Aircraft2Sell et touchez des acheteurs qualifiés sans commission.</p>
          </div>
        </div>
        <a href="post-listing.html" class="btn-primary btn-lg">Déposer une annonce <i data-icon="arrow-right"></i></a>
      </div>
    </div>

  </div>
</section>

<section class="section-sm section-alt">
  <div class="container">
    <div class="section-head">
      <div>
        <h2>Guides associés</h2>
        <p>Pour aller plus loin dans votre projet de vente.</p>
      </div>
      <a href="blog.html" class="btn-secondary">Tous les guides <i data-icon="arrow-right"></i></a>
    </div>
    <div class="grid-3 related">
{related_cards(c, 'fr')}
    </div>
  </div>
</section>

<div id="a2sFooter"></div>
<script src="icons.js?v=20261007a"></script>
<script src="analytics.js" defer></script>
<script src="rgpd-consent.js?v=20261006a" defer></script>
<script src="nav.js?v={NAV_SCRIPT_TAG_VERSION}"></script>
<script src="footer.js?v=20261030a"></script>
</body>
</html>
"""

def render_en(c):
    slug = c["slug"]
    name_en = EN_OVERRIDES[slug]["name_en"]
    title = f"Selling Your Aircraft in {name_en.title() if not name_en.startswith('the') else name_en}: Process, Price and Tax 2026"
    desc = f"Sell a used aircraft in {name_en} in 2026: how to price it, documents required by {c['authority']}, sale tax ({c['tax_name']}) and average time to sell. Complete seller's guide."
    docs_html = "".join(f'<li><i data-icon="check"></i><span><strong>{d}</strong></span></li>' for d in c["docs"])
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<script src="/confirm-handler.js"></script>
<script src="/lang-redirect.js"></script>
<meta charset="UTF-8">
<meta name="robots" content="index, follow">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="{desc}">
<meta property="og:title" content="{title} | Aircraft2Sell">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://aircraft2sell.eu/en/vendre-avion-{slug}.html">
<meta property="og:image" content="https://aircraft2sell.eu/og-image.png?v=3">
<meta property="og:site_name" content="Aircraft2Sell">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://aircraft2sell.eu/en/vendre-avion-{slug}.html">
<link rel="alternate" hreflang="fr" href="https://aircraft2sell.eu/vendre-avion-{slug}.html">
<link rel="alternate" hreflang="en" href="https://aircraft2sell.eu/en/vendre-avion-{slug}.html">
<link rel="alternate" hreflang="x-default" href="https://aircraft2sell.eu/vendre-avion-{slug}.html">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<title>{title}</title>
<script type="application/ld+json">
{{"@type": "Article", "@context": "https://schema.org", "headline": "{title}", "description": "{desc}", "datePublished": "{TODAY}", "dateModified": "{TODAY}", "inLanguage": "en", "author": {{"@type": "Organization", "name": "Aircraft2Sell"}}, "publisher": {{"@type": "Organization", "name": "Aircraft2Sell", "logo": {{"@type": "ImageObject", "url": "https://aircraft2sell.eu/icon-512.png"}}, "url": "https://aircraft2sell.eu"}}, "mainEntityOfPage": {{"@type": "WebPage", "@id": "https://aircraft2sell.eu/en/vendre-avion-{slug}.html"}}}}
</script>
<script type="application/ld+json">
{{"@type": "BreadcrumbList", "@context": "https://schema.org", "itemListElement": [{{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://aircraft2sell.eu/en/index.html"}}, {{"@type": "ListItem", "position": 2, "name": "Guides", "item": "https://aircraft2sell.eu/en/blog.html"}}, {{"@type": "ListItem", "position": 3, "name": "Selling in {name_en}", "item": "https://aircraft2sell.eu/en/vendre-avion-{slug}.html"}}]}}
</script>
<link rel="stylesheet" href="/styles.css?v=20261106a">
<link rel="stylesheet" href="/mobile.css?v=20260909a" media="(max-width: 1024px)">
<style>
.page-head .eyebrow{{display:block;margin-bottom:.5rem}}
.guide-meta{{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;font-size:.84rem;color:var(--a2s-text-muted);margin-top:.9rem}}
.guide-meta span{{display:inline-flex;align-items:center;gap:.4rem}}
.guide-meta .ic{{width:16px;height:16px}}
.toc{{margin-bottom:2.25rem}}
.toc .card-body{{padding:1.1rem 1.35rem}}
.toc-title{{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--a2s-text-muted);margin-bottom:.65rem}}
.toc ol{{counter-reset:toc;display:flex;flex-direction:column;gap:.4rem}}
.toc li{{counter-increment:toc;display:flex;gap:.6rem;font-size:.92rem;line-height:1.45}}
.toc li::before{{content:counter(toc) ".";font-weight:700;color:var(--a2s-text-faint);min-width:1.3rem}}
.toc a{{color:var(--a2s-blue);font-weight:600}}
.toc a:hover{{text-decoration:underline}}
.article h2{{font-size:1.5rem;margin:2.5rem 0 .9rem;scroll-margin-top:calc(var(--nav-h) + 1.25rem)}}
.article h2:first-child{{margin-top:0}}
.article h3{{font-size:1.12rem;margin:1.6rem 0 .6rem}}
.article p{{font-size:1.02rem;line-height:1.75;margin-bottom:1.1rem}}
.article ul.checks{{display:flex;flex-direction:column;gap:.6rem;margin:0 0 1.35rem}}
.article ul.checks li{{display:flex;gap:.65rem;align-items:flex-start;line-height:1.6;font-size:1rem}}
.article ul.checks .ic{{width:18px;height:18px;color:var(--a2s-success);margin-top:.25rem}}
.article .alert{{margin:1.5rem 0;font-size:.95rem}}
.article .table-wrap{{margin:1rem 0 1.5rem;border:1px solid var(--a2s-border);border-radius:var(--a2s-radius-card);background:var(--a2s-surface)}}
.article .table{{font-size:.92rem}}
.guide-cta{{margin-top:3rem}}
.guide-cta .card-body{{padding:1.75rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}}
.guide-cta .icon-box{{width:52px;height:52px}}
.guide-cta h3{{margin-bottom:.3rem}}
.guide-cta p{{color:var(--a2s-text-muted);margin:0;max-width:460px}}
.guide-cta .cta-text{{display:flex;align-items:center;gap:1.1rem}}
.related a.card{{display:flex;flex-direction:column;gap:.55rem;padding:1.35rem;color:inherit;transition:box-shadow .15s,border-color .15s}}
.related a.card:hover{{border-color:var(--a2s-border-2);box-shadow:var(--a2s-shadow)}}
.related .card .icon-box{{width:40px;height:40px;margin-bottom:.2rem}}
.related .card .icon-box .ic{{width:20px;height:20px}}
.related .card strong{{color:var(--a2s-navy);font-size:1rem;line-height:1.35}}
.related .card p{{font-size:.86rem;color:var(--a2s-text-muted);line-height:1.55;margin:0}}
.related .card .btn-link{{margin-top:auto;padding-top:.5rem}}
@media(max-width:768px){{.guide-cta .card-body{{padding:1.5rem}}.article p{{font-size:.98rem}}}}
</style>
<script defer src="https://cloud.umami.is/script.js" data-website-id="6fa26d01-f284-48ca-814b-ad6cf8dcee84"></script>
</head>
<body>
<!-- nav injected by nav.js -->

<div class="page-head">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/en/index.html">Home</a><i data-icon="chevron-right"></i><a href="/en/blog.html">Guides</a><i data-icon="chevron-right"></i><span aria-current="page">Selling in {name_en}</span></nav>
    <span class="eyebrow">Selling</span>
    <h1>{title}</h1>
    <p>Market, pricing, documents required by {c['authority']} and tax treatment: everything you need to know to sell your aircraft efficiently in {name_en}.</p>
    <div class="guide-meta">
      <span><i data-icon="clock"></i>7 min read</span>
      <span><i data-icon="calendar"></i>Published November {TODAY[8:10]}, 2026</span>
      <span><i data-icon="user-check"></i>Written by the Aircraft2Sell team</span>
    </div>
  </div>
</div>

<section class="section">
  <div class="container-narrow">

    <div class="card toc">
      <div class="card-body">
        <div class="toc-title">Contents</div>
        <ol><li><a href="#marche">The seller's market in {name_en}</a></li><li><a href="#prix">How to price your aircraft</a></li><li><a href="#documents">Documents to prepare</a></li><li><a href="#fiscalite">Tax treatment of the sale</a></li><li><a href="#delai">Average time to sell</a></li><li><a href="#pieges">Common seller mistakes to avoid</a></li></ol>
      </div>
    </div>

    <article class="article">
<h2 id="marche">The seller's market in {name_en}</h2>
<p>{c['market']}</p>

<h2 id="prix">How to price your aircraft</h2>
<p>An aircraft's price is driven first by its remaining engine potential (hours to TBO/overhaul), the quality and continuity of its maintenance records, and its equipment (avionics, options). Year of manufacture plays a secondary role compared to these factors. Compare your aircraft against several similar listings published recently to position it realistically — an overpriced listing mechanically lengthens the time to sell.</p>
<div class="alert alert-info"><i data-icon="info"></i><div><strong>Tip</strong> — Use Aircraft2Sell's <a href="/en/estimation.html">free valuation tool</a> to get a realistic price range before publishing your listing.</div></div>

<h2 id="documents">Documents to prepare</h2>
<p>Prepare this file before even publishing your listing: a serious buyer will ask for it from the very first exchange, and having it ready considerably speeds up the negotiation.</p>
<ul class="checks">
  {docs_html}
</ul>

<h2 id="fiscalite">Tax treatment of the sale</h2>
<p>{c['tax_detail']}</p>
<div class="table-wrap"><table class="table">
<thead><tr><th>Competent authority</th><th>Registration prefix</th><th>Applicable tax</th></tr></thead>
<tbody>
<tr><td>{c['authority']}</td><td>{c['prefix']}</td><td>{c['tax_name']} ({c['tax_rate']})</td></tr>
</tbody>
</table></div>

<h2 id="delai">Average time to sell</h2>
<p>Budget {c['delay']} A complete listing (plenty of photos, precise description, up-to-date documents) significantly shortens this timeline compared to a minimal listing.</p>

<h2 id="pieges">Common seller mistakes to avoid</h2>
<p>{c['pitfalls']}</p>
<div class="alert alert-info"><i data-icon="info"></i><div><strong>Tip</strong> — List your aircraft on Aircraft2Sell to reach qualified buyers across Europe, with zero commission on the sale.</div></div>
    </article>

    <div class="card guide-cta">
      <div class="card-body">
        <div class="cta-text">
          <span class="icon-box accent"><i data-icon="tag"></i></span>
          <div>
            <h3>Sell your aircraft in {name_en}</h3>
            <p>List your aircraft for free on Aircraft2Sell and reach qualified buyers with zero commission.</p>
          </div>
        </div>
        <a href="/en/post-listing.html" class="btn-primary btn-lg">List your aircraft <i data-icon="arrow-right"></i></a>
      </div>
    </div>

  </div>
</section>

<section class="section-sm section-alt">
  <div class="container">
    <div class="section-head">
      <div>
        <h2>Related guides</h2>
        <p>More resources for your sale.</p>
      </div>
      <a href="/en/blog.html" class="btn-secondary">All guides <i data-icon="arrow-right"></i></a>
    </div>
    <div class="grid-3 related">
{related_cards(c, 'en')}
    </div>
  </div>
</section>

<div id="a2sFooter"></div>
<script src="/icons.js?v=20261007a"></script>
<script src="/analytics.js" defer></script>
<script src="/rgpd-consent.js?v=20261006a" defer></script>
<script src="/nav.js?v={NAV_SCRIPT_TAG_VERSION}"></script>
<script src="/footer.js?v=20261030a"></script>
</body>
</html>
"""

def main():
    created = []
    for c in COUNTRIES:
        fr_path = os.path.join(BASE, f"vendre-avion-{c['slug']}.html")
        with open(fr_path, "w", encoding="utf-8") as f:
            f.write(render_fr(c))
        created.append(fr_path)
        if c["slug"] in EN_SLUGS:
            en_dir = os.path.join(BASE, "en")
            os.makedirs(en_dir, exist_ok=True)
            en_path = os.path.join(en_dir, f"vendre-avion-{c['slug']}.html")
            with open(en_path, "w", encoding="utf-8") as f:
                f.write(render_en(c))
            created.append(en_path)
    print(f"{len(created)} fichiers générés :")
    for p in created:
        print(" -", os.path.relpath(p, BASE))

if __name__ == "__main__":
    main()
