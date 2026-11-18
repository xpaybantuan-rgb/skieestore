import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://skieepay.pages.dev"
]);
function cors(origin: string | null) {
  const h: Record<string,string> = {
    "Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin",
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS"
  };
  if (origin && allowedOrigins.has(origin)) h["Access-Control-Allow-Origin"]=origin;
  return h;
}
function reply(data: unknown,status=200,origin:string|null=null) {
  return new Response(JSON.stringify(data),{status,headers:cors(origin)});
}
const hex=(b:Uint8Array)=>Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");
function randomHex(n=32){const b=new Uint8Array(n);crypto.getRandomValues(b);return hex(b);}
async function sha256(value:string){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));}
async function hmac(secret:string,value:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value))));
}
function safeWebhookUrl(raw:string){
  let u:URL;try{u=new URL(raw)}catch{return false}
  if(u.protocol!=="https:"||u.username||u.password||(u.port&&u.port!=="443"))return false;
  const h=u.hostname.toLowerCase();
  if(h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||h.endsWith(".internal")||h.includes(":"))return false;
  if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h)){
    const p=h.split(".").map(Number);
    if(p.some(x=>x<0||x>255)||p[0]===0||p[0]===10||p[0]===127||p[0]>=224||
      (p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||
      (p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127))return false;
  }
  return true;
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS"){
    if(origin&&!allowedOrigins.has(origin))return new Response(null,{status:403});
    return new Response(null,{status:204,headers:cors(origin)});
  }
  if(req.method!=="POST")return reply({ok:false,error:"Method not allowed"},405,origin);
  if(origin&&!allowedOrigins.has(origin))return reply({ok:false,error:"Origin not allowed"},403,origin);
  const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!serviceKey)return reply({ok:false,error:"Server not configured"},503,origin);
  const token=(req.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1]||"";
  if(!token)return reply({ok:false,error:"Login admin diperlukan"},401,origin);
  const db=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    const {data:userData,error:userError}=await db.auth.getUser(token);
    if(userError||!userData.user)return reply({ok:false,error:"Sesi admin tidak valid"},401,origin);
    const {data:admin,error:adminError}=await db.from("skieepay_admins").select("user_id").eq("user_id",userData.user.id).maybeSingle();
    if(adminError||!admin)return reply({ok:false,error:"Akses hanya untuk admin pemilik SkieePay"},403,origin);
    const body=await req.json().catch(()=>null);
    if(!body||typeof body!=="object")return reply({ok:false,error:"JSON tidak valid"},400,origin);

    if(body.action==="list_api_keys"){
      const {data,error}=await db.from("skieepay_api_keys").select("id,label,mode,key_prefix,created_at,last_used_at,revoked_at").order("created_at",{ascending:false});
      if(error)throw error;return reply({ok:true,api_keys:data||[]},200,origin);
    }
    if(body.action==="create_api_key"){
      const label=String(body.label||"").trim();
      if(label.length<2||label.length>80)return reply({ok:false,error:"Nama kunci harus 2–80 karakter"},400,origin);
      const mode=String(body.mode||"test");
      if(mode!=="test")return reply({ok:false,error:"Kunci Live belum tersedia sebelum jalur pembayaran Live aktif"},409,origin);
      const plain="sk_test_"+randomHex(32),hash=await sha256(plain),prefix=plain.slice(0,16);
      const {data,error}=await db.from("skieepay_api_keys").insert({label,mode,key_prefix:prefix,key_hash:hash}).select("id,label,mode,key_prefix,created_at").single();
      if(error)throw error;
      return reply({ok:true,api_key:plain,key:data,warning:"Simpan kunci sekarang. Kunci lengkap hanya ditampilkan sekali."},201,origin);
    }
    if(body.action==="revoke_api_key"){
      const id=String(body.id||"");
      const {data,error}=await db.from("skieepay_api_keys").update({revoked_at:new Date().toISOString()}).eq("id",id).is("revoked_at",null).select("id").maybeSingle();
      if(error)throw error;return reply({ok:!!data,revoked:!!data},200,origin);
    }
    if(body.action==="list_webhooks"){
      const {data,error}=await db.from("skieepay_webhook_endpoints").select("id,url,mode,events,active,created_at,updated_at,last_delivery_at").order("created_at",{ascending:false});
      if(error)throw error;return reply({ok:true,endpoints:data||[]},200,origin);
    }
    if(body.action==="create_webhook"){
      const url=String(body.url||"").trim();
      if(!safeWebhookUrl(url))return reply({ok:false,error:"URL harus HTTPS publik; alamat lokal/private tidak diizinkan"},400,origin);
      const events=Array.isArray(body.events)?body.events.filter((x:string)=>["payment.paid","payment.expired"].includes(x)):["payment.paid","payment.expired"];
      const unique=[...new Set(events)];
      if(!unique.length)return reply({ok:false,error:"Pilih minimal satu event"},400,origin);
      const secret="whsec_"+randomHex(32);
      const {data:endpoint,error}=await db.from("skieepay_webhook_endpoints").insert({url,mode:"test",events:unique,active:true}).select("id,url,mode,events,active,created_at").single();
      if(error)throw error;
      const {error:secretError}=await db.from("skieepay_webhook_secrets").insert({endpoint_id:endpoint.id,signing_secret:secret});
      if(secretError){await db.from("skieepay_webhook_endpoints").delete().eq("id",endpoint.id);throw secretError;}
      return reply({ok:true,endpoint,signing_secret:secret,warning:"Secret ditampilkan satu kali. Simpan di server penerima webhook."},201,origin);
    }
    if(body.action==="disable_webhook"){
      const id=String(body.id||"");
      const {data,error}=await db.from("skieepay_webhook_endpoints").update({active:false,updated_at:new Date().toISOString()}).eq("id",id).select("id,active").maybeSingle();
      if(error)throw error;return reply({ok:!!data,endpoint:data},200,origin);
    }
    if(body.action==="test_webhook"){
      const id=String(body.id||"");
      const eventType=String(body.event_type||"payment.paid");
      if(!["payment.paid","payment.expired"].includes(eventType))return reply({ok:false,error:"Event tidak didukung"},400,origin);
      const {data:endpoint,error}=await db.from("skieepay_webhook_endpoints").select("id,url,events,active").eq("id",id).eq("mode","test").maybeSingle();
      if(error||!endpoint)return reply({ok:false,error:"Endpoint tidak ditemukan"},404,origin);
      if(!endpoint.active||!endpoint.events.includes(eventType))return reply({ok:false,error:"Endpoint nonaktif atau event tidak dipilih"},409,origin);
      const {data:secretRow,error:secretError}=await db.from("skieepay_webhook_secrets").select("signing_secret").eq("endpoint_id",id).single();
      if(secretError||!secretRow)return reply({ok:false,error:"Secret endpoint tidak tersedia"},500,origin);
      const eventId="evt_test_"+crypto.randomUUID();
      const now=new Date().toISOString();
      const payload={id:eventId,type:eventType,source:"skieepay_sandbox",mode:"test",created_at:now,data:{invoice_code:"SKPTEST00000000000000000000000000",amount:10000,paid_at:eventType==="payment.paid"?now:null}};
      const raw=JSON.stringify(payload),ts=Math.floor(Date.now()/1000);
      const sig=await hmac(secretRow.signing_secret,ts+"."+raw);
      let responseStatus:number|null=null,lastError:string|null=null,status="failed";
      try{
        const res=await fetch(endpoint.url,{method:"POST",headers:{"Content-Type":"application/json","SkieePay-Signature":"t="+ts+",v1="+sig,"SkieePay-Event-Id":eventId},body:raw,signal:AbortSignal.timeout(10000)});
        responseStatus=res.status;status=res.ok?"delivered":"failed";
        if(!res.ok)lastError=("Endpoint returned HTTP "+res.status+" "+(await res.text()).slice(0,300));
      }catch(e){lastError=String(e).slice(0,500);}
      const {data:delivery,error:deliveryError}=await db.from("skieepay_webhook_deliveries").insert({endpoint_id:id,event_id:eventId,event_type:eventType,payload,response_status:responseStatus,status,attempt_count:1,last_error:lastError,delivered_at:status==="delivered"?new Date().toISOString():null}).select("id,status,response_status,attempt_count,last_error,created_at").single();
      if(deliveryError)throw deliveryError;
      await db.from("skieepay_webhook_endpoints").update({last_delivery_at:new Date().toISOString()}).eq("id",id);
      return reply({ok:true,delivery},200,origin);
    }
    if(body.action==="list_deliveries"){
      const {data,error}=await db.from("skieepay_webhook_deliveries").select("id,endpoint_id,event_id,event_type,status,response_status,attempt_count,last_error,delivered_at,created_at").order("created_at",{ascending:false}).limit(50);
      if(error)throw error;return reply({ok:true,deliveries:data||[]},200,origin);
    }
    if(body.action==="list_payment_methods"){
      const {data,error}=await db.from("skieepay_payment_methods").select("method_code,display_name,enabled,mode,settings,updated_at").order("method_code");
      if(error)throw error;return reply({ok:true,methods:data||[]},200,origin);
    }
    if(body.action==="set_payment_method"){
      const method=String(body.method_code||"");
      if(!["qris_standard","qris_custom"].includes(method))return reply({ok:false,error:"Metode pembayaran tidak dikenal"},400,origin);
      const enabled=body.enabled===true;
      const {data,error}=await db.from("skieepay_payment_methods").update({enabled,mode:"test",updated_at:new Date().toISOString()}).eq("method_code",method).select("method_code,display_name,enabled,mode,settings").single();
      if(error)throw error;
      return reply({ok:true,method:data,warning:"Pengaturan ini hanya untuk tampilan dan pengujian. Adapter pembayaran belum terhubung."},200,origin);
    }
    return reply({ok:false,error:"Action tidak dikenal"},400,origin);
  }catch(error){
    console.error("skieepay-admin",error);
    return reply({ok:false,error:"Permintaan admin SkieePay gagal"},500,origin);
  }
});