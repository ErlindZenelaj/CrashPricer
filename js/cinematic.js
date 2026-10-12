/* ============================================================
   Landing-page scenes — the spotlit hero, the opening card, the
   section hand-offs, the shop gallery and the nav's tone. One rAF-throttled scroll
   handler drives all of them; each only writes CSS variables or
   classes, and the CSS decides what they do.

   Per frame it reads every measurement first and writes afterwards, and
   writes only what changed: interleaving the two forces layout several
   times a frame, which is what makes scrolling stutter on phones.
   ============================================================ */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  /* reduced motion gets the open, unpinned card (see CSS) */
  const staticCard = matchMedia('(prefers-reduced-motion: reduce)');

  const nav = document.getElementById('nav');
  const hero = document.querySelector('.spot-hero');
  const expand = document.querySelector('.expand');
  const walkthrough = document.getElementById('experience');
  const shop = document.querySelector('.shop-scroll');
  const progress = document.querySelector('.reading-progress');
  const main = document.getElementById('top');
  const curtains = [...document.querySelectorAll('[data-curtain]')];
  /* in page order: where sections overlap, the earlier one is on top */
  const layers = [...main.children, document.querySelector('.foot')]
    .filter((el) => el.matches('section, footer'));
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const ease = (t) => t * t * (3 - 2 * t);
  const NAV_LINE = 36;    // the nav's vertical centre
  let lastScrollIndex = -1;
  let frame = 0;
  let restScan = () => {};   // set by the hero's scan cycle below

  /* Write only what changed. A custom property set on an ancestor restyles
     every descendant, so re-writing an identical value each frame is real
     work; so is toggling a class to the state it already has. */
  const wrote = new WeakMap();
  function put(el, prop, value) {
    if (!el) return;
    let m = wrote.get(el);
    if (!m) wrote.set(el, (m = {}));
    if (m[prop] === value) return;
    m[prop] = value;
    if (value === null || value === '') {
      if (prop.startsWith('--')) el.style.removeProperty(prop); else el.style[prop] = '';
    } else if (prop.startsWith('--')) el.style.setProperty(prop, value);
    else el.style[prop] = value;
  }
  const flags = new WeakMap();
  function setFlag(el, name, on) {
    let m = flags.get(el);
    if (!m) flags.set(el, (m = {}));
    if (m[name] === on) return;
    m[name] = on;
    el.classList.toggle(name, on);
  }

  /* The card opens over the first 80% of its stage and holds open for
     the rest, so the walkthrough arrives already settled. r is the card's
     rect, measured before anything was written this frame. */
  function opening(r, h, vh) {
    if (!expand) return 1;
    if (!r) {                                   // reduced motion: open and unpinned
      put(expand, '--x', null);
      put(walkthrough, '--lift', null);
      return 1;
    }
    const x = clamp(-r.top / Math.max(1, h - vh) / 0.8);
    put(expand, '--x', ease(x).toFixed(4));
    /* then the open card lifts off the walkthrough pinned beneath it */
    put(walkthrough, '--lift', ease(clamp(1 - r.bottom / vh)).toFixed(4));
    return x;
  }

  function update() {
    frame = 0;
    const sy = scrollY, vh = innerHeight;
    const still = reduced.matches;

    /* ── read: every measurement, before the first write ── */
    const heroR = hero ? hero.getBoundingClientRect() : null;
    const boxTop = hero && cut ? (cut.pinned ? pin.getBoundingClientRect().top : heroR.top) : 0;
    const heroH = hero ? hero.offsetHeight : 0;
    const expandR = expand && !staticCard.matches ? expand.getBoundingClientRect() : null;
    const expandH = expand ? expand.offsetHeight : 0;
    const rects = layers.map((layer) => layer.getBoundingClientRect());
    let seams = null, docH = 0, shopR = null, shopH = 0;
    if (!still) {
      seams = curtains.map((a) => ({ a, b: a.nextElementSibling, end: a.offsetTop + a.offsetHeight, bh: a.nextElementSibling.offsetHeight }));
      docH = document.documentElement.scrollHeight;
      shopR = shop.getBoundingClientRect();
      shopH = shop.offsetHeight;
    }

    /* ── write ── */
    travel(heroR, boxTop, heroH, vh);
    const x = opening(expandR, expandH, vh);

    /* light-on-dark chrome while a dark section is under the bar — the
       opening card counts as light once it has nearly filled the screen */
    let dark = false;
    for (let i = 0; i < layers.length; i++) {
      const r = rects[i];
      if (r.top <= NAV_LINE && r.bottom > NAV_LINE) {
        dark = layers[i].hasAttribute('data-dark') && (layers[i] !== expand || x < 0.85);
        break;
      }
    }
    setFlag(nav, 'is-dark', dark);

    if (still) {
      for (const a of curtains) {
        setFlag(a, 'is-lifting', false);
        put(a.nextElementSibling, 'transform', null);
      }
      return;
    }

    /* Curtains. While a section's bottom edge crosses the screen it lifts
       away with the scan line on that edge, and the section after it is
       held in place underneath, fading up as it is uncovered. Measured
       from layout, so the held position never feeds back into itself.
       The section about to be held is promoted to its own layer shortly
       before, so the first frame of the lift is not spent rasterising it. */
    for (const { a, b, end, bh } of seams) {
      const edge = end - sy;
      /* a section shorter than the screen cannot be held without a gap */
      const lifting = edge > 0 && edge < vh && bh >= vh;
      setFlag(a, 'is-lifting', lifting);
      setFlag(b, 'is-near', edge > -vh * 0.25 && edge < vh * 2);
      put(b, 'transform', lifting ? `translate3d(0, ${(-edge).toFixed(1)}px, 0)` : null);
      put(b.querySelector(':scope > .veil'), 'opacity', lifting ? (edge / vh * 0.5).toFixed(3) : '0');
    }
    put(progress, 'transform', `scaleX(${clamp(sy / Math.max(1, docH - vh)).toFixed(4)})`);
    if (shopR.top <= 0 && shopR.bottom >= vh) {
      const index = Math.min(2, Math.floor(clamp(-shopR.top / Math.max(1, shopH - vh)) * 3));
      if (index !== lastScrollIndex) { lastScrollIndex = index; select(index); }
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }

  /* reduced motion drops the curtains: nothing held, nothing lifting */
  function settle() {
    if (reduced.matches) {
      for (const a of curtains) {
        setFlag(a, 'is-lifting', false);
        setFlag(a.nextElementSibling, 'is-near', false);
        put(a.nextElementSibling, 'transform', null);
      }
    }
    queue();
  }

  addEventListener('scroll', queue, { passive:true });
  /* On phones the toolbar sliding in and out fires resize with only the
     height changed; nothing here depends on that, so measuring waits for a
     real change of width (see the hero's re-measure below). */
  let knownWidth = innerWidth;
  const widthChanged = () => { const w = innerWidth; if (w === knownWidth) return false; knownWidth = w; return true; };
  addEventListener('resize', queue, { passive:true });
  reduced.addEventListener('change', settle);
  staticCard.addEventListener('change', queue);
  queue();

  /* The spotlights come up as their section arrives, not on page load. */
  const lights = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-lit');
      lights.unobserve(e.target);
    }
  }, { threshold: 0.2 });
  document.querySelectorAll('.spotlight').forEach((el) => lights.observe(el.closest('section') || el));

  /* A section held under a lifting curtain reports its held position, so
     a native jump to it lands in the wrong place. In-page links jump to
     where each section sits in the flow instead. */
  function flowTop(target) {
    let y = main.getBoundingClientRect().top + scrollY;
    if (target === main) return y;
    for (const el of main.children) {
      const c = getComputedStyle(el);
      y += parseFloat(c.marginTop) || 0;
      if (el === target) return y;
      y += el.offsetHeight + (parseFloat(c.marginBottom) || 0);
    }
    return null;
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || reduced.matches || event.defaultPrevented) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target || (target !== main && target.parentElement !== main)) return;
    const top = flowTop(target);
    if (top === null) return;
    event.preventDefault();
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    scrollTo({ top: Math.max(0, top - pad - margin), behavior: 'smooth' });
    history.pushState(null, '', `#${id}`);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* Looping decoration holds still while it is off screen. */
  const pause = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-paused', !e.isIntersecting);
  });
  [hero, expand].forEach((el) => el && pause.observe(el));

  /* The lit phone scans: the photos wipe into the estimate behind the
     scan line and back, a few times, then it rests on the estimate. It
     holds while off screen or in a hidden tab; under reduced motion it
     simply shows the estimate. */
  if (hero) {
    const HOLD = 3000, WIPE = 1200, WIPES = 5;   // odd, so it ends on the price
    let wipes = 0, timer = 0, visible = false;
    const schedule = () => {
      if (!timer && visible && !document.hidden && !reduced.matches && wipes < WIPES) {
        timer = setTimeout(wipe, wipes ? HOLD + WIPE : HOLD);
      }
    };
    const wipe = () => {
      timer = 0;
      if (!visible || document.hidden || reduced.matches) return;
      hero.dataset.state = hero.dataset.state === 'scan' ? 'price' : 'scan';
      hero.classList.add('is-wiping');
      setTimeout(() => hero.classList.remove('is-wiping'), WIPE);
      wipes++;
      schedule();
    };
    const rest = () => { clearTimeout(timer); timer = 0; wipes = WIPES; hero.dataset.state = 'price'; };
    restScan = () => { if (hero.dataset.state !== 'price' || wipes < WIPES) rest(); };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }).observe(hero);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', () => (reduced.matches ? rest() : schedule()));
    if (reduced.matches) rest();
  }

  /* The match cut. As the page starts to scroll, the side phones fold
     in and the lit phone glides to exactly where the opening card's phone
     waits below — same centre, same width — and stays there, so the scan
     line that lifts the hero passes from one phone straight into the
     other. On desktop the hero holds still for the glide (its pin is
     sticky); on phones it scrolls, and the glide is measured against
     where the phone actually is, so the same sum serves both. All from
     layout, never from the moving rig; re-measured on resize. */
  const travelling = matchMedia('(prefers-reduced-motion: no-preference)');
  const rig = hero && hero.querySelector('.rig');
  const fan = hero && hero.querySelector('.rig__fan');
  const pin = hero && hero.querySelector('.spot-hero__pin');
  const heroPhone = hero && hero.querySelector('.rig__main');
  const cardStage = document.querySelector('.expand__stage');
  const cardPhone = document.querySelector('.expand__main .capture-device');
  let cut = null;

  function measureCut() {
    cut = null;
    if (!rig || !cardPhone || !travelling.matches) return;
    const pinned = getComputedStyle(pin).position === 'sticky';
    const held = rig.style.transform;
    rig.style.transform = 'none';
    const r = rig.getBoundingClientRect();
    const top = (pinned ? pin : hero).getBoundingClientRect().top;
    const cx = r.left + fan.offsetLeft + fan.offsetWidth / 2;
    const cy = r.top - top + fan.offsetTop + fan.offsetHeight / 2;
    rig.style.transformOrigin = `${(cx - r.left).toFixed(1)}px ${(cy - (r.top - top)).toFixed(1)}px`;
    rig.style.transform = held;     // put() already knows this value
    /* the card's phone, from layout: offsets summed up to the stage, which
       is held at the top of the screen when the cut happens */
    let cardY = cardPhone.offsetHeight / 2;
    for (let el = cardPhone; el && el !== cardStage; el = el.offsetParent) cardY += el.offsetTop;
    cut = {
      pinned,
      cx, cy,                                   // the phone's centre, in its frame
      tx: cardStage.offsetWidth / 2, ty: cardY, // where the card's phone will be
      k: cardPhone.offsetWidth / heroPhone.offsetWidth,
    };
    queue();
  }

  function travel(heroR, boxTop, heroH, vh) {
    if (!hero) return;
    if (!cut) {
      put(rig, 'transform', null);
      put(hero, '--hp', null);
      setFlag(hero, 'is-travelling', false);
      setFlag(hero, 'is-cleared', false);
      return;
    }
    /* the glide runs over the hold, or a third of a screen where the hero
       has little to hold */
    const hold = Math.max(heroH - vh, vh * 0.3);
    const hp = clamp(-heroR.top / hold);
    const e = ease(hp);
    const moving = hp > 0.005;
    const y = boxTop + cut.cy;                  // where the phone is now, untouched
    put(hero, '--hp', hp.toFixed(4));
    setFlag(hero, 'is-travelling', moving);
    setFlag(hero, 'is-cleared', hp > 0.56);     // copy fully faded: out of reach too
    put(rig, 'transform', moving
      ? `translate3d(${((cut.tx - cut.cx) * e).toFixed(1)}px, ${((cut.ty - y) * e).toFixed(1)}px, 0) scale(${(1 + (cut.k - 1) * e).toFixed(4)})`
      : null);
    if (moving) restScan();     // the cut lands on the estimate, as the card shows it
  }

  if (hero) {
    measureCut();
    addEventListener('resize', () => { if (widthChanged()) measureCut(); }, { passive:true });
    travelling.addEventListener('change', measureCut);
    addEventListener('load', measureCut);
    if (document.fonts) document.fonts.ready.then(measureCut);
    new ResizeObserver(measureCut).observe(hero.querySelector('.spot-hero__inner'));
  }

  /* The hero rig turns a few degrees toward the pointer — the
     interactive-3D half of the Spline reference, kept shallow. */
  if (hero) {
    let tilt = 0, tx = 0, ty = 0;
    const apply = () => {
      tilt = 0;
      hero.style.setProperty('--tx', tx.toFixed(3));
      hero.style.setProperty('--ty', ty.toFixed(3));
    };
    hero.addEventListener('pointermove', (event) => {
      if (reduced.matches || !finePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      tx = (event.clientX - rect.left) / rect.width * 2 - 1;
      ty = (event.clientY - rect.top) / rect.height * 2 - 1;
      if (!tilt) tilt = requestAnimationFrame(apply);
    }, { passive:true });
    hero.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!tilt) tilt = requestAnimationFrame(apply);
    });
  }

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
  let galleryWidth = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== galleryWidth) { galleryWidth = innerWidth; select(active); } }, {passive:true});
  addEventListener('crashpricer:lang', () => select(active));
  select(0);
})();
