import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";

async function sbGet(table: string, params: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return r.ok ? r.json() : [];
}

async function sendEmail(to: string, subject: string, html: string) {
  return fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Aircraft2Sell", email: "contact@aircraft2sell.eu" },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });
}

serve(async () => {
  // Récupérer les annonces des dernières 24h
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const listings = await sbGet("listings", `status=eq.live&submitted_at=gte.${since}&select=id,make,model,year,price,currency,category,airport,country`);
  
  if (!listings.length) {
    return new Response(JSON.stringify({ matched: 0 }), { status: 200 });
  }

  // Récupérer les alertes actives
  const alerts = await sbGet("search_alerts", "active=eq.true&select=*");
  
  let matched = 0;
  const sym: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "Fr" };

  for (const alert of alerts) {
    const matchingListings = listings.filter((l: any) => {
      if (alert.cat && l.category !== alert.cat) return false;
      if (alert.make && !`${l.make} ${l.model}`.toLowerCase().includes(alert.make.toLowerCase())) return false;
      if (alert.max_price && l.price > parseFloat(alert.max_price)) return false;
      if (alert.country && l.country && !l.country.toLowerCase().includes(alert.country.toLowerCase())) return false;
      return true;
    });

    if (!matchingListings.length) continue;

    const listingsHtml = matchingListings.slice(0, 5).map((l: any) => {
      const title = [l.make, l.model, l.year ? `(${l.year})` : ""].filter(Boolean).join(" ");
      const price = l.price ? `${sym[l.currency] || "€"}${Number(l.price).toLocaleString("fr-FR")}` : "Prix sur demande";
      return `
        <div style="background:#0f1830;border:1px solid rgba(180,200,230,.1);padding:1rem;margin-bottom:.75rem">
          <div style="font-size:1rem;font-weight:600;color:#edf2f8;margin-bottom:.3rem">${title}</div>
          <div style="font-size:.88rem;color:#e8a020;margin-bottom:.3rem">${price}</div>
          <div style="font-size:.78rem;color:#7a93aa">${l.airport || l.country || ""}</div>
          <a href="https://www.aircraft2sell.eu/listing.html?id=${l.id}" 
             style="display:inline-block;margin-top:.65rem;background:#e8a020;color:#030610;text-decoration:none;padding:.4rem 1rem;font-weight:700;font-size:.82rem">
            Voir l'annonce →
          </a>
        </div>`;
    }).join("");

    const html = `
      <div style="background:#05080f;font-family:'DM Sans',Arial,sans-serif;padding:2rem;max-width:600px;margin:0 auto">
        <div style="font-family:Georgia,serif;font-size:1.5rem;letter-spacing:.08em;text-transform:uppercase;color:#edf2f8;margin-bottom:.25rem">
          Aircraft2<span style="color:#e8a020">Sell</span>
        </div>
        <p style="font-size:.78rem;color:#3d5468;margin-bottom:2rem">La marketplace aéronautique européenne</p>
        
        <h2 style="font-size:1.1rem;color:#edf2f8;margin-bottom:.5rem">
          🔔 ${matchingListings.length} nouvelle${matchingListings.length > 1 ? "s" : ""} annonce${matchingListings.length > 1 ? "s" : ""} correspond${matchingListings.length > 1 ? "ent" : ""} à votre alerte
        </h2>
        <p style="font-size:.82rem;color:#7a93aa;margin-bottom:1.5rem">Alerte : <strong style="color:#edf2f8">${alert.name || "Ma recherche"}</strong></p>
        
        ${listingsHtml}
        
        <div style="border-top:1px solid rgba(180,200,230,.08);margin-top:2rem;padding-top:1.5rem;font-size:.72rem;color:#3d5468">
          Vous recevez cet email car vous avez créé une alerte sur Aircraft2Sell.<br>
          <a href="https://www.aircraft2sell.eu/alerts.html" style="color:#7a93aa">Gérer mes alertes</a>
        </div>
      </div>`;

    await sendEmail(alert.email, `🔔 ${matchingListings.length} nouvelle(s) annonce(s) — ${alert.name || "Votre alerte Aircraft2Sell"}`, html);
    matched++;
  }

  return new Response(JSON.stringify({ matched, listings: listings.length }), { status: 200 });
});
