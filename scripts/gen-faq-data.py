#!/usr/bin/env python3
"""Génère faq-data.js — le corpus de connaissances de l'assistant du site.

Les réponses françaises sont extraites du JSON-LD de `faq.html` : la FAQ publiée
reste la source unique de vérité, l'assistant ne peut donc pas raconter autre
chose que ce qui est affiché (et indexé par Google).

Les traductions anglaises sont tenues dans ce script (dict EN ci-dessous), avec
un contrôle : si une question française change dans faq.html sans que la
traduction soit mise à jour, la génération échoue plutôt que de publier un
contenu désynchronisé.

Usage : python3 scripts/gen-faq-data.py
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Mots-clés de déclenchement supplémentaires (le texte de la question et de la
# réponse est déjà indexé ; on ajoute ici le vocabulaire des utilisateurs).
KEYWORDS = {
    'commission': 'commission commissions prenez prend prelevez frais gratuit cout couter coute tarif tarifs prix payer paie payant combien argent marge pourcentage prelevement facture',
    'contacter un vendeur': 'contacter contact vendeur joindre appeler telephone message ecrire proprietaire discuter parler',
    'annonces sont-elles': 'verifiee verifier fiable fiabilite arnaque arnaques confiance securite securise escroquerie authentique controle serieux risque danger',
    'alerte': 'alerte notification email prevenu nouvelle annonce recherche sauvegardee',
    'favoris': 'favori sauvegarder coeur enregistrer liste envie',
    'negociables': 'negocier negociation prix marge discuter offre baisser',
    'deposer une annonce': 'deposer depot publie publier poster vendre vends vend vendez vente avion aeronef mettre creer annonce inscrire ajouter proposer',
    "combien d'annonces": 'nombre annonces limite quota plusieurs formule plan',
    "n'a pas ete validee": 'refusee rejetee validation attente moderation refus pourquoi bloquee',
    'photos puis-je': 'photos nombre images combien ajouter telecharger',
    'modifier ou supprimer': 'modifier supprimer editer changer retirer archiver vendu',
    'adresse email et mon telephone': 'confidentialite email telephone visible public prive donnees affiche',
    'creation de compte': 'compte inscription inscrire gratuit creer sinscrire enregistrer carte bancaire payant',
    'resilier': 'resilie resilier resiliation annul annule annuler annulation abonnement abonne arreter stopper desabonner remboursement',
    'pseudo': 'pseudo nom utilisateur changer modifier profil',
    'mot de passe': 'mot de passe oublie perdu reinitialiser connexion acces',
    'mobile': 'mobile telephone portable smartphone tablette responsive application appli marche fonctionne',
    'formats de photos': 'format photo jpg png taille poids resolution mo',
    'convertisseur de devises': 'devise conversion taux change euro dollar livre franc',
    'publicites': 'publicite pub banniere sponsorise annonce commerciale',
    'signaler': 'signaler suspect fraude arnaque abus denoncer probleme',
    'donnees personnelles': 'rgpd donnee donnees personnelles confidentialite vie privee protection reven revendez revendre vendre partager tiers exploiter',
}

# Traductions anglaises, indexées par la question française exacte.
EN = {
    "Comment contacter un vendeur ?": (
        "How do I contact a seller?",
        "On every listing page, click \u201cContact the seller\u201d. A form opens: enter your name, "
        "email, phone (optional) and your message. The seller is notified by email and can reply "
        "to you directly. No account is required to contact a seller.",
        "contact seller reach owner message phone call write"),
    "Les annonces sont-elles vérifiées ?": (
        "Are the listings verified?",
        "Yes. Every listing is reviewed manually by our team before publication. We check that the "
        "information is consistent (category, price, description), but we do not physically inspect "
        "the aircraft. We always recommend an independent pre-purchase inspection by an approved "
        "maintenance organisation before committing.",
        "verified verify trustworthy scam scams safe safety fraud genuine checked reliable risk trust"),
    "Aircraft2Sell prend-il une commission sur les ventes ?": (
        "Does Aircraft2Sell take a commission on sales?",
        "Zero commission. Aircraft2Sell is an introduction platform. We take no percentage of any "
        "transaction: the full sale price goes to the seller. Our business model relies solely on "
        "subscriptions from professional sellers.",
        "commission commissions fee fees percentage free cost costs price charge charges how much money billing"),
    "Comment créer une alerte pour être notifié de nouvelles annonces ?": (
        "How do I create an alert for new listings?",
        "On the home page, enter your email in the \u201cAlerts\u201d section, choose a category and a "
        "maximum budget, then click \u201cCreate my alert\u201d. You will receive an email as soon as a "
        "listing matches your criteria. You can unsubscribe in one click from any email.",
        "alert notification email notified new listing saved search"),
    "Puis-je sauvegarder des annonces en favoris ?": (
        "Can I save listings as favourites?",
        "Yes. On the listing cards, click the heart icon to add a listing to your favourites. They "
        "are saved locally in your browser and persist between visits. A free account lets you find "
        "them again on all your devices.",
        "favourite favorite save heart bookmark shortlist wishlist"),
    "Les prix sont-ils négociables ?": (
        "Are prices negotiable?",
        "Aircraft2Sell does not take part in negotiations: they happen entirely between you and the "
        "seller. Some listings state explicitly whether the price is \u201cnegotiable\u201d or \u201cfirm\u201d. Feel "
        "free to ask the seller directly about their margin, backing your offer with objective "
        "factors (engine hours, condition, market value).",
        "negotiate negotiation price offer haggle discount lower"),
    "Comment déposer une annonce ?": (
        "How do I post a listing?",
        "Create a free account, then click \u201cList your aircraft\u201d in the navigation. Fill in the form "
        "(category, make, model, year, price, description, photos) and submit. Your listing is "
        "reviewed by our team within 24 to 72 working hours, then published automatically.",
        "post publish list sell sells selling seller plane aircraft create listing advertise submit add"),
    "Combien d'annonces puis-je publier ?": (
        "How many listings can I publish?",
        "It depends on your plan: Essential (free): 1 active listing. Aviator (\u20ac29/month): 3 listings. "
        "Pro (\u20ac79/month): unlimited listings. You can upgrade at any time from your dashboard.",
        "how many listings limit quota multiple plan number"),
    "Pourquoi mon annonce n'a pas été validée ?": (
        "Why was my listing not approved?",
        "We reject listings that do not meet our rules: incomplete or inaccurate information, "
        "insufficient or misleading photos, a price inconsistent with the category, or duplicate "
        "listings. You receive an email explaining the reason, and you can correct and resubmit from "
        "your dashboard.",
        "rejected refused approval pending moderation why blocked declined"),
    "Combien de photos puis-je ajouter ?": (
        "How many photos can I add?",
        "Essential plan: up to 5 photos. Aviator plan: up to 20 photos. Pro plan: unlimited. We "
        "recommend at least 6 photos covering the exterior (front and rear three-quarter views, "
        "side), the cockpit, the engine and the documents. Good photos significantly increase the "
        "number of enquiries you receive.",
        "photos how many images pictures add upload number"),
    "Comment modifier ou supprimer mon annonce ?": (
        "How do I edit or delete my listing?",
        "From your dashboard (\u201cMy listings\u201d tab), click the listing you want to change. You can edit "
        "all the information, add or remove photos, and archive or delete the listing. If the "
        "aircraft is sold, mark it as \u201cSold\u201d rather than deleting it: it strengthens the credibility "
        "of the platform.",
        "edit delete modify change remove archive sold update"),
    "Qui voit mon adresse email et mon téléphone ?": (
        "Who can see my email address and phone number?",
        "Your email is never displayed publicly on listings \u2014 only your public username is visible. "
        "Your email is passed to buyers only when they contact you through the contact form, so that "
        "you can reply directly. Your phone number is shared only if you choose to include it in "
        "your listing.",
        "privacy email phone visible public private data displayed"),
    "La création de compte est-elle gratuite ?": (
        "Is creating an account free?",
        "Yes, entirely free. The Essential plan lets you publish 1 listing, receive messages from "
        "buyers and access your dashboard. No credit card is required to sign up.",
        "account signup free register create card payment"),
    "Comment résilier mon abonnement ?": (
        "How do I cancel my subscription?",
        "From your dashboard, \u201cSubscription\u201d tab, click \u201cCancel my subscription\u201d. Cancellation takes "
        "effect at the end of the current period: you keep access to all features until the end of "
        "the period you paid for. No minimum notice is required.",
        "cancel cancellation subscription stop unsubscribe end refund billing terminate"),
    "Comment changer mon pseudo ?": (
        "How do I change my username?",
        "In your dashboard, \u201cSettings\u201d tab, edit your username in the dedicated field and click "
        "\u201cSave\u201d. The change is immediate on your profile, but listings already published keep the "
        "previous username until their next update.",
        "username nickname change edit profile name"),
    "J'ai oublié mon mot de passe, que faire ?": (
        "I forgot my password, what should I do?",
        "On the login page, click \u201cForgot password?\u201d. Enter your email and you will receive a reset "
        "link valid for 1 hour. If the email does not arrive, check your spam folder or contact us at "
        "contact@aircraft2sell.eu.",
        "password forgot lost reset login access recover"),
    "Le site fonctionne-t-il sur mobile ?": (
        "Does the site work on mobile?",
        "Yes. Aircraft2Sell is fully responsive and optimised for mobile and tablet. Every feature "
        "(search, filters, contacting a seller, posting a listing) works from a smartphone. Uploading "
        "photos from your phone gallery is supported.",
        "mobile phone smartphone tablet responsive app application work works"),
    "Quels formats de photos sont acceptés ?": (
        "Which photo formats are accepted?",
        "Accepted formats: JPG, JPEG, PNG. Maximum size: 10 MB per photo. We recommend landscape "
        "photos in 4:3 or 16:9, with a minimum resolution of 1280\u00d7720 pixels. Blurred, very dark or "
        "distant photos are rejected during review.",
        "format photo jpg png size resolution mb file"),
    "Le convertisseur de devises est-il fiable ?": (
        "Is the currency converter reliable?",
        "The converter uses exchange rates from public APIs (indicative rates close to the European "
        "Central Bank, updated regularly). These rates are indicative: for an actual transaction, "
        "always use your bank's rate or a specialist currency exchange service.",
        "currency conversion exchange rate euro dollar pound franc"),
    "Aircraft2Sell affiche-t-il des publicités ?": (
        "Does Aircraft2Sell display advertising?",
        "No. Aircraft2Sell is entirely ad-free. Our business model relies on seller subscriptions: we "
        "never display banners, pop-ups or sponsored content.",
        "advertising ads banner sponsored commercial"),
    "Comment signaler une annonce suspecte ?": (
        "How do I report a suspicious listing?",
        "On each listing page, click the \u201cReport\u201d link at the bottom. You can also contact us "
        "directly at contact@aircraft2sell.eu with the listing link and the reason for reporting. We "
        "handle every report within 24 hours.",
        "report suspicious fraud scam abuse flag problem"),
    "Mes données personnelles sont-elles protégées ?": (
        "Is my personal data protected?",
        "Yes. Aircraft2Sell complies with the GDPR. Your data is hosted on secure servers (Supabase / "
        "Cloudflare) and is never sold to third parties. You can exercise your rights (access, "
        "rectification, erasure) at any time. See our full privacy policy.",
        "gdpr data personal privacy protection security sell share third party"),
}


def extract_fr():
    """[(question, réponse), ...] depuis les blocs JSON-LD FAQPage de faq.html."""
    src = open(os.path.join(ROOT, 'faq.html'), encoding='utf-8').read()
    pairs = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        for entry in data.get('mainEntity', []) or []:
            answer = entry.get('acceptedAnswer', {}).get('text', '')
            answer = re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', html.unescape(answer))).strip()
            question = (entry.get('name') or '').strip()
            if question and answer:
                pairs.append((question, answer))
    return pairs


def _fold(s):
    """Minuscules sans accents : les clés de KEYWORDS sont écrites sans accent,
    les questions de la FAQ en comportent (« résilier », « données »). Sans ce
    repli, la correspondance échouait silencieusement et 8 entrées sur 22 se
    retrouvaient sans aucun mot-clé."""
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower())
                   if unicodedata.category(c) != 'Mn')


def keywords_for(question):
    low = _fold(question)
    for frag, kw in KEYWORDS.items():
        if _fold(frag) in low:
            return kw
    return ''


def main():
    fr = extract_fr()
    if not fr:
        sys.exit('Aucune Q/R trouvée dans faq.html — vérifier le JSON-LD.')

    missing = [q for q, _ in fr if q not in EN]
    if missing:
        sys.exit('Traduction anglaise manquante pour :\n  - ' + '\n  - '.join(missing) +
                 "\nMettre à jour le dict EN de ce script.")

    entries = []
    for question, answer in fr:
        en_q, en_a, en_kw = EN[question]
        entries.append({
            'fr': {'q': question, 'a': answer, 'k': keywords_for(question)},
            'en': {'q': en_q, 'a': en_a, 'k': en_kw},
        })

    empty = [e['fr']['q'] for e in entries if not e['fr']['k']]
    if empty:
        sys.exit('Mots-clés manquants (vérifier les clés de KEYWORDS) :\n  - ' +
                 '\n  - '.join(empty))

    payload = json.dumps(entries, ensure_ascii=False, separators=(',', ':'))
    js = (
        '/* Corpus de l\'assistant Aircraft2Sell — FICHIER GÉNÉRÉ, NE PAS ÉDITER.\n'
        '   Source : le JSON-LD de faq.html (FR) + les traductions du script.\n'
        '   Régénérer : python3 scripts/gen-faq-data.py */\n'
        'window.A2S_FAQ = ' + payload + ';\n'
    )
    dest = os.path.join(ROOT, 'faq-data.js')
    open(dest, 'w', encoding='utf-8').write(js)
    print(f'faq-data.js généré : {len(entries)} entrées (FR + EN), {len(js) // 1024} ko.')

    # Contexte serveur pour l'agent IA (api/chat.js) : même source unique de
    # vérité, format texte compact FR/EN pour être injecté dans le prompt
    # système. Ne JAMAIS écrire ce contenu à la main dans api/chat.js.
    def contexte(lang):
        lignes = [f"Q: {e[lang]['q']}\nR: {e[lang]['a']}" for e in entries]
        return '\n\n'.join(lignes)

    ctx_js = (
        '/* Contexte FAQ pour l\'agent IA (api/chat.js) — FICHIER GÉNÉRÉ, NE PAS ÉDITER.\n'
        '   Source : le JSON-LD de faq.html (FR) + les traductions de gen-faq-data.py.\n'
        '   Régénérer : python3 scripts/gen-faq-data.py */\n'
        'export const FAQ_CONTEXT = {\n'
        '  fr: ' + json.dumps(contexte('fr'), ensure_ascii=False) + ',\n'
        '  en: ' + json.dumps(contexte('en'), ensure_ascii=False) + ',\n'
        '};\n'
    )
    dest_ctx = os.path.join(ROOT, 'api', '_faq-context.js')
    open(dest_ctx, 'w', encoding='utf-8').write(ctx_js)
    print(f'api/_faq-context.js généré : {len(ctx_js) // 1024} ko.')


if __name__ == '__main__':
    main()
