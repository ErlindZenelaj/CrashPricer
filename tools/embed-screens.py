#!/usr/bin/env python3
"""
Embed locally supplied CrashPricer app captures into the landing page.

The screens shown inside the device on this site are not re-drawings — they are
the actual artboards from the CrashPricer design canvases, lifted out at their
native 390x844 and scaled by CSS. This script does the lifting.

    python3 tools/embed-screens.py [canvas.dc.html ...]

With no arguments it embeds images from assets/app without reading Downloads.
Explicit canvas arguments retain the legacy canvas import. Each screen is
taken from the first canvas that has it, so the focused "Core Flow" set wins over
the older full set. It reads index.template.html, replaces every
`<!--SCREEN name-->` marker with the matching artboard, and writes index.html.

Re-run it whenever the mockups change; never hand-edit the screen markup in
index.html.
"""
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.expanduser("~/Downloads")

# Searched in order — the first canvas holding a screen wins.
CANVASES = [
    os.path.join(DL, "SnapPrice - Core Flow.dc.html"),
    os.path.join(DL, "SnapPrice- light.dc.html"),
    os.path.join(DL, "SnapPrice - Shops.dc.html"),
]

# marker name -> data-screen-label
SCREENS = {
    "home-scan-first": "Home scan first",
    "vehicle-details": "Vehicle details",
    "damage-photos":   "AI damage photos simple",
    "estimate-result": "Estimate result",
    "offers-list":     "Offers list",
    "make-an-offer":   "Make an offer",
    "shops-market":    "Shops marketplace",
}

# The offers artboard ships with one test account repeated for every offer, so
# the page would advertise a person three times over. Substituted here rather
# than in index.html so the change survives regeneration. Each needle is
# replaced occurrence by occurrence, in order. Delete an entry once the canvas
# itself carries real partner names.
CONTENT_OVERRIDES = {
    # The canvas still carries the old product name in the app's wordmark.
    # Renamed here so the device does not contradict the page around it;
    # delete this once the artboards themselves say CrashPricer.
    "home-scan-first": [
        ("SnapPrice", ["CrashPricer"]),
    ],
    "shops-market": [
        ("SnapPrice", ["CrashPricer"]),
        ("Erlind Zenelaj", ["Fatmir K."]),
    ],
    "offers-list": [
        ("Erlind Zenelaj", ["Auto Ngjyra", "Prime Auto", "Naseri Auto"]),
        (">EZ<", [">AN<", ">PA<", ">NA<"]),
        ("3 offers from 1 shop", ["3 offers from 3 shops"]),
    ],
}

ASSET_DIR = os.path.join(ROOT, "assets", "screens")
DIV = re.compile(r"<(/?)div\b", re.I)
IMG = re.compile(r"<img\b[^>]*?>(?:\s*</img>)?", re.I)
CARD = re.compile(r'<div[^>]*style="([^"]*flex:none;width:414px[^"]*)"')

missing_assets = set()


def balanced_div(src, start):
    """Return the full <div>...</div> beginning at `start`."""
    i, depth = start, 0
    while True:
        m = DIV.search(src, i)
        if not m:
            raise ValueError("unbalanced div")
        if m.group(1) == "":
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return src[start:src.index(">", m.end()) + 1]
        i = m.end()


def artboard(canvas, label):
    """The 390x844 screen inside the artboard, plus any font the card sets."""
    m = re.search(r'<div data-screen-label="%s"' % re.escape(label), canvas)
    if not m:
        return None
    shell = balanced_div(canvas, m.start())
    inner = re.search(r'<div style="[^"]*width:390px;height:844px[^"]*"', shell)
    if not inner:
        raise SystemExit("no 390x844 screen inside: %s" % label)
    html = balanced_div(shell, inner.start())

    # A screen card may set its own typeface (the damage-photos card uses
    # Manrope). Carry it across so the embedded screen still looks designed.
    font = None
    for c in CARD.finditer(canvas):
        if c.start() > m.start():
            break
        f = re.search(r"font-family:([^;\"]+)", c.group(1))
        font = f.group(1).strip() if f else None
    return html, font


def place_asset(src, canvas_dir):
    """Copy a canvas asset into the repo. Returns the new src, or None."""
    name = os.path.basename(src)
    source = os.path.join(canvas_dir, src)
    if not os.path.exists(source):
        missing_assets.add(src)
        return None
    os.makedirs(ASSET_DIR, exist_ok=True)
    shutil.copy2(source, os.path.join(ASSET_DIR, name))
    return "assets/screens/" + name


def rewrite_images(html, canvas_dir):
    """Point images at this repo. Assets the canvas did not ship are stood in
    for, so a screen never renders with a broken-image box."""
    def sub(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag)
        if not src:
            return ""
        src = src.group(1)

        # the logo pack is already vendored under assets/logo
        logo = re.match(r"Optic White Logo/png/appicon/optic-white-appicon-(\d+)\.png", src)
        if logo:
            return tag.replace(src, "assets/logo/appicon-%s.png" % logo.group(1))

        placed = place_asset(src, canvas_dir)
        if placed:
            return tag.replace(src, placed)

        # Missing. Chrome (the glass tab bars) simply goes; content images
        # become a neutral fill at the same size so the layout still reads.
        if os.path.basename(src).startswith("tabbar"):
            return ""
        style = re.search(r'style="([^"]*)"', tag)
        style = style.group(1) if style else ""
        style = re.sub(r"object-fit:[^;]*;?", "", style)
        return '<div style="%s;background:linear-gradient(150deg,#D8DEE6,#B9C3CE);"></div>' % style

    return IMG.sub(sub, html)


