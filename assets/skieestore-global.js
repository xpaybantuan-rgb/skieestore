(()=>{"use strict";

/* Single source of truth for responsive navigation across all pages. */
(function(){
 const pathname=(window.location.pathname||"/").toLowerCase();
 const items=[
  {href:"/",label:"Beranda",active:pathname==="/",icon:'<svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/></svg>'},
  {href:"/cek-pesanan",label:"Cek Pesanan",active:pathname.startsWith("/cek"),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>'},
  {href:"/topup",label:"Top Up",active:pathname.startsWith("/topup"),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4"/></svg>'},
  {href:"/profil",label:"Profil",active:pathname.startsWith("/profil"),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>'}
 ];
 const links=items.map(({href,label,icon,active})=>
  '<a href="'+href+'" class="nav-item'+(active?' active" aria-current="page"':'"')+'><span class="skiee-svg-box" aria-hidden="true">'+icon+'</span><span>'+label+'</span></a>'
 ).join("");
 let dock=document.querySelector(".skiee-bottom-nav");
 if(!dock){
  dock=document.createElement("nav");
  dock.className="skiee-bottom-nav";
  dock.setAttribute("aria-label","Navigasi utama");
  document.body.appendChild(dock);
 }
 dock.innerHTML=links;
 dock.querySelectorAll(".nav-item").forEach(a=>{
  const href=a.getAttribute("href");
  const active=items.find(item=>item.href===href)?.active===true;
  a.classList.toggle("active",active);
  if(active)a.setAttribute("aria-current","page");
  else a.removeAttribute("aria-current");
 });
 const style=document.createElement("style");
 style.id="skiee-navigation-final";
 style.textContent=`
  @media(max-width:767px){
   .header .nav,.header nav.nav,nav.nav,.bottomnav{display:none!important;visibility:hidden!important}
   .skiee-bottom-nav{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;position:fixed!important;left:12px!important;right:12px!important;bottom:8px!important;z-index:2147483000!important;width:auto!important;max-width:480px!important;margin:0 auto!important;padding:5px!important;gap:5px!important;background:#fff!important;border:1px solid #0F172A!important;border-radius:12px!important;box-shadow:none!important;box-sizing:border-box!important}
   .skiee-bottom-nav .nav-item{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;min-width:0!important;width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;padding:3px!important;gap:2px!important;border:2px solid #0F172A!important;border-radius:8px!important;box-shadow:2px 2px 0 #0F172A!important;background:#fff!important;color:#0F172A!important;font-size:9.5px!important;line-height:1!important;font-weight:800!important;text-align:center!important;text-decoration:none!important;white-space:nowrap!important;transition:transform .08s ease,box-shadow .08s ease,background-color .15s ease!important;-webkit-tap-highlight-color:transparent}
   .skiee-bottom-nav .nav-item.active,.skiee-bottom-nav .nav-item[aria-current="page"]{background:#FFD600!important;color:#0F172A!important;box-shadow:2px 2px 0 #0F172A!important;transform:none!important}
   .skiee-bottom-nav .nav-item:active:not(.active):not([aria-current="page"]){transform:translate(2px,2px)!important;box-shadow:0 0 0 #0F172A!important}
   .skiee-bottom-nav .skiee-svg-box,.skiee-bottom-nav svg{display:block!important;width:15px!important;height:15px!important;flex:0 0 15px!important}
   .skiee-bottom-nav .nav-item>span:last-child{font-size:9.5px!important;white-space:nowrap!important;line-height:1!important}
   body:not(.chat-open){padding-bottom:0!important}
   #footer.xp-footer,.xp-footer#footer,footer.xp-footer{padding-bottom:82px!important;margin-bottom:0!important;scroll-margin-bottom:0!important}
  }
  @media(min-width:768px){.skiee-bottom-nav{display:none!important}}
  .header .nav{padding:5px!important;gap:4px!important;font-size:10px!important}
  .header .nav a{padding:8px 11px!important}
  .header .nav a.active,.header .nav a[aria-current="page"]{background:#FFD600!important;background-color:#FFD600!important;color:#191b22!important;transform:none!important;box-shadow:3px 3px 0 #0F172A!important}

  body:not(.chat-open) main{padding-bottom:0!important;margin-bottom:0!important}
  body:not(.chat-open) footer.xp-footer#footer,
  body:not(.chat-open) #footer.xp-footer,
  body:not(.chat-open) footer.xp-footer{padding-bottom:82px!important;margin-bottom:0!important}
  body:not(.chat-open)>header,
  body:not(.chat-open) header.header,
  body:not(.chat-open) header.top{background-color:#FFFFFF!important;border-bottom:2.5px solid #0F172A!important}
  body.chat-open .skiee-bottom-nav{display:none!important;visibility:hidden!important;pointer-events:none!important}
  .xp-footer .xp-foot-contact a[aria-label="WhatsApp Customer Service SKIEESTORE"]{color:#087BFF!important}
  .xp-footer .xp-foot-contact a[aria-label="WhatsApp Customer Service SKIEESTORE"] *{color:#087BFF!important}
  .xp-footer .xp-foot-contact a[aria-label="WhatsApp Customer Service SKIEESTORE"] svg,
  .xp-footer .xp-foot-contact a[aria-label="WhatsApp Customer Service SKIEESTORE"] svg *{fill:#087BFF!important;stroke:#087BFF!important}
 `;
 document.head.appendChild(style);
 // Mark all interactive store controls for the shared Neo-Brutalism press treatment.
 const markBrutalButtons = root => {
  const selector='button, input[type="submit"], .btn, .primary, .account, .catalog-more, .chip, .gamecard, .product-choice, .payment-option, .method-card, .shortcut, [role="button"]';
  const nodes=[];
  if(root && root.nodeType===1 && root.matches?.(selector)) nodes.push(root);
  if(root?.querySelectorAll) nodes.push(...root.querySelectorAll(selector));
  nodes.forEach(el=>{
   if(el.closest('#chatPanel,.chat-panel,.chat-history-panel,.ai-widget,[class*="chat"],[id*="chat"],[id*="ai"]')) return;
   el.classList.add('brutal-btn');
  });
 };
 markBrutalButtons(document);
 const brutalObserver=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)markBrutalButtons(node)})));
 brutalObserver.observe(document.documentElement,{childList:true,subtree:true});
})();
const $=id=>document.getElementById(id);
const SUPABASE_URL="https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY="sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
let toastTimer=0;
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(msg){const t=$("toast");if(!t){alert(msg);return}t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,2600)}
if($("chatPanel") && $("chatToggle")){
const CHAT_ENDPOINT=SUPABASE_URL+"/functions/v1/ai-chat";
let chatDeviceId=localStorage.getItem("xp-chat-device");
if(!chatDeviceId){chatDeviceId=crypto.randomUUID();localStorage.setItem("xp-chat-device",chatDeviceId)}
let chatMessages=[],chatLoaded=false,chatBusy=false,chatCooldownUntil=0,chatCooldownTimer=0,chatConversationId=localStorage.getItem("xp-chat-conversation")||"";
const CHAT_GREETING="Halo Gamers! 👋 Ada yang bisa SKIEESTORE AI bantu seputar top up game, voucher, atau cek status invoice kamu? Ketik aja pertanyaanmu di bawah!";
function scrollChatToLatest(){
  const box=$("chatMessages");
  if(!box||$("chatPanel").hidden)return;
  const move=()=>{
    const target=box.scrollHeight;
    box.scrollTop=target;
    if(typeof box.scrollTo==="function")box.scrollTo(0,target);
  };
  move();
  requestAnimationFrame(()=>{move();requestAnimationFrame(move);});
  clearTimeout(window.__skieeChatScrollTimer1);
  clearTimeout(window.__skieeChatScrollTimer2);
  clearTimeout(window.__skieeChatScrollTimer3);
  window.__skieeChatScrollTimer1=setTimeout(move,80);
  window.__skieeChatScrollTimer2=setTimeout(move,220);
  window.__skieeChatScrollTimer3=setTimeout(move,450);
}
function chatMessageHtml(value){
  let html=safe(value);
  const markdownLinks=[];
  html=html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,function(_,label,url){
    const token="__SKIEE_CHAT_LINK_"+markdownLinks.length+"__";
    markdownLinks.push('<a href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+'</a>');
    return token;
  });
  html=html.replace(/(^|[\s(])([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?=$|[\s),!?;:])/gi,function(_,prefix,email){return prefix+'<a href="mailto:'+email+'">'+email+'</a>'});
  html=html.replace(/(^|[\s(])((https?:\/\/)[^\s<]+)/g,function(_,prefix,url){
    const clean=url.replace(/[.,!?;:]+$/,"");
    const tail=url.slice(clean.length);
    return prefix+'<a href="'+clean+'" target="_blank" rel="noopener noreferrer">'+clean+'</a>'+tail;
  });
  markdownLinks.forEach((link,index)=>{html=html.replace("__SKIEE_CHAT_LINK_"+index+"__",link)});
  return html;
}
function renderChat(){
  const box=$("chatMessages");
  box.innerHTML=chatMessages.map(m=>'<div class="chat-bubble '+(m.role==="user"?"user":"bot")+'"><small class="chat-sender">'+(m.role==="user"?"KlienSKIEE":safe(m.provider||"SKIEESTORE AI"))+'</small><div>'+chatMessageHtml(m.content)+'</div></div>').join("");
  scrollChatToLatest();
}
function syncChatSendState(){const button=$("chatSend");if(!button)return;const remaining=Math.max(0,Math.ceil((chatCooldownUntil-Date.now())/1000));button.disabled=chatBusy||remaining>0;button.textContent=remaining>0?remaining+"s":"➤";if(remaining===0&&chatCooldownTimer){clearInterval(chatCooldownTimer);chatCooldownTimer=0}}
function startChatCooldown(){chatCooldownUntil=Date.now()+2000;if(chatCooldownTimer)clearInterval(chatCooldownTimer);const tick=()=>syncChatSendState();tick();chatCooldownTimer=setInterval(tick,200)}
$("chatMessages").hidden=true;
const chatScrollObserver=new MutationObserver(()=>scrollChatToLatest());
chatScrollObserver.observe($("chatMessages"),{childList:true,subtree:true,characterData:true});
const chatPanelObserver=new MutationObserver(()=>{if(!$("chatPanel").hidden)scrollChatToLatest()});
chatPanelObserver.observe($("chatPanel"),{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","style"]});
if(typeof ResizeObserver==="function"){
  const chatSizeObserver=new ResizeObserver(()=>scrollChatToLatest());
  chatSizeObserver.observe($("chatMessages"));
}
async function chatCall(payload){
  const response=await fetch(CHAT_ENDPOINT,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({...payload,deviceId:chatDeviceId})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Chat sedang tidak tersedia.");
  return data;
}
async function chatStreamCall(payload,onToken,onMeta){
  const response=await fetch(CHAT_ENDPOINT,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({...payload,deviceId:chatDeviceId})});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Chat sedang tidak tersedia.");}
  const contentType=response.headers.get("content-type")||"";
  if(!contentType.includes("text/event-stream")){
    const data=await response.json().catch(()=>({}));
    if(data.meta&&onMeta)onMeta(data.meta);
    if(data.conversationId&&onMeta)onMeta({conversationId:data.conversationId});
    if(data.reply)onToken(data.reply);
    if(data.error)throw new Error(data.error);
    return;
  }
  if(!response.body)throw new Error("Browser tidak mendukung streaming chat.");
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let pending="",streamError=null;
  const handleFrame=raw=>{
    const data=raw.replace(/\r\n/g,"\n").split("\n").filter(x=>x.startsWith("data:")).map(x=>x.slice(5).replace(/^ /,"")).join("\n");
    if(!data)return;
    try{
      const event=JSON.parse(data);
      if(event.meta&&onMeta)onMeta(event.meta);
      if(event.conversationId&&onMeta)onMeta({conversationId:event.conversationId});
      if(typeof event.token==="string"&&event.token)onToken(event.token,event.provider||event.source);
      else if(typeof event.reply==="string"&&event.reply)onToken(event.reply,event.provider||event.source);
      if(event.error)streamError=event.error;
    }catch(_){}
  };
  while(true){
    const {value,done}=await reader.read();
    if(done)break;
    pending+=decoder.decode(value,{stream:true});
    let boundary=/\r?\n\r?\n/.exec(pending);
    while(boundary){
      handleFrame(pending.slice(0,boundary.index));
      pending=pending.slice(boundary.index+boundary[0].length);
      boundary=/\r?\n\r?\n/.exec(pending);
    }
  }
  pending+=decoder.decode();
  if(pending.trim())handleFrame(pending);
  reader.releaseLock();
  if(streamError)throw new Error(streamError);
}
function setChatConversation(id){
  chatConversationId=id||"";
  if(chatConversationId)localStorage.setItem("xp-chat-conversation",chatConversationId);
  else localStorage.removeItem("xp-chat-conversation");
}
async function loadConversation(id){
  const data=await chatCall({action:"history",conversationId:id||undefined});
  setChatConversation(data.conversationId);
  chatMessages=(data.messages||[]).map(m=>({role:m.role,content:m.message,provider:m.provider||null}));
  const legacyGreeting="Halo! Aku SKIEESTORE AI. Mau tanya harga game, cara top up, XPAYCOIN, atau bantuan pesanan? 😊";
  if(chatMessages.length===1&&chatMessages[0].role==="assistant"&&chatMessages[0].content.trim()===legacyGreeting){
    chatMessages[0].content=CHAT_GREETING;
  }
  if(!chatMessages.length)chatMessages=[{role:"assistant",content:CHAT_GREETING}];
  chatLoaded=true;renderChat();
}
async function loadChat(){
  if(chatLoaded)return;
  try{await loadConversation(chatConversationId||undefined)}
  catch(e){chatMessages=[{role:"assistant",content:CHAT_GREETING}];renderChat();notify(e.message||"Riwayat chat belum dapat dimuat.")}
}
async function createNewChat(){
  if(chatBusy)return;
  try{
    const data=await chatCall({action:"create_conversation"});
    setChatConversation(data.conversation.id);
    chatMessages=[{role:"assistant",content:CHAT_GREETING}];
    chatLoaded=true;renderChat();$("chatInput").value="";
    $("chatHistoryPanel").hidden=true;
  }catch(e){notify(e.message||"Chat baru gagal dibuat.")}
}
async function loadChatHistory(){
  const list=$("chatHistoryList");
  list.innerHTML='<div class="chat-history-empty">Memuat riwayat…</div>';
  try{
    const data=await chatCall({action:"list_conversations"});
    const items=data.conversations||[];
    if(!items.length){list.innerHTML='<div class="chat-history-empty">Belum ada riwayat percakapan.</div>';return}
    list.innerHTML=items.map(c=>'<div class="chat-history-item"><button class="chat-history-open" data-open-chat="'+safe(c.id)+'">'+safe(c.title||"Percakapan baru")+'<small>'+new Date(c.updated_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})+'</small></button><button class="chat-history-delete" data-delete-chat="'+safe(c.id)+'" aria-label="Hapus percakapan">Hapus</button></div>').join("");
  }catch(e){list.innerHTML='<div class="chat-history-empty">'+safe(e.message||"Riwayat gagal dimuat.")+'</div>'}
}
async function deleteChat(id){
  if(chatBusy||!confirm("Hapus percakapan ini beserta seluruh pesannya?"))return;
  try{
    await chatCall({action:"delete_conversation",conversationId:id});
    if(chatConversationId===id){setChatConversation("");chatLoaded=false;chatMessages=[]}
    await loadChatHistory();
    if(!chatConversationId){const data=await chatCall({action:"list_conversations"});const next=data.conversations?.[0];if(next)await loadConversation(next.id);else await createNewChat()}
    notify("Percakapan berhasil dihapus.");
  }catch(e){notify(e.message||"Percakapan gagal dihapus.")}
}
let chatPreviousOverflow="";
function syncChatViewport(){
  const panel=$("chatPanel");
  if(!panel||panel.hidden)return;
  const vv=window.visualViewport;
  if(vv){panel.style.setProperty("--chat-vv-top",Math.max(0,vv.offsetTop)+"px");panel.style.setProperty("--chat-vv-height",vv.height+"px")}
  else{panel.style.setProperty("--chat-vv-top","0px");panel.style.setProperty("--chat-vv-height",window.innerHeight+"px")}
}
if(window.visualViewport){
  window.visualViewport.addEventListener("resize",()=>{syncChatViewport();if(!$("chatPanel").hidden)scrollChatToLatest()});
  window.visualViewport.addEventListener("scroll",()=>{syncChatViewport();if(!$("chatPanel").hidden)scrollChatToLatest()});
}
window.addEventListener("resize",()=>{syncChatViewport();if(!$("chatPanel").hidden)scrollChatToLatest()});
function openChat(){
  chatPreviousOverflow=document.body.style.overflow;
  document.body.classList.add("chat-open");
  $("chatPanel").hidden=false;$("chatMessages").hidden=false;$("chatPanel").classList.add("keyboard-aware");$("chatToggle").hidden=true;$("chatToggle").setAttribute("aria-expanded","true");
  document.body.style.overflow="hidden";syncChatViewport();
  loadChat();setTimeout(()=>{$("chatInput").focus({preventScroll:true});syncChatViewport()},120);
}
function closeChat(){
  document.body.classList.remove("chat-open");
  $("chatPanel").hidden=true;$("chatPanel").classList.remove("keyboard-aware");$("chatToggle").hidden=false;$("chatToggle").setAttribute("aria-expanded","false");
  $("chatHistoryPanel").hidden=true;document.body.style.overflow=chatPreviousOverflow;
  $("chatToggle").focus();
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("chatPanel").hidden){if(!$("chatHistoryPanel").hidden)$("chatHistoryPanel").hidden=true;else closeChat()}});
$("chatToggle").addEventListener("click",()=>{$("chatPanel").hidden?openChat():closeChat()});
$("chatClose").addEventListener("click",closeChat);
$("chatNew").addEventListener("click",createNewChat);
$("chatHistoryOpen").addEventListener("click",()=>{$("chatHistoryPanel").hidden=false;loadChatHistory()});
$("chatHistoryClose").addEventListener("click",()=>{$("chatHistoryPanel").hidden=true});
$("chatHistoryList").addEventListener("click",async e=>{
  const open=e.target.closest("[data-open-chat]");
  const del=e.target.closest("[data-delete-chat]");
  if(open){try{await loadConversation(open.dataset.openChat);$("chatHistoryPanel").hidden=true;$("chatInput").focus()}catch(err){notify(err.message||"Chat gagal dibuka.")}}
  if(del)deleteChat(del.dataset.deleteChat);
});
$("chatForm").addEventListener("submit",async e=>{
  e.preventDefault();if(chatBusy||Date.now()<chatCooldownUntil)return;
  const text=$("chatInput").value.trim();if(!text)return;
  startChatCooldown();
  const history=chatMessages.slice(-8).map(m=>({role:m.role,content:m.content}));
  chatMessages.push({role:"user",content:text});
  const assistantIndex=chatMessages.push({role:"assistant",content:""})-1;
  $("chatInput").value="";syncComposer();renderChat();
  chatBusy=true;syncChatSendState();$("chatTyping").hidden=false;
  let received=false;
  try{
    await chatStreamCall({conversationId:chatConversationId,messages:[...history,{role:"user",content:text}]},(token,provider)=>{
      if(provider)chatMessages[assistantIndex].provider=provider;
      received=true;$("chatTyping").hidden=true;
      chatMessages[assistantIndex].content+=token;
      renderChat();
    },meta=>{
      if(meta&&meta.provider)chatMessages[assistantIndex].provider=meta.provider;
      if(meta&&meta.conversationId)setChatConversation(meta.conversationId);
    });
    if(!received)chatMessages[assistantIndex].content="Maaf Kak, AI belum mengirim jawaban. Silakan coba lagi.";
  }catch(err){
    chatMessages[assistantIndex].content=err.message||"Koneksi sedang terganggu. Coba lagi sebentar ya.";
  }finally{
    chatBusy=false;syncChatSendState();$("chatTyping").hidden=true;
    $("chatInput").focus({preventScroll:true});renderChat();scrollChatToLatest();
  }
});
const chatInput=$("chatInput"),chatClear=$("chatClear"),chatExpand=$("chatExpand");
function syncComposer(){chatClear.hidden=!chatInput.value.length;chatInput.style.height="44px";if(chatInput.value){chatInput.style.height=Math.min(chatInput.scrollHeight,132)+"px"}}
chatInput.addEventListener("input",syncComposer);
chatClear.addEventListener("click",()=>{chatInput.value="";syncComposer();chatInput.focus()});
chatExpand.addEventListener("click",()=>{const expanded=chatInput.classList.toggle("expanded");chatExpand.textContent=expanded?"⤡":"⤢";chatExpand.setAttribute("aria-label",expanded?"Kecilkan kolom pesan":"Perbesar kolom pesan");if(expanded)chatInput.focus()});
chatInput.addEventListener("keydown",e=>{if(e.key==="Escape"&&chatInput.classList.contains("expanded")){chatInput.classList.remove("expanded");chatExpand.textContent="⤢"}else if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit()}});
syncComposer();

}
/* Site-wide SVG icon replacement: shared by homepage, profile and navigation pages. */
const skieeIconStyle=document.createElement("style");
skieeIconStyle.textContent=".skiee-svg-box{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle}.skiee-svg-box svg{width:24px;height:24px;display:block}.skiee-svg-mini{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle}.skiee-svg-mini svg{width:20px;height:20px;margin-right:6px;display:block}.feature-icon .skiee-svg-box{width:24px;height:24px}.bottomnav .skiee-svg-box svg{width:22px;height:22px}";
document.head.appendChild(skieeIconStyle);
const skieeSvg={
grid:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#FFD600" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="#FFF"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="#FFF"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="#00E5FF"/></svg></span>',
tag:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#4ADE80" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="#0F172A"/></svg></span>',
search:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#38BDF8" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/></svg></span>',
support:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#FACC15" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" fill="none"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg></span>',
wallet:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#FFD600" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M16 11h6v4h-6a2 2 0 0 1 0-4z" fill="#FFF"/></svg></span>',
reward:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#FB923C" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>',
history:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#A78BFA" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="#FFF"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg></span>',
game:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#00E5FF" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4" fill="none"/><circle cx="15" cy="11" r="1" fill="#0F172A"/><circle cx="17.5" cy="13" r="1" fill="#0F172A"/></svg></span>',
user:'<span class="skiee-svg-box"><svg viewBox="0 0 24 24" fill="#38BDF8" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></span>',
wa:'<span class="skiee-svg-mini"><svg viewBox="0 0 24 24" fill="#25D366" stroke="#0F172A" stroke-width="2" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>',
mail:'<span class="skiee-svg-mini"><svg viewBox="0 0 24 24" fill="#FACC15" stroke="#0F172A" stroke-width="2" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6" fill="none"/></svg></span>'
};
/* Profile + footer icon correction using nearby labels (user-provided SVG design). */
const skieeProfileIcons={
 guest:'<svg viewBox="0 0 24 24" width="28" height="28" fill="#38BDF8" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path></svg>',
 history:'<svg viewBox="0 0 24 24" width="24" height="24" fill="#A78BFA" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8" fill="#FFF"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="13" y2="17"></line></svg>',
 topup:'<svg viewBox="0 0 24 24" width="24" height="24" fill="#00E5FF" stroke="#0F172A" stroke-width="2.2" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><circle cx="15" cy="11" r="1" fill="#0F172A"></circle><circle cx="17.5" cy="13" r="1" fill="#0F172A"></circle></svg>',
 wa:'<svg viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle;margin-right:6px" fill="#25D366" stroke="#0F172A" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
 mail:'<svg viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle;margin-right:6px" fill="#FACC15" stroke="#0F172A" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6" fill="none"></polyline></svg>'
};
function fixSkieeProfileAndFooter(){
 const memberCard=document.querySelector(".member-card");
 if(memberCard&&/selamat datang/i.test(memberCard.textContent)&&/guest/i.test(memberCard.textContent)){
  const box=memberCard.querySelector(".member-avatar");
  if(box&&!box.dataset.skieeFixed){
   box.dataset.skieeFixed="1";
   box.style.backgroundColor="#E0F2FE";
   box.style.border="2px solid #0F172A";
   box.innerHTML=skieeProfileIcons.guest;
  }
 }
 document.querySelectorAll(".profile-shortcuts .shortcut-card").forEach(card=>{
  const label=card.textContent||"";
  const box=card.querySelector(".shortcut-icon");
  if(!box||box.dataset.skieeFixed)return;
  if(label.includes("Riwayat Pesanan")&&label.includes("Cek status transaksi")){
   box.dataset.skieeFixed="1";box.style.backgroundColor="#F3E8FF";box.innerHTML=skieeProfileIcons.history;
  }else if(label.includes("Mulai Top Up")&&label.includes("Pilih game")){
   box.dataset.skieeFixed="1";box.style.backgroundColor="#CFFAFE";box.innerHTML=skieeProfileIcons.topup;
  }
 });
 /* Footer markup is canonical HTML from index.html; never mutate it at runtime. */
}


