import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM = "contact@aircraft2sell.eu";

serve(async () => {
  // Annonces live depuis plus de 30 jours sans aucun contact (enquiries = 0)
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const r = await fetch(`${SB_URL}/rest/v1/listings?status=eq.live&enquiries=eq.0&submitted_at=lte.${since30}&select=id,make,model,year,price,currency,seller_email,seller_name,views,submitted_at&limit=50`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  });
  const listings = r.ok ? await r.json() : [];
  
  let sent = 0;
  for (const l of listings) {
    if (!l.seller_email) continue;
    const title = [l.make, l.model, l.year ? `(${l.year})` : ""].filter(Boolean).join(" ") || "Votre annonce";
    const days = Math.floor((Date.now() - new Date(l.submitted_at).getTime()) / 86400000);
    const price = l.price ? `${l.currency || "EUR"} ${Number(l.price).toLocaleString("fr-FR")}` : "";
    
    const html = `
      <div style="background:#05080f;font-family:'DM Sans',Arial,sans-serif;padding:2rem;max-width:600px;margin:0 auto;color:#edf2f8">
        <div style="font-family:Georgia,serif;font-size:1.5rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2rem">
          Aircraft2<span style="color:#e8a020">Sell</span>
        </div>
        <h2 style="font-size:1.1rem;color:#edf2f8;margin-bottom:.5rem">
          Votre annonce n'a pas encore reçu de contact
        </h2>
        <p style="font-size:.82rem;color:#7a93aa;line-height:1.75;margin-bottom:1.5rem">
          <strong style="color:#edf2f8">${title}</strong> est en ligne depuis ${days} jours et a reçu <strong style="color:#e8a020">${l.views || 0} vues</strong> mais aucun contact. Voici quelques conseils pour améliorer votre annonce.
        </p>
        <div style="background:#0c1428;border:1px solid rgba(180,200,230,.1);padding:1.25rem;margin-bottom:1.5rem">
          <div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#e8a020;margin-bottom:.75rem">💡 Conseils pour attirer plus d'acheteurs</div>
          <ul style="font-size:.8rem;color:#7a93aa;line-height:2;margin-left:1.25rem">
            <li>Ajoutez plus de photos (intérieur, cockpit, logbook)</li>
            <li>Complétez la description avec l'historique d'entretien</li>
            <li>Vérifiez que votre prix est compétitif</li>
            <li>Renseignez les heures moteur et le TTAF</li>
          </ul>
        </div>
        <div style="text-align:center">
          <a href="https://www.aircraft2sell.eu/dashboard.html"
             style="display:inline-block;background:#e8a020;color:#030610;text-decoration:none;padding:.85rem 2rem;font-family:Georgia,serif;font-size:.9rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700">
            Modifier mon annonce →
          </a>
        </div>
        <div style="border-top:1px solid rgba(180,200,230,.08);margin-top:2rem;padding-top:1.25rem;font-size:.65rem;color:#3d5468;text-align:center">
          Aircraft2Sell · <a href="mailto:${FROM}" style="color:#7a93aa">${FROM}</a>
        </div>
      </div>`;

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Aircraft2Sell", email: FROM },
        to: [{ email: l.seller_email, name: l.seller_name || l.seller_email }],
        subject: `💡 Conseils pour booster votre annonce — ${title}`,
        htmlContent: html
      })
    });
    sent++;
  }

  return new Response(JSON.stringify({ sent, total: listings.length }), {
    headers: { "Content-Type": "application/json" }
  });
});