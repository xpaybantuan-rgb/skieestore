# SKIEESTORE Duitku + Google OAuth setup

## Supabase Edge Function

Function: `skieestore-duitku`  
Public callback mode: `verify_jwt = false` (the callback validates Duitku's HMAC signature; member checkout validates the Supabase user token internally).

Required Supabase Edge Function secrets:

- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`

Optional secrets:

- `DUITKU_ENV` = `production` (use `sandbox` only for sandbox testing)
- `DUITKU_PAYMENT_METHOD` = `NQ` (QRIS channel; set a channel enabled for the merchant account)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

The function's health endpoint is `GET /functions/v1/skieestore-duitku`. It returns only whether the required values are configured, never their contents.

## Duitku callback and return URLs

The checkout request registers this callback URL automatically:

`https://skieestore.biz.id/api/duitku?action=callback`

Top-up return URL: `https://skieestore.biz.id/cek-pesanan?order_code=...`  
Membership return URL: `https://skieestore.biz.id/profil?membership_payment=return`

## Google OAuth

The profile page calls Supabase Auth `signInWithOAuth({ provider: "google" })` and redirects to:

`https://skieestore.biz.id/profil`

Supabase Auth must have Google enabled with a valid Google OAuth Client ID and Client Secret. Add the profile URL to Supabase Auth's allowed redirect URLs. In Google Cloud OAuth credentials, add the Supabase callback URL:

`https://rjgeitbkpcyymgemcztx.supabase.co/auth/v1/callback`

The project currently reports Google provider disabled. Client credentials are not present in the connected project, so the button is implemented but Google sign-in cannot complete until the owner supplies/configures those credentials.

## Payment minimum

Duitku QRIS has a Rp10.000 minimum per invoice. The top-up flow rejects a payable amount below that minimum before creating a payment intent. Products below Rp10.000 cannot be paid individually using this QRIS channel.
