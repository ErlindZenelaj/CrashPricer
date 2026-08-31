# SnapPrice — landing page

A product-launch site for SnapPrice, built around one idea:
**scan the damage, know the price.**

The centrepiece is a single 3D device that persists across the whole first
stretch of scrolling. As you move, it rotates, the screen inside it changes, and
interface fragments float out around it — home → photos → estimate → offers →
booked. One continuous story rather than a stack of sections.

## The screens are the real screens

Everything shown inside the device is lifted from the SnapPrice design canvases,
embedded at its native 390 × 844 and scaled by CSS. It is not a re-drawing of the
app — it *is* the artboards, with the canvas's own conditional markup stripped out.

Two canvases are read, in order. A screen is taken from the first one that has
it, so the focused core-flow set wins over the older full set:

1. `SnapPrice - Core Flow.dc.html` — Home, Vehicle details, Damage photos,
   Estimate result, Offers list. These are the current screens.
2. `SnapPrice- light.dc.html` — Make an offer, for the repair-shop section.
   Nothing else is taken from here.

Regenerate after the mockups change:

```bash
python3 tools/embed-screens.py
```

That reads `index.template.html`, replaces each `<!--SCREEN name-->` marker with
the matching artboard, and writes `index.html`. **Edit the template, never the
generated screen markup in `index.html`.** Pass canvas paths as arguments to read
different files.

### Canvas test data

The offers artboard ships with one test account (`Erlind Zenelaj`) repeated for
every offer, which would put a person's name on the page three times. The
embedder substitutes three shop names and their avatar initials, and corrects
the "from 1 shop" subtitle to match. That lives in `CONTENT_OVERRIDES` in
`tools/embed-screens.py` rather than in `index.html`, so it survives
regeneration; each needle is replaced occurrence by occurrence and a count
mismatch is reported rather than silently ignored. Delete an entry once the
canvas itself carries real partner names.

The two `No offers yet` empty states on that screen are left as designed — they
are honest about how the list behaves while shops are still replying.

### Missing canvas assets

The core-flow canvas references five images that live in the design tool's asset
store rather than next to the file:

```
assets/tabbar-home.png     assets/damage-1.png
assets/tabbar-offers.png   assets/damage-2.png
                           assets/damage-3.png
```

Until they are supplied the embedder stands in for them: the glass tab bars are
dropped, and the damage thumbnails become neutral fills at the same size, so no
screen renders with a broken-image box. Drop the real files beside the
`.dc.html` and re-run to pick them up — no other change needed.

## Running it

No build step, no dependencies. Any static server works:

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. `.claude/launch.json` wires the same command
up to the editor's preview pane.

## Sharing it

`tools/build-artifact.py` flattens the site into one self-contained file at
`dist/snapprice.html` — every stylesheet, script and image inlined, and the
document skeleton stripped because the artifact host supplies its own.

```bash
python3 tools/build-artifact.py
```

Two things that file has to get right. It cannot carry a `<meta charset>`,
since it has no `<head>`, so the build emits **pure ASCII**: body text becomes
numeric entities, which decode under any encoding, and the decorative
characters in CSS and JS comments are folded down. Without that the em dashes,
`±12%` and the Albanian place names arrive as mojibake. And the scripts stay at
the end of the body — they are `defer`red on the real site, but inline scripts
ignore `defer`, so their position is what guarantees the DOM exists.

The build asserts the output is ASCII and reports any surviving local
reference, so a missed asset fails loudly rather than shipping broken.

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

## How it works

That section is built out of the app's parts rather than described in prose.
The four steps sit on the same 7px progress rail the scan flow draws across its
own screens — it fills left to right as the section reveals, with a node at each
step — and each card carries the component that step actually produces: the city
field, the photo tray with its three ticks, the dark cost card, an offer row.
The tokens are the mockups' own, so it reads as the product rather than as
marketing furniture.

The rail and its nodes drop away below 1180px, where two columns and two rows
make a single left-to-right line meaningless.

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

Chapter 0 is the app home, shown while the hero copy is up. Chapters 1–4 follow
the app's own request order: vehicle, photos, estimate, offers. Device rotation is keyframed per screen and interpolated between
anchors placed at each screen's midpoint in the scroll, so the device is always
moving but never spins. Pointer position adds a shallow parallax on top; deeper
fragments (higher `--z`) move further. It all runs in a single
`requestAnimationFrame` loop that stops when the section leaves the viewport.

## Screen transitions

Screens never cross-fade. Two dense interfaces at half opacity read as a
rendering fault rather than a transition, so the incoming screen is fully opaque
and wipes down over the outgoing one, which holds at full strength underneath
until it is covered and then vanishes behind it. A green line rides the wipe
edge, which turns the seam into the one gesture this product is about — a scan
pass. Both the clip and the line run 450ms on the same easing, so the line stays
locked to the edge.

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
