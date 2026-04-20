// ============================================================
// supabase/functions/notify-new-listing/index.ts
// Edge Function — Notifie l'admin d'une nouvelle annonce à valider
//
// Secrets Supabase requis :
//   BREVO_API_KEY   → clé API Brevo
//   ADMIN_EMAIL     → contact.aircraft2sell@gmail.com
//
// DÉPLOIEMENT :
//   supabase functions deploy notify-new-listing
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
    const { listingId } = await req.json()
    if (!listingId) {
      return new Response(JSON.stringify({ error: 'listingId manquant' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── Récupérer l'annonce ──────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (error || !listing) {
      return new Response(JSON.stringify({ error: 'Annonce introuvable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const BREVO_KEY   = Deno.env.get('BREVO_API_KEY')
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'contact.aircraft2sell@gmail.com'
    if (!BREVO_KEY) throw new Error('BREVO_API_KEY non configurée')

    const title   = [listing.make, listing.model, listing.year ? `(${listing.year})` : ''].filter(Boolean).join(' ') || 'Sans titre'
    const sym     = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr' }[listing.currency ?? 'EUR'] ?? '€'
    const price   = listing.price ? `${sym}${Number(listing.price).toLocaleString('fr-FR')}` : '—'
    const adminUrl = `https://aircraft2sell.eu/admin-a2s00760.html`

    const row = (label: string, value: string) =>
      `<tr><td style="padding:7px 10px;color:#7a93aa;width:140px;font-size:13px">${label}</td><td style="padding:7px 10px;color:#edf2f8;font-size:13px">${value}</td></tr>`

    // ── 1. Email admin ───────────────────────────────────────
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: 'noreply@aircraft2sell.eu' },
        to: [{ email: ADMIN_EMAIL, name: 'Admin A2S' }],
        subject: `🛩 Nouvelle annonce à valider — ${title}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#05080f;color:#edf2f8">
            <div style="padding:24px 32px;border-bottom:3px solid #e8a020">
              <span style="font-size:20px;font-weight:700;letter-spacing:4px">AIRCRAFT2<span style="color:#e8a020">SELL</span></span>
            </div>
            <div style="padding:28px 32px">
              <h2 style="margin:0 0 6px;font-size:18px;color:#edf2f8">🛩 Nouvelle annonce à valider</h2>
              <p style="margin:0 0 20px;color:#7a93aa;font-size:13px">${new Date().toLocaleString('fr-FR')}</p>
              <table style="width:100%;border-collapse:collapse;background:#0c1428;margin-bottom:20px">
                ${row('Aéronef', `<strong style="color:#e8a020">${title}</strong>`)}
                ${row('Catégorie', listing.category ?? '—')}
                ${row('Année', listing.year ?? '—')}
                ${row('Prix', price)}
                ${row('Aéroport', listing.airport ?? '—')}
                ${row('Pays', listing.country ?? '—')}
                ${row('Vendeur', listing.seller_name ?? '—')}
                ${row('Email', `<a href="mailto:${listing.seller_email}" style="color:#e8a020">${listing.seller_email}</a>`)}
                ${row('Heures TT', listing.hours ? listing.hours + 'h' : '—')}
                ${row('Description', listing.description ? listing.description.substring(0, 120) + '…' : '—')}
              </table>
              <div style="text-align:center;padding:20px 0">
                <a href="${adminUrl}" style="background:#e8a020;color:#030610;text-decoration:none;padding:13px 32px;font-weight:700;font-size:15px;display:inline-block;letter-spacing:1px">VALIDER L'ANNONCE →</a>
              </div>
            </div>
            <div style="padding:14px 32px;border-top:1px solid rgba(180,200,230,.08);background:#030610">
              <p style="margin:0;color:#3d5468;font-size:11px">© ${new Date().getFullYear()} Aircraft2Sell — notification automatique</p>
            </div>
          </div>
        `,
      }),
    })

    // ── 2. Email de confirmation au vendeur ──────────────────
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: 'noreply@aircraft2sell.eu' },
        to: [{ email: listing.seller_email, name: listing.seller_name ?? listing.seller_email }],
        subject: `✅ Annonce reçue — ${title}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
            <div style="background:#05080f;padding:24px 32px;border-bottom:3px solid #e8a020">
              <span style="font-size:20px;font-weight:700;color:#edf2f8;letter-spacing:4px">AIRCRAFT2<span style="color:#e8a020">SELL</span></span>
            </div>
            <div style="padding:32px">
              <div style="background:#f0fdf4;border:1px solid #86efac;padding:16px;text-align:center;margin-bottom:24px">
                <div style="font-size:28px">✅</div>
                <h2 style="color:#16a34a;margin:8px 0;font-size:18px">Annonce bien reçue !</h2>
              </div>
              <p style="color:#444;line-height:1.7">Bonjour <strong>${listing.seller_name ?? ''}</strong>,</p>
              <p style="color:#555;line-height:1.7">Votre annonce <strong>${title}</strong> a bien été reçue et est en cours de vérification par notre équipe.</p>
              <div style="background:#f9f9f9;border-left:3px solid #e8a020;padding:16px;margin:24px 0">
                <p style="margin:0 0 8px;color:#888;font-size:12px;font-weight:600;text-transform:uppercase">Récapitulatif :</p>
                <table style="font-size:13px;width:100%">
                  <tr><td style="color:#888;padding:3px 0;width:100px">Aéronef</td><td style="color:#333;font-weight:600">${title}</td></tr>
                  <tr><td style="color:#888;padding:3px 0">Prix</td><td style="color:#e8a020;font-weight:600">${price}</td></tr>
                  <tr><td style="color:#888;padding:3px 0">Statut</td><td style="color:#f97316;font-weight:600">En attente de validation</td></tr>
                </table>
              </div>
              <p style="color:#555;font-size:14px;line-height:1.7">Notre équipe valide les annonces sous <strong>24 à 48 heures</strong>. Vous recevrez un email dès que votre annonce sera en ligne.</p>
              <div style="text-align:center;margin:28px 0">
                <a href="https://aircraft2sell.eu/dashboard.html" style="background:#e8a020;color:#05080f;text-decoration:none;padding:12px 28px;font-weight:700;font-size:14px;display:inline-block">Mon tableau de bord →</a>
              </div>
            </div>
            <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#aaa">
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
    console.error('notify-new-listing error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
