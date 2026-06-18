# Mystic East

Mystic East is a static English BaZi website adapted from the original Chinese single-page calculator at `../mingli-tool.html`.

## Pages

- `index.html` — landing page
- `calculator.html` — local BaZi chart calculator
- `what-is-bazi.html` — educational guide
- `readings.html` — paid reading tiers and browser-generated report unlocks

## Shared Assets

- `css/style.css` — shared visual system, responsive layout, starfield, cards, tables, forms, and modal styles
- `js/bazi-engine.js` — migrated BaZi calculation engine exposed as `window.BaZiEngine`

## Notes

- Pure HTML/CSS/JS.
- Free chart birth data is calculated locally in the browser and is not stored by this static site.
- The lunar lookup table follows the original tool's 1900-2030 range.

## Commercial Launch Notes

- Canonical, Open Graph, Twitter, and schema URLs should use `https://yourbazi.xyz`.
- The current PayPal unlock flow is client-side. Before scaling paid traffic, add server-side order creation/capture verification and a durable delivery record.
- Keep refund, delivery, and privacy copy aligned across `readings.html` and `privacy.html`.
- Do not publish unverified social proof. Use real analytics, testimonials, or product promises instead.
