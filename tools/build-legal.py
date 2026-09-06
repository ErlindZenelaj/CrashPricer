#!/usr/bin/env python3
"""Generate the store-facing legal pages from the app's own legal copy.

Google Play and the App Store both want stable HTTPS pages for the privacy
policy, the terms, support, and an account-deletion request that a signed-out
person can reach. Those documents already exist, in English and Albanian, inside
the mobile app at features/legal/support-legal.ts — so they are read from there
rather than retyped here. Retyping them is how the app and the site drift, and a
reviewer comparing the two is exactly who notices.

    python3 tools/build-legal.py [path/to/support-legal.ts]

Writes privacy/terms/support/delete-account/company at the site root in English
and under sq/ in Albanian, and reports any company detail still unfilled.

Two pages have no counterpart in the app and are authored here: the deletion
request page (the app's own flow is Settings -> Delete account; this is the
route for someone who has uninstalled) and the company identification page.
Their Albanian is mine and has not had a native-speaker pass — the same caveat
the README makes about the landing page.

The company identity is not yet registered, so those fields are TODO markers.
They render as visible amber chips and the build lists them on every run, so the
gap is loud rather than quietly shipped.
"""

from __future__ import annotations

import html
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_COPY = ROOT.parent / "SnapPriceFront" / "features" / "legal" / "support-legal.ts"

# One name, one domain, one address — the point of the exercise. Everything the
# pages say about the operator comes from here.
SITE_DOMAIN = "crashpricer.com"
SUPPORT_EMAIL = "support@crashpricer.com"
APP_NAME = "CrashPricer"
CITY = "Prishtinë, Kosovo"

# Where the deletion form posts. The site is static and deploys separately from
# the API, so this cannot be inferred — and it must be an origin listed in the
# backend's Cors:AllowedOrigins or the browser will refuse the request. Left on
# localhost so a wrong production value cannot ship silently; the build says so
# on every run.
API_BASE_URL = "http://localhost:5050"

# Not registered yet. Each of these renders as a visible marker and is listed at
# the end of the build; fill them in before the site goes in front of a store
# reviewer, since Play's developer identity and the EU trader rules both ask.
TODO = {
    "legal_name": "TODO — registered legal name",
    "address": "TODO — registered street address",
    "reg_number": "TODO — business registration number",
    "backup_window": "TODO — backup retention window",
}

# ── the brand mark, same geometry as the landing page ────────────────────────
MARK = """<svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
<g stroke="#16A34A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 28 L12 12 L28 12"/><path d="M68 12 L84 12 L84 28"/>
<path d="M12 68 L12 84 L28 84"/><path d="M68 84 L84 84 L84 68"/></g>
<line x1="22" y1="48" x2="74" y2="48" stroke="#16A34A" stroke-width="3" stroke-linecap="round" opacity=".4"/>
<g transform="translate(19,19) scale(0.91)" stroke="#0E1A2B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M6 42h-.3c-1.4 0-2.4-1.3-2-2.6l1.6-5c.5-1.6 1.8-2.8 3.5-3.1l4-.7c4.3-4.6 8.8-7 13.8-7.6 5.2-.6 9.8.8 14 4.2l5.4 1c3.4.5 6 1.4 7.8 2.8 1.1.9 1.7 2.2 1.7 3.6v3c0 1.3-1 2.4-2.4 2.4H51"/>
<circle cx="18.5" cy="42" r="5.6"/><circle cx="45.5" cy="42" r="5.6"/></g></svg>"""

PAGES = ["privacy", "terms", "support", "delete-account", "company"]

NAV_LABEL = {
    "en": {
        "privacy": "Privacy", "terms": "Terms", "support": "Support",
        "delete-account": "Delete account", "company": "Company", "home": "Home",
    },
    "sq": {
        "privacy": "Privatësia", "terms": "Kushtet", "support": "Ndihma",
        "delete-account": "Fshirja e llogarisë", "company": "Kompania", "home": "Ballina",
    },
}

RIGHTS = {"en": "All rights reserved.", "sq": "Të gjitha të drejtat e rezervuara."}


