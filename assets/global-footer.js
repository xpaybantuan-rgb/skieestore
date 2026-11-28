(()=>{"use strict";
const existing=document.querySelector("footer.xp-footer,footer.footer-simple,footer.auth-foot,footer.site-footer,footer.footer");
const footer=existing||document.createElement("footer");
const chatToggle=footer.querySelector("#chatToggle,.chat-fab");
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
   <section><h3>Hubungi Kami</h3>
    <div class="xp-foot-contact">
     <a href="https://wa.me/message/3N6JKGNV65P2D1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Customer Service SKIEESTORE"><span class="xp-foot-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366" stroke="currentColor" stroke-width="1.4"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3 20l.9-4.9a8.4 8.4 0 1 1 16.6-3.3Z"/></svg></span>WhatsApp Customer Service</a>
     <a href="mailto:adminskiee@gmail.com" aria-label="Email SKIEESTORE"><span class="xp-foot-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="#FACC15" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7" fill="none"/></svg></span>adminskiee@gmail.com</a>
    </div>
    <div class="xp-foot-meta">
     <div class="xp-foot-meta-row"><span class="xp-foot-meta-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span><strong>Jam Operasional CS</strong><span>08.00–22.00 WIB</span></span></div>
     <div class="xp-foot-meta-row"><span class="xp-foot-meta-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span><strong>Domisili Usaha</strong><a href="https://maps.google.com/?q=Lubuk+Linggau,+Sumatera+Selatan,+Indonesia" target="_blank" rel="noopener noreferrer">Lubuk Linggau, Sumatera Selatan, Indonesia</a></span></div>
    </div>
   </section>
   <section><h3>Media Sosial</h3><div class="xp-foot-contact">
    <a href="https://www.instagram.com/skieestore?lqvp=MWhlc3VtdHpkOWs1" target="_blank" rel="noopener noreferrer">Instagram · skieestore</a>
    <a href="https://www.facebook.com/profile.php?id=61595844852789" target="_blank" rel="noopener noreferrer">Facebook · skieestore</a>
   </div></section>
  </div>
  <div class="xp-foot-copy"><span>© 2026 SKIEESTORE. All Rights Reserved.</span></div>
 </div>`;
if(chatToggle)footer.querySelector(".xp-foot-copy").appendChild(chatToggle);
if(!existing)document.body.appendChild(footer);
})();