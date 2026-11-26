const SUPABASE_FUNCTION="https://rjgeitbkpcyymgemcztx.supabase.co/functions/v1/skieestore-duitku";
const SUPABASE_ANON_KEY="sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
export async function onRequest({request}) {
  const headers={"apikey":SUPABASE_ANON_KEY,"Content-Type":request.headers.get("Content-Type")||"application/json"};
  const authorization=request.headers.get("Authorization");
  if(authorization)headers.Authorization=authorization;
  const method=request.method;
  const init={method,headers};
  if(method!=="GET"&&method!=="HEAD"&&method!=="OPTIONS")init.body=await request.arrayBuffer();
  const target=new URL(SUPABASE_FUNCTION);
  target.search=new URL(request.url).search;
  try {
    const upstream=await fetch(target.toString(),init);
    const responseHeaders=new Headers(upstream.headers);
    responseHeaders.set("Cache-Control","no-store");
    responseHeaders.set("Access-Control-Allow-Origin","https://skieestore.biz.id");
    responseHeaders.set("Access-Control-Allow-Headers","authorization,content-type");
    responseHeaders.set("Access-Control-Allow-Methods","GET,POST,OPTIONS");
    return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
  } catch(error) {
    return new Response(JSON.stringify({ok:false,code:"DUITKU_BACKEND_UNAVAILABLE",message:"Layanan pembayaran belum dapat dihubungi."}),{status:502,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }
}