def extract(copy_path: Path) -> dict:
    """Evaluate the app's legal module and hand back its copy as data.

    It is TypeScript, but only in its annotations — the values themselves are
    plain object literals with template strings. Stripping the type layer leaves
    valid JavaScript, which Node can evaluate. Parsing it by regex instead would
    have to understand nested quotes and ${} interpolation, and would break the
    first time someone writes an apostrophe.
    """
    if not copy_path.exists():
        sys.exit(f"legal copy not found: {copy_path}\nPass the path as an argument.")

    script = r"""
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
let js = src
  .replace(/^import[^;]*;$/gm, '')
  .replace(/^export type [\s\S]*?^};$/gm, '')
  .replace(/^type [\s\S]*?^};$/gm, '')
  .replace(/:\s*Record<[^>]*>/g, '')
  .replace(/^export /gm, '');
js += '\nreturn JSON.stringify({ SUPPORT_EMAIL, helpCopy, legalCopy });';
process.stdout.write(new Function(js)());
"""
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as fh:
        fh.write(script)
        runner = fh.name

    out = subprocess.run(
        ["node", runner, str(copy_path)], capture_output=True, text=True
    )
    Path(runner).unlink(missing_ok=True)
    if out.returncode != 0:
        sys.exit(f"could not read {copy_path.name}:\n{out.stderr.strip()}")

    data = json.loads(out.stdout)
    # The app is the source of truth for the address users are told to write to.
    # If it drifts from this site the two documents disagree, which is exactly
    # the inconsistency this build exists to prevent.
    if data["SUPPORT_EMAIL"] != SUPPORT_EMAIL:
        sys.exit(
            f"support email mismatch: the app says {data['SUPPORT_EMAIL']}, "
            f"this build says {SUPPORT_EMAIL}. Make them agree before shipping."
        )
    return data


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def todo(key: str) -> str:
    return f'<span class="todo">{esc(TODO[key])}</span>'


def mailto(subject: str) -> str:
    query = subject.replace(" ", "%20")
    return f"mailto:{SUPPORT_EMAIL}?subject={query}"


def chrome(lang: str, page: str, title: str, description: str, body: str,
           script: str = "") -> str:
    """Wrap page content in the shared shell: bar, language switch, footer."""
    up = "../" if lang == "sq" else ""
    other = "sq" if lang == "en" else "en"
    other_href = f"sq/{page}.html" if lang == "en" else f"../{page}.html"
    label = NAV_LABEL[lang]

    links = "".join(
        f'<a href="{up if p != page else ""}{p}.html">{esc(label[p])}</a>'
        if p != page
        else f'<a href="{p}.html" aria-current="page">{esc(label[p])}</a>'
        for p in PAGES
    )

    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>{esc(title)} — {APP_NAME}</title>
<meta name="description" content="{html.escape(description, quote=True)}" />
<meta name="theme-color" content="#E7E5DF" />
<link rel="canonical" href="https://{SITE_DOMAIN}/{'' if lang == 'en' else 'sq/'}{page}.html" />
<link rel="alternate" hreflang="{other}" href="https://{SITE_DOMAIN}/{'sq/' if lang == 'en' else ''}{page}.html" />
<link rel="alternate" hreflang="{lang}" href="https://{SITE_DOMAIN}/{'' if lang == 'en' else 'sq/'}{page}.html" />
<link rel="icon" href="{up}assets/favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="{up}css/tokens.css" />
<link rel="stylesheet" href="{up}css/base.css" />
<link rel="stylesheet" href="{up}css/legal.css" />
</head>
<body class="doc">

<header class="doc__bar">
  <div class="wrap doc__bar-inner">
    <a class="doc__brand" href="{up}index.html">{MARK}<span>{APP_NAME}</span></a>
    <div class="doc__langs">
      <a class="doc__lang" href="{'' if lang == 'en' else other_href}" {'aria-current="true"' if lang == 'en' else ''}>EN</a>
      <a class="doc__lang" href="{other_href if lang == 'en' else ''}" {'aria-current="true"' if lang == 'sq' else ''}>SQ</a>
    </div>
  </div>
