const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-SkieePay-Key,X-Idempotency-Key"
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}
function jsonError(message, status = 400) { return reply({ ok: false, error: message }, status); }
function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "SKP" + [...bytes].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
async function db(env, path, init = {}) {
  const url = env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {})
    }
  });
  const body = await res.text();
  if (!res.ok) throw new Error("Database request failed (" + res.status + "): " + body.slice(0, 300));
  return body ? JSON.parse(body) : null;
}
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function constantTimeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function authorized(request, env) {
  const key = request.headers.get("X-SkieePay-Key") || "";
  if (!key) return false;
  if (constantTimeEqual(key, env.SKIEEPAY_API_KEY || "")) return "test";
  const hash = await sha256Hex(key);
  const rows = await db(env, "skieepay_api_keys?key_hash=eq." + encodeURIComponent(hash) +
    "&revoked_at=is.null&select=id,mode&limit=1");
  if (!rows || !rows.length) return false;
  if (rows[0].mode === "live" && env.SKIEEPAY_LIVE_ENABLED !== "true") return false;
  await db(env, "skieepay_api_keys?id=eq." + encodeURIComponent(rows[0].id), {
    method: "PATCH",
    body: JSON.stringify({ last_used_at: new Date().toISOString() })
  });
  return rows[0].mode;
}

