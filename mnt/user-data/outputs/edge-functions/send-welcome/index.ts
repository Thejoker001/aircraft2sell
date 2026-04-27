import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM = "contact@aircraft2sell.eu";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { email, name } = await req.json();
  if (!email) return new Response("Missing email", { status: 400 });

  const html = `
    <div style="background:#05080f;font-family:'DM Sans',Arial,sans-serif;padding:2rem;max-width:600px;margin:0 auto;color:#edf2f8">
      <div style="font-family:Georgia,serif;font-size:1.5rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.25rem">
        Aircraft2<span style="color:#e8a020">Sell</span>
      </div>
      <p style="font-size:.75rem;color:#3d5468;margin-bottom:2rem;letter-spacing:.1em;text-transform:uppercase">Bienvenue sur la marketplace aéronautique européenne</p>
      
      <h2 style="font-family:Georgia,serif;font-size:1.3rem;color:#edf2f8;margin-bottom:.75rem">
        Bienvenue${name ? ', ' + name : ''} ! ✈
      </h2>
      <p style="font-size:.85rem;color:#7a93aa;line-height:1.8;margin-bottom:1.5rem">
        Votre compte Aircraft2Sell est créé. Vous pouvez maintenant publier vos annonces d'aéronefs et contacter des vendeurs vérifiés dans toute l'Europe.
      </p>
      
      <div style="display:grid;gap:.75rem;margin-bottom:2rem">
        <div style="background:#0c1428;border:1px solid rgba(180,200,230,.1);padding:1rem;display:flex;align-items:center;gap:1rem">
          <span style="font-size:1.5rem">🛩</span>
          <div>
            <div style="font-size:.82rem;font-weight:600;color:#edf2f8;margin-bottom:.2rem">Publiez votre première annonce</div>
            <div style="font-size:.75rem;color:#7a93aa">En ligne en 10 minutes, validée sous 24h</div>
          </div>
        </div>
        <div style="background:#0c1428;border:1px solid rgba(180,200,230,.1);padding:1rem;display:flex;align-items:center;gap:1rem">
          <span style="font-size:1.5rem">🔍</span>
          <div>
            <div style="font-size:.82rem;font-weight:600;color:#edf2f8;margin-bottom:.2rem">Créez une alerte de recherche</div>
            <div style="font-size:.75rem;color:#7a93aa">Recevez un email dès qu'une annonce correspond</div>
          </div>
        </div>
        <div style="background:#0c1428;border:1px solid rgba(180,200,230,.1);padding:1rem;display:flex;align-items:center;gap:1rem">
          <span style="font-size:1.5rem">✓</span>
          <div>
            <div style="font-size:.82rem;font-weight:600;color:#edf2f8;margin-bottom:.2rem">Faites vérifier votre identité</div>
            <div style="font-size:.75rem;color:#7a93aa">Obtenez le badge Certifié pour plus de confiance</div>
          </div>
        </div>
      </div>
      
      <div style="text-align:center;margin-bottom:2rem">
        <a href="https://www.aircraft2sell.eu/post-listing.html"
           style="display:inline-block;background:#e8a020;color:#030610;text-decoration:none;padding:.85rem 2rem;font-family:Georgia,serif;font-size:.95rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;margin-right:.5rem">
          Publier une annonce
        </a>
        <a href="https://www.aircraft2sell.eu/search.html"
           style="display:inline-block;background:transparent;border:1px solid rgba(232,160,32,.4);color:#e8a020;text-decoration:none;padding:.85rem 2rem;font-family:Georgia,serif;font-size:.95rem;letter-spacing:.08em;text-transform:uppercase">
          Parcourir les annonces
        </a>
      </div>
      
      <div style="border-top:1px solid rgba(180,200,230,.08);padding-top:1.5rem;font-size:.68rem;color:#3d5468;text-align:center">
        Aircraft2Sell — La marketplace aéronautique européenne<br>
        Des questions ? <a href="mailto:${FROM}" style="color:#7a93aa">${FROM}</a>
      </div>
    </div>`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Aircraft2Sell", email: FROM },
      to: [{ email, name: name || email }],
      subject: "✈ Bienvenue sur Aircraft2Sell — La marketplace aéronautique européenne",
      htmlContent: html
    })
  });

  return new Response(JSON.stringify({ ok: true }), { 
    headers: { "Content-Type": "application/json" } 
  });
});