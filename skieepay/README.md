# SkieePay — independent payment gateway

SkieePay is a separate application under `/skieepay` in the shared GitHub repository. Cloudflare Pages uses `/skieepay` as its root; SKIEESTORE keeps its own root application. Both stay in the same GitHub, Cloudflare, and Supabase accounts, but their code, merchant identity, admin registry, and active payment integrations are separate.

## Components

- Public site: `index.html`
- Owner dashboard: `admin.html`
- Invoice lookup: `invoice.html`
- Sandbox: `sandbox.html`
- GoPay Merchant connection: `gopay.html`
- API Worker: `https://skieepay-api.xpaybantuan.workers.dev`

## SkieePay-specific backend

- Admin authorization: `public.skieepay_admins`
- Business identity: `public.skieepay_businesses`, default code `skieepay`
- Invoice and ledger tables: `skieepay_invoices`, `skieepay_ledger`
- Payment event, API key, webhook, and provider-session tables use the `skieepay_*` namespace.
- The shared Supabase project is intentional; the SkieePay runtime does not use SKIEESTORE order, product, or supplier tables.

## Worker configuration

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Shared Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `SKIEEPAY_API_KEY` | Owner test API key |
| `SKIEEPAY_LIVE_ENABLED` | Keep `false` until payment acceptance and settlement are verified |
| `SKIEEPAY_QRIS_STATIC` | QRIS payload owned by SkieePay; never copy SKIEESTORE's QRIS |

Never expose service-role keys, API secrets, merchant tokens, or OTP in frontend code or chat.

## Provider isolation

- SkieePay does not call SKIEESTORE's VIPayment supplier or fulfillment endpoints.
- The old VIPayment callback table/function is legacy history only; it is no longer read or accepted by SkieePay.
- Old GoPay sessions remain untouched in the shared database but are ignored. SkieePay uses its own namespaced provider session `skieepay_gopay_merchant`.
- The QRIS generator requires `SKIEEPAY_QRIS_STATIC`; no SKIEESTORE QRIS payload is embedded in code.
- The GoBiz connection uses non-public endpoints and is not an official public merchant API. It may stop working if GoBiz changes its service.

## API

- `GET /health` — Worker health and safe mode.
- `GET /public/invoices/:invoice_code` — public invoice status lookup.
- `POST /v1/invoices` — create an invoice with a valid SkieePay API key.
- `GET /v1/invoices/:uuid` — retrieve an invoice with a valid SkieePay API key.
- `POST /webhooks/payment` — unavailable until a verified payment provider adapter is connected.

## Safety

- Sandbox and live invoice modes are separate.
- Live payment confirmation remains disabled until a dedicated SkieePay merchant account, QRIS settlement route, and transaction verification are tested end-to-end.
- A customer payment is marked paid only by a verified payment rail, never by a product supplier or an unverified notification.
- Webhook deliveries are signed with HMAC-SHA256 and include a unique event ID.
