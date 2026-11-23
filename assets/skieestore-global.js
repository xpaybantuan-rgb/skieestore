(()=>{"use strict";
const $=id=>document.getElementById(id);
const SUPABASE_URL="https://rjgeitbkpcyymgemcztx.supabase.co";
const SUPABASE_KEY="sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR";
let toastTimer=0;
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(msg){const t=$("toast");if(!t){alert(msg);return}t.textContent=msg;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,2600)}
const CHAT_ENDPOINT=SUPABASE_URL+"/functions/v1/ai-chat";
let chatDeviceId=localStorage.getItem("xp-chat-device");
if(!chatDeviceId){chatDeviceId=crypto.randomUUID();localStorage.setItem("xp-chat-device",chatDeviceId)}
let chatMessages=[],chatLoaded=false,chatBusy=false,chatConversationId=localStorage.getItem("xp-chat-conversation")||"";
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
  $("chatPanel").hidden=false;$("chatPanel").classList.add("keyboard-aware");$("chatToggle").hidden=true;$("chatToggle").setAttribute("aria-expanded","true");
  document.body.style.overflow="hidden";syncChatViewport();
  loadChat();setTimeout(()=>{$("chatInput").focus({preventScroll:true});syncChatViewport()},120);
}
function closeChat(){
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
  e.preventDefault();if(chatBusy)return;
  const text=$("chatInput").value.trim();if(!text)return;
  const history=chatMessages.slice(-8).map(m=>({role:m.role,content:m.content}));
  chatMessages.push({role:"user",content:text});
  const assistantIndex=chatMessages.push({role:"assistant",content:""})-1;
  $("chatInput").value="";syncComposer();renderChat();
  chatBusy=true;$("chatSend").disabled=true;$("chatTyping").hidden=false;
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
    chatBusy=false;$("chatSend").disabled=false;$("chatTyping").hidden=true;
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
document.querySelectorAll(".xp-foot-year").forEach(e=>e.textContent=new Date().getFullYear());
})();