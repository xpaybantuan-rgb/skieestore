const SUPABASE_URL = "https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
const SITE = "https://skieestore.biz.id";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export async function onRequestGet({ params }) {
  const slug = String(params.slug || "").trim().toLowerCase();
  if (!slug) return new Response("Not found", { status: 404 });

  try {
    const query = new URLSearchParams({
      select: "id,name,slug",
      slug: "eq." + slug,
      is_active: "eq.true",
      limit: "1"
    });
    const response = await fetch(SUPABASE_URL + "/rest/v1/xpaypoint_games?" + query.toString(), {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!response.ok) throw new Error("Game lookup failed");
    const games = await response.json();
    const game = games[0];
    if (!game) return new Response("Game tidak ditemukan", { status: 404 });

    const name = esc(game.name);
    const title = "Top Up " + game.name + " Murah & Cepat | SKIEESTORE";
    const description = "Top up " + game.name + " di SKIEESTORE. Pilih nominal yang tersedia, isi data akun dengan benar, lalu lanjutkan pemesanan dengan praktis.";
    const canonical = SITE + "/game/" + encodeURIComponent(slug);
    const target = "/topup?game=" + encodeURIComponent(game.id);
    const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SKIEESTORE">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/skieestore-logo-asli.png">
<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "SKIEESTORE", url: SITE }
    }).replace(/</g, "\\u003c")}</script>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#191b22;font:500 15px Arial,sans-serif}.wrap{width:min(680px,calc(100% - 32px));margin:12vh auto;padding:32px;border:1px solid #e5e7eb;border-radius:20px;background:linear-gradient(135deg,#fff,#f4fcff)}.brand{font-weight:900;letter-spacing:.06em;color:#087bff;font-size:13px}h1{font-size:clamp(28px,6vw,42px);line-height:1.15;margin:22px 0 12px}p{color:#667085;line-height:1.7;font-size:14px}.cta{display:inline-block;margin-top:12px;padding:14px 20px;border-radius:12px;background:#087bff;color:white;text-decoration:none;font-weight:800;font-size:13px}.back{display:block;margin-top:18px;color:#667085;font-size:12px;text-decoration:none}
</style>
</head>
<body>
<main class="wrap">
<div class="brand">SKIEESTORE</div>
<h1>Top Up ${name}</h1>
<p>Top up ${name} dengan praktis di SKIEESTORE. Lihat pilihan nominal dan harga yang tersedia, lalu lanjutkan pemesanan.</p>
<a class="cta" href="${target}">Pilih nominal top up</a>
<a class="back" href="/">Kembali ke beranda SKIEESTORE</a>
</main>
</body>
</html>`;
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    return new Response("Halaman game sementara tidak tersedia", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }
}