function replaceSkieeIcons(){
 const aliases={"▦":"grid","◈":"tag","⌕":"search","✆":"support","◎":"wallet","◉":"wallet","✦":"reward","☰":"history","▤":"game","👤":"user","☻":"user","옷":"user","⌂":"grid","☎":"wa","✉":"mail"};
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const pending=[];let n;
 while((n=walker.nextNode())){
  if(n.parentElement?.closest(".nav,.bottomnav,footer"))continue;
  const token=n.nodeValue.trim();
  if(aliases[token]&&!n.parentElement?.dataset.skieeIconDone)pending.push({node:n,token});
 }
 pending.forEach(({node,token})=>{
  const parent=node.parentElement;if(!parent)return;
  let key=aliases[token];
  const memberCard=parent.closest(".feature-card");
  if(token==="▤"&&memberCard&&memberCard.textContent.includes("Riwayat Transaksi"))key="history";
  const icon=document.createElement("span");icon.innerHTML=skieeSvg[key];
  node.replaceWith(icon);
 });
 document.querySelectorAll(".shortcut-card[href='/topup'] .shortcut-icon").forEach(icon=>{
  if(!icon.dataset.skieeGameIcon){icon.dataset.skieeGameIcon="1";icon.innerHTML=skieeSvg.game}
 });
}
replaceSkieeIcons();
fixSkieeProfileAndFooter();
setInterval(fixSkieeProfileAndFooter,400);
let skieeIconQueued=false;
const skieeIconObserver=new MutationObserver(()=>{
 if(skieeIconQueued)return;skieeIconQueued=true;
 requestAnimationFrame(()=>{skieeIconQueued=false;replaceSkieeIcons()});
});
skieeIconObserver.observe(document.body,{childList:true,subtree:true});


