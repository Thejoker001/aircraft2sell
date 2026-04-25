export async function onRequestGet(context) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.aircraft2sell.eu/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/search.html</loc><changefreq>daily</changefreq><priority>0.95</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/avions-legers.html</loc><changefreq>daily</changefreq><priority>0.90</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/jets-affaires.html</loc><changefreq>daily</changefreq><priority>0.90</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/helicopteres.html</loc><changefreq>daily</changefreq><priority>0.88</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/turboprops.html</loc><changefreq>daily</changefreq><priority>0.85</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/ulm.html</loc><changefreq>daily</changefreq><priority>0.82</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/post-listing.html</loc><changefreq>weekly</changefreq><priority>0.88</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/vendeur.html</loc><changefreq>monthly</changefreq><priority>0.82</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/pricing.html</loc><changefreq>weekly</changefreq><priority>0.80</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/guide-acheteur.html</loc><changefreq>monthly</changefreq><priority>0.82</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/comparateur.html</loc><changefreq>weekly</changefreq><priority>0.78</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/map.html</loc><changefreq>daily</changefreq><priority>0.80</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/blog.html</loc><changefreq>weekly</changefreq><priority>0.80</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/blog/comment-financer-avion-leger.html</loc><changefreq>monthly</changefreq><priority>0.75</priority><lastmod>2026-04-01</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/blog/inspection-pre-achat-avion.html</loc><changefreq>monthly</changefreq><priority>0.75</priority><lastmod>2026-04-10</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/blog/vendre-avion-particulier-europe.html</loc><changefreq>monthly</changefreq><priority>0.75</priority><lastmod>2026-04-18</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/faq.html</loc><changefreq>monthly</changefreq><priority>0.72</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/contact.html</loc><changefreq>monthly</changefreq><priority>0.60</priority><lastmod>2026-04-25</lastmod></url>
  <url><loc>https://www.aircraft2sell.eu/legal.html</loc><changefreq>yearly</changefreq><priority>0.30</priority><lastmod>2026-04-25</lastmod></url>
</urlset>`;
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}
