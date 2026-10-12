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

  /* A held section first spends one screen under the one before it (its
     negative top margin, see the CSS); its own progress starts after that.
     Read once per width — 100svh does not change with the phone toolbar. */
  const lead = (el) => (el ? Math.max(0, -parseFloat(getComputedStyle(el).marginTop) || 0) : 0);
  let cardLead = 0, shopLead = 0;
  function measureLeads() { cardLead = lead(expand); shopLead = lead(shop); }
  measureLeads();

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
    const x = clamp((-r.top - cardLead) / Math.max(1, h - vh - cardLead) / 0.8);
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
      seams = curtains.map((a) => ({ a, end: a.offsetTop + a.offsetHeight }));
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
      for (const a of curtains) setFlag(a, 'is-lifting', false);
      return;
    }

    /* Curtains: while a section's bottom edge crosses the screen it lifts
       away with the scan line lit on that edge. The section beneath is
       held by the browser (sticky, see the CSS), not from here. */
    for (const { a, end } of seams) {
      const edge = end - sy;
      setFlag(a, 'is-lifting', edge > 0 && edge < vh);
    }
    put(progress, 'transform', `scaleX(${clamp(sy / Math.max(1, docH - vh)).toFixed(4)})`);
    /* the shop gallery follows the scroll the whole way through its pinned
       stretch (see placeGallery) */
    if (shopR.bottom > 0 && shopR.top < vh) {
      placeGallery(clamp((-shopR.top - shopLead) / Math.max(1, shopH - vh - shopLead)) * 2);
    }
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }

  /* reduced motion drops the curtains: nothing held, nothing lifting */
  function settle() {
    if (reduced.matches) {
      for (const a of curtains) setFlag(a, 'is-lifting', false);
    }
    measureLeads();
    queue();
  }

  addEventListener('scroll', queue, { passive:true });
  /* On phones the toolbar sliding in and out fires resize with only the
     height changed; nothing here depends on that, so measuring waits for a
     real change of width (see the hero's re-measure below). */
  const widthWatch = () => { let known = innerWidth; return () => { const w = innerWidth; if (w === known) return false; known = w; return true; }; };
  const widthChanged = widthWatch();
  addEventListener('resize', () => { if (widthChanged()) measureLeads(); queue(); }, { passive:true });
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

  /* The match cut. As the page starts to scroll, the side phones fold in
     (everywhere) and, where the hero is pinned (desktop), the lit phone
     glides to exactly where the opening card's phone waits below — same
     centre, same width — so the scan line that lifts the hero passes from
     one phone straight into the other. On phones the hero is not pinned,
     and gliding the phone there meant moving it against the scroll from
     script, which shakes on iPhone; it scrolls away with the hero instead.
     Measured from layout, never from the moving rig. */
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
    if (!pinned) { queue(); return; }
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
    if (!travelling.matches) {                  // reduced motion: still
      put(rig, 'transform', null);
      put(hero, '--hp', null);
      setFlag(hero, 'is-travelling', false);
      setFlag(hero, 'is-cleared', false);
      return;
    }
    /* the glide runs over the pinned hold, or a third of a screen where
       the hero is not pinned (the side phones fold over it) */
    const hold = Math.max(heroH - vh, vh * 0.3);
    const hp = clamp(-heroR.top / hold);
    const moving = hp > 0.005;
    put(hero, '--hp', hp.toFixed(4));
    setFlag(hero, 'is-travelling', moving);
    if (moving) restScan();     // the cut lands on the estimate, as the card shows it
    if (!cut) { put(rig, 'transform', null); setFlag(hero, 'is-cleared', false); return; }
    const e = ease(hp);
    const y = boxTop + cut.cy;                  // where the phone is now, untouched
    setFlag(hero, 'is-cleared', hp > 0.56);     // copy fully faded: out of reach too
    put(rig, 'transform', moving
      ? `translate3d(${((cut.tx - cut.cx) * e).toFixed(1)}px, ${((cut.ty - y) * e).toFixed(1)}px, 0) scale(${(1 + (cut.k - 1) * e).toFixed(4)})`
      : null);
  }

  if (hero) {
    measureCut();
    const cutWidthChanged = widthWatch();
    addEventListener('resize', () => { if (cutWidthChanged()) measureCut(); }, { passive:true });
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
  const showcase = document.querySelector('.shop-scroll .app-showcase');
  const captions = ['Your area. Your next opportunity.', 'Your price. Your schedule. Your offer.', 'Accepted. Scheduled. All in one place.'];
  let active = -1;
  let placed = 0;
  let spread = innerWidth < 600 ? 145 : 280;

  /* the tabs and the caption follow whichever phone is nearest the front */
  function setActive(index) {
    if (index === active) return;
    active = index;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    caption.textContent = window.snapT ? window.snapT(captions[index]) : captions[index];
  }

  /* Each phone sits (its index - f) places from the front, where f runs
     0 → 2 through the pinned stretch, so the gallery moves for as long as
     the page does. Stepping only at each third left long stretches where
     the screen sat still under a moving finger, which reads as a stalled
     scroll. Places wrap round the back, fading out as they cross. */
  function placeGallery(f) {
    placed = f;
    devices.forEach((device, i) => {
      const d = (((i - f + 1.5) % 3) + 3) % 3 - 1.5;
      const near = Math.min(1, Math.abs(d));
      const fade = clamp((1.5 - Math.abs(d)) * 2);
      put(device, 'transform', `translateX(${(d * spread).toFixed(1)}px) translateY(${(near * 60).toFixed(1)}px) rotate(${(d * 12).toFixed(2)}deg) scale(${(1 - near * 0.16).toFixed(4)})`);
      put(device, 'opacity', ((1 - near * 0.5) * fade).toFixed(3));
      put(device, 'zIndex', near < 0.5 ? '3' : '1');
    });
    setActive(Math.round(f) % 3);
  }

  /* A tab, while the gallery is pinned, scrolls to that phone's place —
     the scroll then brings it forward. Unpinned (reduced motion) it simply
     shows that phone. */
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    if (!reduced.matches && showcase && getComputedStyle(showcase).position === 'sticky') {
      const span = shop.offsetHeight - innerHeight;
      scrollTo({ top: shop.offsetTop + span * (index / 2) + (index ? 1 : 0), behavior: 'smooth' });
    } else {
      placeGallery(index);
    }
  }));
  let galleryWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === galleryWidth) return;
    galleryWidth = innerWidth;
    spread = innerWidth < 600 ? 145 : 280;
    placeGallery(placed);
  }, {passive:true});
  addEventListener('crashpricer:lang', () => { const i = active; active = -1; setActive(i); });
  placeGallery(0);

  /* Decode the screenshots ahead of time, one at a time while the page is
     idle, so a phone that scrolls into view for the first time does not
     hold the scroll up while its image is decoded. */
  addEventListener('load', () => {
    const pending = [...document.querySelectorAll('img[src*="assets/app/web/"]')];
    const done = new Set();
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
    const next = () => {
      const img = pending.shift();
      if (!img) return;
      const src = img.currentSrc || img.src;
      if (done.has(src) || !img.decode) { idle(next); return; }
      done.add(src);
      img.decode().catch(() => {}).then(() => idle(next));
    };
    idle(next);
  });
})();
