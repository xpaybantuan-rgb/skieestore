const SUPABASE_URL = "https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
const SITE = "https://skieestore.biz.id";
const slugify = (v) => String(v || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const xml = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function onRequestGet() {
  try {
    const response = await fetch(SUPABASE_URL + "/rest/v1/xpaypoint_games?select=slug,name&is_active=eq.true&order=sort_order.asc,name.asc", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!response.ok) throw new Error("Catalog query failed");
    const games = await response.json();
    const urls = games.map(g => SITE + "/game/" + encodeURIComponent(g.slug || slugify(g.name)));
    const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(u => '<url><loc>' + xml(u) + '</loc></url>').join("\n") + '\n</urlset>';
    return new Response(body, { headers: { "content-type":"application/xml; charset=utf-8", "cache-control":"public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) {
    return new Response("Sitemap game sementara tidak tersedia", { status:503, headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"} });
  }
}
