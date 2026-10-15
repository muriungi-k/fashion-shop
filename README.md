# Fashion storefront

A responsive, buildless fashion storefront using HTML, CSS, and JavaScript. The supplied reference layouts and locally saved imagery form one continuous page.

## Preview

Open `index.html` directly, or serve the folder for a consistent local origin:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit `http://localhost:8000`. No dependencies or build step are required.

## Included

- Fourteen browsable products, product detail dialogs, and size selection.
- Search, department/category filtering, collection browsing, and price sorting.
- Favorites and a shopping bag with quantity adjustment, removal, and totals.
- Bag, favorites, and optional local profile saved in browser storage.
- Accessible native dialogs, keyboard controls, responsive layouts, empty states, and reduced-motion support.
- Footer navigation, care and sizing guidance, privacy controls, and rotating editorial style notes.
- Optimized WebP assets; original PNG/JPEG files are retained.

## Files

- `index.html`: page sections and product cards.
- `css/style.css`: original reference layouts.
- `css/polish.css`: shared refinements, shopping dialogs, footer, and responsive finishing.
- `js/main.js`: catalog metadata and storefront interactions.
- `images/`: original and optimized assets. `enhancement-notes.txt` records AI image reconstruction prompts.

Product names, prices, and images live in the HTML. Descriptions and departments live in the `metadata` object in `js/main.js`, keyed by image filename without extension.

## Before accepting orders

This is a complete frontend preview, not a connected commerce backend. Online authentication, payment processing, stock management, order fulfillment, email delivery, and customer support must be connected before launch. Profiles currently save preferences on the device only. No passwords or payment details are collected. Shoes and watches are preview collections without purchasable catalog entries. Product availability, material specifications, sizes, promotional discounts, shipping promises, and returns policies need the store owner's confirmation. Images include AI reconstructions and should be replaced with verified product photography before selling actual goods.

## Verification performed

Chrome checks at 320, 390, 600, 768, 1024, 1280, and 1440 CSS pixels; no document overflow. Verified image decoding, search and empty results, department filtering, sorting, required size selection, cart totals, quantity updates, removal, persistence after reload, favorites, local profile forms, data clearing, menu toggling, and style-note navigation. No runtime errors in those checks.
