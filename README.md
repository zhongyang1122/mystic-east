# Mystic East

Mystic East is a static English BaZi website adapted from the original Chinese single-page calculator at `../mingli-tool.html`.

## Pages

- `index.html` — landing page
- `calculator.html` — local BaZi chart calculator
- `what-is-bazi.html` — educational guide
- `readings.html` — placeholder paid reading tiers

## Shared Assets

- `css/style.css` — shared visual system, responsive layout, starfield, cards, tables, forms, and modal styles
- `js/bazi-engine.js` — migrated BaZi calculation engine exposed as `window.BaZiEngine`

## Notes

- Pure HTML/CSS/JS.
- No backend dependency.
- No real payment processing.
- Birth data is calculated locally in the browser and is not stored by this static site.
- The lunar lookup table follows the original tool's 1900-2030 range.
