const SUPABASE_URL = "https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
const SITE = "https://skieestore.biz.id";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export async function onRequestGet({ request, params }) {
  const slug = String(params.slug || "").trim().toLowerCase();
  if (!slug) return new Response("Not found", { status: 404 });
  try {
    const query = new URLSearchParams({ select: "id,name,slug", slug: "eq." + slug, is_active: "eq.true", limit: "1" });
    const response = await fetch(SUPABASE_URL + "/rest/v1/xpaypoint_games?" + query.toString(), { headers: { apikey: SUPABASE_KEY }, cf: { cacheTtl: 300 } });
    if (!response.ok) throw new Error("Game lookup failed");
    const games = await response.json();
    const game = games[0];
    if (!game) return new Response("Game tidak ditemukan", { status: 404 });
    const appResponse = await fetch(new URL("/topup.html", request.url), { headers: { accept: "text/html" } });
    if (!appResponse.ok) throw new Error("Top-up application unavailable");
    let html = await appResponse.text();
    const name = String(game.name || "Game");
    const title = "Top Up " + name + " Murah & Cepat | SKIEESTORE";
    const description = "Top up " + name + " di SKIEESTORE. Pilih nominal dan harga yang tersedia, isi data akun dengan benar, lalu lanjutkan transaksi dengan praktis.";
    const canonical = SITE + "/game/" + encodeURIComponent(slug);
    const config = "<base href=\"/\"><script>window.__SKIEE_GAME_ID__=" + JSON.stringify(String(game.id)) + ";window.__SKIEE_GAME_SLUG__=" + JSON.stringify(slug) + ";window.__SKIEE_CANONICAL__=" + JSON.stringify(canonical) + ";window.__SKIEE_GAME_NAME__=" + JSON.stringify(name) + ";</script>";
    html = html.replace("<head>", "<head>" + config);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, "<title>" + esc(title) + "</title>");
    html = html.replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="' + esc(description) + '">');
    html = html.replace(/<link rel="canonical" href="[^"]*">/i, '<link rel="canonical" href="' + esc(canonical) + '">');
    html = html.replace(/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="' + esc(title) + '">');
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="' + esc(description) + '">');
    html = html.replace(/<meta property="og:url" content="[^"]*">/i, '<meta property="og:url" content="' + esc(canonical) + '">');
    html = html.replace(/<meta name="twitter:title" content="[^"]*">/i, '<meta name="twitter:title" content="' + esc(title) + '">');
    html = html.replace(/<meta name="twitter:description" content="[^"]*">/i, '<meta name="twitter:description" content="' + esc(description) + '">');
    const seo = '<section style="margin:24px 0 8px;padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fff"><h2 style="font-size:18px;margin:0 0 8px">Top Up ' + esc(name) + ' di SKIEESTORE</h2><p style="font-size:12px;line-height:1.8;color:#667085;margin:0">' + esc(description) + ' Untuk memesan, pilih nominal, masukkan data akun sesuai petunjuk formulir, periksa detail pesanan, lalu ikuti langkah pembayaran.</p></section>';
    html = html.replace("</section></main><footer", "</section>" + seo + "</main><footer");
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) { return new Response("Halaman game sementara tidak tersedia", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }); }
}
