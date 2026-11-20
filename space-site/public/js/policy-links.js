// Add the homepage's destination links in a compact bar directly below the main footer.
(() => {
  const footer = document.querySelector('footer');
  if (!footer || document.getElementById('policy-links-footer')) return;

  const links = document.createElement('nav');
  links.id = 'policy-links-footer';
  links.setAttribute('aria-label', 'Footer navigation');
  links.innerHTML = '<a href="/">Home</a><a href="/contact">Contact</a><a href="/privacy-policy">Privacy Policy</a><a href="/terms-and-conditions">Terms &amp; Conditions</a>';
  footer.insertAdjacentElement('afterend', links);

  const style = document.createElement('style');
  style.textContent = `
    #policy-links-footer {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px 24px;
      width: 100%;
      padding: 18px 6vw calc(18px + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid var(--line, rgba(150, 200, 255, .2));
      background: #000;
      text-align: center;
    }
    #policy-links-footer a {
      color: var(--mut, #93a9c9);
      font-size: 14px;
      text-decoration: none;
      transition: color .2s;
    }
    #policy-links-footer a:hover,
    #policy-links-footer a:focus-visible {
      color: var(--b, #5ee7df);
    }
    @media (max-width: 600px) {
      #policy-links-footer { gap: 8px 18px; }
      #policy-links-footer a { font-size: 13px; }
    }
  `;
  document.head.appendChild(style);
})();
