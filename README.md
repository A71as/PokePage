# RecordCrate — Shopify binder-page store starter

This repository contains a small starter scaffold and documentation to create a Shopify store focused on selling Pokémon cards by the binder page (9-card or 16-card pages).

What you'll find here:

- `theme/sections/product-template.liquid` — sample product section for a binder-page product.
- `theme/snippets/binder-page.liquid` — snippet rendering variant selector and a visual grid preview (3x3 or 4x4) of the binder page layout.
- `theme/assets/styles.css` — minimal styles for the preview grid and product UI.
- `product-csv-template.csv` — CSV template for bulk-importing binder-page products into Shopify.

Quick contract (what this starter does):
- Inputs: Shopify product with option named `Layout` having values `9` and `16`, product images for the page, and prices set per variant.
- Outputs: Theme template that displays layout selector, price, add-to-cart flow, and a grid preview sized for 9 or 16 card slots.
- Error modes: If the product has no `Layout` option or images are missing, the preview will show placeholders and fall back to the default product behavior.

Edge cases to consider:
- Customers ordering >1 of the same binder page should be allowed (cart will track quantity normally).
- Inventory: treat each variant (9/16) as separate inventory/SKU.
- Customization: if customers want to select specific cards in each slot, youll need line-item properties or a custom builder — not included here.

How to use this starter

1) Create a Shopify development store (partners) or use your store.
2) Install Shopify CLI and log in: see https://shopify.dev for steps.

PowerShell example (local):

```powershell
# from your local theme folder (this repo's theme directory)
cd c:/Users/lizal/PagePerfect/theme
# preview using Shopify CLI (after logging in with `shopify login --store your-store`)
shopify theme serve
# or to deploy (after setting up credentials)
shopify theme push
```

3) Product setup in Shopify admin (recommended fields):
- Title: "Binder Page — Pokémon (9)" or "Binder Page — Pokémon (16)"
- Product type: `Binder Page`
- Vendor: your store name
- Options: `Layout` with values `9` and `16` (or single product with two variants)
- Variant SKUs: `BP-POK-9`, `BP-POK-16` (or your naming)
- Images: upload an image showing the page; additional images for example gallery.
- Price: set price per variant.

4) Import the provided CSV (`product-csv-template.csv`) if you want to bulk create products.

Next steps I can take for you (pick any):
- Wire this into a full Shopify theme and push to your store (requires Shopify access/login).
- Add a mini card-picker UI so customers pick specific cards for each slot.
- Create product listing (collection) templates and a homepage hero.

Files added in this commit:
- `theme/sections/product-template.liquid` — product section
- `theme/snippets/binder-page.liquid` — binder UI snippet
- `theme/assets/styles.css` — minimal styles
- `product-csv-template.csv` — CSV template for quick import

Helper scripts
-------------------
- `scripts/setup-shopify-theme.ps1` — PowerShell script to clone Dawn, login to Shopify CLI and run `shopify theme dev` locally. Run this on your machine; it will open the browser for CLI login.
- `scripts/git-init-and-push.ps1` — PowerShell script to initialize git, make an initial commit and push to a remote. Replace the remote URL before running.


If you'd like, I can now: (A) create a simple homepage and collection templates, (B) scaffold a full theme with Shopify CLI metadata, or (C) help you import the CSV and set up sample products. Which do you prefer?