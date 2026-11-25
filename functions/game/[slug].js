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
  const title = "Top Up " + name + " Murah & Cepat | SKIEESTORE";
  const description = "Top up " + name + " di SKIEESTORE. Cek pilihan nominal dan harga terbaru, lalu lanjutkan pemesanan dengan praktis dan aman.";
  const canonical = SITE + "/game/" + encodeURIComponent(game.slug || slugify(name));
  const image = game.banner_url || game.image_url || SITE + "/assets/skieestore-logo-asli.png";
  const items = products.slice(0, 24).map(p => '<li><span>' + esc(p.name) + '</span><strong>' + money(p.sell_price) + '</strong></li>').join("");
  const productText = products.length
    ? '<section><h2>Pilihan nominal dan harga</h2><ul class="products">' + items + '</ul><p class="muted">Harga dapat berubah mengikuti pembaruan katalog. Pastikan nominal dan detail pesanan sebelum melanjutkan.</p></section>'
    : '<section><h2>Pilihan nominal</h2><p>Daftar produk untuk game ini sedang diperbarui. Buka katalog SKIEESTORE untuk melihat ketersediaan terbaru.</p></section>';
  const schema = {
    "@context":"https://schema.org",
    "@type":"Product",
    "name":"Top Up " + name + " - SKIEESTORE",
    "description":description,
    "brand":{"@type":"Brand","name":name},
    "image":image,
    "url":canonical,
    "offers": products.length ? {
      "@type":"AggregateOffer",
      "priceCurrency":"IDR",
      "lowPrice":String(Math.min(...products.map(p=>Number(p.sell_price)||0).filter(n=>n>0))),
      "highPrice":String(Math.max(...products.map(p=>Number(p.sell_price)||0))),
      "offerCount":String(products.length),
      "availability":"https://schema.org/InStock"
    } : undefined
  };
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '"><link rel="canonical" href="' + esc(canonical) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="SKIEESTORE"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '"><meta property="og:url" content="' + esc(canonical) + '"><meta property="og:image" content="' + esc(image) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(description) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,"\\u003c") + '</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#151923;font:500 15px Manrope,Arial,sans-serif}.wrap{width:min(900px,calc(100% - 32px));margin:auto}.top{border-bottom:1px solid #e5e7eb;padding:17px 0}.brand{font:700 21px "Space Grotesk";color:#087BFF;text-decoration:none}.hero{margin:32px 0 18px;padding:26px;border:1px solid #cdeeff;border-radius:20px;background:linear-gradient(120deg,#fff,#f2fbff);display:flex;gap:20px;align-items:center}.hero img{width:104px;height:104px;object-fit:cover;border-radius:18px;background:#eef7ff}.eyebrow{font-size:11px;color:#087BFF;font-weight:800;letter-spacing:.13em}h1{font:700 clamp(27px,5vw,40px) "Space Grotesk";margin:8px 0}p{line-height:1.8;color:#4b5563;font-size:14px}section{padding:22px;margin:16px 0;border:1px solid #e5e7eb;border-radius:17px}h2{font:700 21px "Space Grotesk";margin:0 0 14px}.products{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.products li{padding:13px;border:1px solid #e5e7eb;border-radius:11px;display:flex;justify-content:space-between;gap:10px;font-size:12px}.products strong{color:#087BFF;white-space:nowrap}.muted{font-size:11px}.cta{display:inline-block;background:#087BFF;color:white;text-decoration:none;padding:14px 19px;border-radius:11px;font-weight:800;font-size:13px;margin-top:10px}.foot{padding:26px 0 45px;color:#667085;font-size:11px}@media(max-width:560px){.hero{padding:18px;gap:13px}.hero img{width:76px;height:76px}.products{grid-template-columns:1fr}section{padding:17px}}</style></head><body><header class="top"><div class="wrap"><a class="brand" href="/">SKIEESTORE</a></div></header><main class="wrap"><div class="hero">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(name) + '">' : '') + '<div><div class="eyebrow">KATALOG TOP UP GAME</div><h1>Top Up ' + esc(name) + '</h1><p>Temukan pilihan nominal dan harga top up ' + esc(name) + ' di SKIEESTORE.</p></div></div><section><h2>Top up ' + esc(name) + ' di SKIEESTORE</h2><p>SKIEESTORE menyediakan katalog top up ' + esc(name) + ' dengan pilihan produk yang ditampilkan berdasarkan ketersediaan katalog. Pilih nominal yang sesuai, masukkan data tujuan dengan teliti, dan periksa kembali detail pesanan sebelum checkout.</p><p>Jangan pernah memberikan password akun atau kode OTP kepada siapa pun untuk proses top up.</p><a class="cta" href="/topup?game=' + encodeURIComponent(game.id) + '">Pilih nominal & lanjut top up</a></section>' + productText + '<section><h2>Cara top up ' + esc(name) + '</h2><ol><li>Buka katalog top up SKIEESTORE.</li><li>Pilih nominal atau produk ' + esc(name) + ' yang tersedia.</li><li>Masukkan ID atau data tujuan sesuai petunjuk produk.</li><li>Periksa kembali detail pesanan sebelum melanjutkan.</li></ol><a class="cta" href="/topup?game=' + encodeURIComponent(game.id) + '">Buka halaman pemesanan</a></section></main><footer class="wrap foot">© ' + new Date().getFullYear() + ' SKIEESTORE · Top up game online</footer></body></html>';
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
    const html = page(game, products);
    return new Response(html, { headers: { "content-type":"text/html; charset=utf-8", "cache-control":"public, max-age=0, s-maxage=120, stale-while-revalidate=300", "x-content-type-options":"nosniff" } });
  } catch (error) {
    return new Response("Halaman game sedang tidak tersedia. Silakan buka katalog SKIEESTORE.", { status:503, headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"} });
  }
}
