# Lattaffa Perfumes Implementation Rules

Use this document when continuing the project with another AI or developer.

## Brand

- Site name: Lattaffa perfumes.
- Product context: Arabic perfumes, oud, musk, amber, florals, incense, and premium fragrance presentation.
- Interface language: Portuguese. Arabic may appear only as decorative or brand-flavor accents.
- Keep the tone elegant, warm, and trustworthy. Avoid generic ecommerce wording when perfume-specific wording fits.

## Visual Style

- Use a luxury palette: deep oud/ink backgrounds, ivory surfaces, warm gold accents, rose/clay highlights, and muted sage/teal only as a secondary accent.
- Avoid returning to the old blue SaaS look.
- Avoid playful, neon, cartoon, or overly bright styling.
- Cards should stay restrained with radius around 8px or less.
- Do not nest cards inside other cards.
- Buttons should feel premium but clear, with strong contrast and predictable states.
- Product images should be real perfume/product imagery whenever possible. If no product image exists, use the Lattaffa fallback visual asset.

## UX Rules

- The first screen must be the usable shop experience, not a marketing-only landing page.
- Keep buying flow practical: products, details, cart, checkout, orders.
- Admin screens should stay functional and easy to scan.
- Client order flow:
  - `Aguardando pagamento`: visible to client, hidden from admin.
  - `Pago`: visible to admin as waiting for acceptance.
  - `Em Separacao`: visible to admin in its own section with the shipping action.
  - `Enviado`: shows tracking/posting code to the client.
  - Client can click `Recebido` only after `Enviado`.
  - After `Recebido`, status becomes `Entregue` for both client and admin.
- Admin acceptance should automatically move the order from `Pago` to `Em Separacao`.
- Admin shipping must require a posting/tracking code.

## Copy Rules

- Use Portuguese labels and messages.
- Prefer perfume-specific wording:
  - "Fragrâncias" instead of generic "Produtos" where it makes sense.
  - "Curadoria" or "Notas" can be used for collection context.
  - "Código de postagem" for tracking code.
- Arabic text should be decorative and minimal, for example `لطافة`, `عود`, or `مسك`.
- Do not put long explanations inside the app UI.

## Technical Rules

- Follow existing React component patterns.
- Keep backend status values consistent with the database, especially `Em Separacao`.
- Preserve compatibility with older statuses where possible, such as `Aceito`.
- Keep visual changes mostly in CSS and existing components unless a new component clearly reduces duplication.
- Do not remove user or existing generated changes unless explicitly asked.
- Run `npm run build` in `frontend` after frontend changes.
- Run backend syntax checks with `node --check` for edited backend files.
