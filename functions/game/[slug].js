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
  const category = String(game.category || "Game").trim();
  const categoryLabel = /voucher/i.test(category) ? "voucher digital" : /game/i.test(category) ? "top up game" : category.toLowerCase();
  const description = "Lihat pilihan " + categoryLabel + " " + name + " di SKIEESTORE. Bandingkan nominal, wilayah produk, dan harga katalog sebelum memesan.";
  const productCount = products.length;
  const regions = [...new Set(products.map(p => String(p.region || "").trim()).filter(Boolean))].slice(0, 8);
  const canonical = SITE + "/game/" + encodeURIComponent(game.slug || slugify(name));
  const image = game.banner_url || game.image_url || SITE + "/assets/skieestore-logo-asli.png";
  const items = products.slice(0, 60).map(p => '<li><span>' + esc(p.name) + (p.region ? '<small>' + esc(p.region) + '</small>' : '') + '</span><strong>' + money(p.sell_price) + '</strong></li>').join("");
  const productText = products.length
    ? '<section><h2>Pilihan nominal dan harga</h2><ul class="products">' + items + '</ul><p class="muted">Harga dapat berubah mengikuti pembaruan katalog. Pastikan nominal dan detail pesanan sebelum melanjutkan.</p></section>'
    : '<section><h2>Pilihan nominal</h2><p>Daftar produk untuk game ini sedang diperbarui. Buka katalog SKIEESTORE untuk melihat ketersediaan terbaru.</p></section>';
  const schema = {
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"CollectionPage","name":title,"description":description,"url":canonical,"isPartOf":{"@type":"WebSite","name":"SKIEESTORE","url":SITE},"mainEntity":{"@type":"ItemList","numberOfItems":productCount,"itemListElement":products.slice(0,60).map((p,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"Product","name":p.name,"offers":{"@type":"Offer","priceCurrency":"IDR","price":String(Number(p.sell_price)||0),"availability":"https://schema.org/InStock","url":canonical}}}))}},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Beranda","item":SITE+"/"},{"@type":"ListItem","position":2,"name":"Top Up Game","item":SITE+"/topup"},{"@type":"ListItem","position":3,"name":name,"item":canonical}]},
      {"@type":"FAQPage","mainEntity":[
        {"@type":"Question","name":"Bagaimana cara memilih produk "+name+"?","acceptedAnswer":{"@type":"Answer","text":"Bandingkan nama nominal dan wilayah produk yang tercantum pada katalog. Pilih produk yang sesuai dengan akun atau kebutuhan Anda."}},
        {"@type":"Question","name":"Apakah harga produk "+name+" bisa berubah?","acceptedAnswer":{"@type":"Answer","text":"Harga mengikuti katalog aktif dan dapat berubah. Periksa kembali harga pada halaman pemesanan sebelum checkout."}},
        {"@type":"Question","name":"Data apa yang perlu disiapkan untuk pemesanan?","acceptedAnswer":{"@type":"Answer","text":"Siapkan ID atau data tujuan sesuai petunjuk produk pada halaman pemesanan. Jangan pernah membagikan password atau kode OTP."}}
      ]}
    ]
  };
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow,max-image-preview:large"><title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '"><link rel="canonical" href="' + esc(canonical) + '"><meta property="og:type" content="website"><meta property="og:site_name" content="SKIEESTORE"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '"><meta property="og:url" content="' + esc(canonical) + '"><meta property="og:image" content="' + esc(image) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(description) + '"><script type="application/ld+json">' + JSON.stringify(schema).replace(/</g,"\\u003c") + '</script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#151923;font:500 15px Manrope,Arial,sans-serif}.wrap{width:min(900px,calc(100% - 32px));margin:auto}.top{border-bottom:1px solid #e5e7eb;padding:17px 0}.brand{font:700 21px "Space Grotesk";color:#087BFF;text-decoration:none}.hero{margin:32px 0 18px;padding:26px;border:1px solid #cdeeff;border-radius:20px;background:linear-gradient(120deg,#fff,#f2fbff);display:flex;gap:20px;align-items:center}.hero img{width:104px;height:104px;object-fit:cover;border-radius:18px;background:#eef7ff}.eyebrow{font-size:11px;color:#087BFF;font-weight:800;letter-spacing:.13em}h1{font:700 clamp(27px,5vw,40px) "Space Grotesk";margin:8px 0}p{line-height:1.8;color:#4b5563;font-size:14px}section{padding:22px;margin:16px 0;border:1px solid #e5e7eb;border-radius:17px}h2{font:700 21px "Space Grotesk";margin:0 0 14px}.products{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.products li{padding:13px;border:1px solid #e5e7eb;border-radius:11px;display:flex;justify-content:space-between;gap:10px;font-size:12px}.products strong{color:#087BFF;white-space:nowrap}.products small{display:block;color:#667085;font-size:10px;margin-top:4px}.muted{font-size:11px}.cta{display:inline-block;background:#087BFF;color:white;text-decoration:none;padding:14px 19px;border-radius:11px;font-weight:800;font-size:13px;margin-top:10px}.foot{padding:26px 0 45px;color:#667085;font-size:11px}@media(max-width:560px){.hero{padding:18px;gap:13px}.hero img{width:76px;height:76px}.products{grid-template-columns:1fr}section{padding:17px}}</style></head><body><header class="top"><div class="wrap"><a class="brand" href="/">SKIEESTORE</a></div></header><main class="wrap"><div class="hero">' + (image ? '<img src="' + esc(image) + '" alt="' + esc(name) + '">' : '') + '<div><div class="eyebrow">KATALOG TOP UP GAME</div><h1>Top Up ' + esc(name) + '</h1><p>Halaman ini memuat ' + productCount + ' pilihan produk aktif dari katalog SKIEESTORE. Bandingkan nama nominal, keterangan wilayah, dan harga sebelum memilih.</p></div></div><section><h2>Pilihan ' + esc(categoryLabel) + ' ' + esc(name) + '</h2><p>Katalog ini menampilkan produk ' + esc(name) + ' yang sedang aktif. Periksa nama paket dan keterangan wilayah pada setiap pilihan karena varian produk dapat memiliki ketentuan berbeda.</p>' + (regions.length ? '<p><strong>Wilayah/varian yang tercantum:</strong> ' + regions.map(esc).join(', ') + '.</p>' : '')<p>Jangan pernah memberikan password akun atau kode OTP kepada siapa pun untuk proses top up.</p><a class="cta" href="/topup?game=' + encodeURIComponent(game.id) + '">Pilih nominal & lanjut top up</a></section>' + productText + '<section><h2>Cara memesan ' + esc(name) + '</h2><ol><li>Buka katalog top up SKIEESTORE.</li><li>Pilih nominal atau produk ' + esc(name) + ' yang tersedia.</li><li>Isi ID atau data tujuan sesuai kolom yang diminta pada halaman pemesanan.</li><li>Periksa nama produk, wilayah, data tujuan, dan total harga sebelum checkout.</li></ol><a class="cta" href="/topup?game=' + encodeURIComponent(game.id) + '">Buka halaman pemesanan</a></section><section><h2>Pertanyaan seputar ' + esc(name) + '</h2><h3>Bagaimana memilih nominal yang tepat?</h3><p>Periksa nama produk dan wilayah yang tertera. Pastikan pilihan sesuai dengan akun atau kebutuhan sebelum memesan.</p><h3>Apakah harga selalu sama?</h3><p>Tidak selalu. Harga mengikuti katalog aktif dan dapat berubah. Gunakan harga yang tampil saat checkout sebagai acuan akhir.</p><h3>Apakah perlu memberikan password atau OTP?</h3><p>Tidak. Jangan pernah membagikan password akun atau kode OTP untuk proses top up.</p></section><nav aria-label="Tautan bantuan"><a href="/cara-top-up">Panduan cara top up</a> · <a href="/pusat-bantuan">Pusat bantuan</a> · <a href="/topup">Semua produk</a></nav></main><footer class="wrap foot">© ' + new Date().getFullYear() + ' SKIEESTORE · Top up game online</footer></body></html>';
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
