#!/usr/bin/env python3
"""Report page copy that has no Albanian translation.

Translations are matched on the English text itself, so editing a string in
index.template.html silently drops its translation. This is the guard: run it
after any copy change.

    python3 tools/check-i18n.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n_strings import collect, parse  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Strings that are the same in both languages, or are not words to translate.
IGNORE = {
    "CrashPricer", "FAQ", "App Store", "Google Play", "EN", "SQ",
    "Volkswagen Golf", "Audi A4", "VW Golf",   # vehicle names stay as they are
    "min", "~2 min", "Prishtinë", "Deçan", "Dragash", "Ferizaj", "Fushë Kosovë",
    "Gjakovë", "Gjilan", "Graçanicë", "Istog", "Kaçanik", "Klinë", "Lipjan",
    "Malishevë", "Mitrovicë", "Pejë", "Podujevë", "Prizren", "Rahovec",
    "Skenderaj", "Suharekë", "Viti", "Vushtrri",
}


def norm(s):
    return s.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')


def dictionaries():
    with open(os.path.join(ROOT, "js", "i18n.js"), encoding="utf-8") as fh:
        src = fh.read()
    text = src[src.index("const SQ = {"): src.index("const SQ_HTML")]
    html = src[src.index("const SQ_HTML"): src.index("const SKIP")]
    keys = re.compile(r"^\s*'((?:[^'\\]|\\.)*)':", re.M)
    return ({norm(m) for m in keys.findall(text)}, {m for m in keys.findall(html)})


def main():
    page = os.path.join(ROOT, "index.html")
    if not os.path.exists(page):
        raise SystemExit("build index.html first: python3 tools/embed-screens.py")

    known, known_html = dictionaries()
    missing = [s for s in collect(page)
               if norm(s) not in known and s not in IGNORE and not s.isdigit()]
    missing_html = [i for i in parse(page).html_ids if i not in known_html]

    if missing_html:
        print("elements translated whole with no SQ_HTML entry: %s\n"
              % ", ".join(sorted(set(missing_html))))

    if missing or missing_html:
        print("%d string(s) with no Albanian translation:\n" % len(missing))
        for s in missing:
            print("  %s" % (s if len(s) < 100 else s[:97] + "..."))
        print("\nAdd them to SQ in js/i18n.js, or to IGNORE here if they stay as-is.")
        return 1

    print("all page copy is translated (%d strings, %d whole elements)"
          % (len(known), len(known_html)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
