/* ============================================================
   The scroll experience
   One phone, four chapters. Scroll position drives a single
   normalised progress value; everything else — device rotation,
   which screen is live, which fragments float, which copy is
   on — is derived from it. Pointer movement adds a shallow
   parallax on top. All of it runs in one rAF loop.
   ============================================================ */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small   = matchMedia('(max-width: 860px)');

  const experience = document.getElementById('experience');
  const stage      = document.getElementById('stage');
  const hero       = document.getElementById('hero');
  const phone      = document.getElementById('phone');
  const orbs       = [...document.querySelectorAll('#orbs .orb')];
  const steps      = [...document.querySelectorAll('#steps .step')];
  const rail       = [...document.querySelectorAll('#rail li')];
  const screens    = [...document.querySelectorAll('#screens .scr')];

  if (!experience || !phone) return;

  const CHAPTERS  = 4;
  const HERO_OUT  = 0.085;   // progress at which the hero copy has fully left

  /* Device attitude per chapter — anchored at each chapter's midpoint
     and interpolated between, so the phone is always in motion but
     never spins. Degrees. */
  const ROT_Y = [-15, -4,  10, -7];
  const ROT_X = [  6,  3,  -2,  4];
  const ROT_Z = [1.6, -1,   2, -1.4];

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const ease  = (t) => t * t * (3 - 2 * t);            // smoothstep

  /* Value of a per-chapter keyframe track at continuous chapter pos `cp`. */
  function track(arr, cp) {
    const x = clamp(cp - 0.5, 0, CHAPTERS - 1);
    const i = Math.min(Math.floor(x), CHAPTERS - 2);
    return lerp(arr[i], arr[i + 1], ease(clamp(x - i)));
  }

  /* ---------- state ---------- */
  const target = { p: 0, mx: 0, my: 0 };
  const cur    = { p: 0, mx: 0, my: 0 };
  let chapter = -1;
  let heroGone = null;
  let running = false;
  let inView = true;

  /* ---------- scroll ---------- */
  function readScroll() {
    const rect = experience.getBoundingClientRect();
    const span = experience.offsetHeight - innerHeight;
    target.p = span > 0 ? clamp(-rect.top / span) : 0;
  }

  /* ---------- pointer ---------- */
  function onPointer(e) {
    if (small.matches) return;
    target.mx = (e.clientX / innerWidth) * 2 - 1;
    target.my = (e.clientY / innerHeight) * 2 - 1;
  }

  /* ---------- discrete chapter changes ---------- */
  function setChapter(next) {
    if (next === chapter) return;
    chapter = next;

    screens.forEach((s, i) => s.classList.toggle('is-on', i === next));
    rail.forEach((r, i) => r.classList.toggle('is-on', i === next));
    orbs.forEach((o) => {
      o.classList.toggle("is-on", Number(o.dataset.ch) === next);
    });
    steps.forEach((s, i) => {
      s.classList.toggle('is-on', i === next && heroGone === true);
    });
  }

  function setHeroGone(gone) {
    if (gone === heroGone) return;
    heroGone = gone;
    hero.style.pointerEvents = gone ? 'none' : '';
    hero.setAttribute('aria-hidden', gone ? 'true' : 'false');
    steps.forEach((s, i) => s.classList.toggle("is-on", gone && i === chapter));
  }

  /* ---------- frame ---------- */
  function frame() {
    cur.p  = lerp(cur.p,  target.p,  0.12);
    cur.mx = lerp(cur.mx, target.mx, 0.06);
    cur.my = lerp(cur.my, target.my, 0.06);

    const p = cur.p;
    const isSmall = small.matches;

    /* hero copy leaves */
    const out = ease(clamp(p / HERO_OUT));
    hero.style.opacity   = String(1 - out);
    hero.style.transform = `translate3d(0, ${-46 * out}px, 0) scale(${1 - 0.045 * out})`;
    setHeroGone(target.p > HERO_OUT * 0.92);

    /* chapter position */
    const storyP = clamp((p - HERO_OUT * 0.6) / (1 - HERO_OUT * 0.6));
    const cp = storyP * CHAPTERS;
    setChapter(clamp(Math.floor(cp), 0, CHAPTERS - 1));

    /* device attitude */
    const damp = isSmall ? 0.45 : 1;
    const ry = track(ROT_Y, cp) * damp + cur.mx * (isSmall ? 0 : 5.5);
    const rx = track(ROT_X, cp) * damp - cur.my * (isSmall ? 0 : 3.5);
    const rz = track(ROT_Z, cp) * damp;

    /* entrance: the device settles into place while the hero leaves */
    const settle = ease(clamp(p / (HERO_OUT * 1.9)));
    const scale  = isSmall ? lerp(0.86, 1, settle) : lerp(0.9, 1, settle);
    const shiftY = isSmall
      ? lerp(46, -10, settle)                    // sits below the hero copy, then rises
      : lerp(4, 0, settle);
    const floatY = Math.sin(p * Math.PI * 4) * (isSmall ? 0.4 : 1.1);

    phone.style.transform =
      `translate3d(0, ${shiftY + floatY}vh, 0) ` +
      `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;

    /* fragments drift against the cursor, deeper cards move further */
    if (!isSmall) {
      for (const o of orbs) {
        if (!o.classList.contains('is-on')) continue;
        const d = (parseFloat(o.style.getPropertyValue('--z')) || 60) / 120;
        o.style.setProperty('--px', `${cur.mx * -16 * d}px`);
        o.style.setProperty('--py', `${cur.my * -11 * d}px`);
      }
    }

    if (inView || Math.abs(cur.p - target.p) > 0.001) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  /* ---------- reduced motion: a static, readable stack ---------- */
  if (reduced.matches) {
    screens[0].classList.add('is-on');
    steps.forEach((s) => s.classList.add('is-on'));
    return;
  }

  /* only animate while the experience is on screen */
  new IntersectionObserver(
    ([e]) => { inView = e.isIntersecting; if (inView) kick(); },
    { rootMargin: '10% 0px' }
  ).observe(experience);

  addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
  addEventListener('resize', () => { readScroll(); kick(); }, { passive: true });
  stage.addEventListener('pointermove', onPointer, { passive: true });
  stage.addEventListener('pointerleave', () => { target.mx = 0; target.my = 0; }, { passive: true });

  readScroll();
  cur.p = target.p;
  kick();
})();
