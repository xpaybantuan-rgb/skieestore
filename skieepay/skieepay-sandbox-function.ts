import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://skieestore.biz.id",
  "https://www.skieestore.biz.id",
  "https://xpaybantuan-rgb.github.io",
  "https://skieestore.pages.dev"
]);
function headers(origin: string | null) {
  const h: Record<string,string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (origin && allowedOrigins.has(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function reply(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null, {status:403});
    return new Response(null, {status:204,headers:headers(origin)});
  }
  if (req.method !== "POST") return reply({ok:false,error:"Method not allowed"},405,origin);
  if (origin && !allowedOrigins.has(origin)) return reply({ok:false,error:"Origin not allowed"},403,origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ok:false,error:"Sandbox server is not configured"},503,origin);

  const auth = req.headers.get("Authorization") || "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (!token) return reply({ok:false,error:"Login admin diperlukan"},401,origin);

  const db = createClient(supabaseUrl, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
  try {
    const {data:userData,error:userError} = await db.auth.getUser(token);
    if (userError || !userData.user) return reply({ok:false,error:"Sesi admin tidak valid"},401,origin);
    const {data:admin,error:adminError} = await db.from("xpaypoint_admins")
      .select("user_id").eq("user_id",userData.user.id).maybeSingle();
    if (adminError || !admin) return reply({ok:false,error:"Akses hanya untuk admin pemilik SkieePay"},403,origin);

    const body = await req.json().catch(()=>null);
    if (!body || typeof body !== "object") return reply({ok:false,error:"JSON tidak valid"},400,origin);

    if (body.action === "create") {
      const amount = Number(body.amount);
      const expires = body.expires_minutes === undefined ? 15 : Number(body.expires_minutes);
      if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000)
        return reply({ok:false,error:"Nominal harus Rp1 sampai Rp100.000.000"},400,origin);
      if (!Number.isInteger(expires) || expires < 5 || expires > 60)
        return reply({ok:false,error:"Masa berlaku harus 5–60 menit"},400,origin);
      const customerRef = typeof body.customer_ref === "string" ? body.customer_ref.slice(0,120) : "Sandbox SkieePay";
      const {data,error} = await db.rpc("skieepay_create_invoice",{
        p_amount:amount,p_order_id:null,p_customer_ref:customerRef,
        p_payment_method:"qris",
        p_payment_payload:JSON.stringify({mode:"test",sandbox:true,payment_method:"simulation"}),
        p_expires_minutes:expires
      });
      if (error || !data?.invoice_code) {
        console.error("sandbox create invoice",error?.message);
        return reply({ok:false,error:"Gagal membuat invoice uji"},500,origin);
      }
      return reply({ok:true,mode:"test",invoice:data},201,origin);
    }

    if (body.action === "simulate_paid" || body.action === "simulate_expired") {
      const code = String(body.invoice_code || "").trim().toUpperCase();
      if (!/^SKP[0-9A-F]{32}$/.test(code))
        return reply({ok:false,error:"Kode invoice tidak valid"},400,origin);
      const outcome = body.action === "simulate_paid" ? "paid" : "expired";
      const {data,error} = await db.rpc("skieepay_simulate_test_payment",{
        p_invoice_code:code,p_outcome:outcome,p_event_id:"sbx_"+crypto.randomUUID()
      });
      if (error) {
        console.error("sandbox simulation",error.message);
        return reply({ok:false,error:"Simulasi gagal diproses"},500,origin);
      }
      return reply({ok:true,mode:"test",result:data},200,origin);
    }

    if (body.action === "list") {
      const {data,error} = await db.from("skieepay_invoices")
        .select("id,invoice_code,amount,status,payment_method,created_at,expires_at,paid_at,mode")
        .eq("mode","test").order("created_at",{ascending:false}).limit(30);
      if (error) return reply({ok:false,error:"Gagal membaca invoice uji"},500,origin);
      return reply({ok:true,mode:"test",invoices:data || []},200,origin);
    }

    return reply({ok:false,error:"Action tidak dikenal"},400,origin);
  } catch (error) {
    console.error("skieepay-sandbox",error);
    return reply({ok:false,error:"Permintaan sandbox gagal"},500,origin);
  }
});