document.querySelectorAll(".xp-foot-year").forEach(e=>e.textContent=new Date().getFullYear());

/* Legacy duplicate navigation removed; .skiee-bottom-nav above is the single global component. */



/* XP-SAFE-001: one header search controller for catalog, invoice lookup, and hidden pages. */
(function(){
 const path=(location.pathname||"/").toLowerCase().replace(/\/+$/,"")||"/";
 const isInvoice=/\/cek-pesanan(?:\.html)?$/.test(path);
 const isProfile=/\/profil(?:\.html)?$/.test(path);
 const isInfo=/\/(?:tentang-skieestore|pusat-bantuan|kebijakan-privasi|syarat-ketentuan|cara-top-up)(?:\.html)?$/.test(path);
 const button=document.querySelector("#headerSearchToggle,#mainHeaderSearchToggle,.guide-search");
 const panel=document.querySelector("#headerSearchPanel,#mainHeaderSearchPanel");
 const input=document.querySelector("#gameSearch,#globalGameSearch,#mainHeaderSearchInput");
 const suggestions=document.querySelector("#searchSuggestions,#topupSearchResults");
 const invoiceInput=document.getElementById("code");

 const searchSvg='<svg viewBox="0 0 24 24" aria-hidden="true" fill="#E0F2FE" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
 const closeSvg='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>';
 function setButton(open){
  if(!button)return;
  button.innerHTML=open?closeSvg:searchSvg;
  button.setAttribute("aria-expanded",String(open));
  button.setAttribute("aria-label",open?"Tutup pencarian":"Cari game");
  button.classList.toggle("is-search-open",open);
 }
 function closePanel(clear){
  if(panel)panel.hidden=true;
  if(suggestions){suggestions.hidden=true;suggestions.innerHTML="";}
  if(input&&clear){input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));}
  if(input)input.setAttribute("aria-expanded","false");
  setButton(false);
 }
 if(isProfile||isInfo){
  document.body.classList.add("skiee-search-hidden");
  if(panel)panel.hidden=true;
  if(button){button.hidden=true;button.setAttribute("aria-hidden","true");}
  document.querySelectorAll(".guide-search,.main-header-search-btn,.header-search-btn").forEach(el=>{
   el.hidden=true;el.setAttribute("aria-hidden","true");
  });
  return;
 }
 if(!button)return;

 if(isInvoice){
  closePanel(true);
  button.addEventListener("click",function(e){
   e.preventDefault();
   e.stopImmediatePropagation();
   if(!invoiceInput)return;
   invoiceInput.scrollIntoView({behavior:"smooth",block:"center"});
   window.setTimeout(()=>invoiceInput.focus({preventScroll:true}),180);
  },true);
  return;
 }

 if(!panel||!input)return;
 setButton(false);
 button.addEventListener("click",function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  if(panel.hidden){
   panel.hidden=false;
   setButton(true);
   window.setTimeout(()=>input.focus({preventScroll:true}),0);
  }else{
   closePanel(true);
  }
 },true);

 document.addEventListener("click",function(e){
  if(panel.hidden)return;
  if(e.target.closest("[data-search-game]")){
   closePanel(true);
   return;
  }
  if(!e.target.closest("#headerSearchPanel")&&!e.target.closest("#mainHeaderSearchPanel")&&!e.target.closest("#headerSearchToggle")&&!e.target.closest("#mainHeaderSearchToggle")){
   closePanel(true);
  }
 },true);
 document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&!panel.hidden)closePanel(true);
 });
})();

})();
