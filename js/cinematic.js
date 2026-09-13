(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const launch = document.querySelector('.launch');
  const shop = document.querySelector('.shop-scroll');
  let lastScrollIndex = -1;
  const progress = document.querySelector('.reading-progress');
  const clamp = (n) => Math.max(0, Math.min(1, n));
  let frame = 0;
  function update() {
    frame = 0;
    if (reduced.matches) return;
    progress.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`;
    const p = clamp(-launch.getBoundingClientRect().top / Math.max(1, launch.offsetHeight - innerHeight));
    launch.style.setProperty('--launch-p', p);
    launch.style.setProperty('--launch-screen', clamp((p - .25) / .45));
    const rect = shop.getBoundingClientRect();
    if (rect.top <= 0 && rect.bottom >= innerHeight) {
      const index = Math.min(2, Math.floor(clamp(-rect.top / Math.max(1, shop.offsetHeight - innerHeight)) * 3));
      if (index !== lastScrollIndex) { lastScrollIndex = index; select(index); }
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', queue, { passive:true });
  addEventListener('resize', queue, { passive:true });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      launch.style.removeProperty('--launch-p');
      launch.style.removeProperty('--launch-screen');
    }
    queue();
  });
  queue();
  launch.addEventListener('pointermove', (event) => {
    if (reduced.matches || !matchMedia('(hover: hover)').matches) return;
    const rect = launch.getBoundingClientRect();
    launch.style.setProperty('--pointer-x', (event.clientX / rect.width - .5) * 2);
    launch.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height - .5) * 2);
  }, {passive:true});
  launch.addEventListener('pointerleave', () => {
    launch.style.setProperty('--pointer-x', 0);
    launch.style.setProperty('--pointer-y', 0);
  });

  const buttons = [...document.querySelectorAll('[data-showcase]')];
  const devices = [...document.querySelectorAll('[data-device]')];
  const caption = document.querySelector('.showcase-caption');
  const captions = ['Your area. Your next opportunity.', 'Your price. Your schedule. Your offer.', 'Accepted. Scheduled. All in one place.'];
  let active = 0;
  function select(index) {
    active = index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    devices.forEach((device, i) => {
      const position = ((i - index + 4) % 3) - 1;
      device.style.transform = position === 0 ? 'translateX(0) rotate(0deg)' : `translateX(${position * (innerWidth < 600 ? 145 : 280)}px) translateY(60px) rotate(${position * 12}deg) scale(.84)`;
      device.style.opacity = position === 0 ? '1' : '.5';
      device.style.zIndex = position === 0 ? '3' : '1';
    });
    caption.textContent = window.snapT ? window.snapT(captions[index]) : captions[index];
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  addEventListener('resize', () => select(active), {passive:true});
  addEventListener('crashpricer:lang', () => select(active));
  select(0);
})();
