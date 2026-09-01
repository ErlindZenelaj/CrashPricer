/* ============================================================
   Page behaviour — navigation, reveals, counters, magnetics
   ============================================================ */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── sticky glass navigation ─────────────────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── mobile menu ─────────────────────────────────────────── */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobilemenu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    const label = open ? 'Close menu' : 'Open menu';
    burger.setAttribute('aria-label', window.snapT ? window.snapT(label) : label);
    menu.hidden = !open;
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  addEventListener('snapprice:lang', () => setMenu(!menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 1024) setMenu(false); });

  /* ── section reveals, staggered by position in their group ── */
  const revealables = [...document.querySelectorAll('.reveal')];
  if (reduced.matches) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const sibs = [...e.target.parentElement.children].filter((n) => n.classList.contains('reveal'));
        e.target.style.setProperty('--d', `${Math.max(0, sibs.indexOf(e.target)) * 80}ms`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    revealables.forEach((el) => io.observe(el));
  }

  /* ── number count-up ─────────────────────────────────────── */
  const counters = [...document.querySelectorAll('[data-count]')];
  const runCount = (el) => {
    const to = Number(el.dataset.count);
    if (reduced.matches) { el.textContent = String(to); return; }
    const dur = 1400;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = String(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      runCount(e.target);
      cio.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  counters.forEach((el) => cio.observe(el));

  /* ── the estimate fragment re-counts each time it floats in ─ */
  if (!reduced.matches) {
    for (const el of document.querySelectorAll('[data-odo]')) {
      const host = el.closest('.orb');
      if (!host) continue;
      const to = Number(el.dataset.odo);
      const run = () => {
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 1100);
          el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 4))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      new MutationObserver(() => { if (host.classList.contains('is-on')) run(); })
        .observe(host, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ── magnetic buttons ────────────────────────────────────── */
  if (!reduced.matches && matchMedia('(hover: hover)').matches) {
    for (const el of document.querySelectorAll('.magnetic')) {
      let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      const tick = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(tick) : 0;
      };
      const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 16;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 12;
        start();
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; start(); });
    }
  }

  /* ── scroll-linked motion below the fold ─────────────────────
        One loop for everything that opts in with data-scrub. Each element
        gets --s: 0 as it enters the viewport, 1 as it leaves. The CSS decides
        what to do with it — the place names drift, the fragments beside the
        shop screen sit at their own depths. Only elements actually on screen
        are measured, and the loop stops when none are. */
  if (!reduced.matches) {
    const scrubs = [...document.querySelectorAll('[data-scrub]')];
    const live = new Set();
    let raf = 0;

    function tick() {
      for (const el of live) {
        const r = el.getBoundingClientRect();
        const p = (innerHeight - r.top) / (innerHeight + r.height);
        el.style.setProperty('--s', Math.min(1, Math.max(0, p)).toFixed(4));
      }
      raf = live.size ? requestAnimationFrame(tick) : 0;
    }

    if (scrubs.length) {
      const sio = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) live.add(e.target);
          else live.delete(e.target);
        }
        if (live.size && !raf) raf = requestAnimationFrame(tick);
      }, { rootMargin: '20% 0px' });
      scrubs.forEach((el) => sio.observe(el));
    }
  }

  /* ── one FAQ answer open at a time ───────────────────────── */
  const qas = [...document.querySelectorAll('.qa')];
  qas.forEach((qa) => qa.addEventListener('toggle', () => {
    if (qa.open) qas.forEach((o) => { if (o !== qa) o.open = false; });
  }));

  /* ── footer year ─────────────────────────────────────────── */
  document.getElementById('yr').textContent = String(new Date().getFullYear());
})();
