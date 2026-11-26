export async function onRequestGet({ params }) {
  const slug = String(params.slug || "").trim();
  if (!slug) return new Response("Not found", { status: 404 });
  const target = new URL("/topup", "https://skieestore.biz.id");
  target.searchParams.set("game", slug);
  return Response.redirect(target.toString(), 302);
}