</header>

<main class="doc__main">
  <div class="wrap wrap--narrow">
{body}
  </div>
</main>

<footer class="doc__foot">
  <div class="wrap doc__foot-inner">
    <nav aria-label="{esc(label['home'])}">
      <a href="{up}index.html">{esc(label['home'])}</a>{links}
    </nav>
    <p>© 2026 {APP_NAME} · {CITY} · {RIGHTS[lang]}</p>
  </div>
</footer>
{script}
</body>
</html>
"""


def sections(blocks: list[dict]) -> str:
    return "\n".join(
        f'      <section class="doc__sec">\n'
        f'        <h2>{esc(b["title"])}</h2>\n'
        f'        <p>{esc(b["body"])}</p>\n'
        f"      </section>"
        for b in blocks
    )


def head(eyebrow: str, title: str, lede: str, stamp: str = "") -> str:
    stamp_html = f'\n      <p class="doc__stamp">{esc(stamp)}</p>' if stamp else ""
    return (
        f'    <header class="doc__head">\n'
        f'      <p class="doc__eyebrow">{esc(eyebrow)}</p>\n'
        f'      <h1 class="doc__title">{esc(title)}</h1>\n'
        f'      <p class="doc__lede">{esc(lede)}</p>{stamp_html}\n'
        f"    </header>"
    )


# ── the two pages the app has no counterpart for ─────────────────────────────

DELETION = {
    "en": {
        "eyebrow": "Account deletion",
        "title": "Request deletion of your account",
        "lede": f"You can delete your {APP_NAME} account from inside the app, or ask us to delete it for you — including after you have uninstalled.",
        "in_app_h": "Still have the app installed?",
        "in_app": "You can also delete the account inside CrashPricer: Settings → Delete account. It is removed immediately, with no email step.",
        "request_h": "Request deletion",
        "request_p": "Enter the email address your account is registered to and we will send a confirmation link to it. We confirm by email because an account must never be deleted by someone who is not its owner.",
        "steps": [
            "Enter your registered email address below.",
            "Open the confirmation link we send to that address.",
            "Confirm on the page it opens — the account is deleted straight away.",
            "The link expires after 30 minutes and works only once.",
        ],
        "cta": "Email a deletion request",
        "what_h": "What is deleted",
        "what_p": "The account itself, sessions and sign-in links, cases and photos stored on the server, marketplace requests and offers, in-app notifications, and analytics tied to the account. Accepted offers are removed together with the request they belong to. Cases and photos held only on your phone are removed with the app's data.",
        "kept_h": "What is kept, and why",
        "kept_p": f"Limited moderation records — the type of action, its reason, timestamps and pseudonymous identifiers — may be kept after deletion where that is necessary to protect other users and prevent repeat abuse, and records we are required by law to retain. These do not identify you publicly. Deleted data also persists in encrypted backups until they expire on their normal cycle ({TODO['backup_window']}), after which it is gone from those too.",
        "timing_h": "How long it takes",
        "timing_p": "Deletion from inside the app is immediate. An emailed request is answered within 30 days of us verifying it, and usually much sooner.",
    },
    "sq": {
        "eyebrow": "Fshirja e llogarisë",
        "title": "Kërko fshirjen e llogarisë sate",
        "lede": f"Mund ta fshish llogarinë tënde {APP_NAME} brenda aplikacionit, ose të na kërkosh ta fshijmë ne — edhe pasi ta kesh çinstaluar.",
        "in_app_h": "E ke ende aplikacionin?",
        "in_app": "Mund ta fshish llogarinë edhe brenda CrashPricer: Cilësimet → Fshi llogarinë. Hiqet menjëherë, pa asnjë hap me email.",
        "request_h": "Kërko fshirjen",
        "request_p": "Shkruaj adresën e emailit me të cilën është regjistruar llogaria dhe ne do të dërgojmë një lidhje konfirmimi. Konfirmojmë me email sepse një llogari nuk duhet fshirë kurrë nga dikush që nuk është pronari i saj.",
        "steps": [
            "Shkruaj më poshtë adresën e emailit të regjistruar.",
            "Hap lidhjen e konfirmimit që dërgojmë në atë adresë.",
            "Konfirmo në faqen që hapet — llogaria fshihet menjëherë.",
            "Lidhja skadon pas 30 minutash dhe përdoret vetëm një herë.",
        ],
        "cta": "Dërgo kërkesë për fshirje",
        "what_h": "Çfarë fshihet",
        "what_p": "Vetë llogaria, sesionet dhe lidhjet e hyrjes, rastet dhe fotot e ruajtura në server, kërkesat dhe ofertat e tregut, njoftimet në aplikacion dhe analitika e lidhur me llogarinë. Ofertat e pranuara hiqen bashkë me kërkesën së cilës i përkasin. Rastet dhe fotot që ruhen vetëm në telefonin tënd hiqen me të dhënat e aplikacionit.",
        "kept_h": "Çfarë ruhet dhe pse",
        "kept_p": f"Të dhëna të kufizuara moderimi — lloji i veprimit, arsyeja, koha dhe identifikues pseudonimë — mund të ruhen pas fshirjes kur kjo është e nevojshme për të mbrojtur përdoruesit e tjerë dhe për të parandaluar abuzimin e përsëritur, si dhe të dhënat që jemi të detyruar me ligj t'i ruajmë. Këto nuk të identifikojnë publikisht. Të dhënat e fshira qëndrojnë edhe në kopjet rezervë të enkriptuara derisa ato të skadojnë në ciklin e tyre normal ({TODO['backup_window']}), pas së cilës hiqen edhe prej atje.",
        "timing_h": "Sa zgjat",
        "timing_p": "Fshirja brenda aplikacionit është e menjëhershme. Një kërkesë me email trajtohet brenda 30 ditësh nga verifikimi, zakonisht shumë më shpejt.",
    },
}

# The form on the deletion page, and the page the mailed link opens.
FORM = {
    "en": {
        "label": "The email address your account is registered to",
        "placeholder": "you@example.com",
        "submit": "Send me the deletion link",
        "sending": "Sending…",
        # Says the same thing whether or not the address had an account: the
        # server will not tell the page, so the page cannot tell the visitor.
        "sent": "If that address has a CrashPricer account, a confirmation link is on its way. The link expires in 30 minutes.",
        "failed": "That request could not be sent. Check your connection and try again, or email " + SUPPORT_EMAIL + ".",
        "or_email": "Prefer email? Write to " + SUPPORT_EMAIL + " with the subject “Account deletion”, from the address the account is registered to.",
        "confirm_eyebrow": "Account deletion",
        "confirm_title": "Confirm you want this account deleted",
        "confirm_lede": "This permanently deletes the CrashPricer account this link was sent for. It cannot be undone.",
        "confirm_button": "Delete my account permanently",
        "confirm_working": "Deleting…",
        "confirm_done": "The account has been deleted. Nothing further is needed.",
        "confirm_invalid": "This link is no longer valid. Links expire after 30 minutes and can only be used once — request a new one from the deletion page.",
        "confirm_missing": "This link is incomplete. Open the link from the confirmation email exactly as it was sent.",
        "confirm_failed": "The account could not be deleted just now. Check your connection and try again, or email " + SUPPORT_EMAIL + ".",
        "confirm_back": "Back to the deletion page",
    },
    "sq": {
        "label": "Adresa e emailit me të cilën është regjistruar llogaria",
        "placeholder": "ti@shembull.com",
        "submit": "Dërgomë lidhjen e fshirjes",
        "sending": "Po dërgohet…",
        "sent": "Nëse ajo adresë ka një llogari CrashPricer, lidhja e konfirmimit është nisur. Lidhja skadon pas 30 minutash.",
        "failed": "Kërkesa nuk mundi të dërgohej. Kontrollo lidhjen dhe provo sërish, ose shkruaj te " + SUPPORT_EMAIL + ".",
        "or_email": "Preferon emailin? Shkruaj te " + SUPPORT_EMAIL + " me subjektin “Fshirja e llogarisë”, nga adresa me të cilën është regjistruar llogaria.",
        "confirm_eyebrow": "Fshirja e llogarisë",
        "confirm_title": "Konfirmo që dëshiron ta fshish këtë llogari",
        "confirm_lede": "Kjo fshin përgjithmonë llogarinë CrashPricer për të cilën u dërgua kjo lidhje. Nuk mund të zhbëhet.",
        "confirm_button": "Fshij llogarinë time përgjithmonë",
        "confirm_working": "Po fshihet…",
        "confirm_done": "Llogaria u fshi. Nuk nevojitet asgjë tjetër.",
        "confirm_invalid": "Kjo lidhje nuk është më e vlefshme. Lidhjet skadojnë pas 30 minutash dhe përdoren vetëm një herë — kërko një të re nga faqja e fshirjes.",
        "confirm_missing": "Kjo lidhje është e paplotë. Hape lidhjen nga emaili i konfirmimit pikërisht ashtu si u dërgua.",
        "confirm_failed": "Llogaria nuk mundi të fshihej tani. Kontrollo lidhjen dhe provo sërish, ose shkruaj te " + SUPPORT_EMAIL + ".",
        "confirm_back": "Kthehu te faqja e fshirjes",
    },
}

COMPANY = {
    "en": {
        "eyebrow": "Company details",
        "title": "Who operates CrashPricer",
        "lede": "The identity of the operator behind the app, its store listings and this website.",
        "warn": "These details are not final. The operating entity is not yet registered, so the fields marked below must be completed before this page is published or submitted to an app store.",
        "labels": {
            "app": "Application", "operator": "Operator", "reg": "Registration number",
            "address": "Registered address", "email": "Contact email",
            "site": "Website", "role": "Data controller", "auth": "Supervisory authority",
        },
        "role": "The operator named above is the data controller for personal data processed in the app, the accounts system and the repair marketplace.",
        "auth": "Information and Privacy Agency of Kosovo.",
    },
    "sq": {
        "eyebrow": "Të dhënat e kompanisë",
        "title": "Kush e operon CrashPricer",
        "lede": "Identiteti i operatorit pas aplikacionit, listimeve në dyqane dhe kësaj faqeje.",
        "warn": "Këto të dhëna nuk janë përfundimtare. Subjekti operues nuk është ende i regjistruar, prandaj fushat e shënuara më poshtë duhet të plotësohen para se kjo faqe të publikohet ose të dorëzohet në një dyqan aplikacionesh.",
        "labels": {
            "app": "Aplikacioni", "operator": "Operatori", "reg": "Numri i regjistrimit",
            "address": "Adresa e regjistruar", "email": "Emaili i kontaktit",
            "site": "Faqja", "role": "Kontrolluesi i të dhënave", "auth": "Autoriteti mbikëqyrës",
        },
        "role": "Operatori i emërtuar më lart është kontrolluesi i të dhënave personale që përpunohen në aplikacion, në sistemin e llogarive dhe në tregun e riparimeve.",
        "auth": "Agjencia për Informim dhe Privatësi e Kosovës.",
    },
}

SUPPORT_PAGE = {
    "en": {"eyebrow": "Support", "contact_h": "Contact us", "faq_h": "Frequently asked questions",
           "cta": "Email support"},
    "sq": {"eyebrow": "Ndihma", "contact_h": "Na kontakto", "faq_h": "Pyetjet e shpeshta",
           "cta": "Shkruaj mbështetjes"},
}


def build_privacy(lang: str, legal: dict) -> str:
    c = legal[lang]
    body = (
        head(NAV_LABEL[lang]["privacy"], c["privacyTitle"], c["privacySubtitle"], c["lastUpdated"])
        + f'\n    <div class="doc__note doc__note--calm"><p>{esc(c["privacyNotice"])}</p></div>\n'
        + f'    <div class="doc__card">\n{sections(c["privacy"])}\n    </div>'
    )
    return chrome(lang, "privacy", c["privacyTitle"], c["privacySubtitle"], body)


def build_terms(lang: str, legal: dict) -> str:
    c = legal[lang]
    body = (
        head(NAV_LABEL[lang]["terms"], c["termsTab"], c["subtitle"], c["lastUpdated"])
        + f'\n    <div class="doc__note doc__note--calm"><p>{esc(c["reviewNotice"])}</p></div>\n'
        + f'    <div class="doc__card">\n{sections(c["terms"])}\n    </div>'
    )
    return chrome(lang, "terms", c["termsTab"], c["subtitle"], body)


def build_support(lang: str, helpc: dict, legal: dict) -> str:
    h = helpc[lang]
    t = SUPPORT_PAGE[lang]
    faq = sections(h["faqs"])
    body = (
        head(t["eyebrow"], h["title"], h["subtitle"])
        + f"""
    <div class="doc__card">
      <section class="doc__sec">
        <h2>{esc(t["contact_h"])}</h2>
        <p>{esc(h["contactSupportBody"])}</p>
        <p><a href="{mailto('CrashPricer support')}">{SUPPORT_EMAIL}</a></p>
        <a class="doc__cta" href="{mailto('CrashPricer support')}">{esc(t["cta"])}</a>
      </section>
    </div>

    <header class="doc__head" style="margin-top:48px">
      <h2 class="doc__title" style="font-size:clamp(1.5rem,3.4vw,2.1rem)">{esc(t["faq_h"])}</h2>
    </header>
    <div class="doc__card">
{faq}
    </div>"""
    )
    return chrome(lang, "support", h["title"], h["subtitle"], body)


def build_deletion_confirm(lang: str) -> str:
    """The page the mailed link opens.

    It asks for a click rather than deleting on load. Mail clients and security
    scanners follow links in messages to preview or vet them, and a page that
    acted on load would let a scanner erase the account before the person had
    even read the email.
    """
    f = FORM[lang]
    up = "../" if lang == "sq" else ""
    body = (
        head(f["confirm_eyebrow"], f["confirm_title"], f["confirm_lede"])
        + f"""
    <div class="doc__card">
      <section class="doc__sec" data-deletion-confirm
               data-endpoint="{API_BASE_URL}/api/account-deletion/confirm"
               data-working="{html.escape(f["confirm_working"], quote=True)}"
               data-done="{html.escape(f["confirm_done"], quote=True)}"
               data-invalid="{html.escape(f["confirm_invalid"], quote=True)}"
               data-missing="{html.escape(f["confirm_missing"], quote=True)}"
               data-failed="{html.escape(f["confirm_failed"], quote=True)}">
        <button class="doc__cta doc__cta--danger" type="button">{esc(f["confirm_button"])}</button>
      </section>
      <p class="doc__note doc__note--calm" data-confirm-status hidden></p>
      <section class="doc__sec">
        <p><a href="{up}delete-account.html">{esc(f["confirm_back"])}</a></p>
      </section>
    </div>"""
    )
    return chrome(
        lang, "delete-account-confirm", f["confirm_title"], f["confirm_lede"], body,
        script=f'<script src="{up}js/deletion.js" defer></script>',
    )


def build_deletion(lang: str) -> str:
    d = DELETION[lang]
    f = FORM[lang]
    up = "../" if lang == "sq" else ""
    steps = "\n".join(f"          <li>{esc(s)}</li>" for s in d["steps"])
    body = (
        head(d["eyebrow"], d["title"], d["lede"])
        + f"""
    <div class="doc__card">
      <section class="doc__sec">
        <h2>{esc(d["request_h"])}</h2>
        <p>{esc(d["request_p"])}</p>
        <ol class="doc__steps">
{steps}
        </ol>

        <form class="doc__form" data-deletion-form
              data-endpoint="{API_BASE_URL}/api/account-deletion/request"
              data-sending="{html.escape(f["sending"], quote=True)}"
              data-sent="{html.escape(f["sent"], quote=True)}"
              data-failed="{html.escape(f["failed"], quote=True)}">
          <label class="doc__label" for="deletion-email">{esc(f["label"])}</label>
          <input class="doc__input" id="deletion-email" type="email" name="email"
                 autocomplete="email" required placeholder="{html.escape(f["placeholder"], quote=True)}" />
          <button class="doc__cta" type="submit">{esc(f["submit"])}</button>
        </form>
        <p class="doc__note doc__note--calm" data-deletion-status hidden></p>

        <p>{esc(f["or_email"])}</p>
      </section>
      <section class="doc__sec">
        <h2>{esc(d["in_app_h"])}</h2>
        <p>{esc(d["in_app"])}</p>
      </section>
      <section class="doc__sec">
        <h2>{esc(d["what_h"])}</h2>
        <p>{esc(d["what_p"])}</p>
      </section>
      <section class="doc__sec">
        <h2>{esc(d["kept_h"])}</h2>
        <p>{esc(d["kept_p"]).replace(esc(TODO["backup_window"]), todo("backup_window"))}</p>
      </section>
      <section class="doc__sec">
        <h2>{esc(d["timing_h"])}</h2>
        <p>{esc(d["timing_p"])}</p>
      </section>
    </div>"""
    )
    return chrome(
        lang, "delete-account", d["title"], d["lede"], body,
        script=f'<script src="{up}js/deletion.js" defer></script>',
    )


def build_company(lang: str) -> str:
    c = COMPANY[lang]
    lab = c["labels"]
    rows = [
        (lab["app"], APP_NAME),
        (lab["operator"], todo("legal_name")),
        (lab["reg"], todo("reg_number")),
        (lab["address"], f'{todo("address")}<br />{esc(CITY)}'),
        (lab["email"], f'<a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a>'),
        (lab["site"], f'<a href="https://{SITE_DOMAIN}">{SITE_DOMAIN}</a>'),
        (lab["role"], esc(c["role"])),
        (lab["auth"], esc(c["auth"])),
    ]
    facts = "\n".join(
        f"        <div><dt>{esc(k)}</dt><dd>{v}</dd></div>" for k, v in rows
    )
    body = (
        head(c["eyebrow"], c["title"], c["lede"])
        + f'\n    <div class="doc__note doc__note--warn"><p>{esc(c["warn"])}</p></div>\n'
        + f'    <div class="doc__card">\n      <dl class="doc__facts">\n{facts}\n      </dl>\n    </div>'
    )
    return chrome(lang, "company", c["title"], c["lede"], body)


def main() -> None:
    copy_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_COPY
    data = extract(copy_path)
    legal, helpc = data["legalCopy"], data["helpCopy"]

    (ROOT / "sq").mkdir(exist_ok=True)
    written = []
    for lang in ("en", "sq"):
        out_dir = ROOT if lang == "en" else ROOT / "sq"
        pages = {
            "privacy": build_privacy(lang, legal),
            "terms": build_terms(lang, legal),
            "support": build_support(lang, helpc, legal),
            "delete-account": build_deletion(lang),
            # Not in PAGES: it is the landing page for the emailed link, not a
            # destination anyone navigates to, so it stays out of the footer.
            "delete-account-confirm": build_deletion_confirm(lang),
            "company": build_company(lang),
        }
        for name, markup in pages.items():
            path = out_dir / f"{name}.html"
            path.write_text(markup, encoding="utf-8")
            written.append(path.relative_to(ROOT))

    print(f"wrote {len(written)} pages from {copy_path.name}:")
    for path in written:
        print(f"  {path}")

    print(f"\nsupport email, consistent across app and site: {SUPPORT_EMAIL}")
    print(f"deletion form posts to: {API_BASE_URL}")
    if "localhost" in API_BASE_URL or "127.0.0.1" in API_BASE_URL:
        print("  !! that is a local address — the deletion form will not work once deployed.")
        print("     Set API_BASE_URL to the production API, and add this site's origin")
        print("     to the backend's Cors:AllowedOrigins, or the browser will block it.")

    print("\nSTILL TO FILL IN before this goes in front of a store reviewer:")
    for key, value in TODO.items():
        print(f"  {key:14} {value}")
    print("  -> edit TODO at the top of this script, then re-run.")


if __name__ == "__main__":
    main()
