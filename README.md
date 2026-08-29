# SnapPrice — landing page

A product-launch site for SnapPrice, built around one idea:
**scan the damage, know the price.**

The centrepiece is a single 3D device that persists across the whole first
stretch of scrolling. As you move, it rotates, the screen inside it changes, and
interface fragments float out around it — home → photos → estimate → offers →
booked. One continuous story rather than a stack of sections.

## The screens are the real screens

Everything shown inside the device is lifted from the SnapPrice design canvas
(`SnapPrice- light.dc.html`), embedded at its native 390 × 844 and scaled by
CSS. It is not a re-drawing of the app — it *is* the app's artboards, with the
canvas's own conditional markup stripped out.

Regenerate after the mockups change:

```bash
python3 tools/embed-screens.py "~/Downloads/SnapPrice- light.dc.html"
```

That reads `index.template.html`, replaces each `<!--SCREEN name-->` marker with
the matching artboard, and writes `index.html`. **Edit the template, never the
generated screen markup in `index.html`.**

Screens in use: `Home scan first`, `Damage photos`, `Estimate result`,
`Offers list`, `Offer accepted` (the story) and `Make an offer` (the repair-shop
section).

## Running it

No build step, no dependencies. Any static server works:

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. `.claude/launch.json` wires the same command
up to the editor's preview pane.

## Structure

```
index.template.html   the page — screens appear as <!--SCREEN name--> markers
index.html            generated; do not hand-edit the screen markup
tools/embed-screens.py  lifts artboards out of the design canvas
css/tokens.css        design tokens, all traced to the mockups
css/base.css          reset, typography, buttons, shared primitives
css/phone.css         the device shell and the 390x844 screen viewport
css/site.css          navigation, the scroll experience, sections, responsive
js/experience.js      the scroll engine — progress → chapter, rotation, parallax
js/site.js            nav, reveals, counters, magnetic buttons, FAQ
assets/logo/          the SnapPrice mark and app icon
```

## Design system

The page uses the app's own system rather than a parallel one:

- **Type** — Plus Jakarta Sans throughout, the mockups' only family. Micro
  labels follow their pattern exactly: 12px, 700–800, `.12em`, uppercase, in
  `#7C8696` for neutral or `#15803D` for green.
- **Colour** — ink `#0E1A2B`, green `#16A34A` / `#22C55E` / `#15803D`, amber
  `#B45309` on `#FEF3C7`, surfaces `#FFFFFF` / `#F4F5F7` / `#F1F3F6`. The page
  ground is `#E7E5DF`, the warm neutral the mockups themselves are pinned to,
  with `#D6D3CB` hairlines.
- **Shape and elevation** — 14 / 16 / 22 / 28px radii and the app's shadow ramp,
  from `0 4px 12px -6px` up to the device's `0 34px 70px -24px`.
- **Actions** — filled at 18px radius with white type, exactly as in the app:
  green `#22C55E` for the primary, ink for the secondary.

Composition takes its cues from the two reference systems that briefed the work
— *Hims App* for the calm single-accent canvas, long-spread shadows and generous
radii; *Slush* for sculptural display type, pill navigation and hairline rules.
Neither is copied: the palette and components come from SnapPrice.

## The scroll engine

`js/experience.js` derives everything from one normalised value:

```
scroll position → p (0…1) → chapter index + device attitude
```

Chapter 0 is the app home, shown while the hero copy is up. Chapters 1–4 are the
journey. Device rotation is keyframed per screen and interpolated between
anchors placed at each screen's midpoint in the scroll, so the device is always
moving but never spins. Pointer position adds a shallow parallax on top; deeper
fragments (higher `--z`) move further. It all runs in a single
`requestAnimationFrame` loop that stops when the section leaves the viewport.

## Content honesty

- Damage vocabulary, prices, shop names, ratings, dates and the product figures
  (`~2 min`, `3 photos`, `±12%`) all come from the mockups and the app's own
  constants. Nothing on the page is invented.
- The 22 supported municipalities are the real list from `constants/kosovoCities.ts`.
- Scan volume, partner counts and review scores are deliberately absent, with a
  line saying they publish when the numbers are real. Add them then — don't
  invent them now.

## Known discrepancy

`Optic White Logo/svg/optic-white-lockup.svg` sets the wordmark as **AutoSnap —
“Snap it. Price it.”**, while the app, the mockups and `shared/brand.ts` all say
**SnapPrice**. This site uses the logo *mark* and sets the wordmark in Plus
Jakarta Sans as SnapPrice. Worth reconciling in the asset pack.

## Responsive

Three composed layouts, not one design scaled down:

- **Desktop** — two columns, full depth, floating fragments, chapter rail.
- **Tablet** — same story, fragments and rail dropped, tighter columns.
- **Mobile** — hero copy on top with the device rising from below it, then the
  device moves up and chapter copy takes the lower third. The hero stat row is
  dropped because the app's home screen inside the device already shows those
  three figures.

`prefers-reduced-motion` collapses the experience into a plain vertical stack
with every chapter visible and nothing animated.
