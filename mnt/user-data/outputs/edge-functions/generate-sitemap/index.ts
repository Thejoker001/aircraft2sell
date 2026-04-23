import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE = "https://www.aircraft2sell.eu";

const STATIC_PAGES = [
  { url: "/", priority: "1.0", freq: "daily" },
  { url: "/search.html", priority: "0.95", freq: "hourly" },
  { url: "/post-listing.html", priority: "0.9", freq: "weekly" },
  { url: "/avions-legers.html", priority: "0.85", freq: "daily" },
  { url: "/jets-affaires.html", priority: "0.85", freq: "daily" },
  { url: "/helicopteres.html", priority: "0.85", freq: "daily" },
  { url: "/turboprops.html", priority: "0.80", freq: "daily" },
  { url: "/ulm.html", priority: "0.80", freq: "daily" },
  { url: "/map.html", priority: "0.80", freq: "weekly" },
  { url: "/pricing.html", priority: "0.8", freq: "weekly" },
  { url: "/guide-acheteur.html", priority: "0.8", freq: "monthly" },
  { url: "/vendeur.html", priority: "0.8", freq: "monthly" },
  { url: "/comparateur.html", priority: "0.75", freq: "weekly" },
  { url: "/blog.html", priority: "0.75", freq: "weekly" },
  { url: "/blog/comment-financer-avion-leger.html", priority: "0.7", freq: "monthly" },
  { url: "/blog/inspection-pre-achat-avion.html", priority: "0.7", freq: "monthly" },
  { url: "/blog/vendre-avion-particulier-europe.html", priority: "0.7", freq: "monthly" },
  { url: "/faq.html", priority: "0.7", freq: "monthly" },
  { url: "/contact.html", priority: "0.6", freq: "monthly" },
  { url: "/legal.html", priority: "0.3", freq: "yearly" },
];

serve(async () => {
  const today = new Date().toISOString().slice(0, 10);
  
  // Récupérer les annonces live
  const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?status=eq.live&select=id,submitted_at&order=submitted_at.desc&limit=500`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const listings = r.ok ? await r.json() : [];
  
  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join("");
  
  const listingUrls = listings.map((l: any) => `
  <url>
    <loc>${BASE}/listing.html?id=${l.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${(l.submitted_at || today).slice(0, 10)}</lastmod>
  </url>`).join("");
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${listingUrls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" }
  });
});