const DEFAULT_GOPAY_QRIS = "00020101021126610014COM.GO-JEK.WWW01189360091432644747540210G2644747540303UMI51440014ID.CO.QRIS.WWW0215ID10266381975600303UMI5204899953033605802ID5925skieestore, Digital & Kre6013LUBUK LINGGAU61053161662070703A0163049575";
const GOBIZ_TOKEN_URL = "https://api.gobiz.co.id/goid/token";
const GOBIZ_OTP_URL = "https://api.gobiz.co.id/goid/login/request";
const GOBIZ_CONFIG_URL = "https://api.gobiz.co.id/goresto/v5/public/users/config";
const GOJEK_TRANSACTIONS_URL = "https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions";
function hexBytes(value) {
  if (!/^[0-9a-f]{64}$/i.test(value || "")) throw new Error("GoPay encryption key is not configured");
  return new Uint8Array(value.match(/.{2}/g).map(x => parseInt(x,16)));
}
function bytesB64(bytes) {
  let binary = "";
  for (let i=0;i<bytes.length;i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function b64Bytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
async function getGopayMasterKey(env) {
  const result = await db(env,"rpc/skieepay_get_gopay_master_key",{method:"POST",body:"{}"});
  const key = typeof result === "string" ? result : result?.secret || result?.decrypted_secret;
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) throw new Error("GoPay encryption key is unavailable");
  return key;
}
async function encryptGopayPayload(env,payload) {
  const master = await getGopayMasterKey(env);
  const key = await crypto.subtle.importKey("raw",hexBytes(master),{name:"AES-GCM"},false,["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(payload)));
  return {encrypted_payload:bytesB64(new Uint8Array(encrypted)),iv:bytesB64(iv)};
}
async function decryptGopayPayload(env,row) {
  const master = await getGopayMasterKey(env);
  const key = await crypto.subtle.importKey("raw",hexBytes(master),{name:"AES-GCM"},false,["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({name:"AES-GCM",iv:b64Bytes(row.iv)},key,b64Bytes(row.encrypted_payload));
  return JSON.parse(new TextDecoder().decode(decrypted));
}
async function loadGopaySession(env) {
  const rows=await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant&select=*&limit=1");
  if(!rows.length)return null;
  return await decryptGopayPayload(env,rows[0]);
}
async function saveGopaySession(env,session) {
  const encrypted=await encryptGopayPayload(env,session);
  const row={provider:"gopay_merchant",...encrypted,merchant_id:session.merchant_id||null,
    outlet_name:session.outlet_name||null,masked_phone:maskGopayPhone(session.phone_number),
    expires_at:session.expires_at||null,updated_at:new Date().toISOString()};
  await db(env,"skieepay_provider_sessions?on_conflict=provider",{method:"POST",
    headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(row)});
}
function maskGopayPhone(phone) {
  const digits=String(phone||"").replace(/\D/g,"");
  if(digits.length<7)return "****";
  return "+"+digits.slice(0,4)+"****"+digits.slice(-3);
}
function gopayDeviceHeaders(deviceId) {
  return {
    "accept":"application/json, text/plain, */*","accept-language":"id",
    "authentication-type":"go-id","content-type":"application/json",
    "gojek-country-code":"ID","gojek-timezone":"Asia/Jakarta",
    "origin":"https://portal.gofoodmerchant.co.id","referer":"https://portal.gofoodmerchant.co.id/",
    "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "x-appid":"go-biz-web-dashboard","x-appversion":"platform-v3.111.0-1708bc9a",
    "x-deviceos":"Web","x-phonemake":"Windows 10 64-bit",
    "x-phonemodel":"Chrome 150.0.0.0 on Windows 10 64-bit","x-platform":"Web",
    "x-uniqueid":deviceId,"x-user-locale":"en-GB","x-user-type":"merchant"
  };
}
function gopayAuthHeaders(session) {
  return {...gopayDeviceHeaders(session.device_id),
    "Authorization":"Bearer "+session.access_token,
    "Cookie":"access_token="+session.access_token+"; refresh_token="+(session.refresh_token||"")+"; auth_method=goid"};
}
async function isSkieePayAdmin(request,env) {
  const authorization=request.headers.get("Authorization")||"";
  if(!/^Bearer\s+\S+/i.test(authorization))return false;
  const userResponse=await fetch(env.SUPABASE_URL.replace(/\/$/,"")+"/auth/v1/user",{
    headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:authorization}
  });
  if(!userResponse.ok)return false;
  const user=await userResponse.json();
  if(!user?.id)return false;
  const admins=await db(env,"xpaypoint_admins?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id&limit=1");
  return !!admins.length;
}
async function refreshGopaySession(env,session) {
  if(!session?.refresh_token||!session?.device_id)throw new Error("Sesi GoPay perlu dihubungkan ulang");
  const phone=String(session.phone_number||"").replace(/\D/g,"").replace(/^62/,"").replace(/^0/,"");
  const response=await fetch(GOBIZ_TOKEN_URL,{method:"POST",headers:gopayDeviceHeaders(session.device_id),
    body:JSON.stringify({client_id:"go-biz-web-new",grant_type:"refresh_token",
      data:{refresh_token:session.refresh_token,phone_number:phone,country_code:"62"}}),
    signal:AbortSignal.timeout(15000)});
  const payload=await response.json().catch(()=>({}));
  const data=payload?.data||payload;
  if(!response.ok||!data?.access_token)throw new Error("GoBiz gagal memperbarui sesi. Hubungkan ulang jika diperlukan.");
  const updated={...session,access_token:data.access_token,refresh_token:data.refresh_token||session.refresh_token,
    expires_at:new Date(Date.now()+Number(data.expires_in||86400)*1000).toISOString(),
    updated_at:new Date().toISOString()};
  await saveGopaySession(env,updated);
  const rows=await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant",{method:"PATCH",
    body:JSON.stringify({last_refresh_at:new Date().toISOString()})});
  return updated;
}
async function getValidGopaySession(env) {
  let session=await loadGopaySession(env);
  if(!session?.access_token)throw new Error("Akun GoPay Merchant belum terhubung");
  const expires=Date.parse(session.expires_at||"");
  if(!Number.isFinite(expires)||Date.now()>=expires-5*60*1000)session=await refreshGopaySession(env,session);
  return session;
}
async function fetchGopayTransactions(env,session,startTime) {
  const url=new URL(GOJEK_TRANSACTIONS_URL);
  url.searchParams.set("from","0");url.searchParams.set("size","50");
  url.searchParams.set("statuses","SETTLEMENT,CAPTURE,REFUND,PARTIAL_REFUND");
  url.searchParams.set("payment_types","QRIS");
  url.searchParams.set("start_time",new Date(startTime||Date.now()-86400000).toISOString());
  url.searchParams.set("end_time",new Date(Date.now()+120000).toISOString());
  url.searchParams.set("merchant_ids",String(session.merchant_id||""));
  const response=await fetch(url.toString(),{headers:gopayAuthHeaders(session),signal:AbortSignal.timeout(15000)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error("GoPay Merchant menolak pembacaan transaksi (HTTP "+response.status+")");
  const data=payload?.data||payload;
  return Array.isArray(data?.transactions)?data.transactions:(Array.isArray(data)?data:[]);
}

function parseQrisTags(input) {
  let raw=String(input||"").trim();
  const crcIndex=raw.indexOf("6304");
  if(crcIndex>=0)raw=raw.slice(0,crcIndex);
  const tags=[];let i=0;
  while(i<raw.length){
    if(i+4>raw.length)throw new Error("QRIS statis tidak valid");
    const id=raw.slice(i,i+2),len=Number(raw.slice(i+2,i+4));
    if(!/^\d{2}$/.test(id)||!Number.isInteger(len)||len<0||i+4+len>raw.length)throw new Error("Struktur QRIS tidak valid");
    tags.push({id,value:raw.slice(i+4,i+4+len)});i+=4+len;
  }
  return tags;
}
function encodeQrisTags(tags) {
  return tags.map(t=>{if(t.value.length>99)throw new Error("Field QRIS terlalu panjang");return t.id+String(t.value.length).padStart(2,"0")+t.value;}).join("");
}
function qrisCrc16(input) {
  let crc=0xffff;
  for(let i=0;i<input.length;i++){crc^=input.charCodeAt(i)<<8;for(let b=0;b<8;b++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;}
  return crc.toString(16).toUpperCase().padStart(4,"0");
}
function makeDynamicGopayQris(template,amount) {
  if(!Number.isSafeInteger(amount)||amount<1)throw new Error("Nominal QRIS tidak valid");
  const tags=parseQrisTags(template);
  const poi=tags.find(t=>t.id==="01");
  if(!poi||poi.value!=="11")throw new Error("Template QRIS bukan QRIS statis yang dikenali");
  if(tags.some(t=>t.id==="54"))throw new Error("Template QRIS sudah memiliki nominal");
  poi.value="12";
  const countryIndex=tags.findIndex(t=>t.id==="58");
  if(countryIndex<0)throw new Error("Tag negara QRIS tidak ditemukan");
  tags.splice(countryIndex,0,{id:"54",value:String(amount)});
  const body=encodeQrisTags(tags)+"6304";
  return body+qrisCrc16(body);
}
async function signOutgoingWebhook(secret,value) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function dispatchPaymentWebhook(env,eventType,invoice,transaction) {
  const endpoints=await db(env,"skieepay_webhook_endpoints?mode=eq.live&active=eq.true&select=id,url,events");
  for(const endpoint of (endpoints||[])){
    if(!Array.isArray(endpoint.events)||!endpoint.events.includes(eventType))continue;
    const secrets=await db(env,"skieepay_webhook_secrets?endpoint_id=eq."+encodeURIComponent(endpoint.id)+"&select=signing_secret&limit=1");
    if(!secrets.length)continue;
    const eventId="evt_live_"+crypto.randomUUID(),createdAt=new Date().toISOString();
    const payload={id:eventId,type:eventType,source:"skieepay",mode:"live",created_at:createdAt,
      data:{invoice_code:invoice.invoice_code,amount:Number(invoice.amount),paid_at:invoice.paid_at||createdAt,
        provider_reference:transaction.id||transaction.transaction_id||null}};
    const raw=JSON.stringify(payload),ts=Math.floor(Date.now()/1000);
    const signature=await signOutgoingWebhook(secrets[0].signing_secret,ts+"."+raw);
    let responseStatus=null,lastError=null,status="failed";
    try{
      const response=await fetch(endpoint.url,{method:"POST",headers:{"Content-Type":"application/json",
        "SkieePay-Signature":"t="+ts+",v1="+signature,"SkieePay-Event-Id":eventId},
        body:raw,signal:AbortSignal.timeout(10000)});
      responseStatus=response.status;status=response.ok?"delivered":"failed";
      if(!response.ok)lastError=("Endpoint returned HTTP "+response.status+" "+(await response.text()).slice(0,250));
    }catch(error){lastError=String(error).slice(0,500);}
    await db(env,"skieepay_webhook_deliveries",{method:"POST",body:JSON.stringify({endpoint_id:endpoint.id,
      invoice_id:invoice.id,event_id:eventId,event_type:eventType,payload,status,response_status:responseStatus,
      attempt_count:1,last_error:lastError,delivered_at:status==="delivered"?new Date().toISOString():null})});
    await db(env,"skieepay_webhook_endpoints?id=eq."+encodeURIComponent(endpoint.id),{method:"PATCH",
      body:JSON.stringify({last_delivery_at:new Date().toISOString()})});
  }
}
function parseGopayTransactionTime(value) {
  if (typeof value === "number") return value > 1000000000000 ? value : value * 1000;
  const raw = String(value || "").trim();
  if (!raw) return NaN;
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) return Date.parse(raw);
  return Date.parse(raw.replace(" ","T") + "+07:00");
}
async function syncGopayPendingInvoices(env,onlyCode=null,providedTransactions=null) {
  const now=new Date();
  const filter="mode=eq.live&status=eq.pending&expires_at=gt."+encodeURIComponent(now.toISOString())+
    "&select=id,invoice_code,amount,created_at,expires_at&order=created_at.asc&limit=100"+
    (onlyCode?"&invoice_code=eq."+encodeURIComponent(onlyCode):"");
  const invoices=await db(env,"skieepay_invoices?"+filter);
  if(!invoices.length)return {checked:0,paid:0};
  if(!providedTransactions){
    const sessionRows=await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant&select=last_polled_at&limit=1");
    const last=Date.parse(sessionRows[0]?.last_polled_at||"");
    if(Number.isFinite(last)&&Date.now()-last<8000)return {checked:invoices.length,paid:0,throttled:true};
    await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant",{method:"PATCH",
      body:JSON.stringify({last_polled_at:new Date().toISOString()})});
  }
  const session=await getValidGopaySession(env);
  if(!session.merchant_id)throw new Error("GoPay Merchant ID belum tersedia");
  let transactions=providedTransactions;
  if(!transactions){
    const earliest=Math.min(...invoices.map(x=>Date.parse(x.created_at)))-5*60*1000;
    transactions=await fetchGopayTransactions(env,session,earliest);
  }
  let paid=0;
  for(const tx of transactions){
    const txId=String(tx.id||tx.transaction_id||tx.wallstreet_transaction_id||tx.order_id||"");
    const txStatus=String(tx.transaction_status||tx.status||"").toUpperCase();
    const paymentType=String(tx.payment_type||tx.transaction_source||"").toUpperCase();
    const amountValues = [
      tx.gross_amount,
      tx.real_gross_amount,
      typeof tx.amount === "object" && tx.amount ? tx.amount.value : tx.amount
    ].map(value => Number(value)).filter(value => Number.isFinite(value) && value > 0);
    const txTime = parseGopayTransactionTime(tx.transaction_time||tx.settlement_time||tx.created_at||tx.time);
    if(!txId||!amountValues.length||!Number.isFinite(txTime)||
      !["SETTLEMENT","CAPTURE"].includes(txStatus)|| (paymentType && !paymentType.includes("QRIS")))continue;
    const candidates=invoices.filter(inv=>amountValues.some(raw=>raw===Number(inv.amount)||raw===Number(inv.amount)*100||Math.round(raw/100)===Number(inv.amount))&&
      txTime>=Date.parse(inv.created_at)-5*60*1000&&txTime<=Date.parse(inv.expires_at)+5*60*1000);
    if(candidates.length!==1)continue;
    const invoice=candidates[0],amount=Number(invoice.amount),rawAmount=amountValues.find(raw=>raw===amount||raw===amount*100||Math.round(raw/100)===amount);
    const payload={id:txId,transaction_status:txStatus,payment_type:paymentType,gross_amount:rawAmount,
      transaction_time:new Date(txTime).toISOString(),merchant_id:session.merchant_id};
    const result=await db(env,"rpc/skieepay_apply_gopay_payment",{method:"POST",
      body:JSON.stringify({p_invoice_code:invoice.invoice_code,p_transaction_id:txId,p_amount:amount,
        p_transaction_time:new Date(txTime).toISOString(),p_payload:payload})});
    if(result?.ok&&result?.status==="paid"){
      paid++;invoice.status="paid";invoice.paid_at=result.paid_at;invoice.provider_reference=txId;
      await dispatchPaymentWebhook(env,"payment.paid",invoice,{id:txId,transaction_time:new Date(txTime).toISOString()});
      invoices.splice(invoices.indexOf(invoice),1);
    }
  }
  return {checked:invoices.length,paid};
}

async function gopayAdminRoutes(request,env,url) {
  if(!await isSkieePayAdmin(request,env))return jsonError("Admin authentication required",401);
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return jsonError("Server is not configured",503);
  try {
    if(url.pathname==="/admin/gopay/status"&&request.method==="GET") {
      let session=await loadGopaySession(env);
      if(!session)return reply({ok:true,connected:false,provider:"gopay_merchant"});
      let refreshError=null;
      try {session=await getValidGopaySession(env);} catch(e) {refreshError=e.message;}
      const rows=await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant&select=last_refresh_at,last_polled_at&limit=1");
      return reply({ok:true,connected:true,provider:"gopay_merchant",phone:maskGopayPhone(session.phone_number),
        merchant_id:session.merchant_id||null,outlet_name:session.outlet_name||null,
        expires_at:session.expires_at||null,refresh_token_available:!!session.refresh_token,
        qris_static_configured:!!session.qris_static,refresh_error:refreshError,
        last_refresh_at:rows[0]?.last_refresh_at||null,last_polled_at:rows[0]?.last_polled_at||null});
    }
    if(url.pathname==="/admin/gopay/request-otp"&&request.method==="POST") {
      const body=await request.json();let phone=String(body.phone||"").replace(/\D/g,"");
      if(phone.startsWith("62"))phone=phone.slice(2);if(phone.startsWith("0"))phone=phone.slice(1);
      if(!/^8\d{7,13}$/.test(phone))return jsonError("Nomor HP GoPay Merchant tidak valid");
      const existing=await db(env,"skieepay_provider_login_attempts?provider=eq.gopay_merchant&select=expires_at&limit=1");
      if(existing.length&&Date.parse(existing[0].expires_at)>Date.now())return jsonError("OTP sebelumnya masih berlaku. Gunakan OTP tersebut atau tunggu kedaluwarsa.",429);
      const deviceId=crypto.randomUUID();
      const response=await fetch(GOBIZ_OTP_URL,{method:"POST",headers:gopayDeviceHeaders(deviceId),
        body:JSON.stringify({client_id:"go-biz-web-new",phone_number:phone,country_code:"62"}),
        signal:AbortSignal.timeout(15000)});
      const payload=await response.json().catch(()=>({})),data=payload?.data||payload;
      const otpToken=data?.otp_token||data?.login_token;
      if(!response.ok||!otpToken)return jsonError("GoBiz menolak permintaan OTP. Periksa nomor atau coba lagi.",502);
      const expiresIn=Number(data.expires_in||720);
      const encrypted=await encryptGopayPayload(env,{phone_number:phone,otp_token:otpToken,device_id:deviceId});
      await db(env,"skieepay_provider_login_attempts?on_conflict=provider",{method:"POST",
        headers:{Prefer:"resolution=merge-duplicates,return=representation"},
        body:JSON.stringify({provider:"gopay_merchant",...encrypted,expires_at:new Date(Date.now()+expiresIn*1000).toISOString()})});
      return reply({ok:true,otp_sent:true,phone:maskGopayPhone("62"+phone),expires_in:expiresIn});
    }
    if(url.pathname==="/admin/gopay/verify-otp"&&request.method==="POST") {
      const body=await request.json(),otp=String(body.otp||"").trim();
      if(!/^\d{4,8}$/.test(otp))return jsonError("Kode OTP harus 4–8 digit");
      const attempts=await db(env,"skieepay_provider_login_attempts?provider=eq.gopay_merchant&select=*&limit=1");
      if(!attempts.length||Date.parse(attempts[0].expires_at)<=Date.now())return jsonError("Permintaan OTP sudah kedaluwarsa. Minta OTP baru.",410);
      const pending=await decryptGopayPayload(env,attempts[0]);
      const response=await fetch(GOBIZ_TOKEN_URL,{method:"POST",headers:gopayDeviceHeaders(pending.device_id),
        body:JSON.stringify({client_id:"go-biz-web-new",grant_type:"otp",data:{otp,otp_token:pending.otp_token}}),
        signal:AbortSignal.timeout(15000)});
      const payload=await response.json().catch(()=>({})),data=payload?.data||payload;
      if(!response.ok||!data?.access_token)return jsonError("OTP salah, kedaluwarsa, atau ditolak GoBiz.",401);
      let merchantId=null,outletName="GoPay Merchant";
      try {
        const configResponse=await fetch(GOBIZ_CONFIG_URL,{headers:{Authorization:"Bearer "+data.access_token,
          "authentication-type":"go-id",Origin:"https://portal.gofoodmerchant.co.id",
          Referer:"https://portal.gofoodmerchant.co.id/","User-Agent":gopayDeviceHeaders(pending.device_id)["user-agent"]},
          signal:AbortSignal.timeout(10000)});
        const config=await configResponse.json().catch(()=>({})),cfg=config?.data||config;
        const merchant=cfg.merchant||cfg.merchants?.[0]||cfg.restaurants?.[0];
        merchantId=merchant?.id?String(merchant.id):null;outletName=merchant?.name||merchant?.brand_name||outletName;
      } catch {}
      const session={phone_number:"+62"+pending.phone_number,device_id:pending.device_id,
        access_token:data.access_token,refresh_token:data.refresh_token||null,
        expires_at:new Date(Date.now()+Number(data.expires_in||86400)*1000).toISOString(),
        merchant_id:merchantId,outlet_name:outletName,qris_static:DEFAULT_GOPAY_QRIS,
        cookie:"access_token="+data.access_token+"; refresh_token="+(data.refresh_token||"")+"; auth_method=goid",
        connected_at:new Date().toISOString()};
      await saveGopaySession(env,session);
      await db(env,"skieepay_provider_login_attempts?provider=eq.gopay_merchant",{method:"DELETE"});
      return reply({ok:true,connected:true,phone:maskGopayPhone(session.phone_number),merchant_id:merchantId,outlet_name:outletName,
        expires_at:session.expires_at,refresh_token_available:!!session.refresh_token,qris_static_configured:true});
    }
    if(url.pathname==="/admin/gopay/refresh"&&request.method==="POST") {
      const session=await loadGopaySession(env);if(!session)return jsonError("Akun belum terhubung",404);
      const updated=await refreshGopaySession(env,session);
      return reply({ok:true,connected:true,expires_at:updated.expires_at,refresh_token_available:!!updated.refresh_token});
    }
    if(url.pathname==="/admin/gopay/disconnect"&&request.method==="POST") {
      await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant",{method:"DELETE"});
      await db(env,"skieepay_provider_login_attempts?provider=eq.gopay_merchant",{method:"DELETE"});
      return reply({ok:true,connected:false});
    }
    if(url.pathname==="/admin/gopay/transactions"&&request.method==="GET") {
      const session=await getValidGopaySession(env);
      if(!session.merchant_id)return jsonError("Merchant ID tidak ditemukan pada profil GoPay",409);
      const tx=await fetchGopayTransactions(env,session,Date.now()-7*86400000);
      const transactions=tx.slice(0,50).map(t=>({id:t.id||t.transaction_id||null,order_id:t.order_id||null,
        amount:Number(t.gross_amount||t.amount||0)/100,status:t.transaction_status||t.status||null,
        payment_type:t.payment_type||t.transaction_source||null,transaction_time:t.transaction_time||t.settlement_time||null,
        payer_issuer:t.qris_provider_aspi_issuer||null}));
      // Persist provider evidence idempotently. Unmatched mutations remain unassigned
      // until a unique pending invoice can be safely identified.
      const eventRows=transactions.filter(t=>t.id&&Number.isSafeInteger(t.amount)&&t.amount>=0).map(t=>({
        invoice_id:null,source:"gopay_merchant",external_event_id:String(t.id),
        event_type:"gopay."+(String(t.status||"unknown").toLowerCase()),
        amount:t.amount,verified:true,mode:"live",
        received_at:(t.transaction_time&&Number.isFinite(Date.parse(t.transaction_time)))?new Date(t.transaction_time).toISOString():new Date().toISOString(),
        payload:{id:t.id,order_id:t.order_id,amount:t.amount,status:t.status,payment_type:t.payment_type,
          transaction_time:t.transaction_time,payer_issuer:t.payer_issuer}
      }));
      let savedCount=0;
      if(eventRows.length){
        const saved=await db(env,"skieepay_payment_events?on_conflict=source,external_event_id",{method:"POST",
          headers:{Prefer:"resolution=ignore-duplicates,return=representation"},body:JSON.stringify(eventRows)});
        savedCount=Array.isArray(saved)?saved.length:0;
      }
      // Match only settled QRIS mutations against exactly one live pending invoice.
      const matching=await syncGopayPendingInvoices(env,null,tx);
      await db(env,"skieepay_provider_sessions?provider=eq.gopay_merchant",{method:"PATCH",
        body:JSON.stringify({last_polled_at:new Date().toISOString()})});
      return reply({ok:true,merchant_id:session.merchant_id,transactions,saved_count:savedCount,matching});
    }
    return jsonError("GoPay admin route not found",404);
  } catch(error) {return jsonError(error.message||"GoPay connection failed",502);}
}

// MD5 implementation for VIPayment's documented callback signature.
// Web Crypto does not provide MD5, so do not call crypto.subtle.digest("MD5").
function md5Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

  const shifts = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
  ];
  const k = Array.from({length:64}, (_,i) => Math.floor(Math.abs(Math.sin(i+1))*0x100000000) >>> 0);
  let a0=0x67452301, b0=0xefcdab89, c0=0x98badcfe, d0=0x10325476;
  const rotl = (x,n) => (x << n) | (x >>> (32-n));

  for (let offset=0; offset<paddedLength; offset+=64) {
    const words = new Uint32Array(16);
    for (let j=0; j<16; j++) words[j]=view.getUint32(offset+j*4,true);
    let a=a0,b=b0,c=c0,d=d0;
    for (let i=0; i<64; i++) {
      let f,g;
      if (i<16) { f=(b & c) | (~b & d); g=i; }
      else if (i<32) { f=(d & b) | (~d & c); g=(5*i+1)%16; }
      else if (i<48) { f=b ^ c ^ d; g=(3*i+5)%16; }
      else { f=c ^ (b | ~d); g=(7*i)%16; }
      const sum=(a+f+k[i]+words[g]) >>> 0;
      const next=(b+rotl(sum,shifts[i])) >>> 0;
      a=d; d=c; c=b; b=next;
    }
    a0=(a0+a)>>>0; b0=(b0+b)>>>0; c0=(c0+c)>>>0; d0=(d0+d)>>>0;
  }
  return [a0,b0,c0,d0].map(word =>
    [0,8,16,24].map(shift => ((word>>>shift)&255).toString(16).padStart(2,"0")).join("")
  ).join("");
}
function vipaymentSignature(env) {
  if (!env.VIPAYMENT_API_ID || !env.VIPAYMENT_API_KEY) return null;
  return md5Hex(env.VIPAYMENT_API_ID + env.VIPAYMENT_API_KEY);
}
async function vipaymentCallback(request, env) {
  const expected = await vipaymentSignature(env);
  if (!expected) return jsonError("VIPayment API credentials are not configured", 503);
  const sourceIp = request.headers.get("CF-Connecting-IP") || "";
  if (env.VIPAYMENT_ENFORCE_IP !== "false" && sourceIp !== "178.248.73.218") {
    return jsonError("Callback source IP is not allowed", 403);
  }
  const supplied = (request.headers.get("X-Client-Signature") || "").trim().toLowerCase();
  if (!supplied || supplied.length !== expected.length ||
      [...supplied].reduce((n, c, i) => n | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) !== 0) {
    return jsonError("Invalid VIPayment callback signature", 401);
  }
  const raw = await request.text();
  let payload;
  try { payload = JSON.parse(raw); } catch { return jsonError("Invalid JSON payload"); }
  const item = payload?.data?.trxid ? payload.data : payload;
  const trxid = String(item?.trxid || "").trim();
  const status = String(item?.status || "").toLowerCase();
  const note = item?.note == null ? null : String(item.note).slice(0, 1000);
  const price = Number.isSafeInteger(Number(item?.price)) ? Number(item.price) : null;
  if (!trxid || !["waiting", "processing", "success", "error"].includes(status)) {
    return jsonError("Missing trxid or unsupported status");
  }
  const result = await db(env, "rpc/skieepay_apply_vipayment_callback", {
    method: "POST",
    body: JSON.stringify({
      p_trxid: trxid,
      p_status: status,
      p_note: note,
      p_price: price,
      p_payload: payload
    })
  });
  return reply({ ok: true, provider: "VIPayment", result });
}

