import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const ADMIN_EMAIL = "contact@aircraft2sell.eu";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  const listing = await req.json();
  const title = [listing.make, listing.model, listing.year ? `(${listing.year})` : ""].filter(Boolean).join(" ") || "Aéronef";
  const price = listing.price ? `${listing.currency || "EUR"} ${Number(listing.price).toLocaleString("fr-FR")}` : "Prix non renseigné";
  
  const html = `
    <div style="background:#05080f;font-family:'DM Sans',Arial,sans-serif;padding:2rem;max-width:600px;margin:0 auto;color:#edf2f8">
      <div style="font-family:Georgia,serif;font-size:1.5rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.25rem">
        Aircraft2<span style="color:#e8a020">Sell</span>
      </div>
      <p style="font-size:.75rem;color:#3d5468;margin-bottom:2rem;letter-spacing:.1em;text-transform:uppercase">Nouvelle annonce en attente</p>
      
      <div style="background:#0c1428;border:1px solid rgba(180,200,230,.1);padding:1.5rem;margin-bottom:1.5rem">
        <div style="font-size:.6rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#e8a020;margin-bottom:.5rem">
          ✈ NOUVELLE ANNONCE — EN ATTENTE DE MODÉRATION
        </div>
        <div style="font-family:Georgia,serif;font-size:1.4rem;color:#edf2f8;margin-bottom:.75rem">${title}</div>
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <tr><td style="padding:.4rem 0;color:#7a93aa;width:40%">Vendeur</td><td style="color:#edf2f8">${listing.seller_name || "—"}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Email</td><td style="color:#edf2f8">${listing.seller_email || "—"}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Catégorie</td><td style="color:#edf2f8">${listing.category || "—"}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Prix</td><td style="color:#e8a020;font-weight:600">${price}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Aéroport</td><td style="color:#edf2f8">${listing.airport || "—"}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Heures</td><td style="color:#edf2f8">${listing.hours ? Number(listing.hours).toLocaleString("fr-FR") + " h" : "—"}</td></tr>
          <tr><td style="padding:.4rem 0;color:#7a93aa">Pays</td><td style="color:#edf2f8">${listing.country || "—"}</td></tr>
        </table>
        ${listing.description ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(180,200,230,.08);font-size:.78rem;color:#7a93aa;line-height:1.7">${listing.description.slice(0, 300)}${listing.description.length > 300 ? "…" : ""}</div>` : ""}
      </div>
      
      <div style="text-align:center;margin-bottom:1.5rem">
        <a href="https://www.aircraft2sell.eu/admin-a2s00760.html" 
           style="display:inline-block;background:#e8a020;color:#030610;text-decoration:none;padding:.85rem 2rem;font-family:Georgia,serif;font-size:.95rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700">
          Modérer cette annonce →
        </a>
      </div>
      
      <p style="font-size:.65rem;color:#3d5468;text-align:center">
        Aircraft2Sell — Marketplace aéronautique européenne<br>
        <a href="mailto:${ADMIN_EMAIL}" style="color:#7a93aa">${ADMIN_EMAIL}</a>
      </p>
    </div>`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Aircraft2Sell", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: "Admin Aircraft2Sell" }],
      subject: `🛩 Nouvelle annonce en attente — ${title}`,
      htmlContent: html
    })
  });

  return new Response(JSON.stringify({ ok: true }), { 
    headers: { "Content-Type": "application/json" } 
  });
});