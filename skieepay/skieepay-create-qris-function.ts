import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const STATIC_QRIS = "00020101021126610014COM.GO-JEK.WWW01189360091432644747540210G2644747540303UMI51440014ID.CO.QRIS.WWW0215ID10266381975600303UMI5204899953033605802ID5925skieestore, Digital & Kre6013LUBUK LINGGAU61053161662070703A0163049575";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-skieepay-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
type Tag = { id: string; value: string };
function parseTlv(input: string): Tag[] {
  const out: Tag[] = [];
  let i = 0;
  while (i < input.length) {
    if (i + 4 > input.length) throw new Error("TLV QRIS tidak valid");
    const id = input.slice(i, i + 2);
    const n = Number(input.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(n) || n < 0 || i + 4 + n > input.length) throw new Error("Panjang TLV QRIS tidak valid");
    out.push({ id, value: input.slice(i + 4, i + 4 + n) });
    i += 4 + n;
  }
  return out;
}
function encodeTlv(tags: Tag[]): string {
  return tags.map(t => {
    if (t.value.length > 99) throw new Error("Field QRIS terlalu panjang");
    return t.id + String(t.value.length).padStart(2, "0") + t.value;
  }).join("");
}
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function makeDynamicQris(amount: number): string {
  const base = STATIC_QRIS.slice(0, -8);
  const tags = parseTlv(base);
  const poi = tags.find(t => t.id === "01");
  if (!poi || poi.value !== "11") throw new Error("QR sumber bukan QRIS statis yang dikenali");
  poi.value = "12";
  const currency = tags.findIndex(t => t.id === "53");
  if (currency < 0 || tags.some(t => t.id === "54")) throw new Error("Struktur QRIS sumber tidak sesuai");
  tags.splice(currency + 1, 0, { id: "54", value: String(Math.trunc(amount)) });
  const body = encodeTlv(tags) + "6304";
  return body + crc16(body);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const apiKey = Deno.env.get("SKIEEPAY_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !serviceKey) return json({ error: "Konfigurasi SkieePay belum lengkap." }, 503);
  if (!safeEqual(req.headers.get("x-skieepay-key") || "", apiKey)) return json({ error: "Unauthorized" }, 401);
  try {
    const body = await req.json();
    const amount = Number(body?.amount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000) return json({ error: "amount harus integer rupiah positif." }, 400);
    const expires = body?.expires_minutes === undefined ? 15 : Number(body.expires_minutes);
    if (!Number.isInteger(expires) || expires < 5 || expires > 60) return json({ error: "expires_minutes harus 5-60." }, 400);
    const qrString = makeDynamicQris(amount);
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc("skieepay_create_invoice", {
      p_amount: amount, p_order_id: body?.order_id ?? null,
      p_customer_ref: typeof body?.customer_ref === "string" ? body.customer_ref.slice(0, 120) : null,
      p_payment_method: "qris", p_payment_payload: JSON.stringify({ source: "skieestore_static_qris", qr_string: qrString }),
      p_expires_minutes: expires
    });
    if (error || !data?.invoice_code) {
      console.error("SkieePay invoice create:", error?.message);
      return json({ error: "Gagal membuat invoice SkieePay." }, 500);
    }
    return json({
      ok: true, invoice_id: data.invoice_id, invoice_code: data.invoice_code,
      amount: data.amount, currency: "IDR", status: "pending", payment_method: "qris",
      merchant_name: "SKIEESTORE, DIGITAL & KRE", qr_string: qrString,
      expires_at: data.expires_at, qris_mode: "generated_from_static_merchant_qris",
      payment_confirmation: "automatic_mutation_feed_not_connected"
    }, 201);
  } catch (error) {
    console.error("SkieePay create QRIS error:", error);
    return json({ error: "Request gagal diproses." }, 400);
  }
});