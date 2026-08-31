#!/usr/bin/env python3
"""
Flatten the site into one self-contained HTML file.

Artifact hosting blocks every external host except Google Fonts, so the page
has to carry its own CSS, JS and images. This inlines all of them and strips the
document skeleton, because the host supplies its own.

    python3 tools/build-artifact.py   ->   dist/snapprice.html
"""
import base64
import mimetypes
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "snapprice.html")

# The gallery shows this as the page's name, so it is the product, not the
# tagline. The tagline stays on the deployed site, where it earns its keep.
TITLE = "SnapPrice"


# The host supplies the document skeleton, so this file cannot carry its own
# <meta charset>. Rather than gamble on how it is served, the output is pure
# ASCII: body text becomes numeric entities, which decode under any encoding,
# and the decorative characters in CSS/JS comments are folded to ASCII.
FOLD = {
    "\u2014": "--", "\u2013": "-", "\u00b7": "-", "\u00b1": "+/-",
    "\u2192": "->", "\u2190": "<-", "\u2550": "=", "\u2500": "-",
    "\u2502": "|", "\u2026": "...", "\u2019": "'", "\u201c": '"', "\u201d": '"',
}


def ascii_fold(text):
    for bad, good in FOLD.items():
        text = text.replace(bad, good)
    return text.encode("ascii", "ignore").decode("ascii")


def entities(text):
    return "".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in text)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def data_uri(rel):
    path = os.path.join(ROOT, rel)
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as fh:
        return "data:%s;base64,%s" % (mime, base64.b64encode(fh.read()).decode())


def main():
    page = read("index.html")

    # ── collect the stylesheets, in link order ────────────────────────────
    sheets = re.findall(r'<link rel="stylesheet" href="(css/[^"]+)"\s*/?>', page)
    css = ascii_fold("\n\n".join("/* ===== %s ===== */\n%s" % (s, read(s)) for s in sheets))

    # ── collect the scripts, in load order ────────────────────────────────
    scripts = re.findall(r'<script src="(js/[^"]+)" defer></script>', page)
    js = ascii_fold("\n".join(
        "<script>\n/* ===== %s ===== */\n%s\n</script>" % (s, read(s)) for s in scripts
    ))

    # ── head: keep the font links, drop what the host provides ────────────
    fonts = re.findall(r'<link rel="preconnect"[^>]*>|<link href="https://fonts\.googleapis[^>]*>', page)
    head = "<title>%s</title>\n%s\n<style>\n%s\n</style>" % (
        TITLE, "\n".join(fonts), css)

    # ── body: everything between the skeleton tags ────────────────────────
    body = page[page.index("<body>") + len("<body>"): page.index("</body>")]
    for tag in re.findall(r'<script src="js/[^"]+" defer></script>', body):
        body = body.replace(tag, "")

    # ── images become data URIs ───────────────────────────────────────────
    def inline_img(m):
        src = m.group(1)
        if src.startswith(("data:", "http")):
            return m.group(0)
        return m.group(0).replace(src, data_uri(src))

    body = re.sub(r'src="([^"]+)"', inline_img, body)
    body = entities(body)

    out = "%s\n%s\n%s\n" % (head, body.strip(), js)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(out)

    assert out.isascii(), "output is not pure ASCII"
    leftover = re.findall(r'(?:src|href)="(?!#|data:|https://fonts)([^"]+)"', out)
    print("wrote %s (%d KB)" % (os.path.relpath(OUT, ROOT), len(out) // 1024))
    print("  %d stylesheets, %d scripts inlined" % (len(sheets), len(scripts)))
    if leftover:
        print("  ! still referencing local files: %s" % sorted(set(leftover)))


if __name__ == "__main__":
    main()
