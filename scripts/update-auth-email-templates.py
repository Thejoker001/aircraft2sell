#!/usr/bin/env python3
"""Régénère tous les templates email Supabase Auth avec le design actuel
du site (fond clair, navy #0B2545, orange #EA6A16, cohérent avec
api/_lib.js — le gabarit des emails transactionnels déjà dans ce style).
"""
import json, urllib.request, urllib.error

import os
TOKEN = os.environ['SUPABASE_ACCESS_TOKEN']  # jeton Management API (jamais en dur, jamais commité)
REF = os.environ.get('SUPABASE_PROJECT_REF', 'hlivysnlzlqdjcigqgvk')
SITE = 'https://aircraft2sell.eu'

FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def gabarit(eyebrow, titre, intro_html, cta_url=None, cta_label=None, blocs_html='', pied_html='', validite=None):
    """Même structure visuelle que api/_lib.js : header navy, carte blanche,
    bouton orange, footer clair. Compatible clients email (tables, styles
    inline uniquement)."""
    bloc_cta = ''
    if cta_url:
        bloc_cta = f'''
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#EA6A16;border-radius:8px">
          <a href="{cta_url}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;
             font-family:{FONT};font-size:15px;font-weight:700;text-decoration:none">{cta_label or 'Continuer'}</a>
        </td></tr></table>'''
    bloc_validite = ''
    if validite:
        bloc_validite = f'<p style="margin:14px 0 0;color:#8494A8;font-size:12px;font-family:{FONT}">Lien valable {validite}. Si vous n\'êtes pas à l\'origine de cette action, ignorez cet e-mail.</p>'

    return f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titre} — Aircraft2Sell</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:{FONT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(11,37,69,.08)">

   <tr><td style="background:#0B2545;padding:20px 28px">
     <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px;font-family:{FONT}">
       Aircraft2<span style="color:#EA6A16">Sell</span></div>
   </td></tr>

   <tr><td style="padding:28px">
     <p style="margin:0 0 10px;color:#EA6A16;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-family:{FONT}">{eyebrow}</p>
     <h1 style="margin:0 0 12px;color:#0B2545;font-size:20px;font-weight:800;line-height:1.3;font-family:{FONT}">{titre}</h1>
     <p style="margin:0 0 20px;color:#3D4F63;font-size:15px;line-height:1.6;font-family:{FONT}">{intro_html}</p>
     {blocs_html}
     {bloc_cta}
     {bloc_validite}
     {pied_html}
   </td></tr>

   <tr><td style="background:#F9FBFD;padding:18px 28px;border-top:1px solid #E4EAF2">
     <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.6;font-family:{FONT}">
       Aircraft2Sell OÜ — marketplace aéronautique européenne, zéro commission.<br>
       <a href="{SITE}" style="color:#1E5FCC;text-decoration:none">aircraft2sell.eu</a>
       &nbsp;·&nbsp;
       <a href="{SITE}/contact.html" style="color:#1E5FCC;text-decoration:none">Nous contacter</a>
     </p>
   </td></tr>

  </table>
 </td></tr>
</table>
</body></html>'''


templates = {}
subjects = {}

# ── 1. Confirmation d'inscription ──
templates['mailer_templates_confirmation_content'] = gabarit(
    eyebrow='Vérification de votre compte',
    titre='Confirmez votre adresse email',
    intro_html="Bienvenue sur Aircraft2Sell ! Cliquez sur le bouton ci-dessous pour activer votre compte et accéder à l'ensemble de nos annonces d'aéronefs : avions légers, jets, turbopropulseurs, hélicoptères et ULM.",
    cta_url='{{ .ConfirmationURL }}', cta_label='Confirmer mon adresse email',
    validite='24 heures',
)
subjects['mailer_subjects_confirmation'] = 'Bienvenue sur Aircraft2Sell, confirmez votre email'

# ── 2. Réinitialisation de mot de passe ──
templates['mailer_templates_recovery_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Réinitialisez votre mot de passe',
    intro_html="Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste inchangé.",
    cta_url='{{ .ConfirmationURL }}', cta_label='Choisir un nouveau mot de passe',
    validite='1 heure',
)
subjects['mailer_subjects_recovery'] = 'Aircraft2Sell — Réinitialisez votre mot de passe'

# ── 3. Invitation ──
templates['mailer_templates_invite_content'] = gabarit(
    eyebrow='Invitation',
    titre='Vous avez été invité(e) sur Aircraft2Sell',
    intro_html="Vous avez été invité(e) à créer un compte sur Aircraft2Sell, la marketplace aéronautique européenne sans commission. Cliquez ci-dessous pour accepter l'invitation et créer votre accès.",
    cta_url='{{ .ConfirmationURL }}', cta_label="Accepter l'invitation",
)
subjects['mailer_subjects_invite'] = 'Vous êtes invité(e) sur Aircraft2Sell'

# ── 4. Changement d'adresse email ──
templates['mailer_templates_email_change_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre="Confirmez le changement d'adresse email",
    intro_html="Vous avez demandé à changer l'adresse email de votre compte de <strong>{{ .Email }}</strong> vers <strong>{{ .NewEmail }}</strong>. Cliquez ci-dessous pour confirmer ce changement.",
    cta_url='{{ .ConfirmationURL }}', cta_label="Confirmer le changement d'email",
)
subjects['mailer_subjects_email_change'] = "Aircraft2Sell — Confirmez le changement d'adresse email"

# ── 5. Lien magique (connexion sans mot de passe) ──
templates['mailer_templates_magic_link_content'] = gabarit(
    eyebrow='Connexion sécurisée',
    titre='Votre lien de connexion',
    intro_html="Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Aircraft2Sell, sans mot de passe.",
    cta_url='{{ .ConfirmationURL }}', cta_label='Me connecter',
    validite='1 heure',
)
subjects['mailer_subjects_magic_link'] = 'Aircraft2Sell — Votre lien de connexion'

# ── 6. Ré-authentification (code) ──
code_block = '''
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px">
       <tr><td align="center" style="background:#F9FBFD;border:1px solid #E4EAF2;border-radius:8px;padding:18px">
         <span style="font-family:monospace;font-size:28px;font-weight:800;color:#0B2545;letter-spacing:.15em">{{ .Token }}</span>
       </td></tr>
     </table>'''
templates['mailer_templates_reauthentication_content'] = gabarit(
    eyebrow='Vérification de sécurité',
    titre='Votre code de confirmation',
    intro_html="Pour confirmer cette action sensible sur votre compte Aircraft2Sell, saisissez le code ci-dessous sur le site.",
    blocs_html=code_block,
    validite='quelques minutes',
)
subjects['mailer_subjects_reauthentication'] = 'Aircraft2Sell — Votre code de vérification'

# ── 7. Notifications de sécurité (aucun CTA — informatif) ──
templates['mailer_templates_password_changed_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Votre mot de passe a été modifié',
    intro_html="Le mot de passe du compte <strong>{{ .Email }}</strong> vient d'être changé. Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.",
)
subjects['mailer_subjects_password_changed_notification'] = 'Aircraft2Sell — Votre mot de passe a été modifié'

templates['mailer_templates_email_changed_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Votre adresse email a été modifiée',
    intro_html="L'adresse email de votre compte a été changée de <strong>{{ .OldEmail }}</strong> vers <strong>{{ .Email }}</strong>. Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.",
)
subjects['mailer_subjects_email_changed_notification'] = 'Aircraft2Sell — Votre adresse email a été modifiée'

templates['mailer_templates_phone_changed_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Votre numéro de téléphone a été modifié',
    intro_html="Le numéro de téléphone du compte <strong>{{ .Email }}</strong> a été changé de <strong>{{ .OldPhone }}</strong> vers <strong>{{ .Phone }}</strong>. Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.",
)
subjects['mailer_subjects_phone_changed_notification'] = 'Aircraft2Sell — Votre numéro de téléphone a été modifié'

templates['mailer_templates_mfa_factor_enrolled_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre="Une nouvelle méthode d'authentification a été ajoutée",
    intro_html="Une nouvelle méthode d'authentification ({{ .FactorType }}) a été ajoutée au compte <strong>{{ .Email }}</strong>. Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.",
)
subjects['mailer_subjects_mfa_factor_enrolled_notification'] = "Aircraft2Sell — Nouvelle méthode d'authentification ajoutée"

templates['mailer_templates_mfa_factor_unenrolled_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre="Une méthode d'authentification a été retirée",
    intro_html="Une méthode d'authentification ({{ .FactorType }}) a été retirée du compte <strong>{{ .Email }}</strong>. Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.",
)
subjects['mailer_subjects_mfa_factor_unenrolled_notification'] = "Aircraft2Sell — Méthode d'authentification retirée"

templates['mailer_templates_identity_linked_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Un nouveau compte a été associé',
    intro_html="Un compte {{ .Provider }} a été associé à votre profil Aircraft2Sell (<strong>{{ .Email }}</strong>). Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.",
)
subjects['mailer_subjects_identity_linked_notification'] = 'Aircraft2Sell — Nouveau compte associé'

templates['mailer_templates_identity_unlinked_notification_content'] = gabarit(
    eyebrow='Sécurité de votre compte',
    titre='Un compte associé a été retiré',
    intro_html="Un compte {{ .Provider }} a été dissocié de votre profil Aircraft2Sell (<strong>{{ .Email }}</strong>). Si vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.",
)
subjects['mailer_subjects_identity_unlinked_notification'] = 'Aircraft2Sell — Compte associé retiré'

# ── Application via Management API ──
payload = {}
payload.update(templates)
payload.update(subjects)

req = urllib.request.Request(
    f'https://api.supabase.com/v1/projects/{REF}/config/auth',
    method='PATCH',
    headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    },
    data=json.dumps(payload).encode(),
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    print("PATCH config/auth:", resp.status)
    d = json.loads(resp.read().decode())
    print("confirmation subject:", d.get('mailer_subjects_confirmation'))
    print(f"{len(templates)} templates + {len(subjects)} sujets appliqués.")
except urllib.error.HTTPError as e:
    print("ERREUR:", e.code, e.read().decode()[:800])
