(()=>{"use strict";
const existing=document.querySelector("footer.xp-footer,footer.footer-simple,footer.auth-foot,footer.site-footer,footer.footer");
const footer=existing||document.createElement("footer");
footer.className="xp-footer";footer.id="footer";
footer.innerHTML=`
 <div class="xp-foot-wrap">
  <a class="xp-foot-brand" href="/" aria-label="SKIEESTORE Beranda"><img class="xp-foot-logo" src="/assets/skieestore-logo-transparent.png?v=1" alt="SKIEESTORE"></a>
  <p class="xp-foot-desc">Top up game dan voucher digital jadi lebih sat-set! Pilih produk, isi data, lalu bayar praktis via QRIS. Pesanan diproses cepat dan otomatis, jadi kamu bisa langsung lanjut mabar.</p>
  <div class="xp-foot-grid">
   <section class="xp-foot-navigation">
    <div class="xp-foot-nav-grid">
     <section><h3>Informasi &amp; Bantuan</h3><div class="xp-foot-links">
      <a href="/tentang-skieestore">Tentang SKIEESTORE</a><a href="/pusat-bantuan">Pusat Bantuan</a><a href="/cara-top-up">Cara Top Up</a><a href="/kebijakan-privasi">Kebijakan Privasi</a><a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a>
     </div></section>
     <section><h3>Fitur &amp; Panduan</h3><div class="xp-foot-links">
      <a href="/profil">SKIEE Membership</a><a href="/artikel">Artikel / Blog</a><a href="/kalkulator/win-rate">Kalkulator Win Rate</a><a href="/kalkulator/magic-wheel">Kalkulator Magic Wheel</a><a href="/kalkulator/zodiac">Kalkulator Zodiac</a>
     </div></section>
    </div>
   </section>
   <section class="xp-foot-contact-section"><h3>Hubungi Kami</h3>
    <div class="xp-foot-contact">
     <a href="https://wa.me/message/3N6JKGNV65P2D1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Customer Service SKIEESTORE"><span class="xp-foot-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366" stroke="currentColor" stroke-width="1.4"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3 20l.9-4.9a8.4 8.4 0 1 1 16.6-3.3Z"/></svg></span>WhatsApp Customer Service</a>
     <a class="xp-foot-email" href="mailto:adminskiee@gmail.com" aria-label="Email SKIEESTORE">adminskiee@gmail.com</a>
    </div>
    <div class="xp-foot-meta">
     <div class="xp-foot-meta-row"><span class="xp-foot-meta-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span><strong>Jam Operasional CS</strong><span>08.00–22.00 WIB</span></span></div>
     <div class="xp-foot-meta-row"><span class="xp-foot-meta-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span><strong>Domisili Usaha</strong><a href="https://maps.google.com/?q=Lubuklinggau,+Indonesia" target="_blank" rel="noopener noreferrer">Lubuklinggau • Indonesia</a></span></div>
    </div>
   </section>
   <section class="xp-foot-social-section"><h3>Media Sosial</h3><div class="xp-foot-contact">
    <a href="https://www.instagram.com/skieestore?lqvp=MWhlc3VtdHpkOWs1" target="_blank" rel="noopener noreferrer">Instagram · skieestore</a>
    <a href="https://www.facebook.com/profile.php?id=61595844852789" target="_blank" rel="noopener noreferrer">Facebook · skieestore</a>
   </div></section>
  </div>
  <div class="xp-foot-copy"><span>© 2026 SKIEESTORE. All Rights Reserved.</span></div>
 </div>`;
if(!existing)document.body.appendChild(footer);
const styleId="skiee-shared-footer-style";let style=document.getElementById(styleId);if(!style){style=document.createElement("style");style.id=styleId;document.head.appendChild(style)}
style.textContent=`
footer.xp-footer#footer{display:block!important;width:100%!important;box-sizing:border-box!important;background:#fff!important;color:#090D16!important;border-top:1px solid #E2E8F0!important;padding:38px 0 18px!important;margin:32px 0 0!important;box-shadow:none!important}
footer.xp-footer#footer *{box-sizing:border-box!important;opacity:1!important}
footer.xp-footer#footer .xp-foot-wrap{width:min(1160px,calc(100% - 36px))!important;margin:0 auto!important}
footer.xp-footer#footer .xp-foot-brand{display:inline-flex!important;align-items:center!important;margin:0 0 12px!important}
footer.xp-footer#footer .xp-foot-logo{display:block!important;width:auto!important;height:38px!important;max-width:190px!important;object-fit:contain!important}
footer.xp-footer#footer .xp-foot-desc{max-width:760px!important;margin:0 0 24px!important;color:#090D16!important;font-size:13px!important;line-height:1.75!important;font-weight:500!important}
footer.xp-footer#footer .xp-foot-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:26px 34px!important}
footer.xp-footer#footer .xp-foot-navigation{grid-column:1/-1!important;min-width:0!important}
footer.xp-footer#footer h3{margin:0 0 12px!important;color:#090D16!important;font-size:14px!important;font-weight:850!important;line-height:1.35!important}
footer.xp-footer#footer .xp-foot-nav-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important}
footer.xp-footer#footer .xp-foot-links,footer.xp-footer#footer .xp-foot-contact{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important;min-width:0!important}
footer.xp-footer#footer .xp-foot-links a,footer.xp-footer#footer .xp-foot-contact a{display:flex!important;align-items:flex-start!important;gap:8px!important;min-width:0!important;color:#090D16!important;font-size:12px!important;line-height:1.55!important;font-weight:600!important;text-decoration:none!important;overflow-wrap:anywhere!important;word-break:normal!important}
footer.xp-footer#footer .xp-foot-links a:hover,footer.xp-footer#footer .xp-foot-contact a:hover{color:#0756D8!important;text-decoration:underline!important;text-underline-offset:3px!important}
footer.xp-footer#footer .xp-foot-contact .xp-foot-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 18px!important;width:18px!important;height:18px!important;margin:0!important}
footer.xp-footer#footer .xp-foot-contact .xp-foot-icon svg{display:block!important;width:18px!important;height:18px!important}
footer.xp-footer#footer .xp-foot-contact .xp-foot-email{display:block!important;width:max-content!important;max-width:100%!important;white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important;font-size:13px!important;letter-spacing:0!important}
footer.xp-footer#footer .xp-foot-meta{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin-top:18px!important}
footer.xp-footer#footer .xp-foot-meta-row{display:flex!important;align-items:flex-start!important;gap:7px!important;min-width:0!important;color:#090D16!important}
footer.xp-footer#footer .xp-foot-meta-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 17px!important;width:17px!important;height:17px!important;margin-top:1px!important;color:#334155!important}
footer.xp-footer#footer .xp-foot-meta-row>span:last-child{display:grid!important;gap:3px!important;min-width:0!important;color:#090D16!important;font-size:11px!important;line-height:1.45!important}
footer.xp-footer#footer .xp-foot-meta-row strong{font-size:11px!important;font-weight:850!important;color:#090D16!important}
footer.xp-footer#footer .xp-foot-meta-row a,footer.xp-footer#footer .xp-foot-meta-row span{color:#090D16!important;text-decoration:none!important;overflow-wrap:anywhere!important}
footer.xp-footer#footer .xp-foot-copy{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;margin-top:24px!important;padding-top:14px!important;border-top:1px solid #E2E8F0!important;color:#090D16!important;font-size:11px!important;line-height:1.5!important;font-weight:650!important}
@media(max-width:760px){footer.xp-footer#footer{padding:28px 0 calc(88px + env(safe-area-inset-bottom))!important;margin-top:24px!important}footer.xp-footer#footer .xp-foot-grid{grid-template-columns:1fr!important;gap:24px!important}footer.xp-footer#footer .xp-foot-navigation{grid-column:auto!important}footer.xp-footer#footer .xp-foot-nav-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}footer.xp-footer#footer .xp-foot-meta{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}footer.xp-footer#footer .xp-foot-contact .xp-foot-email{font-size:12px!important}footer.xp-footer#footer .xp-foot-copy{font-size:10px!important}}
@media(max-width:360px){footer.xp-footer#footer .xp-foot-nav-grid{gap:8px!important}footer.xp-footer#footer .xp-foot-links a{font-size:11px!important}footer.xp-footer#footer .xp-foot-meta-row>span:last-child{font-size:10px!important}}
`;
})();