const SUPABASE_URL = "https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
const SITE = "https://skieestore.biz.id";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const money = (v) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(Number(v || 0));
const slugify = (v) => String(v || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function db(path) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
    cf: { cacheTtl: 120, cacheEverything: true }
  });
  if (!response.ok) throw new Error("Supabase request failed: " + response.status);
  return response.json();
}

function page(game, products) {
  const name = game.name || "Game";
  const title = "Top Up " + name + " | SKIEESTORE";
  const description = "Pilih produk " + name + " dan lihat harga terbaru di SKIEESTORE.";
  const canonical = SITE + "/game/" + encodeURIComponent(game.slug || slugify(name));
  const image = game.banner_url || game.image_url || SITE + "/assets/skieestore-logo-asli.png";
  const items = products.slice(0, 60).map(p =>
    '<li><span>' + esc(p.name) + '</span><strong>' + money(p.sell_price) + '</strong></li>'
  ).join("");
  const schema = {
    "@context":"https://schema.org",
    "@type":"CollectionPage",
    "name":title,
    "description":description,
    "url":canonical,
    "isPartOf":{"@type":"WebSite","name":"SKIEESTORE","url":SITE},
    "mainEntity":{"@type":"ItemList","numberOfItems":products.length,"itemListElement":products.slice(0,60).map((p,i)=>({
      "@type":"ListItem","position":i+1,"item":{"@type":"Product","name":p.name,"offers":{
        "@type":"Offer","priceCurrency":"IDR","price":String(Number(p.sell_price)||0),
        "availability":"https://schema.org/InStock","url":canonical
      }}
    }))}
  };
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '"><link rel="canonical" href="' + esc(canonical) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="SKIEESTORE"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '"><meta property="og:url" content="' + esc(canonical) + '"><meta property="og:image" content="' + esc(image) + '"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,"\\u003c") + '</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#f7f9fc;color:#151923;font:500 15px Manrope,Arial,sans-serif}.wrap{width:min(760px,calc(100% - 28px));margin:auto}.top{background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 0}.brand{font:700 21px "Space Grotesk";color:#087BFF;text-decoration:none}.hero{margin:22px 0 14px;padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;display:flex;gap:14px;align-items:center}.hero img{width:66px;height:66px;object-fit:cover;border-radius:13px}.hero h1{font:700 clamp(22px,5vw,30px) "Space Grotesk";margin:0}.count{font-size:12px;color:#667085;margin-top:5px}.panel{padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:16px}.panel h2{font:700 19px "Space Grotesk";margin:0 0 13px}.products{list-style:none;margin:0;padding:0;display:grid;gap:9px}.products li{padding:14px;border:1px solid #e5e7eb;border-radius:11px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px}.products strong{color:#087BFF;white-space:nowrap}.empty{color:#667085;font-size:13px}.cta{display:block;text-align:center;background:#087BFF;color:#fff;text-decoration:none;padding:15px 18px;border-radius:11px;font-weight:800;font-size:14px;margin-top:14px}.foot{padding:22px 0 35px;color:#98a2b3;font-size:11px;text-align:center}@media(max-width:480px){.hero{padding:14px}.hero img{width:56px;height:56px}.panel{padding:14px}.products li{font-size:12px}}</style></head><body><header class="top"><div class="wrap"><a class="brand" href="/">SKIEESTORE</a></div></header><main class="wrap"><div class="hero">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(name) + '">' : '') + '<div><h1>' + esc(name) + '</h1><div class="count">' + products.length + ' produk tersedia</div></div></div><section class="panel"><h2>Pilih produk</h2>' + (items ? '<ul class="products">' + items + '</ul>' : '<p class="empty">Produk sedang tidak tersedia.</p>') + '<a class="cta" href="/topup?game=' + encodeURIComponent(game.id) + '">Lanjut top up</a></section></main><footer class="wrap foot">© ' + new Date().getFullYear() + ' SKIEESTORE</footer></body></html>';
}

export async function onRequestGet({ request, params }) {
  const raw = String(params.slug || "").replace(/\/$/, "");
  if (!raw || raw.length > 120) return new Response("Not found", { status:404 });
  try {
    let games = await db("xpaypoint_games?select=id,slug,name,category,image_url,banner_url&is_active=eq.true&slug=eq." + encodeURIComponent(raw) + "&limit=1");
    if (!games.length) games = await db("xpaypoint_games?select=id,slug,name,category,image_url,banner_url&is_active=eq.true&id=eq." + encodeURIComponent(raw) + "&limit=1");
    if (!games.length) return new Response("Game tidak ditemukan", { status:404, headers:{"content-type":"text/plain; charset=utf-8"} });
    const game = games[0];
    const products = await db("xpaypoint_products?select=id,game_id,name,sell_price,region&is_active=eq.true&game_id=eq." + encodeURIComponent(game.id) + "&order=sort_order.asc&limit=60").catch(() => []);
    return new Response(page(game, products), { headers:{
      "content-type":"text/html; charset=utf-8",
      "cache-control":"public, max-age=0, s-maxage=120, stale-while-revalidate=300",
      "x-content-type-options":"nosniff"
    }});
  } catch (error) {
    return new Response("Halaman sedang tidak tersedia. Silakan buka katalog SKIEESTORE.", { status:503, headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"} });
  }
}