def clean(html, font, canvas_dir):
    """Strip canvas-runtime markup; point assets at this repo."""
    html = re.sub(r"<sc-if\b.*?</sc-if>", "", html, flags=re.S)     # all default hidden
    html = re.sub(r'\s(?:onClick|style-hover|hint-[a-z-]+)="[^"]*"', "", html)
    html = rewrite_images(html, canvas_dir)
    html = html.replace("</img>", "")
    if font:
        html = '<div style="font-family:%s;">%s</div>' % (font, html)
    return html


def unbound(html):
    """Canvas bindings the artboard never had values for. Shipping one puts a
    literal {{ activeCount }} on the page, so report rather than embed."""
    return sorted(set(re.findall(r"\{\{[^}]*\}\}", html)))


def apply_overrides(name, html):
    """Swap canvas test data for something presentable, one occurrence at a
    time. A count mismatch means the artboard changed — say so rather than
    silently leaving the old content in place."""
    for needle, replacements in CONTENT_OVERRIDES.get(name, []):
        found = html.count(needle)
        if found != len(replacements):
            print("  ! %s: expected %d x %r, found %d — check the override"
                  % (name, len(replacements), needle, found))
        for value in replacements:
            if needle not in html:
                break
            html = html.replace(needle, value, 1)
    return html


def main():
    # The website now uses the supplied app captures. Keep the legacy canvas
    # importer available only when canvas files are explicitly passed.
    if len(sys.argv) == 1:
        captures = {
            'home-scan-first': 'home', 'vehicle-details': 'vehicle',
            'damage-photos': 'photos', 'estimate-result': 'estimate',
            'offers-list': 'offers', 'make-an-offer': 'offer-sent',
            'shops-market': 'coverage',
        }
        with open(os.path.join(ROOT, 'index.template.html'), encoding='utf-8') as fh:
            page = fh.read()
        for name, filename in captures.items():
            # Web-sized copies (assets/app/web, 780 px wide): the 1179 x 2556
            # originals are 16-bit PNGs that cost ~12 MB each to decode, which
            # stalls scrolling on phones.
            relative = 'assets/app/web/%s.jpg' % filename
            if not os.path.isfile(os.path.join(ROOT, relative)):
                raise SystemExit('Missing app capture: ' + relative)
            page = page.replace('<!--SCREEN %s-->' % name,
                                '<img class="app-capture" src="%s" alt="" width="780" height="1691" decoding="async" />' % relative)
        if '<!--SCREEN ' in page:
            raise SystemExit('Unmapped app capture')
        with open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8') as fh:
            fh.write(page)
        print('Built index.html from local app captures.')
        return
    paths = sys.argv[1:] or CANVASES
    canvases = []
    for p in paths:
        p = os.path.expanduser(p)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as fh:
                canvases.append((p, fh.read()))
        else:
            print("  ! canvas not found, skipping: %s" % p)
    if not canvases:
        raise SystemExit("no canvases found")

    with open(os.path.join(ROOT, "index.template.html"), encoding="utf-8") as fh:
        page = fh.read()

    for name, label in SCREENS.items():
        marker = "<!--SCREEN %s-->" % name
        if marker not in page:
            print("  - unused: %s" % name)
            continue
        for path, canvas in canvases:
            found = artboard(canvas, label)
            if found:
                html, font = found
                html = clean(apply_overrides(name, html), font, os.path.dirname(path))
                # checked after cleaning: bindings inside sc-if blocks are
                # stripped there, and only what survives would reach the page
                loose = unbound(html)
                if loose:
                    raise SystemExit(
                        "%s still has unbound canvas bindings: %s\n"
                        "That artboard is a template, not a rendered screen - "
                        "bind it in the canvas and re-export."
                        % (name, ", ".join(loose)))
                page = page.replace(marker, html)
                print("  %-16s %-26s %6d bytes  %s%s"
                      % (name, label, len(html), os.path.basename(path),
                         "  [%s]" % font if font else ""))
                break
        else:
            raise SystemExit("screen in no canvas: %s (%s)" % (name, label))

    left = re.findall(r"<!--SCREEN ([^>]+)-->", page)
    if left:
        raise SystemExit("no source for: %s" % ", ".join(sorted(set(left))))

    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(page)
    print("wrote index.html (%d KB)" % (len(page) // 1024))

    if missing_assets:
        print("\n  Assets the canvas references but did not ship:")
        for a in sorted(missing_assets):
            print("    %s" % a)
        print("  Drop them beside the .dc.html file and re-run to include them.")


if __name__ == "__main__":
    main()
