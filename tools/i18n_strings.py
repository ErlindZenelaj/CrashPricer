#!/usr/bin/env python3
"""Collect every translatable string on the page.

Text inside the embedded app screens (.phone__screen) and the app component
fragments (.fg) is deliberately left out — that is product interface lifted
from the design canvas, not page copy, and it carries its own language.
"""
import re
import sys
from html.parser import HTMLParser

SKIP_TAGS = {"script", "style", "title"}
SKIP_CLASS = re.compile(r"\b(phone__screen|scr|fg)\b")
HAS_LETTER = re.compile(r"[A-Za-z]")


class Collect(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth_skip = 0
        self.stack = []
        self.out = []
        self.html_ids = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        skip = (tag in SKIP_TAGS
                or SKIP_CLASS.search(a.get("class", "") or "")
                or "data-i18n" in a)   # translated whole, by id
        if tag not in ("br", "img", "input", "meta", "link", "source"):
            self.stack.append(bool(skip))
        if skip:
            self.depth_skip += 1
        if a.get("data-i18n"):
            self.html_ids.append(a["data-i18n"])
        if not self.depth_skip:
            for key in ("aria-label", "placeholder", "title"):
                if a.get(key) and HAS_LETTER.search(a[key]):
                    self.out.append(("@" + key, a[key].strip()))

    def handle_endtag(self, tag):
        if tag in ("br", "img", "input", "meta", "link", "source"):
            return
        if self.stack:
            if self.stack.pop():
                self.depth_skip -= 1

    def handle_data(self, data):
        if self.depth_skip:
            return
        text = " ".join(data.split())
        if text and HAS_LETTER.search(text):
            self.out.append(("text", text))


def parse(path):
    with open(path, encoding="utf-8") as fh:
        p = Collect()
        p.feed(fh.read())
    return p


def collect(path):
    p = parse(path)
    seen, ordered = set(), []
    for kind, text in p.out:
        if text not in seen:
            seen.add(text)
            ordered.append(text)
    return ordered


if __name__ == "__main__":
    strings = collect(sys.argv[1] if len(sys.argv) > 1 else "index.html")
    for s in strings:
        print(s)
    print("\n-- %d unique strings --" % len(strings), file=sys.stderr)
