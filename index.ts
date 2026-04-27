// ============================================================
// supabase/functions/send-contact-email/index.ts
// Edge Function — Envoie l'email de contact via Brevo
//
// Variables d'env à configurer dans Supabase :
//   BREVO_API_KEY     → ta clé API Brevo
//   ADMIN_EMAIL       → contact@aircraft2sell.eu
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ['https://aircraft2sell.eu', 'https://www.aircraft2sell.eu', 'http://localhost:3000'];
  const allowedOrigin = allowed.includes(origin) ? origin : 'https://www.aircraft2sell.eu';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { firstName, lastName, email, subject, message } = await req.json()

    // Validation basique
    if (!firstName || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Champs manquants' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Anti-spam : vérifier que le message n'est pas vide
    if (message.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Message trop court' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const BREVO_KEY = Deno.env.get('BREVO_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'contact@aircraft2sell.eu'

    if (!BREVO_KEY) throw new Error('BREVO_API_KEY non configurée')

    const subjectLabels: Record<string, string> = {
      support: 'Support / Problème technique',
      listing: 'Question sur une annonce',
      billing: 'Facturation / Abonnement',
      partnership: 'Partenariat',
      press: 'Presse / Médias',
      other: 'Autre',
    }

    // 1. Email de notification à l'équipe A2S
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell Contact', email: 'noreply@aircraft2sell.eu' },
        to: [{ email: ADMIN_EMAIL, name: 'Aircraft2Sell' }],
        replyTo: { email, name: `${firstName} ${lastName}` },
        subject: `[Contact A2S] ${subjectLabels[subject] ?? subject}`,
        htmlContent: `
          <h2 style="color:#e8a020;font-family:sans-serif">Nouveau message — Aircraft2Sell</h2>
          <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
            <tr><td style="padding:8px;color:#666;width:140px">Nom</td><td style="padding:8px;font-weight:600">${firstName} ${lastName}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;color:#666">Objet</td><td style="padding:8px">${subjectLabels[subject] ?? subject}</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;vertical-align:top">Message</td><td style="padding:8px;line-height:1.6;white-space:pre-wrap">${message}</td></tr>
          </table>
          <p style="font-size:12px;color:#999;margin-top:20px">Envoyé depuis aircraft2sell.eu — ${new Date().toLocaleString('fr-FR')}</p>
        `,
      }),
    })

    // 2. Email de confirmation à l'utilisateur
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: 'noreply@aircraft2sell.eu' },
        to: [{ email, name: `${firstName} ${lastName}` }],
        subject: 'Nous avons bien reçu votre message — Aircraft2Sell',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#05080f;padding:24px;text-align:center">
              <h1 style="font-family:Georgia,serif;color:#e8a020;letter-spacing:4px;margin:0">AIRCRAFT2SELL</h1>
            </div>
            <div style="padding:32px;background:#ffffff">
              <p style="font-size:16px">Bonjour ${firstName},</p>
              <p style="color:#555;line-height:1.7">Nous avons bien reçu votre message concernant <strong>${subjectLabels[subject] ?? subject}</strong>.</p>
              <p style="color:#555;line-height:1.7">Notre équipe vous répondra dans les <strong>24 heures ouvrées</strong> à cette adresse email.</p>
              <div style="background:#f5f5f5;border-left:3px solid #e8a020;padding:16px;margin:24px 0;font-size:14px;color:#555">
                <strong>Votre message :</strong><br><br>
                <span style="white-space:pre-wrap">${message}</span>
              </div>
              <p style="color:#999;font-size:13px">Si vous avez une question urgente, vous pouvez nous répondre directement à cet email.</p>
            </div>
            <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">
              © ${new Date().getFullYear()} Aircraft2Sell · <a href="https://aircraft2sell.eu/legal.html" style="color:#e8a020">Mentions légales</a>
            </div>
          </div>
        `,
      }),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('send-contact-email error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
