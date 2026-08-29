# SnapPrice — landing page

A product-launch site for SnapPrice, built around one idea:
**scan the damage, know the price.**

The centrepiece is a single 3D device that persists across the whole first
screenful of scrolling. As you move, it rotates, the SnapPrice interface inside
it changes, and interface fragments float out around it — scan → estimate →
offers → booking. It is one continuous story rather than a stack of sections.

## Running it

No build step, no dependencies. Any static server works:

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. `.claude/launch.json` wires the same command
up to the editor's preview pane.

## Structure

```
index.html          all markup, including the four in-device screens
css/tokens.css      design tokens — colour, type scale, radii, elevation
css/base.css        reset, typography, buttons, shared primitives
css/phone.css       the 3D device shell and the four app screens
css/site.css        navigation, the scroll experience, sections, responsive
js/experience.js    the scroll engine — progress → chapter, rotation, parallax
js/site.js          nav, reveals, counters, magnetic buttons, FAQ
```

## Design direction

Two reference systems were used as source material and then merged into
something specific to SnapPrice:

- **Hims App** — a calm, near-monochrome canvas where a single accent colour
  does all the emotional work; generous 30–52px radii; long-spread soft shadows
  (`0 27px 104px`) that make cards float rather than sit; spacious section
  rhythm; one type family carrying every weight of meaning.
- **Slush** — oversized display type with crushed leading, pill-shaped
  navigation, hairline outlines, and alternating section grounds that create
  scroll rhythm without dividers.

What SnapPrice takes from them: the calm editorial base and the long shadows
from the first, the sculptural headline scale and the pill nav from the second.
What it does not take: Slush's rainbow sticker palette (SnapPrice stays
restrained) and Hims' photographic hero (SnapPrice leads with the product).

Colour comes from the app itself — `shared/theme/tokens.ts` in the SnapPrice
React Native repo. Navy `#0E1A2B` for ink and dark surfaces, green `#16A34A` /
`#22C55E` as the single chromatic voice, `#F4F5F7` as the canvas. Green is used
for one headline line, the primary action, and confirmation states — nothing
else.

Type is Manrope throughout, with IBM Plex Mono for small technical labels
(eyebrows, chapter rail, telemetry chips).

## The scroll engine

`js/experience.js` derives everything from one normalised value:

```
scroll position → p (0…1) → chapter index + continuous chapter position
```

From `p` it drives the hero's exit, the device's rotation and scale, which
screen is live, which floating fragments are on, and which chapter copy shows.
Pointer position adds a shallow parallax on top; deeper cards (higher `--z`)
move further. It all runs in a single `requestAnimationFrame` loop that stops
when the section leaves the viewport.

## The device screens

The four screens are real DOM, not screenshots — that is what lets the scan line
sweep, the price count up, the evidence meter fill, and the offer cards enter in
sequence. They mirror the actual app: the same estimate card, evidence score,
detected-damage row, chips and button styles.

## Content honesty

- Damage vocabulary (parts, damage types, severities, repair actions) and the
  22 supported municipalities are real, taken from the app's constants.
- Repair shop names, prices, ratings and distances are **placeholders** and are
  labelled as such in the offers screen.
- The trust section ships `—` placeholders for scans, partners and ratings, with
  a note that live figures publish at launch. Only the coverage count is real.
  Replace them when the numbers exist; do not invent them.

## Responsive

Three intentional compositions, not one design scaled down:

- **Desktop** — two columns, full depth, floating fragments, chapter rail.
- **Tablet** — same story, fragments and rail dropped, tighter columns.
- **Mobile** — hero copy on top with the device rising from below it, then the
  device moves up and chapter copy takes the lower third. Store badges move to
  the closing section so the hero can breathe.

`prefers-reduced-motion` collapses the whole experience into a plain vertical
stack with every chapter visible and nothing animated.
