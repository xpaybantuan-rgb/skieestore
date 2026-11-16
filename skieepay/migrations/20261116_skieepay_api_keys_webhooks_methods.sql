-- SkieePay private API keys, webhook endpoints, delivery log and payment-method settings.
create table if not exists public.skieepay_api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(trim(label)) between 2 and 80),
  mode text not null default 'test' check (mode in ('test','live')),
  key_prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.skieepay_webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  url text not null check (url ~ '^https://'),
  mode text not null default 'test' check (mode in ('test','live')),
  events text[] not null default array['payment.paid','payment.expired']::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_delivery_at timestamptz,
  constraint skieepay_webhook_events_check check (
    events <@ array['payment.paid','payment.expired']::text[] and cardinality(events) > 0
  )
);

create table if not exists public.skieepay_webhook_secrets (
  endpoint_id uuid primary key references public.skieepay_webhook_endpoints(id) on delete cascade,
  signing_secret text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skieepay_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.skieepay_webhook_endpoints(id) on delete cascade,
  invoice_id uuid references public.skieepay_invoices(id) on delete set null,
  event_id text not null,
  event_type text not null check (event_type in ('payment.paid','payment.expired')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','delivered','failed')),
  response_status integer,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(endpoint_id,event_id)
);

create table if not exists public.skieepay_payment_methods (
  method_code text primary key,
  display_name text not null,
  enabled boolean not null default false,
  mode text not null default 'test' check (mode in ('test','live')),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.skieepay_payment_methods(method_code,display_name,enabled,mode,settings)
values
 ('qris_standard','QRIS Standar',false,'test','{"provider_connected":false,"note":"Payment adapter belum terhubung"}'::jsonb),
 ('qris_custom','QRIS CUSTOM GoPay',false,'test','{"account_connected":false,"note":"Koneksi GoPay Merchant belum diimplementasikan"}'::jsonb)
on conflict(method_code) do nothing;

alter table public.skieepay_api_keys enable row level security;
alter table public.skieepay_webhook_endpoints enable row level security;
alter table public.skieepay_webhook_secrets enable row level security;
alter table public.skieepay_webhook_deliveries enable row level security;
alter table public.skieepay_payment_methods enable row level security;

drop policy if exists skieepay_api_keys_owner_read on public.skieepay_api_keys;
create policy skieepay_api_keys_owner_read on public.skieepay_api_keys
  for select to authenticated
  using (exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_webhook_endpoints_owner_read on public.skieepay_webhook_endpoints;
create policy skieepay_webhook_endpoints_owner_read on public.skieepay_webhook_endpoints
  for select to authenticated
  using (exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_webhook_deliveries_owner_read on public.skieepay_webhook_deliveries;
create policy skieepay_webhook_deliveries_owner_read on public.skieepay_webhook_deliveries
  for select to authenticated
  using (exists(
    select 1 from public.skieepay_webhook_endpoints e
    join public.xpaypoint_admins a on a.user_id=(select auth.uid())
    where e.id=skieepay_webhook_deliveries.endpoint_id
  ));

drop policy if exists skieepay_payment_methods_owner_read on public.skieepay_payment_methods;
create policy skieepay_payment_methods_owner_read on public.skieepay_payment_methods
  for select to authenticated
  using (exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));

revoke all on public.skieepay_api_keys from anon, authenticated;
grant select (id,label,mode,key_prefix,created_at,last_used_at,revoked_at) on public.skieepay_api_keys to authenticated;
grant all on public.skieepay_api_keys to service_role;

revoke all on public.skieepay_webhook_secrets from anon, authenticated;
grant all on public.skieepay_webhook_secrets to service_role;
grant select on public.skieepay_webhook_endpoints, public.skieepay_webhook_deliveries, public.skieepay_payment_methods to authenticated;
grant all on public.skieepay_webhook_endpoints, public.skieepay_webhook_deliveries, public.skieepay_payment_methods to service_role;

create index if not exists skieepay_api_keys_mode_active_idx on public.skieepay_api_keys(mode,revoked_at);
create index if not exists skieepay_webhook_deliveries_endpoint_created_idx on public.skieepay_webhook_deliveries(endpoint_id,created_at desc);
