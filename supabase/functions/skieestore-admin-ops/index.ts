import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const ORIGINS=new Set(["https://skieestore.biz.id","https://www.skieestore.biz.id","https://skieestore.pages.dev"]);
const headers=(o:string|null)=>({"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS",...(o&&ORIGINS.has(o)?{"Access-Control-Allow-Origin":o}:{})});
const reply=(d:unknown,s=200,o:string|null=null)=>new Response(JSON.stringify(d),{status:s,headers:headers(o)});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin"); if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=="POST")return reply({ok:false,error:"Method not allowed"},405,origin);
 if(origin&&!ORIGINS.has(origin))return reply({ok:false,error:"Origin tidak diizinkan"},403,origin);
 const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!service)return reply({ok:false,error:"Server belum dikonfigurasi"},503,origin);
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return reply({ok:false,error:"Sesi admin diperlukan"},401,origin);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data:ud,error:ue}=await db.auth.getUser(token);const user=ud?.user;if(ue||!user)return reply({ok:false,error:"Sesi tidak valid"},401,origin);
  const {data:admin,error:ae}=await db.from("xpaypoint_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(ae||!admin)return reply({ok:false,error:"Akses admin ditolak"},403,origin);
  const b=await req.json().catch(()=>({}));
  if(b.action==="vipayment_balance"){
   const key=Deno.env.get("VIPAYMENT_API_KEY");if(!key)return reply({ok:false,error:"VIPAYMENT_API_KEY belum ada di Supabase secrets"},503,origin);
   const r=await fetch("https://xpaypoint-vipayment-gateway.xpaybantuan.workers.dev/vipayment-catalog",{method:"POST",headers:{"x-vipayment-key":key,"Accept":"application/json"},signal:AbortSignal.timeout(20000)});
   const d=await r.json().catch(()=>null);if(!r.ok||d?.ok!==true)return reply({ok:false,error:"Gagal membaca profil VIPayment"},502,origin);
   const p=d.profile?.data??d.profile??{};return reply({ok:true,balance:p.saldo??p.balance??p.deposit??p.wallet??null,account_level:p.level??null,checked_at:new Date().toISOString()},200,origin);
  }
  if(b.action==="members_list"){
   const users:any[]=[];for(let page=1;page<=20;page++){const {data,error}=await db.auth.admin.listUsers({page,perPage:500});if(error)throw error;users.push(...(data.users||[]).map((u:any)=>({user_id:u.id,email:u.email||"",created_at:u.created_at,last_sign_in_at:u.last_sign_in_at})));if(!data.users||data.users.length<500)break;}
   const {data:members,error}=await db.from("xpaypoint_memberships").select("user_id,tier,starts_at,expires_at,member_expired_at,is_manual,updated_at");if(error)throw error;const map=new Map((members||[]).map((m:any)=>[m.user_id,m]));
   return reply({ok:true,members:users.map(u=>({...u,membership:map.get(u.user_id)||{tier:"free",expires_at:null,is_manual:false}}))},200,origin);
  }
  if(b.action==="member_set"){
   const id=String(b.user_id||""),tier=String(b.tier||"free");if(!id||!["free","pass","vip","pro"].includes(tier))return reply({ok:false,error:"Data member tidak valid"},400,origin);
   const now=new Date(),expiry=tier==="free"?null:(b.expires_at?new Date(b.expires_at):new Date(now.getTime()+30*86400000));if(expiry&&!Number.isFinite(expiry.getTime()))return reply({ok:false,error:"Tanggal kedaluwarsa tidak valid"},400,origin);
   const {data,error}=await db.from("xpaypoint_memberships").upsert({user_id:id,tier,starts_at:tier==="free"?null:now.toISOString(),expires_at:expiry?.toISOString()??null,member_expired_at:expiry?.toISOString()??null,is_manual:true,updated_by:user.id,updated_at:now.toISOString()},{onConflict:"user_id"}).select().single();if(error)throw error;return reply({ok:true,membership:data},200,origin);
  }
  if(b.action==="member_extend"){
   const id=String(b.user_id||"");const {data:old,error:re}=await db.from("xpaypoint_memberships").select("tier,expires_at").eq("user_id",id).maybeSingle();if(re)throw re;if(!old||old.tier==="free")return reply({ok:false,error:"Member belum memiliki tier berbayar"},409,origin);
   const base=old.expires_at&&new Date(old.expires_at)>new Date()?new Date(old.expires_at):new Date();base.setDate(base.getDate()+30);
   const {data,error}=await db.from("xpaypoint_memberships").update({expires_at:base.toISOString(),member_expired_at:base.toISOString(),is_manual:true,updated_by:user.id,updated_at:new Date().toISOString()}).eq("user_id",id).select().single();if(error)throw error;return reply({ok:true,membership:data},200,origin);
  }
  if(b.action==="refresh_supplier_status"){
   const id=String(b.order_id||"");if(!id)return reply({ok:false,error:"order_id wajib diisi"},400,origin);
   const {data:order,error:oe}=await db.from("xpaypoint_orders").select("id,order_code,status,supplier_reference").eq("id",id).maybeSingle();if(oe)throw oe;
   if(!order)return reply({ok:false,error:"Pesanan tidak ditemukan"},404,origin);
   if(!order.supplier_reference)return reply({ok:false,error:"Pesanan belum memiliki referensi VIPayment"},409,origin);
   const key=Deno.env.get("VIPAYMENT_API_KEY");if(!key)return reply({ok:false,error:"VIPAYMENT_API_KEY belum dipasang"},503,origin);
   const response=await fetch("https://xpaypoint-vipayment-gateway.xpaybantuan.workers.dev/vipayment-status",{method:"POST",headers:{"Content-Type":"application/json","x-vipayment-key":key},body:JSON.stringify({trxid:order.supplier_reference}),signal:AbortSignal.timeout(20000)});
   const payload=await response.json().catch(()=>null);if(!response.ok||payload?.ok!==true)return reply({ok:false,error:"Gagal meminta status VIPayment"},502,origin);
   const body=payload.body,row=Array.isArray(body?.data)?body.data[0]:body?.data,status=String(row?.status||"").toLowerCase();
   if(body?.result!==true||!["waiting","processing","success","error"].includes(status))return reply({ok:false,error:body?.message||"Status supplier belum valid"},502,origin);
   const patch:any={supplier_status:status,updated_at:new Date().toISOString()};
   if(status==="success"){patch.status="success";patch.fulfilled_at=new Date().toISOString();patch.failure_reason=null;}
   if(status==="error"){patch.status="failed";patch.failure_reason=String(row?.note||body?.message||"VIPayment error").slice(0,500);}
   const {error:up}=await db.from("xpaypoint_orders").update(patch).eq("id",id);if(up)throw up;
   return reply({ok:true,order_code:order.order_code,supplier_status:status,order_status:patch.status||order.status},200,origin);
  }
  if(b.action==="product_price_update"){
   const items=Array.isArray(b.items)?b.items:[];if(!items.length||items.length>500)return reply({ok:false,error:"Daftar produk tidak valid (1–500)"},400,origin);
   let updated=0;for(const x of items){const id=String(x.id||""),normal=Number(x.sell_price),meta=x.metadata&&typeof x.metadata==="object"?x.metadata:{};if(!id||!Number.isSafeInteger(normal)||normal<=0)continue;
    const {data:product,error:pe}=await db.from("xpaypoint_products").select("base_price").eq("id",id).maybeSingle();if(pe)throw pe;if(!product)continue;
    const min=Math.ceil(Number(product.base_price||0)*1.007);
    const tiers=[Number(meta?.member_prices?.pass),Number(meta?.member_prices?.vip),Number(meta?.member_prices?.pro)];
    if(normal<min||tiers.some(v=>!Number.isSafeInteger(v)||v<min)) return reply({ok:false,error:"Harga normal dan tier member harus minimal modal + MDR QRIS 0,7%",product_id:id},409,origin);
    const {error}=await db.from("xpaypoint_products").update({sell_price:normal,metadata:meta,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;updated++;
   }
   return reply({ok:true,updated},200,origin);
  }

  if(b.action==="finance_summary"){
   const now=new Date(),wibNow=new Date(now.getTime()+7*3600000),wibStart=(y:number,m:number,d:number)=>new Date(Date.UTC(y,m,d)-7*3600000),yearStart=wibStart(wibNow.getUTCFullYear(),0,1).toISOString();
   const [{data:orders,error:oe},{data:payments,error:pe},{data:subs,error:se}]=await Promise.all([
    db.from("xpaypoint_orders").select("id,product_id,base_price_snapshot,sell_price,payable_amount,status,created_at").in("status",["paid","processing","success"]).gte("created_at",yearStart).limit(10000),
    db.from("xpaypoint_payments").select("order_id,payment_type,status,amount,paid_at,created_at").eq("status","paid").eq("purpose","topup").gte("paid_at",yearStart).limit(10000),
    db.from("skieestore_membership_transactions").select("id,tier,amount,gateway,payment_type,status,paid_at,created_at").eq("status","paid").gte("paid_at",yearStart).limit(10000)
   ]);
   if(oe||pe||se)throw oe||pe||se;
   const ids=[...new Set((orders||[]).map(x=>x.product_id).filter(Boolean))];
   const {data:products,error:pr}=ids.length?await db.from("xpaypoint_products").select("id,base_price").in("id",ids):{data:[],error:null};if(pr)throw pr;
   const costMap=new Map((products||[]).map(x=>[x.id,Number(x.base_price||0)]));
   const paymentMap=new Map((payments||[]).map(x=>[x.order_id,x]));
   const periods=[["day",wibStart(wibNow.getUTCFullYear(),wibNow.getUTCMonth(),wibNow.getUTCDate())],["month",wibStart(wibNow.getUTCFullYear(),wibNow.getUTCMonth(),1)],["year",wibStart(wibNow.getUTCFullYear(),0,1)]];
   const summary={};
   for(const [key,start] of periods){
    const os=(orders||[]).filter(x=>{const p=paymentMap.get(x.id);return p&&new Date(p.paid_at||p.created_at)>=start;}),ms=(subs||[]).filter(x=>new Date(x.paid_at||x.created_at)>=start);
    const calc=(rows,kind)=>rows.reduce((a,x)=>{const pay=kind==="topup"?paymentMap.get(x.id):null;const amount=kind==="topup"?Number(pay?.amount||0):Number(x.amount||0);const modal=kind==="topup"?Number(x.base_price_snapshot??costMap.get(x.product_id)??0):0;const mdr=(kind==="topup"?pay?.payment_type:x.payment_type)==="qris"?Math.ceil(amount*.007):0;a.gross+=amount;a.modal+=modal;a.mdr+=mdr;a.net+=amount-modal-mdr;return a;},{gross:0,modal:0,mdr:0,net:0});
    summary[key]={topup:calc(os,"topup"),membership:calc(ms,"member"),topup_count:os.length,membership_count:ms.length};
   }
   return reply({ok:true,timezone:"Asia/Jakarta",currency:"IDR",summary,generated_at:new Date().toISOString()},200,origin);
  }
  if(b.action==="membership_transactions_list"){
   const {data,error}=await db.from("skieestore_membership_transactions").select("id,user_id,tier,amount,gateway,payment_type,gateway_reference,status,paid_at,created_at").order("created_at",{ascending:false}).limit(200);if(error)throw error;
   const ids=[...new Set((data||[]).map(x=>x.user_id).filter(Boolean))],users=new Map();
   for(const id of ids){const {data:u}=await db.auth.admin.getUserById(id);if(u?.user)users.set(id,u.user.email||"");}
   return reply({ok:true,transactions:(data||[]).map(x=>({...x,email:users.get(x.user_id)||""}))},200,origin);
  }
  if(b.action==="banner_list"){
   const {data,error}=await db.from("site_banners").select("*").order("sort_order").order("created_at",{ascending:false});if(error)throw error;
   return reply({ok:true,banners:data||[]},200,origin);
  }
  if(b.action==="banner_save"){
   const id=String(b.id||"").trim(),title=String(b.title||"").slice(0,120),imagePath=String(b.image_path||"").trim(),target=String(b.target_url||"").trim(),ratio=String(b.aspect_ratio||"16:9");
   const sort=Number(b.sort_order??100);
   if(!imagePath||imagePath.length>500||!Number.isInteger(sort)||!["16:9","2:1"].includes(ratio))return reply({ok:false,error:"Data banner tidak valid."},400,origin);
   if(target&&!/^(https:\/\/|\/)/i.test(target))return reply({ok:false,error:"Link tujuan harus URL HTTPS atau path internal."},400,origin);
   const row={title,image_path:imagePath,image_url:String(b.image_url||"").slice(0,1000)||null,target_url:target||null,sort_order:sort,is_active:b.is_active!==false,aspect_ratio:ratio,updated_at:new Date().toISOString(),created_by:user.id};
   const q=id?db.from("site_banners").update(row).eq("id",id):db.from("site_banners").insert(row);
   const {data,error}=await q.select("*").single();if(error)throw error;return reply({ok:true,banner:data},200,origin);
  }
  if(b.action==="banner_delete"){
   const id=String(b.id||"");if(!id)return reply({ok:false,error:"ID banner wajib diisi."},400,origin);
   const {data:banner,error:be}=await db.from("site_banners").select("image_path").eq("id",id).maybeSingle();if(be)throw be;if(!banner)return reply({ok:false,error:"Banner tidak ditemukan."},404,origin);
   const {error}=await db.from("site_banners").delete().eq("id",id);if(error)throw error;
   if(banner.image_path)await db.storage.from("skieestore-banners").remove([banner.image_path]);
   return reply({ok:true},200,origin);
  }
  if(b.action==="store_status_set"){
   const open=b.open===true;
   const {error}=await db.from("xpaypoint_store_settings").upsert({setting_key:"store_status",setting_value:{open,message:String(b.message||"Toko sedang maintenance. Silakan kembali beberapa saat lagi.").slice(0,240)},updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:"setting_key"});if(error)throw error;
   return reply({ok:true,open},200,origin);
  }
  if(b.action==="flash_save"){
   const id=String(b.id||""),productId=String(b.product_id||""),price=Number(b.promo_price),start=new Date(b.starts_at||Date.now()),end=new Date(b.ends_at||0);
   if(!productId||!Number.isSafeInteger(price)||price<=0||!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start)return reply({ok:false,error:"Data Flash Sale tidak valid."},400,origin);
   const {data:p,error:pr}=await db.from("xpaypoint_products").select("sell_price,base_price").eq("id",productId).maybeSingle();if(pr)throw pr;if(!p)return reply({ok:false,error:"Produk tidak ditemukan."},404,origin);
   const floor=Math.ceil(Number(p.base_price||0)*1.007);if(price>=Number(p.sell_price)||price<floor)return reply({ok:false,error:"Harga promo harus di bawah harga normal dan minimal modal + MDR QRIS 0,7%."},409,origin);
   const row={product_id:productId,promo_price:price,starts_at:start.toISOString(),ends_at:end.toISOString(),is_active:b.is_active!==false,created_by:user.id,updated_at:new Date().toISOString()};
   const q=id?db.from("xpaypoint_flash_sales").update(row).eq("id",id):db.from("xpaypoint_flash_sales").upsert(row,{onConflict:"product_id"});
   const {data,error}=await q.select("*").single();if(error)throw error;return reply({ok:true,flash_sale:data},200,origin);
  }
  return reply({ok:false,error:"Action tidak dikenal"},400,origin);
 }catch(e){console.error("skieestore-admin-ops",e);return reply({ok:false,error:e instanceof Error?e.message:"Operasi admin gagal"},500,origin);}
});