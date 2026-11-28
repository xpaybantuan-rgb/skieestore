(function(){
 const sharedHeader=document.querySelector("body>header.header,body>header.site-header,body>header.top,body>header.main-site-header");
 if(sharedHeader){
  document.body.classList.add("skiee-fixed-header");
  let sharedTheme=document.getElementById("skiee-site-theme-css");
  if(!sharedTheme){sharedTheme=document.createElement("link");sharedTheme.id="skiee-site-theme-css";sharedTheme.rel="stylesheet";sharedTheme.href="/assets/site-theme.css?v=1";}
  document.body.appendChild(sharedTheme);
 }
 const SEARCH_PATHS=new Set(["/","/cek-pesanan","/topup"]),path=location.pathname.length>1&&location.pathname.endsWith("/")?location.pathname.slice(0,-1):location.pathname;
 const header=document.querySelector("header.header,body>header");if(!header)return;
 const headrow=header.querySelector(".headrow")||header,oldNav=headrow.querySelector(".nav");if(oldNav)oldNav.setAttribute("aria-hidden","true");
 let actions=headrow.querySelector(".header-actions,.actions");if(!actions){actions=document.createElement("div");actions.className="site-nav-actions";headrow.appendChild(actions)}actions.classList.add("site-nav-actions");
 const search=headrow.querySelector("#headerSearchToggle,#mainHeaderSearchToggle,.header-search-btn"),showSearch=SEARCH_PATHS.has(path);
 if(search){search.hidden=!showSearch;search.setAttribute("aria-label","Cari game");search.setAttribute("title","Cari game");search.classList.remove("brutal-btn");search.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';}
 let toggle=headrow.querySelector("#siteMenuToggle");if(!toggle){toggle=document.createElement("button");toggle.type="button";toggle.id="siteMenuToggle";toggle.className="site-nav-menu-toggle";toggle.setAttribute("aria-label","Buka menu");toggle.setAttribute("aria-expanded","false");actions.appendChild(toggle)}
 let backdrop=document.querySelector(".site-menu-backdrop");if(!backdrop){backdrop=document.createElement("div");backdrop.className="site-menu-backdrop";backdrop.setAttribute("aria-hidden","true");document.body.appendChild(backdrop)}
 let card=document.querySelector(".site-menu-card");if(!card){card=document.createElement("aside");card.className="site-menu-card";card.id="siteMenuCard";card.setAttribute("aria-label","Menu utama");card.innerHTML=
 '<a class="site-menu-link" href="/profil"><span class="site-menu-icon">✦</span><span class="site-menu-copy"><strong>SKIEE MEMBERSHIP</strong><small>Harga spesial &amp; akses eksklusif</small></span><span class="site-menu-chevron">›</span></a>'+
 '<a class="site-menu-link" href="/artikel"><span class="site-menu-icon">▤</span><span class="site-menu-copy"><strong>ARTIKEL / BLOG</strong><small>Info update game, panduan, &amp; promo</small></span><span class="site-menu-chevron">›</span></a>'+
 '<div><button type="button" class="site-menu-link site-menu-calc-toggle" id="siteCalcToggle" aria-expanded="false"><span class="site-menu-icon">⌁</span><span class="site-menu-copy"><strong>KALKULATOR ↓</strong><small>Hitung kebutuhan gacha &amp; win rate</small></span><span class="site-menu-chevron" id="siteCalcChevron">⌄</span></button><div class="site-menu-subitems" id="siteCalcSubitems"><a href="/kalkulator/win-rate">Win Rate</a><a href="/kalkulator/magic-wheel">Magic Wheel</a><a href="/kalkulator/zodiac">Zodiac</a></div></div>'+
 '<div class="site-menu-divider"></div><div class="site-menu-auth" id="siteMenuAuth"><div class="site-menu-guest"><a class="site-menu-login" href="/login">MASUK →</a><a class="site-menu-register" href="/daftar">DAFTAR +</a></div></div>';document.body.appendChild(card)}
 const calc=card.querySelector("#siteCalcToggle"),subs=card.querySelector("#siteCalcSubitems");
 function setOpen(open){card.classList.toggle("is-open",open);backdrop.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Tutup menu":"Buka menu");toggle.innerHTML=open?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';document.body.style.overflow=open?"hidden":""}
 toggle.addEventListener("click",()=>setOpen(!card.classList.contains("is-open")));backdrop.addEventListener("click",()=>setOpen(false));document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});card.addEventListener("click",e=>{if(e.target.closest("a"))setOpen(false)});setOpen(false);
 if(calc)calc.addEventListener("click",()=>{const open=!subs.classList.contains("is-open");subs.classList.toggle("is-open",open);calc.setAttribute("aria-expanded",String(open));card.querySelector("#siteCalcChevron").textContent=open?"⌃":"⌄"});
 const authBox=card.querySelector("#siteMenuAuth");
 let client=null;
 function renderUser(user){if(!authBox)return;if(user){const name=(user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||user.email?.split("@")[0]||"Member";authBox.innerHTML='<div class="site-menu-user"><div class="site-menu-user-info"><strong></strong><small></small></div><button type="button" class="site-menu-logout" id="siteMenuLogout">Keluar</button></div>';authBox.querySelector("strong").textContent=name;authBox.querySelector("small").textContent=user.email||"Akun aktif";authBox.querySelector("#siteMenuLogout").addEventListener("click",async()=>{try{await client.auth.signOut();renderUser(null)}catch(e){alert("Gagal keluar. Coba lagi.")}})}else authBox.innerHTML='<div class="site-menu-guest"><a class="site-menu-login" href="/login">MASUK →</a><a class="site-menu-register" href="/daftar">DAFTAR +</a></div>'}
 function initAuth(){if(!window.supabase||!window.supabase.createClient)return;try{client=window.supabase.createClient("https://rjgeitbkpcyymgemcztx.supabase.co","sb_publishable_1b6C4q5vgbX0XfP_EV5yjQ_Qk9Cq4lR",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});client.auth.getSession().then(({data})=>renderUser(data.session?.user||null)).catch(()=>{});client.auth.onAuthStateChange((_event,session)=>renderUser(session?.user||null))}catch(e){}}
 if(window.supabase)initAuth();else{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=initAuth;document.head.appendChild(s)}
 /* Global UI polish: identical header controls, restrained search results, and a two-column footer. */
 const uiStyle=document.createElement("style");
 uiStyle.id="skiee-global-ui-polish";
 uiStyle.textContent=`
  .site-nav-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;margin-left:auto!important}
  .site-nav-menu-toggle,#headerSearchToggle,#mainHeaderSearchToggle,.header-search-btn{
   display:inline-flex!important;align-items:center!important;justify-content:center!important;
   width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important;
   padding:0!important;border:1px solid #E2E8F0!important;border-radius:12px!important;
   background:#FFFFFF!important;color:#334155!important;box-shadow:none!important;
   vertical-align:middle!important;line-height:1!important
  }
  .site-nav-menu-toggle[hidden],#headerSearchToggle[hidden],#mainHeaderSearchToggle[hidden],.header-search-btn[hidden]{display:none!important}
  .site-nav-menu-toggle svg,#headerSearchToggle svg,#mainHeaderSearchToggle svg,.header-search-btn svg{display:block!important;width:19px!important;height:19px!important;flex:none!important}
  .main-site-header{border-bottom:1px solid #E2E8F0!important;box-shadow:none!important}
  .main-site-header .header-search-btn{width:42px!important;height:42px!important;padding:0!important;border:1px solid #E2E8F0!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important}
  .main-header-search-panel{border:0!important;border-bottom:1px solid #E2E8F0!important;background:#fff!important;box-shadow:0 8px 20px rgba(148,163,184,.12)!important}
  .search-suggestions,.topup-search-results{
   background:#FFFFFF!important;color:#172033!important;border:1px solid #E2E8F0!important;
   border-radius:16px!important;box-shadow:0 10px 28px rgba(148,163,184,.22)!important
  }
  .search-suggestion{color:#172033!important;border-radius:12px!important}
  .search-suggestion:hover,.search-suggestion:focus-visible{background:#F8FAFC!important}
  .search-suggestion-copy small,.search-suggestion-empty{color:#64748B!important}
  .search-suggestion img,.search-suggestion-art{background:#F1F5F9!important}
  .topup-search-results>*{color:#172033!important}
  .xp-footer{display:block!important;width:100%!important;margin-top:32px!important;padding:34px 0 88px!important;background:#FFFFFF!important;border-top:1px solid #E2E8F0!important;color:#172033!important;box-shadow:none!important}
  .xp-footer .xp-foot-wrap{width:min(1160px,calc(100% - 36px))!important;margin:0 auto!important}
  .xp-footer .xp-foot-brand{display:inline-flex!important;align-items:center!important;margin-bottom:12px!important}
  .xp-footer .xp-foot-logo{display:block!important;width:auto!important;max-width:190px!important;height:48px!important;object-fit:contain!important}
  .xp-footer .xp-foot-desc{max-width:650px!important;margin:0 0 26px!important;color:#64748B!important;font-size:12px!important;line-height:1.75!important}
  .xp-footer .xp-foot-grid,.xp-footer .xp-foot-grid-global{
   display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
   align-items:start!important;column-gap:28px!important;row-gap:26px!important
  }
  .xp-footer h3{margin:4px 0 12px!important;color:#172033!important;font-size:12px!important;font-weight:800!important}
  .xp-footer .xp-foot-contact{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
  .xp-footer .xp-foot-contact a{display:flex!important;align-items:center!important;gap:8px!important;color:#087BFF!important;font-size:12px!important;line-height:1.55!important;text-decoration:none!important;overflow-wrap:anywhere!important}
  .xp-footer .xp-foot-meta{display:grid!important;gap:11px!important;margin-top:14px!important}
  .xp-footer .xp-foot-meta-row{display:grid!important;gap:3px!important;color:#64748B!important;font-size:11px!important;line-height:1.55!important}
  .xp-footer .xp-foot-meta-row strong{color:#334155!important;font-size:11px!important;font-weight:800!important}
  .xp-footer .xp-foot-copy{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-top:24px!important;padding-top:15px!important;border-top:1px solid #E2E8F0!important;color:#94A3B8!important;font-size:11px!important}
  .xp-footer .xp-foot-grid>section{min-width:0!important}
  .xp-footer .xp-foot-links{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:10px!important}
  .xp-footer .xp-foot-links a{display:block!important;line-height:1.55!important}
  .xp-footer .xp-foot-features .xp-foot-links{gap:10px!important}
  @media(max-width:760px){
   .site-nav-menu-toggle,#headerSearchToggle,#mainHeaderSearchToggle,.header-search-btn{width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important;max-height:40px!important;flex:0 0 40px!important;border-radius:12px!important}
   .xp-footer .xp-foot-grid,.xp-footer .xp-foot-grid-global{grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:18px!important;row-gap:24px!important}
   .xp-footer .xp-foot-grid>section h3{font-size:12px!important;line-height:1.4!important}
   .xp-footer .xp-foot-links{gap:9px!important}
  }
 `;
 document.head.appendChild(uiStyle);
 function polishGlobalFooter(){
  let footer=document.querySelector("footer.footer-simple");
  if(footer){
   footer.className="xp-footer";
   footer.id=footer.id||"footer";
   footer.innerHTML='<div class="xp-foot-wrap"><a class="xp-foot-brand" href="/" aria-label="SKIEESTORE Beranda"><img class="xp-foot-logo" src="/assets/skieestore-logo-transparent.png?v=1" alt="SKIEESTORE"></a><p class="xp-foot-desc">Top up game dan voucher digital jadi lebih sat-set! Pilih produk, isi data, lalu bayar praktis via QRIS. Pesanan diproses cepat dan otomatis, jadi kamu bisa langsung lanjut mabar.</p><div class="xp-foot-grid"><section><h3>Informasi &amp; Bantuan</h3><div class="xp-foot-links"><a href="/tentang-skieestore">Tentang SKIEESTORE</a><a href="/pusat-bantuan">Pusat Bantuan</a><a href="/cara-top-up">Cara Top Up</a><a href="/kebijakan-privasi">Kebijakan Privasi</a><a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a></div></section><section><h3>Hubungi Kami</h3><div class="xp-foot-contact"><a href="https://wa.me/message/3N6JKGNV65P2D1" target="_blank" rel="noopener noreferrer">WhatsApp Customer Service</a><a href="mailto:adminskiee@gmail.com">adminskiee@gmail.com</a></div><div class="xp-foot-meta"><div class="xp-foot-meta-row"><strong>Jam Operasional CS</strong><span>08.00–22.00 WIB</span></div><div class="xp-foot-meta-row"><strong>Domisili Usaha</strong><a href="https://maps.google.com/?q=Lubuk+Linggau,+Sumatera+Selatan,+Indonesia" target="_blank" rel="noopener noreferrer">Lubuk Linggau, Sumatera Selatan, Indonesia</a></div></div></section><section><h3>Media Sosial</h3><div class="xp-foot-contact"><a href="https://www.instagram.com/skieestore?lqvp=MWhlc3VtdHpkOWs1" target="_blank" rel="noopener noreferrer">Instagram · skieestore</a><a href="https://www.facebook.com/profile.php?id=61595844852789" target="_blank" rel="noopener noreferrer">Facebook · skieestore</a></div></section></div><div class="xp-foot-copy">© '+new Date().getFullYear()+' SKIEESTORE. All Rights Reserved.</div></div>';
  }
  const grid=document.querySelector(".xp-footer .xp-foot-grid");
  if(!grid)return;
  grid.classList.add("xp-foot-grid-global");
  const info=[...grid.children].find(section=>section.tagName==="SECTION"&&/Informasi\s*&\s*Bantuan/i.test(section.querySelector("h3")?.textContent||""));
  if(!info)return;
  const links=info.querySelector(".xp-foot-links");
  if(links)links.querySelectorAll('a[href="/cek-pesanan"],a[href="/cek-pesanan/"]').forEach(link=>link.remove());
  if(!grid.querySelector(".xp-foot-features")){
   const section=document.createElement("section");
   section.className="xp-foot-features";
   section.innerHTML='<h3>Fitur &amp; Panduan</h3><div class="xp-foot-links"><a href="/profil">SKIEE Membership</a><a href="/artikel">Artikel / Blog</a><a href="/kalkulator/win-rate">Kalkulator Win Rate</a><a href="/kalkulator/magic-wheel">Kalkulator Magic Wheel</a><a href="/kalkulator/zodiac">Kalkulator Zodiac</a></div>';
   info.insertAdjacentElement("afterend",section);
  }
 }
 polishGlobalFooter();
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",polishGlobalFooter,{once:true});
})();