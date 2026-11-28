(()=>{"use strict";
const pathname=(window.location.pathname||"/").replace(/\/+$/,"")||"/";
const allowedPages=new Set(["/","/cek-pesanan","/topup","/profil"]);
if(!allowedPages.has(pathname)){
 document.querySelectorAll("#chatToggle,#chatPanel,.chat-fab,.chat-panel").forEach(node=>node.remove());
 return;
}

const buttonMarkup='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 9.5h32v23H23l-9 7v-7H8z" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/><path d="M15 18h18M15 24h13" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="m36 4 1.7 4.3L42 10l-4.3 1.7L36 16l-1.7-4.3L30 10l4.3-1.7z" fill="currentColor"/></svg>';
const panelMarkup=`<div class="chat-head"><div class="chat-brand"><span class="chat-avatar" aria-label="Logo SKIEESTORE">S</span><div class="chat-brand-copy"><strong>SKIEESTORE AI · Asisten Virtual</strong></div></div><button class="chat-close" id="chatClose" type="button" aria-label="Tutup chat">×</button></div>
<div class="chat-toolbar"><button class="chat-tool-btn primary" id="chatNew" type="button">＋ Chat baru</button><button class="chat-tool-btn" id="chatHistoryOpen" type="button">◷ Riwayat chat</button></div>
<div class="chat-history-panel" id="chatHistoryPanel" hidden><div class="chat-history-head"><span>Riwayat percakapan</span><button class="chat-close" id="chatHistoryClose" type="button" aria-label="Tutup riwayat">×</button></div><div class="chat-history-list" id="chatHistoryList"></div></div>
<div class="chat-messages" id="chatMessages" aria-live="polite"></div><div class="chat-typing" id="chatTyping" hidden>SKIEESTORE AI sedang mengetik…</div>
<form class="chat-compose" id="chatForm"><textarea id="chatInput" rows="1" maxlength="2500" placeholder="Tulis pertanyaanmu…" aria-label="Pesan untuk SKIEESTORE AI"></textarea><button class="chat-compose-btn chat-clear" id="chatClear" type="button" aria-label="Hapus semua teks" title="Hapus semua teks" hidden>×</button><button class="chat-compose-btn" id="chatExpand" type="button" aria-label="Perbesar kolom pesan" title="Perbesar kolom pesan">⤢</button><button class="chat-send" id="chatSend" type="submit" aria-label="Kirim pesan">➤</button></form><div class="chat-footer">© <span id="chatYear"></span> SKIEESTORE · Asisten virtual</div>`;
let toggle=document.getElementById("chatToggle");
if(!toggle){toggle=document.createElement("button");toggle.id="chatToggle";toggle.type="button";toggle.setAttribute("aria-label","Buka Asisten AI SKIEESTORE");toggle.setAttribute("aria-expanded","false");document.body.appendChild(toggle)}
toggle.classList.add("chat-fab","skiee-ai-fab");toggle.innerHTML=buttonMarkup;toggle.type="button";toggle.setAttribute("aria-label","Buka Asisten AI SKIEESTORE");
if(toggle.parentElement!==document.body)document.body.appendChild(toggle);
let panel=document.getElementById("chatPanel");
if(!panel){panel=document.createElement("div");panel.id="chatPanel";panel.className="chat-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","Asisten virtual SKIEESTORE");panel.hidden=true;panel.innerHTML=panelMarkup;document.body.appendChild(panel)}
if(!document.getElementById("chatYear")){const y=document.createElement("span");y.id="chatYear";y.textContent=new Date().getFullYear();panel.querySelector(".chat-footer")?.appendChild(y)}
if(!document.getElementById("toast")){const t=document.createElement("div");t.id="toast";t.className="toast";t.hidden=true;document.body.appendChild(t)}
const css=`
#chatToggle,.chat-fab,.skiee-ai-fab{position:fixed!important;display:grid!important;place-items:center!important;right:16px!important;bottom:28px!important;width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;max-width:54px!important;max-height:54px!important;flex:none!important;padding:0!important;margin:0!important;border:0!important;border-radius:18px!important;background:linear-gradient(135deg,#2563EB 0%,#2563EB 100%)!important;color:#fff!important;box-shadow:0 8px 24px rgba(37,99,235,.32),0 2px 8px rgba(37,99,235,.2)!important;z-index:2147483001!important;cursor:pointer!important;overflow:hidden!important;box-sizing:border-box!important;transform:none!important}
#chatToggle svg,.chat-fab svg,.skiee-ai-fab svg{display:block!important;width:29px!important;height:29px!important;min-width:29px!important;min-height:29px!important;max-width:29px!important;max-height:29px!important}
#chatPanel,.chat-panel{position:fixed!important;inset:0!important;width:100%!important;height:100vh!important;height:100dvh!important;max-width:none!important;max-height:none!important;z-index:2147483002!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important;color:#090D16!important}
#chatPanel[hidden],.chat-panel[hidden]{display:none!important}
#chatPanel .chat-head,#chatPanel .chat-history-head{background:linear-gradient(115deg,#fff,#EFF6FF)!important;border:0!important;border-bottom:1px solid #E2E8F0!important;box-shadow:none!important;color:#090D16!important}
#chatPanel .chat-toolbar{background:#fff!important;border:0!important;border-bottom:1px solid #E2E8F0!important;box-shadow:none!important}
#chatPanel .chat-avatar{background:linear-gradient(135deg,#2563EB,#2563EB)!important;border:0!important;border-radius:14px!important;box-shadow:0 5px 16px rgba(37,99,235,.16)!important;color:#fff!important}
#chatPanel .chat-close,#chatPanel .chat-compose-btn,#chatPanel .chat-tool-btn,#chatPanel .chat-history-delete{background:#fff!important;color:#090D16!important;border:1px solid #E2E8F0!important;border-radius:12px!important;box-shadow:none!important}
#chatPanel .chat-tool-btn.primary{background:#EFF6FF!important;color:#2563EB!important;border:1px solid #C7E2FF!important;border-radius:12px!important;box-shadow:none!important}
#chatPanel .chat-messages{background:#F8FAFC!important;background-image:none!important}
#chatPanel .chat-bubble,#chatPanel .chat-history-item{border:1px solid #E2E8F0!important;border-radius:14px!important;box-shadow:none!important}
#chatPanel .chat-bubble.bot{background:#fff!important;color:#090D16!important}
#chatPanel .chat-bubble.user{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important;box-shadow:none!important}
#chatPanel .chat-compose{background:#fff!important;border-top:1px solid #E2E8F0!important}
#chatPanel .chat-compose textarea,#chatPanel #chatInput{background:#fff!important;color:#090D16!important;border:1px solid #E2E8F0!important;border-radius:14px!important;box-shadow:none!important;outline:none!important}
#chatPanel .chat-compose textarea:focus,#chatPanel #chatInput:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}
#chatPanel .chat-send{background:linear-gradient(135deg,#2563EB,#2563EB)!important;color:#fff!important;border:0!important;border-radius:12px!important;box-shadow:0 5px 14px rgba(37,99,235,.18)!important}
#chatPanel .chat-compose-btn:active,#chatPanel .chat-send:active,#chatPanel .chat-tool-btn:active,#chatPanel .chat-close:active{transform:scale(.97)!important;box-shadow:none!important}
#chatPanel .chat-footer{background:#fff!important;color:#475569!important;border-top:1px solid #E2E8F0!important}
@media(max-width:760px){#chatToggle,.chat-fab,.skiee-ai-fab{right:16px!important;bottom:calc(108px + env(safe-area-inset-bottom))!important;width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;max-width:54px!important;max-height:54px!important}#chatPanel{padding-top:env(safe-area-inset-top)!important;padding-bottom:env(safe-area-inset-bottom)!important}}
`;
let style=document.getElementById("skiee-global-assistant-style");if(!style){style=document.createElement("style");style.id="skiee-global-assistant-style";document.head.appendChild(style)}style.textContent=css;
const year=document.getElementById("chatYear");if(year)year.textContent=String(new Date().getFullYear());
})();