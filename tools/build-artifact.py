#!/usr/bin/env python3
"""
Flatten the site into one self-contained HTML file.

Artifact hosting blocks every external host except Google Fonts, so the page
has to carry its own CSS, JS and images. This inlines all of them and strips the
document skeleton, because the host supplies its own.

    python3 tools/build-artifact.py   ->   dist/crashpricer.html
"""
import base64
import mimetypes
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "crashpricer.html")

# The gallery shows this as the page's name, so it is the product, not the
# tagline. The tagline stays on the deployed site, where it earns its keep.
TITLE = "CrashPricer"


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
    """For CSS, where the only non-ASCII is decoration inside comments."""
    for bad, good in FOLD.items():
        text = text.replace(bad, good)
    return text.encode("ascii", "ignore").decode("ascii")


def js_escape(text):
    """For JS, where non-ASCII is live data — the Albanian dictionary. Folding
    it away would quietly strip every e-diaeresis and c-cedilla out of the
    translations, so escape instead: \\uXXXX is exact inside a string literal
    and harmless inside a comment."""
    return "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) for c in text)


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
    css = "\n\n".join("/* ===== %s ===== */\n%s" % (s, read(s)) for s in sheets)
    # embed-screens.py writes the page's own stylesheets into the head already
    head_src = page[:page.index("</head>")]
    css += "\n\n".join(re.findall(r"<style>(.*?)</style>", head_src, flags=re.S))
    # the self-hosted font files ride along as data URIs
    css = re.sub(r"url\((?:\.\./)?(assets/fonts/[^)]+)\)",
                 lambda m: "url(%s)" % data_uri(m.group(1)), css)
    css = ascii_fold(css)

    # ── collect the scripts, in load order ────────────────────────────────
    scripts = re.findall(r'<script src="(js/[^"]+)" defer></script>', page)
    js = js_escape("\n".join(
        "<script>\n/* ===== %s ===== */\n%s\n</script>" % (s, read(s)) for s in scripts
    ))

    # ── head: keep the font links, drop what the host provides ────────────
    fonts = re.findall(r'<link rel="preconnect"[^>]*>|<link href="https://fonts\.googleapis[^>]*>', page)
    head = "<title>%s</title>\n%s\n<style>\n%s\n</style>" % (
        TITLE, "\n".join(fonts), css)

    # ── body: everything between the skeleton tags ────────────────────────
    body = page[page.index("<body>") + len("<body>"): page.index("</body>")]

    # Vercel's analytics tags are served by Vercel; on any other host they are
    # two 404s. The single-file build is for elsewhere, so they come out.
    body = re.sub(r"<!-- Vercel Analytics.*?speed-insights/script\.js\"></script>",
                  "", body, flags=re.S)
    for tag in re.findall(r'<script src="js/[^"]+" defer></script>', body):
        body = body.replace(tag, "")

    # ── images become data URIs ───────────────────────────────────────────
    def inline_img(m):
        src = m.group(1)
        if src.startswith(("data:", "http", "/")):
            return m.group(0)          # already inline, remote, or host-absolute
        if not os.path.exists(os.path.join(ROOT, src)):
            print("  ! referenced file is missing, left as-is: %s" % src)
            return m.group(0)
        return m.group(0).replace(src, data_uri(src))

    # the 480 px copies are for the hosted page; one inlined size is enough
    body = re.sub(r'\s(?:srcset|sizes)="[^"]*"', "", body)
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
