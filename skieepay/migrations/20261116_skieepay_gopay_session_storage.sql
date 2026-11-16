-- Encrypted GoPay Merchant session and transaction-claim storage for the private SkieePay adapter.
create table if not exists public.skieepay_provider_sessions (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('gopay_merchant')),
  encrypted_payload text not null,
  iv text not null,
  merchant_id text,
  outlet_name text,
  masked_phone text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_refresh_at timestamptz,
  last_polled_at timestamptz
);

create table if not exists public.skieepay_provider_login_attempts (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('gopay_merchant')),
  encrypted_payload text not null,
  iv text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skieepay_provider_transaction_claims (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gopay_merchant')),
  external_transaction_id text not null,
  invoice_id uuid not null references public.skieepay_invoices(id) on delete cascade,
  amount bigint not null check (amount > 0),
  transaction_time timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,external_transaction_id)
);

alter table public.skieepay_provider_sessions enable row level security;
alter table public.skieepay_provider_login_attempts enable row level security;
alter table public.skieepay_provider_transaction_claims enable row level security;

revoke all on public.skieepay_provider_sessions, public.skieepay_provider_login_attempts, public.skieepay_provider_transaction_claims from anon, authenticated;
grant all on public.skieepay_provider_sessions, public.skieepay_provider_login_attempts, public.skieepay_provider_transaction_claims to service_role;

create index if not exists skieepay_provider_claim_invoice_idx on public.skieepay_provider_transaction_claims(invoice_id);
create unique index if not exists skieepay_invoice_provider_reference_unique
  on public.skieepay_invoices(provider_reference) where provider_reference is not null;
