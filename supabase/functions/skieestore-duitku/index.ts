import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const SITE="https://skieestore.biz.id";
const cors={"Access-Control-Allow-Origin":SITE,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Cache-Control":"no-store"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const hex=(b:Uint8Array)=>Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");
async function sha256(v:string){return hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v))));}
async function hmac(secret:string,v:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(new Uint8Array(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v))));}
const clean=(v:unknown,n=180)=>String(v??"").slice(0,n);
function cfg(){const merchant=Deno.env.get("DUITKU_MERCHANT_CODE")||"",apiKey=Deno.env.get("DUITKU_API_KEY")||"";return {merchant,apiKey,missing:[...(!merchant?["DUITKU_MERCHANT_CODE"]:[]),...(!apiKey?["DUITKU_API_KEY"]:[])],host:(Deno.env.get("DUITKU_ENV")||"production")==="sandbox"?"https://sandbox.duitku.com":"https://passport.duitku.com",method:(Deno.env.get("DUITKU_PAYMENT_METHOD")||"NQ").toUpperCase()};}
const supabaseUrl=()=>Deno.env.get("SUPABASE_URL")||"";
const serviceKey=()=>Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=()=>createClient(supabaseUrl(),serviceKey(),{auth:{persistSession:false,autoRefreshToken:false}});
async function authUser(req:Request){const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return null;const {data,error}=await db().auth.getUser(token);if(error||!data.user)throw new Error("INVALID_SESSION");return data.user;}
async function createInvoice(amount:number,merchantOrderId:string,details:string,email:string,phone:string,returnUrl:string){
 const c=cfg();if(c.missing.length)return {error:"DUITKU_NOT_CONFIGURED",missing:c.missing};
 if(!["NQ","SP","SQ","GQ"].includes(c.method))return {error:"DUITKU_QRIS_METHOD_INVALID"};
 if(!Number.isSafeInteger(amount)||amount<1)return {error:"DUITKU_MINIMUM_PAYMENT_1"};
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:"DUITKU_EMAIL_REQUIRED"};
 const signature=await hmac(c.apiKey,c.merchant+merchantOrderId+String(amount));
 const payload={merchantCode:c.merchant,paymentAmount:amount,paymentMethod:c.method,merchantOrderId,productDetails:clean(details,255),email:clean(email,50),phoneNumber:clean(phone,50),customerVaName:"SKIEESTORE",callbackUrl:SITE+"/api/duitku?action=callback",returnUrl,signature,expiryPeriod:10};
 let response:Response;try{response=await fetch(c.host+"/webapi/api/merchant/v2/inquiry",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});}catch{return {error:"DUITKU_NETWORK_ERROR"};}
 const data=await response.json().catch(()=>null);
 if(!response.ok||!data||data.statusCode!=="00"||(!data.paymentUrl&&!data.qrString))return {error:"DUITKU_INQUIRY_FAILED",provider_code:data?.statusCode||null,provider_message:data?.statusMessage||null};
 return {data,payment_url:data.paymentUrl||null,qr_string:data.qrString||null,reference:String(data.reference||""),amount:Number(data.amount||amount),expires_at:new Date(Date.now()+600000).toISOString()};
}
async function callback(req:Request){
 const c=cfg();if(c.missing.length)return new Response("NOT_CONFIGURED",{status:503});
 const raw=await req.text();if(raw.length>20000)return new Response("INVALID",{status:413});
 const p=Object.fromEntries(new URLSearchParams(raw).entries());
 const merchant=String(p.merchantCode||""),amount=String(p.amount||""),orderId=String(p.merchantOrderId||""),signature=String(p.signature||""),resultCode=String(p.resultCode||"");
 if(merchant!==c.merchant||!orderId||!/^\d+$/.test(amount)||!signature)return new Response("INVALID",{status:400});
 const expected=await hmac(c.apiKey,merchant+amount+orderId);if(signature.toLowerCase()!==expected.toLowerCase())return new Response("INVALID_SIGNATURE",{status:401});
 const supa=db();
 if(resultCode!=="00"){
  const status=resultCode==="01"?"failed":"expired";
  await supa.from("xpaypoint_payments").update({status,raw_callback:p,updated_at:new Date().toISOString()}).eq("merchant_order_id",orderId).eq("status","pending");
  await supa.from("skieestore_membership_transactions").update({status,raw_data:{duitku_callback:p},updated_at:new Date().toISOString()}).eq("gateway_reference",orderId).eq("status","pending");
  return new Response("SUCCESS",{status:200});
 }
 const {data:result,error}=await supa.rpc("skieestore_apply_duitku_callback",{p_merchant_order_id:orderId,p_amount:Number(amount),p_reference:String(p.reference||""),p_payload:p,p_paid_at:new Date().toISOString()});
 if(error||!result?.ok){console.error("Duitku callback DB processing failed",error?.message);return new Response("PROCESSING_ERROR",{status:500});}
 if(result.result==="topup_paid"&&result.order_id){
  const res=await fetch(supabaseUrl()+"/functions/v1/vipayment-fulfill",{method:"POST",headers:{Authorization:"Bearer "+serviceKey(),apikey:serviceKey(),"Content-Type":"application/json"},body:JSON.stringify({action:"fulfill",order_id:result.order_id})});
  if(!res.ok)console.error("VIPayment fulfillment failed",res.status,await res.text().catch(()=> ""));
 }
 const bot=Deno.env.get("TELEGRAM_BOT_TOKEN"),chat=Deno.env.get("TELEGRAM_CHAT_ID");
 if(bot&&chat){const msg=result.result==="membership_paid"?"SKIEESTORE: pembayaran "+String(result.tier||"").toUpperCase()+" berhasil. Member aktif sampai "+result.expires_at+".":"SKIEESTORE: pembayaran top up berhasil. Pesanan "+String(result.order_code||result.order_id)+" diteruskan ke VIPayment.";try{await fetch("https://api.telegram.org/bot"+bot+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chat,text:msg,disable_web_page_preview:true})});}catch(e){console.error("Telegram notify failed",String(e));}}
 return new Response("SUCCESS",{status:200});
}
async function storeOpen(){const {data,error}=await db().from("xpaypoint_store_settings").select("setting_value").eq("setting_key","store_status").maybeSingle();if(error)throw error;return data?.setting_value?.open!==false;}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 const url=new URL(req.url),action=url.searchParams.get("action")||"";
 if(req.method==="GET"&&url.searchParams.get("action")==="google_status"){
  const r=await fetch(supabaseUrl()+"/auth/v1/settings",{headers:{apikey:"sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR"}});
  const s=await r.json().catch(()=>({}));
  return json({ok:r.ok,google_enabled:!!s.external?.google?.enabled});
 }
 if(req.method==="GET"){const c=cfg();return json({ok:true,provider:"Duitku QRIS",configured:c.missing.length===0,missing:c.missing,method:c.method,environment:Deno.env.get("DUITKU_ENV")||"production",telegram_configured:!!(Deno.env.get("TELEGRAM_BOT_TOKEN")&&Deno.env.get("TELEGRAM_CHAT_ID"))});}
 if(action==="callback")return callback(req);
 if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
 const c=cfg();if(c.missing.length)return json({ok:false,code:"DUITKU_NOT_CONFIGURED",missing:c.missing},503);
 const body=await req.json().catch(()=>null);if(!body)return json({ok:false,code:"INVALID_JSON"},400);
 const supa=db();
 if(action==="membership_create"){
  if(!(await storeOpen()))return json({ok:false,code:"STORE_MAINTENANCE",message:"Toko sedang maintenance."},503);
  let user;try{user=await authUser(req);}catch{return json({ok:false,code:"INVALID_SESSION"},401);}
  if(!user)return json({ok:false,code:"LOGIN_REQUIRED"},401);
  const tier=String(body.tier||"").toLowerCase(),prices:Record<string,number>={pass:10000,vip:15000,pro:20000};
  if(!prices[tier])return json({ok:false,code:"INVALID_MEMBER_TIER"},400);
  const amount=prices[tier],merchantOrderId="SSM"+Date.now().toString(36).toUpperCase()+crypto.randomUUID().replace(/-/g,"").slice(0,10).toUpperCase();
  const {data:payment,error:payErr}=await supa.from("xpaypoint_payments").insert({user_id:user.id,gateway:"duitku",payment_type:"qris",purpose:"membership",amount,status:"pending",merchant_order_id:merchantOrderId,gateway_reference:merchantOrderId,expires_at:new Date(Date.now()+600000).toISOString()}).select("id").single();
  if(payErr||!payment)return json({ok:false,code:"PAYMENT_INTENT_CREATE_FAILED",detail:payErr?.message},502);
  const {data:tx,error:txErr}=await supa.from("skieestore_membership_transactions").insert({user_id:user.id,tier,amount,gateway:"duitku",payment_type:"qris",status:"pending",payment_id:payment.id,gateway_reference:merchantOrderId,raw_data:{merchant_order_id:merchantOrderId}}).select("id").single();
  if(txErr||!tx){await supa.from("xpaypoint_payments").update({status:"failed"}).eq("id",payment.id);return json({ok:false,code:"MEMBERSHIP_INTENT_CREATE_FAILED",detail:txErr?.message},502);}
  await supa.from("xpaypoint_payments").update({membership_transaction_id:tx.id}).eq("id",payment.id);
  const invoice=await createInvoice(amount,merchantOrderId,"Langganan SKIEE "+tier.toUpperCase()+" 30 hari",user.email||"",user.phone||body.phone||"",SITE+"/profil?membership_payment=return");
  if(invoice.error){await supa.from("xpaypoint_payments").update({status:"failed"}).eq("id",payment.id);await supa.from("skieestore_membership_transactions").update({status:"failed"}).eq("id",tx.id);return json({ok:false,code:invoice.error,missing:invoice.missing||[]},503);}
  await supa.from("xpaypoint_payments").update({gateway_reference:invoice.reference||merchantOrderId,checkout_url:invoice.payment_url,qr_string:invoice.qr_string,expires_at:invoice.expires_at,raw_callback:invoice.data,updated_at:new Date().toISOString()}).eq("id",payment.id);
  return json({ok:true,tier,payment:{id:payment.id,amount,payment_url:invoice.payment_url,qr_string:invoice.qr_string,expires_at:invoice.expires_at}},201);
 }
 if(action==="topup_create"){
  if(!(await storeOpen()))return json({ok:false,code:"STORE_MAINTENANCE",message:"Toko sedang maintenance."},503);
  const orderId=String(body.order_id||""),guestToken=String(body.guest_token||"");
  if(!orderId||guestToken.length<32||guestToken.length>128)return json({ok:false,code:"INVALID_ORDER_ACCESS"},400);
  const hash=await sha256(guestToken);
  const {data:order,error:orderErr}=await supa.from("xpaypoint_orders").select("id,order_code,user_id,game_id,product_id,target_id,zone_id,product_name_snapshot,game_name_snapshot,sell_price,payable_amount,discount_xc,base_price_snapshot,status,receipt_email,receipt_whatsapp,guest_token_hash").eq("id",orderId).eq("guest_token_hash",hash).maybeSingle();
  if(orderErr||!order)return json({ok:false,code:"ORDER_NOT_FOUND"},404);
  if(order.status!=="pending_payment")return json({ok:false,code:"ORDER_NOT_PAYABLE"},409);
  let user=null;try{user=await authUser(req);}catch{return json({ok:false,code:"INVALID_SESSION"},401);}
  const {data:product,error:productErr}=await supa.from("xpaypoint_products").select("base_price,sell_price,metadata").eq("id",order.product_id).single();
  if(productErr||!product)return json({ok:false,code:"PRODUCT_NOT_FOUND"},404);
  const basePrice=Number(product.base_price||0),normalPrice=Number(product.sell_price||order.sell_price||0);
  let finalPrice=normalPrice;
  if(user){
   const {data:member}=await supa.from("xpaypoint_memberships").select("tier,member_expired_at,expires_at").eq("user_id",user.id).maybeSingle();
   const expiry=member?.member_expired_at||member?.expires_at;
   if(member&&["pass","vip","pro"].includes(member.tier)&&expiry&&new Date(expiry)>new Date()){
    const special=Number(product.metadata?.member_prices?.[member.tier]||0);if(Number.isSafeInteger(special)&&special>0)finalPrice=Math.min(finalPrice,special);
   }
  }
  const {data:sales}=await supa.from("xpaypoint_flash_sales").select("promo_price").eq("product_id",order.product_id).eq("is_active",true).lte("starts_at",new Date().toISOString()).gt("ends_at",new Date().toISOString()).limit(1);
  if(sales?.[0])finalPrice=Math.min(finalPrice,Number(sales[0].promo_price));
  if(finalPrice<Math.ceil(basePrice*1.007))return json({ok:false,code:"PRICE_BELOW_COST_MDR",minimum:Math.ceil(basePrice*1.007)},409);
  const payable=Math.max(0,finalPrice-Number(order.discount_xc||0));
  if(payable<1)return json({ok:false,code:"DUITKU_MINIMUM_PAYMENT_1",minimum:1},409);
  const update={user_id:user?.id||order.user_id||null,sell_price:finalPrice,payable_amount:payable,base_price_snapshot:basePrice,updated_at:new Date().toISOString()};
  const {error:updateErr}=await supa.from("xpaypoint_orders").update(update).eq("id",order.id).eq("status","pending_payment");
  if(updateErr)return json({ok:false,code:"ORDER_PRICE_UPDATE_FAILED",detail:updateErr.message},502);
  const {data:prior}=await supa.from("xpaypoint_payments").select("id,amount,checkout_url,qr_string,expires_at").eq("order_id",order.id).eq("gateway","duitku").eq("status","pending").order("created_at",{ascending:false}).limit(1);
  if(prior?.[0]&&prior[0].expires_at&&new Date(prior[0].expires_at)>new Date()&&(prior[0].checkout_url||prior[0].qr_string))return json({ok:true,payment:{id:prior[0].id,order_code:order.order_code,amount:prior[0].amount,payment_url:prior[0].checkout_url,qr_string:prior[0].qr_string,expires_at:prior[0].expires_at},reused:true});
  const merchantOrderId="SKT"+Date.now().toString(36).toUpperCase()+crypto.randomUUID().replace(/-/g,"").slice(0,10).toUpperCase();
  const {data:payment,error:payErr}=await supa.from("xpaypoint_payments").insert({order_id:order.id,user_id:user?.id||order.user_id||null,gateway:"duitku",payment_type:"qris",purpose:"topup",amount:payable,status:"pending",merchant_order_id:merchantOrderId,gateway_reference:merchantOrderId,expires_at:new Date(Date.now()+600000).toISOString()}).select("id").single();
  if(payErr||!payment)return json({ok:false,code:"PAYMENT_INTENT_CREATE_FAILED",detail:payErr?.message},502);
  const invoice=await createInvoice(payable,merchantOrderId,order.game_name_snapshot+" - "+order.product_name_snapshot,order.receipt_email||user?.email||"",order.receipt_whatsapp||"",SITE+"/cek-pesanan?order_code="+encodeURIComponent(order.order_code));
  if(invoice.error){await supa.from("xpaypoint_payments").update({status:"failed",raw_callback:{error:invoice.error}}).eq("id",payment.id);return json({ok:false,code:invoice.error,missing:invoice.missing||[]},503);}
  await supa.from("xpaypoint_payments").update({gateway_reference:invoice.reference||merchantOrderId,checkout_url:invoice.payment_url,qr_string:invoice.qr_string,expires_at:invoice.expires_at,raw_callback:invoice.data,updated_at:new Date().toISOString()}).eq("id",payment.id);
  return json({ok:true,payment:{id:payment.id,order_code:order.order_code,amount:invoice.amount,payment_url:invoice.payment_url,qr_string:invoice.qr_string,expires_at:invoice.expires_at}},201);
 }
 return json({ok:false,code:"UNKNOWN_ACTION"},400);
});