export default {
  async scheduled(controller, env, ctx) {
    try {
      const session = await loadGopaySession(env);
      if (!session || !session.refresh_token) return;
      const expires = Date.parse(session.expires_at || "");
      // Refresh within six hours of expiry; hourly cron keeps the session warm.
      if (!Number.isFinite(expires) || Date.now() >= expires - 6 * 60 * 60 * 1000) {
        await refreshGopaySession(env, session);
      }
    } catch (error) {
      console.error("SkieePay scheduled GoPay refresh failed:", error.message || "unknown error");
    }
  },
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return reply({ ok: true, service: "SkieePay", mode: "vipayment-webhook-ready", vipayment_webhook: !!(env.VIPAYMENT_API_ID && env.VIPAYMENT_API_KEY), live_payments: false });
    }
    const publicInvoiceMatch = url.pathname.match(/^\/public\/invoices\/(SKP[0-9A-F]{16}|SKP[0-9A-F]{32})$/i);
    if (publicInvoiceMatch && request.method === "GET") {
      try {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return jsonError("Server is not configured", 503);
        const code = publicInvoiceMatch[1].toUpperCase();
        let rows = await db(env, "skieepay_invoices?invoice_code=eq." + encodeURIComponent(code) +
          "&select=id,invoice_code,amount,currency,status,payment_method,payment_payload,expires_at,created_at,paid_at,mode,provider_reference,payment_provider&limit=1");
        if (!rows.length) return jsonError("Invoice not found", 404);
        if (rows[0].mode === "live" && rows[0].status === "pending") {
          try { await syncGopayPendingInvoices(env,code); } catch (syncError) { console.error("GoPay invoice sync:",syncError.message||"failed"); }
          rows = await db(env, "skieepay_invoices?invoice_code=eq." + encodeURIComponent(code) +
            "&select=id,invoice_code,amount,currency,status,payment_method,payment_payload,expires_at,created_at,paid_at,mode,provider_reference,payment_provider&limit=1");
        }
        return new Response(JSON.stringify({ ok: true, invoice: rows[0] }), {
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors }
        });
      } catch (error) {
        return jsonError(error.message || "Invoice lookup failed", 500);
      }
    }
    if (url.pathname.startsWith("/admin/gopay/")) {
      return await gopayAdminRoutes(request, env, url);
    }
    if (url.pathname === "/webhooks/vipayment" && request.method === "POST") {
      try { return await vipaymentCallback(request, env); }
      catch (error) { return jsonError(error.message || "Callback processing failed", 500); }
    }
    if (url.pathname === "/webhooks/payment" && request.method === "POST") {
      return jsonError("Payment rail webhook is not configured. No invoice was marked paid.", 501);
    }
    const apiMode = await authorized(request, env);
    if (!apiMode) return jsonError("Unauthorized", 401);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return jsonError("Server is not configured", 503);

    try {
      if (url.pathname === "/v1/businesses" && request.method === "GET") {
        const businesses = await db(env, "skieepay_businesses?select=id,code,name,status,created_at&order=created_at.asc");
        return reply({ ok: true, businesses });
      }
      if (url.pathname === "/v1/invoices" && request.method === "POST") {
        const body = await request.json();
        const amount = Number(body.amount);
        if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000) return jsonError("amount must be a positive integer in IDR");
        const mode = String(body.mode || apiMode);
        if (!["test","live"].includes(mode) || mode !== apiMode) return jsonError("API key mode does not match invoice mode",403);
        if (mode === "live" && env.SKIEEPAY_LIVE_ENABLED !== "true") return jsonError("Live payments are still disabled pending sandbox verification",409);
        const expiresMinutes = Math.min(60, Math.max(5, Number(body.expires_minutes) || 15));
        let paymentPayload = JSON.stringify({mode:"test",sandbox:true});
        let qrString = null;
        if (mode === "live") {
          const session = await getValidGopaySession(env);
          if (!session.qris_static) return jsonError("Static QRIS merchant belum dikonfigurasi",409);
          qrString = makeDynamicGopayQris(session.qris_static,amount);
          paymentPayload = JSON.stringify({source:"gopay_merchant_static_qris",mode:"live",qr_string:qrString});
        }
        const created = await db(env,"rpc/skieepay_create_invoice_mode",{method:"POST",body:JSON.stringify({
          p_amount:amount,p_order_id:body.order_id||null,
          p_customer_ref:body.customer_ref?String(body.customer_ref).slice(0,120):null,
          p_payment_method:"qris",p_payment_payload:paymentPayload,p_expires_minutes:expiresMinutes,p_mode:mode
        })});
        if (!created?.invoice_code) return jsonError("Invoice creation failed",500);
        return reply({ok:true,invoice:created,qr_string:qrString,qris_mode:mode==="live"?"gopay_merchant_dynamic":"sandbox_simulation"},201);
      }
      const vipMatch = url.pathname.match(/^\/v1\/invoices\/([0-9a-f-]{36})\/vipayment$/i);
      if (vipMatch && request.method === "POST") {
        const body = await request.json();
        const trxid = String(body.trxid || "").trim();
        if (!trxid || trxid.length > 120) return jsonError("A valid VIPayment trxid is required");
        const rows = await db(env, "skieepay_invoices?id=eq." + encodeURIComponent(vipMatch[1]) + "&select=id,status", {
          method: "PATCH",
          body: JSON.stringify({ vipayment_trxid: trxid, fulfillment_status: "waiting", updated_at: new Date().toISOString() })
        });
        if (!rows || !rows.length) return jsonError("Invoice not found", 404);
        return reply({ ok: true, invoice: rows[0] });
      }
      const match = url.pathname.match(/^\/v1\/invoices\/([0-9a-f-]{36})$/i);
      if (match && request.method === "GET") {
        const rows = await db(env, "skieepay_invoices?id=eq." + encodeURIComponent(match[1]) + "&select=*");
        if (!rows.length) return jsonError("Invoice not found", 404);
        return reply({ ok: true, invoice: rows[0] });
      }
      if (url.pathname === "/v1/events/payment" && request.method === "POST") {
        return jsonError("Payment verification adapter is not connected. No invoice was marked paid.", 501);
      }
      return jsonError("Route not found", 404);
    } catch (error) {
      return jsonError(error.message || "Internal error", 500);
    }
  }
};
