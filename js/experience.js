/* ============================================================
   The scroll experience

   One device, five real app screens. Scroll position becomes a
   single normalised value; everything else — which screen is
   live, how the device is turned, which interface fragments
   float, which chapter copy is on — is derived from it.

   Screen 0 is the app's home, shown while the hero copy is up.
   Screens 1-4 are the journey: photos, estimate, offers, booked.
   ============================================================ */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small   = matchMedia('(max-width: 860px)');

  const experience = document.getElementById('experience');
  const stage      = document.getElementById('stage');
  const hero       = document.getElementById('hero');
  const phone      = document.getElementById('phone');
  const rail       = document.getElementById('rail');
  const orbs       = [...document.querySelectorAll('#orbs .orb')];
  const steps      = [...document.querySelectorAll('#steps .step')];
  const railItems  = [...document.querySelectorAll('#rail li')];
  const screens    = [...document.querySelectorAll('#screens .scr')];

  if (!experience || !phone) return;

  const STORY    = 4;      // chapters that carry copy (screens 1-4)
  const HERO_OUT = 0.10;   // progress at which the hero copy has left

  /* Device attitude per screen, anchored at each screen's midpoint in the
     scroll and interpolated between — always moving, never spinning. */
  const ANCHOR = [];       // p position of each screen's midpoint
  ANCHOR[0] = HERO_OUT / 2;
  for (let i = 1; i <= STORY; i++) {
    ANCHOR[i] = HERO_OUT + ((i - 0.5) / STORY) * (1 - HERO_OUT);
  }

  const ROT_Y = [-16, -9,  -2,  9, -6];
  const ROT_X = [  7,  5,   3, -2,  4];
  const ROT_Z = [1.8,  1, -1.2, 2, -1.3];

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const ease  = (t) => t * t * (3 - 2 * t);              // smoothstep

  /* Piecewise value of a per-screen track at scroll position p. */
  function track(values, p) {
    if (p <= ANCHOR[0]) return values[0];
    const last = values.length - 1;
    if (p >= ANCHOR[last]) return values[last];
    let i = 0;
    while (i < last && p > ANCHOR[i + 1]) i++;
    const t = (p - ANCHOR[i]) / (ANCHOR[i + 1] - ANCHOR[i]);
    return lerp(values[i], values[i + 1], ease(clamp(t)));
  }

  /* ---------- state ---------- */
  const target = { p: 0, mx: 0, my: 0 };
  const cur    = { p: 0, mx: 0, my: 0 };
  let chapter = -1;
  let running = false;
  let inView = true;

  function readScroll() {
    const span = experience.offsetHeight - innerHeight;
    target.p = span > 0 ? clamp(-experience.getBoundingClientRect().top / span) : 0;
  }

  function onPointer(e) {
    if (small.matches) return;
    target.mx = (e.clientX / innerWidth) * 2 - 1;
    target.my = (e.clientY / innerHeight) * 2 - 1;
  }

  /* Chapter 0 is the hero; 1-4 are the story. */
  function chapterAt(p) {
    if (p < HERO_OUT) return 0;
    const storyP = (p - HERO_OUT) / (1 - HERO_OUT);
    return 1 + clamp(Math.floor(storyP * STORY), 0, STORY - 1);
  }

  function setChapter(next) {
    if (next === chapter) return;
    chapter = next;

    screens.forEach((s, i) => s.classList.toggle('is-on', i === next));
    orbs.forEach((o) => o.classList.toggle('is-on', Number(o.dataset.ch) === next));
    steps.forEach((s) => s.classList.toggle('is-on', Number(s.dataset.ch) === next));
    railItems.forEach((r) => r.classList.toggle('is-on', Number(r.dataset.ch) === next));

    rail.classList.toggle('is-live', next > 0);
    hero.style.pointerEvents = next > 0 ? 'none' : '';
    hero.setAttribute('aria-hidden', next > 0 ? 'true' : 'false');
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

    setChapter(chapterAt(target.p));

    /* device attitude */
    const damp = isSmall ? 0.45 : 1;
    const ry = track(ROT_Y, p) * damp + cur.mx * (isSmall ? 0 : 5.5);
    const rx = track(ROT_X, p) * damp - cur.my * (isSmall ? 0 : 3.5);
    const rz = track(ROT_Z, p) * damp;

    /* the device settles into place while the hero leaves */
    const settle = ease(clamp(p / (HERO_OUT * 1.6)));
    const scale  = isSmall ? lerp(0.86, 1, settle) : lerp(0.9, 1, settle);
    const shiftY = isSmall
      ? lerp(46, -10, settle)                    // sits below the hero copy, then rises
      : lerp(4, 0, settle);
    const floatY = Math.sin(p * Math.PI * 4) * (isSmall ? 0.4 : 1.1);

    phone.style.transform =
      `translate3d(0, ${shiftY + floatY}vh, 0) ` +
      `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;

    /* fragments drift against the cursor; deeper cards move further */
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
