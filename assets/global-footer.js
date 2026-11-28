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
if(!existing)document.body.appendChild(footer);
})();