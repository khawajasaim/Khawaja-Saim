(() => {
  const root = document.documentElement;
  root.classList.add('reveal-ready');

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobilePanel = document.querySelector('.mobile-panel');

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuButton && mobilePanel) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      mobilePanel.setAttribute('aria-hidden', 'true');
      mobilePanel.classList.remove('is-open');
    };

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      mobilePanel.setAttribute('aria-hidden', String(open));
      mobilePanel.classList.toggle('is-open', !open);
    });

    mobilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = [...document.querySelectorAll('.reveal')];

  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  }

  const counters = [...document.querySelectorAll('[data-count]')];
  const formatCounter = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  };

  const animateCounter = el => {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    if (reducedMotion) return;

    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const duration = 900;
    const start = performance.now();

    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCounter(el, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatCounter(el, target);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && !reducedMotion && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    counters.forEach(el => counterObserver.observe(el));
  }
})();
