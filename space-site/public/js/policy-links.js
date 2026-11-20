// Ensure the legal/contact pages are reachable from the live homepage navigation and footer.
(() => {
 const headerNav=document.querySelector('nav div')||document.querySelector('nav');
 if(headerNav&&!document.getElementById('policy-links-header')){
  const links=document.createElement('span');
  links.id='policy-links-header';
  links.innerHTML='<a class="policy-nav-link" href="/privacy-policy">Privacy Policy</a><a class="policy-nav-link" href="/terms-and-conditions">Terms &amp; Conditions</a><a class="policy-nav-link" href="/contact">Contact</a>';
  headerNav.appendChild(links);
 }
 const footer=document.querySelector('footer');
 if(footer&&!document.getElementById('policy-links-footer')){
  const links=document.createElement('nav');
  links.id='policy-links-footer';
  links.setAttribute('aria-label','Legal and contact links');
  links.innerHTML='<a href="/privacy-policy">Privacy Policy</a><a href="/terms-and-conditions">Terms &amp; Conditions</a><a href="/contact">Contact</a>';
  const columns=footer.querySelector('.fcols');
  if(columns){
   const group=document.createElement('div');
   group.className='policy-footer-group';
   group.innerHTML='<h4>INFORMATION</h4>';
   group.appendChild(links);
   columns.appendChild(group);
  }else{
   footer.insertBefore(links,footer.querySelector('p')||null);
  }
 }
 if(!document.getElementById('policy-links-style')){
  const style=document.createElement('style');
  style.id='policy-links-style';
  style.textContent=`#policy-links-header{display:flex;align-items:center;gap:10px;margin-left:18px}.policy-nav-link{display:inline-flex!important;align-items:center;padding:7px 12px;border:1px solid rgba(94,231,223,.35);border-radius:999px;color:var(--fg,#eaf6ff)!important;background:rgba(3,4,12,.45);font-size:13px!important;text-decoration:none;white-space:nowrap;transition:background .2s,border-color .2s,color .2s}.policy-nav-link:hover{border-color:var(--b,#5ee7df);background:rgba(94,231,223,.12);color:var(--b,#5ee7df)!important}#policy-links-footer{position:relative;display:flex;justify-content:center;flex-wrap:wrap;gap:12px 22px;width:min(960px,100%);margin:18px auto 0;padding:16px 0;border-top:1px solid var(--line,rgba(150,200,255,.2));z-index:1}#policy-links-footer a{color:var(--mut,#93a9c9);font-size:14px;text-decoration:none}#policy-links-footer a:hover{color:var(--b,#5ee7df)}.policy-footer-group nav{display:grid;gap:5px;margin:0;padding:0;border:0;background:none}.policy-footer-group nav a{color:var(--mut,#93a9c9);font-size:15px;text-decoration:none}.policy-footer-group nav a:hover{color:var(--b,#5ee7df)}@media(max-width:800px){#policy-links-header{display:flex;flex-direction:column;align-items:stretch;gap:0;margin:0}.policy-nav-link{display:block!important;padding:13px 0;border:0;border-bottom:1px solid var(--line,rgba(150,200,255,.2));border-radius:0;background:none;font-size:15px!important}.policy-nav-link:hover{background:none}#policy-links-footer{gap:10px 18px;font-size:12px}}`;
  document.head.appendChild(style);
 }
})();
