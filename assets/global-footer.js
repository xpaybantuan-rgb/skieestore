(()=>{"use strict";
if(document.querySelector(".profile-shell"))document.body.classList.add("skiee-profile-page");
const existing=document.querySelector("footer.xp-footer,footer.footer-simple,footer.auth-foot,footer.site-footer,footer.footer");
const footer=existing||document.createElement("footer");
footer.className="xp-footer";footer.id="footer";
footer.innerHTML=`
 <div class="xp-foot-wrap">
  <a class="xp-foot-brand" href="/" aria-label="SKIEESTORE Beranda"><img class="xp-foot-logo" src="/assets/skieestore-logo-transparent.png?v=1" alt="SKIEESTORE"></a>
  <p class="xp-foot-desc">Top up game dan voucher digital jadi lebih sat-set! Pilih produk, isi data, lalu bayar praktis via QRIS. Pesanan diproses cepat dan otomatis, jadi kamu bisa langsung lanjut mabar.</p>
  <div class="xp-foot-grid">
   <section class="xp-foot-links-section"><h3>Informasi &amp; Bantuan</h3><div class="xp-foot-links">
    <a href="/tentang-skieestore">Tentang SKIEESTORE</a><a href="/pusat-bantuan">Pusat Bantuan</a><a href="/cara-top-up">Cara Top Up</a><a href="/kebijakan-privasi">Kebijakan Privasi</a><a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a>
   </div></section>
   <section class="xp-foot-links-section"><h3>Fitur &amp; Panduan</h3><div class="xp-foot-links">
    <a href="/profil">SKIEE Membership</a><a href="/artikel">Artikel / Blog</a><a href="/kalkulator/win-rate">Kalkulator Win Rate</a><a href="/kalkulator/magic-wheel">Kalkulator Magic Wheel</a><a href="/kalkulator/zodiac">Kalkulator Zodiac</a>
   </div></section>
   <section class="xp-foot-contact-section"><h3>Hubungi Kami</h3><div class="xp-foot-contact">
    <a href="https://wa.me/message/3N6JKGNV65P2D1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Customer Service SKIEESTORE"><span>WhatsApp Customer Service</span></a>
    <a class="xp-foot-email" href="mailto:adminskiee@gmail.com">adminskiee@gmail.com</a>
   </div></section>
   <section class="xp-foot-social-section"><h3>Media Sosial</h3><div class="xp-foot-contact">
    <a href="https://www.instagram.com/skieestore?lqvp=MWhlc3VtdHpkOWs1" target="_blank" rel="noopener noreferrer">Instagram · skieestore</a>
    <a href="https://www.facebook.com/profile.php?id=61595844852789" target="_blank" rel="noopener noreferrer">Facebook · skieestore</a>
   </div></section>
   <section class="xp-foot-meta-section"><h3>Jam Operasional CS</h3><p class="xp-foot-meta-value">08.00–22.00 WIB</p></section>
   <section class="xp-foot-meta-section"><h3>Domisili Usaha</h3><a class="xp-foot-meta-value xp-foot-location" href="https://www.google.com/maps/search/?api=1&amp;query=Lubuklinggau%2C%20Indonesia" target="_blank" rel="noopener noreferrer">Lubuklinggau • Indonesia</a></section>
  </div>
  <div class="xp-foot-copy"><span>© 2026 SKIEESTORE. All Rights Reserved.</span></div>
 </div>`;
if(!existing)document.body.appendChild(footer);
const styleId="skiee-shared-footer-style";let style=document.getElementById(styleId);if(!style){style=document.createElement("style");style.id=styleId;document.head.appendChild(style)}
style.textContent=`
:root{--accent:#2563EB;--accent2:#2563EB;--soft:#EFF6FF;--line:#E2E8F0;--skiee-blue:#2563EB;--skiee-ink:#090D16;--skiee-border:#E2E8F0}
html{scroll-padding-top:76px}
header.header,body>header.header,header.main-site-header{
 position:sticky!important;top:0!important;z-index:40!important;
 background:rgba(255,255,255,.95)!important;
 -webkit-backdrop-filter:blur(16px)!important;backdrop-filter:blur(16px)!important;
 border-bottom:1px solid #E2E8F0!important;box-shadow:none!important;
}
header.main-site-header:not(:has(.headrow)){
 display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
 align-items:center!important;justify-content:space-between!important;gap:12px!important;
 min-height:64px!important;padding:8px max(16px,calc((100% - 1160px)/2))!important;
}
header.main-site-header:not(:has(.headrow)) .brand-image{
 display:flex!important;align-items:center!important;flex:1 1 auto!important;
 min-width:0!important;max-width:calc(100% - 100px)!important;
}
header.main-site-header:not(:has(.headrow)) .brand-image img{
 display:block!important;width:auto!important;height:46px!important;max-height:46px!important;
 max-width:100%!important;object-fit:contain!important;object-position:left center!important;
}
header.header .headrow,header.main-site-header .headrow{
 display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
 align-items:center!important;justify-content:space-between!important;gap:12px!important;
 min-width:0!important;
}
header.header .brand-image,header.main-site-header .brand-image{
 display:flex!important;align-items:center!important;flex:1 1 auto!important;
 min-width:0!important;max-width:calc(100% - 100px)!important;
}
header.header .brand-image img,header.main-site-header .brand-image img{
 display:block!important;width:auto!important;height:46px!important;max-height:46px!important;
 max-width:100%!important;object-fit:contain!important;object-position:left center!important;
}
header.header .header-actions,header.header .site-nav-actions,header.main-site-header .header-actions{
 display:flex!important;flex:0 0 auto!important;align-items:center!important;
 justify-content:flex-end!important;gap:8px!important;margin-left:auto!important;white-space:nowrap!important;
}
header.header .site-nav-menu-toggle,header.header #headerSearchToggle,header.header #mainHeaderSearchToggle{
 flex:0 0 42px!important;width:42px!important;height:42px!important;
}
@media(max-width:380px){
 header.header .headrow{gap:8px!important}
 header.header .brand-image img{height:40px!important;max-height:40px!important}
 header.header .brand-image{max-width:calc(100% - 92px)!important}
}
.site-nav-menu-toggle,#headerSearchToggle,#mainHeaderSearchToggle,.header-search-btn{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;
 padding:0!important;border:1px solid #E2E8F0!important;border-radius:12px!important;
 background:#fff!important;color:#334155!important;box-shadow:none!important;line-height:1!important;
}
.site-nav-menu-toggle svg,#headerSearchToggle svg,#mainHeaderSearchToggle svg,.header-search-btn svg{width:19px!important;height:19px!important;display:block!important}
.site-nav-menu-toggle[hidden],#headerSearchToggle[hidden],#mainHeaderSearchToggle[hidden],.header-search-btn[hidden]{display:none!important}

/* One blue action color across every route and the AI assistant. */
:root{--accent:#2563EB!important;--accent2:#2563EB!important;--soft:#EFF6FF!important}
.topline{background:#2563EB!important;color:#fff!important}
.primary,.btn-primary,.account,.profile,.auth-submit,.site-menu-login,.p-btn-primary,
#submit,.chat-fab,#chatToggle,.skiee-ai-fab,.chat-send,.nickname-check-button,
button.primary,.primary-action,.checkout-button{
 background:#2563EB!important;background-image:none!important;color:#fff!important;
 border-color:#2563EB!important;
}
.primary:hover,.btn-primary:hover,.account:hover,.profile:hover,.auth-submit:hover,.site-menu-login:hover,
.p-btn-primary:hover,#submit:hover,.chat-fab:hover,#chatToggle:hover,.chat-send:hover{
 background:#2563EB!important;filter:brightness(.96)!important
}
.brand em,.brandmark,.kicker,.eyebrow,.price,.section .kicker{color:#2563EB!important}
.nav a.active,.nav a[aria-current="page"],.header .nav a.active,.header .nav a[aria-current="page"],
.bottomnav a.active,.chip.active,.filters .chip.active,.article-filter.active,.calc-tabs a.active{
 background:#EFF6FF!important;color:#2563EB!important;border-color:#2563EB!important;font-weight:800!important;
}
.skiee-bottom-nav .nav-item.active,.skiee-bottom-nav .nav-item[aria-current="page"]{
 background:#EFF6FF!important;color:#2563EB!important;border:0!important;
}
.skiee-bottom-nav .nav-item.active svg,.skiee-bottom-nav .nav-item[aria-current="page"] svg{stroke:#2563EB!important}
.chat-fab,#chatToggle,.skiee-ai-fab{
 background:#2563EB!important;background-image:none!important;color:#fff!important;
 box-shadow:0 8px 22px rgba(37,99,235,.24)!important;border:0!important;
}
#chatPanel .chat-head,#chatPanel .chat-history-head,.chat-panel .chat-head,.chat-panel .chat-history-head{
 background:#fff!important;color:#090D16!important;border-bottom:1px solid #E2E8F0!important;
}
#chatPanel .chat-avatar,.chat-panel .chat-avatar{background:#2563EB!important;color:#fff!important;box-shadow:none!important}
#chatPanel .chat-tool-btn.primary,.chat-panel .chat-tool-btn.primary{background:#EFF6FF!important;color:#2563EB!important;border:1px solid #BFDBFE!important}
#chatPanel .chat-bubble.user,.chat-panel .chat-bubble.user{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}
#chatPanel .chat-send,.chat-panel .chat-send{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}
#chatPanel .chat-compose textarea:focus,#chatPanel #chatInput:focus,.chat-panel .chat-compose textarea:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}

/* Profile accents follow the same blue-600 system. */
.profile-shell .profile-kicker,.profile-shell .p-avatar,.profile-shell .p-menu-icon,
.profile-shell .p-tier.pro,.profile-shell .p-plan-badge,.profile-shell .p-status,
.profile-shell .p-plan li:before,.profile-shell .p-help-row a{color:#2563EB!important}
.profile-shell .p-avatar,.profile-shell .p-menu-icon,.profile-shell .p-plan-badge,
.profile-shell .p-status{background:#EFF6FF!important;border-color:#BFDBFE!important}
.profile-shell .p-camera{background:#2563EB!important}
.profile-shell .p-plan.pro{border-color:#E2E8F0!important;background:#fff!important}
.profile-shell .p-form input:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}

/* Passive surfaces stay white with a fine slate border; selected controls use blue. */
:where(.gamecard,.product-group,.product-choice,.payment-option,.p-plan,.p-card,.p-stat,
.accordion,.accordion-item,.faq-item,.faq-card,.faq-home-item,.category-card,.order-card,
.searchbox,.search,.field input,.receiver-box input,.voucher-box input,.form input,
.form select,.form textarea,.auth-field input,.profile-shell input){
 border-color:#E2E8F0!important;
}
:where(.gamecard,.product-choice,.payment-option,.p-plan,.p-card,.category-card,.order-card,.accordion,.faq-item,.faq-card){background:#fff!important}
.chip,.filters .chip,.article-filter,.calc-tabs a,.category-tab,.category-filter button,.filter-tab{
 background:#fff!important;border:1px solid #E2E8F0!important;color:#475569!important;
}
.chip.active,.filters .chip.active,.article-filter.active,.calc-tabs a.active,.category-tab.active,.category-filter button.active,.filter-tab.active{
 background:#fff!important;border:1px solid #2563EB!important;color:#2563EB!important;font-weight:800!important;
}
.product-choice.selected,.payment-option-choice.selected,.payment-option.selected,
.product-choice[aria-pressed="true"],.payment-option[aria-pressed="true"]{
 background:#fff!important;border:2px solid #2563EB!important;box-shadow:none!important;
}
.payment-option-choice input{accent-color:#2563EB!important}
input,textarea,select,.field input,.search,.receiver-box input,.voucher-box input{
 border-color:#E2E8F0!important;background:#fff!important;
}
input:focus,textarea:focus,select:focus,.field input:focus,.search:focus,
.receiver-box input:focus,.voucher-box input:focus,.form input:focus,.form select:focus,.form textarea:focus{
 border-color:#2563EB!important;outline:none!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important;
}
.gamecard:hover,.game:hover,.product:focus-within{border-color:#E2E8F0!important}
.product-group,.product-group.open{border-color:#E2E8F0!important}
.product-group-count,.game-count-badge,.game-badge,.catalog-count,.product-count,.badge-count{
 border:1px solid #E2E8F0!important;background:#F8FAFC!important;color:#475569!important;
}

/* Dark promotional hero: restore bright, legible text above its background. */
.home-banner-copy,.home-banner-copy *,.home-banner-slide .home-banner-copy{
 color:#fff!important;opacity:1!important;text-shadow:0 1px 2px rgba(2,6,23,.22)!important;
}
.home-banner-copy small,.home-banner-copy .home-banner-note{
 color:#93C5FD!important;font-weight:850!important;
}
.home-banner-copy strong{color:#fff!important}
.home-banner-copy span{color:#F8FAFC!important}
.home-banner-dots button.active{background:#2563EB!important}
.home-banner-controls button{color:#fff!important}

.product-choice.promo-product:not(.selected){border:1px solid #E2E8F0!important;background:#fff!important}
#chatPanel,.chat-panel{background:#fff!important;color:#090D16!important;border:0!important;border-radius:0!important;box-shadow:none!important}
#chatPanel .chat-messages,.chat-panel .chat-messages{background:#F8FAFC!important;background-image:none!important}
#chatPanel .chat-bubble,.chat-panel .chat-bubble{border:1px solid #E2E8F0!important;border-radius:14px!important;box-shadow:none!important}
#chatPanel .chat-bubble.bot,.chat-panel .chat-bubble.bot{background:#fff!important;color:#090D16!important}
#chatPanel .chat-bubble.user{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}
#chatPanel .chat-send{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}
#chatPanel .chat-compose textarea{background:#fff!important;color:#090D16!important;border:1px solid #E2E8F0!important}
#chatPanel .chat-compose textarea:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}

/* Recent invoice buttons: separate invoice code, product and date into clear rows. */
.recent-orders-list{display:grid!important;gap:9px!important}
.recent-order-item{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:start!important;
 justify-items:start!important;gap:7px!important;padding:13px 14px!important;
 border:1px solid #E2E8F0!important;border-radius:13px!important;background:#fff!important;
 text-align:left!important;line-height:1.55!important;
}
.recent-order-item strong{display:block!important;color:#090D16!important;font-size:12px!important;line-height:1.4!important;letter-spacing:.01em!important}
.recent-order-item span{display:block!important;color:#334155!important;font-size:11px!important;line-height:1.5!important;margin:0!important}
.recent-order-item small{display:block!important;color:#64748B!important;font-size:10px!important;line-height:1.5!important;margin:0!important}

/* Global footer: exact 3-row, 2-column grid with permanent blue links. */
footer.xp-footer#footer{
 display:block!important;width:100%!important;box-sizing:border-box!important;
 background:#fff!important;color:#090D16!important;border-top:1px solid #E2E8F0!important;
 padding:34px 0 18px!important;margin:32px 0 0!important;box-shadow:none!important;
}
footer.xp-footer#footer *{box-sizing:border-box!important;opacity:1!important}
footer.xp-footer#footer .xp-foot-wrap{width:min(1160px,calc(100% - 36px))!important;margin:0 auto!important}
footer.xp-footer#footer .xp-foot-brand{display:inline-flex!important;align-items:center!important;margin:0 0 12px!important}
footer.xp-footer#footer .xp-foot-logo{display:block!important;width:auto!important;height:42px!important;max-width:200px!important;object-fit:contain!important}
footer.xp-footer#footer .xp-foot-desc{max-width:760px!important;margin:0 0 25px!important;color:#090D16!important;font-size:13px!important;line-height:1.7!important;font-weight:500!important}
footer.xp-footer#footer .xp-foot-grid{
 display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
 align-items:start!important;gap:25px 34px!important;
}
footer.xp-footer#footer .xp-foot-grid>section{min-width:0!important;width:100%!important;padding:0!important;margin:0!important}
footer.xp-footer#footer h3{margin:0 0 12px!important;color:#090D16!important;font-size:13px!important;font-weight:850!important;line-height:1.4!important}
footer.xp-footer#footer .xp-foot-links,footer.xp-footer#footer .xp-foot-contact{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;justify-items:start!important;
 align-items:start!important;gap:9px!important;min-width:0!important;padding:0!important;margin:0!important;
}
footer.xp-footer#footer .xp-foot-links a,footer.xp-footer#footer .xp-foot-contact a{
 display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;gap:7px!important;
 width:max-content!important;max-width:100%!important;min-width:0!important;
 color:#2563EB!important;font-size:12px!important;line-height:1.55!important;font-weight:650!important;
 text-decoration:none!important;white-space:normal!important;overflow-wrap:normal!important;word-break:normal!important;
}
footer.xp-footer#footer .xp-foot-links a:hover,footer.xp-footer#footer .xp-foot-contact a:hover{
 color:#2563EB!important;text-decoration:underline!important;text-underline-offset:3px!important;
}
footer.xp-footer#footer .xp-foot-contact .xp-foot-icon{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 flex:0 0 18px!important;width:18px!important;height:18px!important;color:#2563EB!important;
}
footer.xp-footer#footer .xp-foot-contact .xp-foot-email{
 display:block!important;width:max-content!important;max-width:100%!important;white-space:nowrap!important;
 overflow-wrap:normal!important;word-break:normal!important;font-size:12px!important;
}
footer.xp-footer#footer .xp-foot-meta-value{
 display:block!important;margin:0!important;padding:0!important;color:#090D16!important;font-size:12px!important;
 font-weight:600!important;line-height:1.55!important;
}
footer.xp-footer#footer a.xp-foot-location{color:#2563EB!important;font-weight:700!important;text-decoration:none!important}
footer.xp-footer#footer a.xp-foot-location:visited,footer.xp-footer#footer a.xp-foot-location:hover{color:#2563EB!important}
footer.xp-footer#footer .xp-foot-contact .xp-foot-icon{display:none!important}
footer.xp-footer#footer .xp-foot-copy{
 display:flex!important;align-items:center!important;justify-content:flex-start!important;
 gap:12px!important;margin-top:25px!important;padding-top:14px!important;
 border-top:1px solid #E2E8F0!important;color:#090D16!important;
 font-size:11px!important;line-height:1.5!important;font-weight:650!important;
}
footer.xp-footer#footer .xp-foot-copy span{color:#090D16!important}
@media(max-width:760px){
 footer.xp-footer#footer{padding:28px 0 calc(136px + env(safe-area-inset-bottom))!important;margin-top:24px!important}
 footer.xp-footer#footer .xp-foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:22px 14px!important}
 footer.xp-footer#footer .xp-foot-wrap{width:calc(100% - 32px)!important}
 footer.xp-footer#footer .xp-foot-desc{font-size:12px!important;margin-bottom:22px!important}
 footer.xp-footer#footer h3{font-size:11px!important;margin-bottom:9px!important}
 footer.xp-footer#footer .xp-foot-links a,footer.xp-footer#footer .xp-foot-contact a{font-size:10.5px!important;line-height:1.55!important}
 footer.xp-footer#footer .xp-foot-contact .xp-foot-email{font-size:10.5px!important}
 footer.xp-footer#footer .xp-foot-meta-value{font-size:10.5px!important}
 footer.xp-footer#footer .xp-foot-copy{font-size:10px!important;margin-top:22px!important}
}
@media(max-width:360px){
 footer.xp-footer#footer .xp-foot-grid{column-gap:10px!important}
 footer.xp-footer#footer .xp-foot-links a,footer.xp-footer#footer .xp-foot-contact a{font-size:10px!important}
 footer.xp-footer#footer .xp-foot-contact .xp-foot-email{font-size:10px!important}
}

/* Final shared overrides: force one coherent header, banner and blue palette. */
:root{--accent:#2563EB!important;--accent2:#2563EB!important;--skiee-blue:#2563EB!important}
header.header,body>header.header,header.main-site-header,body>header.main-site-header{
 position:sticky!important;position:-webkit-sticky!important;top:0!important;z-index:1000!important;
 width:100%!important;box-sizing:border-box!important;background:rgba(255,255,255,.97)!important;
 -webkit-backdrop-filter:blur(16px)!important;backdrop-filter:blur(16px)!important;
 border:0!important;border-bottom:1px solid #E2E8F0!important;border-radius:0 0 16px 16px!important;
 box-shadow:0 4px 16px rgba(15,23,42,.06)!important;
}
header.header .headrow,header.main-site-header .headrow{
 display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;
 align-items:center!important;justify-content:space-between!important;gap:10px!important;
 min-height:64px!important;padding-top:8px!important;padding-bottom:8px!important;
}
header.header .site-nav-actions,header.header .header-actions,header.main-site-header .site-nav-actions,header.main-site-header .header-actions{
 display:flex!important;flex:0 0 auto!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;margin-left:auto!important;
}
header.header .site-nav-menu-toggle,header.header #headerSearchToggle,header.header #mainHeaderSearchToggle,
header.main-site-header .site-nav-menu-toggle,header.main-site-header #headerSearchToggle,header.main-site-header #mainHeaderSearchToggle,
.site-nav-menu-toggle,#headerSearchToggle,#mainHeaderSearchToggle,.header-search-btn{
 display:inline-flex!important;flex:0 0 40px!important;width:40px!important;min-width:40px!important;
 height:40px!important;min-height:40px!important;max-height:40px!important;padding:0!important;
 align-items:center!important;justify-content:center!important;box-sizing:border-box!important;
 border:1px solid #E2E8F0!important;border-radius:12px!important;background:#fff!important;color:#334155!important;
 box-shadow:none!important;line-height:1!important;
}
.site-nav-menu-toggle svg,#headerSearchToggle svg,#mainHeaderSearchToggle svg,.header-search-btn svg{
 display:block!important;width:19px!important;height:19px!important;flex:0 0 19px!important;
}
body.skiee-profile-page header.header{min-height:64px!important;padding:0!important;margin:0!important}
body.skiee-profile-page header.header .headrow{width:min(1160px,calc(100% - 32px))!important;min-height:64px!important;margin:0 auto!important;padding:8px 0!important}
body.skiee-profile-page header.header .brand-image{max-width:calc(100% - 50px)!important}
body.skiee-profile-page header.header .header-search-btn,body.skiee-profile-page header.header #headerSearchToggle{display:none!important}
body.skiee-profile-page header.header .site-nav-actions{gap:0!important}
#homeBanner .home-banner-copy,#homeBanner .home-banner-copy *,.home-banner .home-banner-copy,.home-banner .home-banner-copy *{
 color:#FFFFFF!important;opacity:1!important;text-shadow:0 1px 3px rgba(0,0,0,.5)!important;
}
#homeBanner .home-banner-copy small,#homeBanner .home-banner-copy em,.home-banner .home-banner-copy small,.home-banner .home-banner-copy em{
 color:#93C5FD!important;font-weight:900!important;
}
#homeBanner .home-banner-copy strong,.home-banner .home-banner-copy strong{color:#FFFFFF!important;font-weight:900!important}
#homeBanner .home-banner-copy span,.home-banner .home-banner-copy span{color:#FFFFFF!important}
#homeBanner .home-banner-copy .home-banner-note,.home-banner .home-banner-note{color:#93C5FD!important}
.skiee-bottom-nav .nav-item.active,.skiee-bottom-nav .nav-item[aria-current="page"],
.skiee-bottom-nav .nav-item.active:visited,.skiee-bottom-nav .nav-item[aria-current="page"]:visited{
 background:#EFF6FF!important;color:#2563EB!important;border:0!important;box-shadow:none!important;
}
.skiee-bottom-nav .nav-item.active svg,.skiee-bottom-nav .nav-item[aria-current="page"] svg,
.skiee-bottom-nav .nav-item.active svg *, .skiee-bottom-nav .nav-item[aria-current="page"] svg *{
 color:#2563EB!important;stroke:#2563EB!important;fill:none!important;
}
body.skiee-profile-page .profile-shell .profile-kicker,
body.skiee-profile-page .profile-shell .p-avatar,body.skiee-profile-page .profile-shell .p-menu-icon,
body.skiee-profile-page .profile-shell .p-tier.pro,body.skiee-profile-page .profile-shell .p-plan-badge,
body.skiee-profile-page .profile-shell .p-status,body.skiee-profile-page .profile-shell .p-plan li:before,
body.skiee-profile-page .profile-shell .p-help-row a{color:#2563EB!important}
body.skiee-profile-page .profile-shell .p-avatar,body.skiee-profile-page .profile-shell .p-menu-icon,
body.skiee-profile-page .profile-shell .p-plan-badge,body.skiee-profile-page .profile-shell .p-status{
 background:#EFF6FF!important;border-color:#BFDBFE!important;
}
body.skiee-profile-page .profile-shell .p-camera,body.skiee-profile-page .profile-shell .p-btn-primary,
body.skiee-profile-page .profile-shell .auth-submit{background:#2563EB!important;border-color:#2563EB!important;color:#fff!important}
body.skiee-profile-page .profile-shell .p-form input:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}
footer.xp-footer#footer .xp-foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
footer.xp-footer#footer .xp-foot-meta-section .xp-foot-location{color:#2563EB!important}
@media(max-width:760px){footer.xp-footer#footer{padding-bottom:calc(136px + env(safe-area-inset-bottom))!important}}

`;
if(!existing)document.body.appendChild(footer);
})();