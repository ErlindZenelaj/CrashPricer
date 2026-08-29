#!/usr/bin/env python3
"""
Embed SnapPrice app screens into the landing page.

The screens shown inside the device on this site are not re-drawings — they are
the actual artboards from the SnapPrice design canvas, lifted out at their
native 390x844 and scaled by CSS. This script does the lifting.

    python3 tools/embed-screens.py [path/to/SnapPrice- light.dc.html]

It reads index.template.html, replaces every `<!--SCREEN name-->` marker with
the matching artboard, and writes index.html. Re-run it whenever the mockups
change; never hand-edit the screen markup in index.html.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_CANVAS = os.path.expanduser("~/Downloads/SnapPrice- light.dc.html")

# marker name -> data-screen-label in the canvas
SCREENS = {
    "home-scan-first": "Home scan first",
    "damage-photos":   "Damage photos",
    "estimate-result": "Estimate result",
    "offers-list":     "Offers list",
    "offer-accepted":  "Offer accepted",
    "make-an-offer":   "Make an offer",
}

DIV = re.compile(r"<(/?)div\b", re.I)


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
    """The 390x844 screen inside the artboard's device shell."""
    m = re.search(r'<div data-screen-label="%s"' % re.escape(label), canvas)
    if not m:
        raise SystemExit("screen not found in canvas: %s" % label)
    shell = balanced_div(canvas, m.start())
    inner = re.search(r"<div style=\"[^\"]*width:390px;height:844px[^\"]*\"", shell)
    if not inner:
        raise SystemExit("no 390x844 screen inside: %s" % label)
    return balanced_div(shell, inner.start())


def clean(html):
    """Strip canvas-runtime markup; point assets at the copies in this repo."""
    # conditional blocks (popovers, sheets) all default to hidden
    html = re.sub(r"<sc-if\b.*?</sc-if>", "", html, flags=re.S)
    html = re.sub(r'\s(?:onClick|style-hover|hint-[a-z-]+)="[^"]*"', "", html)
    html = re.sub(
        r'src="Optic White Logo/png/appicon/optic-white-appicon-(\d+)\.png"',
        r'src="assets/logo/appicon-\1.png"',
        html,
    )
    return html.replace("</img>", "")


def main():
    canvas_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CANVAS
    if not os.path.exists(canvas_path):
        raise SystemExit("canvas not found: %s\npass its path as an argument" % canvas_path)

    with open(canvas_path, encoding="utf-8") as fh:
        canvas = fh.read()

    template_path = os.path.join(ROOT, "index.template.html")
    with open(template_path, encoding="utf-8") as fh:
        page = fh.read()

    for name, label in SCREENS.items():
        marker = "<!--SCREEN %s-->" % name
        if marker not in page:
            print("  ! unused screen: %s" % name)
            continue
        html = clean(artboard(canvas, label))
        page = page.replace(marker, html)
        print("  %-18s %-18s %6d bytes x%d" % (name, label, len(html), 0))

    left = re.findall(r"<!--SCREEN ([^>]+)-->", page)
    if left:
        raise SystemExit("no source for: %s" % ", ".join(sorted(set(left))))

    out = os.path.join(ROOT, "index.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(page)
    print("wrote index.html (%d KB)" % (len(page) // 1024))


if __name__ == "__main__":
    main()
