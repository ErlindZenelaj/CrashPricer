# CrashPricer redesign QA

Updated 2026-09-13.

## Direction implemented

- Removed standalone step rows, price guessing game, benefit cards, proof section, car scene and verbose shop information.
- Added an editorial “Oh, scratch.” opening with screenshot-based phone mockups and a scroll-revealed estimate.
- Retained a concise driver walkthrough, paired booking phones, scroll-controlled shop gallery, three collapsed FAQs and final CTA.
- Original app captures are displayed as images, not regenerated interfaces. Perspective, framing and cropping are intentional presentation changes.

## Verification

- Desktop hero visually inspected at 1440 × 1000.
- Mobile hero and shop scene visually inspected at 390 × 844.
- Mobile document width equals viewport width; no broken loaded images.
- Hero estimate reveal changes with scrolling.
- Shop gallery changes from Coverage to Offers on scrolling; sticky overflow conflict corrected and rechecked.
- No browser error logs during these checks.
- Translation coverage, JavaScript syntax and git whitespace checks pass.
- Reduced-motion alternatives are implemented in CSS; OS preference switching was not manually tested.

## Remaining integration

Store badges retain existing placeholder anchors. Real store URLs are needed before publishing. No deployment performed.
