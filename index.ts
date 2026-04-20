// ============================================================
// supabase/functions/send-listing-message/index.ts
// Edge Function — Message acheteur → vendeur depuis listing.html
//
// Secrets Supabase requis :
//   BREVO_API_KEY   → clé API Brevo
//   ADMIN_EMAIL     → contact.aircraft2sell@gmail.com (BCC admin)
//
// DÉPLOIEMENT :
//   supabase functions deploy send-listing-message
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://aircraft2sell.eu',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { buyerName, buyerEmail, buyerPhone, message, listingId } = await req.json()

    // ── Validation ──────────────────────────────────────────
    if (!buyerName || !buyerEmail || !message || !listingId) {
      return new Response(JSON.stringify({ error: 'Champs manquants' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!buyerEmail.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (message.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Message trop court' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Récupérer l'annonce depuis Supabase ─────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('id, make, model, year, price, currency, seller_email, seller_name, seller_pseudo')
      .eq('id', listingId)
      .eq('status', 'live')
      .single()

    if (listingErr || !listing) {
      return new Response(JSON.stringify({ error: 'Annonce introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const BREVO_KEY  = Deno.env.get('BREVO_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'contact.aircraft2sell@gmail.com'
    if (!BREVO_KEY) throw new Error('BREVO_API_KEY non configurée')

    const sellerName   = listing.seller_pseudo || listing.seller_name || 'Vendeur'
    const sellerEmail  = listing.seller_email
    const listingTitle = [listing.make, listing.model, listing.year ? `(${listing.year})` : ''].filter(Boolean).join(' ')
    const listingUrl   = `https://aircraft2sell.eu/listing.html?id=${listing.id}`
    const telLine      = buyerPhone ? `<tr style="background:#f9f9f9"><td style="padding:8px;color:#666;width:140px">Téléphone</td><td style="padding:8px">${buyerPhone}</td></tr>` : ''

    // ── 1. Email au vendeur ──────────────────────────────────
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: 'noreply@aircraft2sell.eu' },
        to: [{ email: sellerEmail, name: sellerName }],
        replyTo: { email: buyerEmail, name: buyerName },
        subject: `✉ Nouveau message pour votre annonce — ${listingTitle}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
            <div style="background:#05080f;padding:24px 32px;border-bottom:3px solid #e8a020">
              <span style="font-size:20px;font-weight:700;color:#edf2f8;letter-spacing:4px">AIRCRAFT2<span style="color:#e8a020">SELL</span></span>
            </div>
            <div style="padding:32px">
              <h2 style="margin:0 0 6px;color:#111;font-size:20px">Vous avez reçu un message</h2>
              <p style="margin:0 0 24px;color:#888;font-size:14px">Pour votre annonce : <strong style="color:#e8a020">${listingTitle}</strong></p>
              <div style="background:#f9f9f9;border-left:4px solid #e8a020;padding:20px;margin-bottom:24px">
                <table style="width:100%;font-size:14px;border-collapse:collapse">
                  <tr><td style="padding:8px;color:#666;width:140px">De</td><td style="padding:8px;font-weight:600">${buyerName}</td></tr>
                  <tr style="background:#fff"><td style="padding:8px;color:#666">Email</td><td style="padding:8px"><a href="mailto:${buyerEmail}" style="color:#e8a020">${buyerEmail}</a></td></tr>
                  ${telLine}
                </table>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e0e0e0">
                  <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;font-weight:600">Message :</p>
                  <p style="margin:0;color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</p>
                </div>
              </div>
              <div style="text-align:center">
                <a href="${listingUrl}" style="background:#e8a020;color:#05080f;text-decoration:none;padding:12px 28px;font-weight:700;font-size:14px;display:inline-block">Voir l'annonce →</a>
              </div>
              <p style="margin-top:24px;color:#aaa;font-size:12px">Répondez directement à cet email pour contacter l'acheteur.</p>
            </div>
            <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#aaa">
              © ${new Date().getFullYear()} Aircraft2Sell · <a href="https://aircraft2sell.eu/legal.html" style="color:#e8a020">Mentions légales</a>
            </div>
          </div>
        `,
      }),
    })

    // ── 2. Confirmation à l'acheteur ─────────────────────────
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: 'noreply@aircraft2sell.eu' },
        to: [{ email: buyerEmail, name: buyerName }],
        subject: `Message envoyé — ${listingTitle}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
            <div style="background:#05080f;padding:24px 32px;border-bottom:3px solid #e8a020">
              <span style="font-size:20px;font-weight:700;color:#edf2f8;letter-spacing:4px">AIRCRAFT2<span style="color:#e8a020">SELL</span></span>
            </div>
            <div style="padding:32px">
              <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;text-align:center;margin-bottom:24px;border-radius:4px">
                <div style="font-size:28px">✅</div>
                <h2 style="color:#16a34a;margin:8px 0;font-size:18px">Message envoyé !</h2>
              </div>
              <p style="color:#444;line-height:1.7">Bonjour <strong>${buyerName}</strong>,</p>
              <p style="color:#555;line-height:1.7">Votre message pour l'annonce <strong>${listingTitle}</strong> a bien été transmis au vendeur. Il vous répondra directement par email.</p>
              <div style="background:#f9f9f9;padding:16px;margin:24px 0;border-left:3px solid #e0e0e0">
                <p style="margin:0 0 6px;color:#888;font-size:12px;font-weight:600;text-transform:uppercase">Votre message :</p>
                <p style="margin:0;color:#555;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</p>
              </div>
              <div style="text-align:center">
                <a href="${listingUrl}" style="background:#e8a020;color:#05080f;text-decoration:none;padding:12px 28px;font-weight:700;font-size:14px;display:inline-block">Voir l'annonce →</a>
              </div>
            </div>
            <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#aaa">
              © ${new Date().getFullYear()} Aircraft2Sell · <a href="https://aircraft2sell.eu/legal.html" style="color:#e8a020">Mentions légales</a>
            </div>
          </div>
        `,
      }),
    })

    // ── 3. Incrémenter enquiries dans Supabase ───────────────
    await supabase
      .from('listings')
      .update({ enquiries: (listing as any).enquiries + 1 })
      .eq('id', listingId)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('send-listing-message error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
