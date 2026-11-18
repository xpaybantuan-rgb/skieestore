# SkieePay — independent payment gateway

SkieePay is maintained as a separate application inside the shared GitHub repository. Cloudflare Pages serves this folder with root directory `/skieepay`; SKIEESTORE keeps its own root application and domain. Both may use the same Cloudflare account and Supabase project, while SkieePay code and `skieepay_*` data remain separate.

## Components

- Public site: `index.html`
- Owner dashboard: `admin.html`
- Invoice lookup: `invoice.html`
- Sandbox: `sandbox.html`
- GoPay Merchant connection: `gopay.html`
- API Worker: `https://skieepay-api.xpaybantuan.workers.dev`

## Worker configuration

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Shared Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `SKIEEPAY_API_KEY` | Owner test API key |
| `SKIEEPAY_LIVE_ENABLED` | Keep `false` until payment acceptance and settlement are verified |
| `SKIEEPAY_QRIS_STATIC` | QRIS payload owned by SkieePay; never copy SKIEESTORE's QRIS |

Never expose the service role key, API secrets, merchant tokens, or OTP in frontend code or chat.

## Provider isolation

- SkieePay does not call SKIEESTORE's VIPayment supplier or fulfillment endpoints.
- Legacy VIPayment database records are retained for historical integrity only; the SkieePay Worker and dashboard no longer read or accept VIPayment callbacks.
- Existing GoPay sessions without the encrypted `account_scope=skieepay` marker are ignored. Reconnect a GoPay Merchant account specifically for SkieePay.
- SkieePay's QRIS payload must be configured independently using `SKIEEPAY_QRIS_STATIC`. The previous embedded SKIEESTORE QRIS is not used.
- The GoBiz connection uses non-public endpoints and is not an official public merchant API. It may stop working if GoBiz changes its service.

## API

- `GET /health` — Worker health and safe mode.
- `GET /public/invoices/:invoice_code` — public invoice status lookup.
- `POST /v1/invoices` — create an invoice with a valid SkieePay API key.
- `GET /v1/invoices/:uuid` — retrieve an invoice with a valid SkieePay API key.
- `POST /webhooks/payment` — intentionally unavailable until a verified payment provider adapter is connected.

## Safety

- Sandbox and live invoice modes are separate.
- Live payment confirmation remains disabled until a dedicated SkieePay merchant account, QRIS settlement route, and transaction verification are tested end-to-end.
- A customer payment is marked paid only by a verified payment rail, never by a product supplier or an unverified notification.
- Webhook deliveries are signed with HMAC-SHA256 and include a unique event ID.
