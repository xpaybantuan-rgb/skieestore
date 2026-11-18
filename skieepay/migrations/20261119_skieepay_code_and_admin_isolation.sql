-- SkieePay code/admin isolation within the existing shared Supabase project.
-- Preserve SKIEESTORE tables and legacy rows; SkieePay gets its own admin registry and business identity.

create table if not exists public.skieepay_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
insert into public.skieepay_admins(user_id)
select user_id from public.xpaypoint_admins
on conflict (user_id) do nothing;

alter table public.skieepay_admins enable row level security;
revoke all on table public.skieepay_admins from anon, authenticated;
grant select on table public.skieepay_admins to authenticated;
grant all on table public.skieepay_admins to service_role;
drop policy if exists skieepay_admins_self_read on public.skieepay_admins;
create policy skieepay_admins_self_read on public.skieepay_admins
for select to authenticated using ((select auth.uid()) = user_id);

update public.skieepay_businesses
set code='skieepay', name='SkieePay', updated_at=now()
where code='xpaypoint';

drop policy if exists skieepay_api_keys_owner_insert on public.skieepay_api_keys;
create policy skieepay_api_keys_owner_insert on public.skieepay_api_keys
for insert to authenticated with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_api_keys_owner_read on public.skieepay_api_keys;
create policy skieepay_api_keys_owner_read on public.skieepay_api_keys
for select to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_api_keys_owner_update on public.skieepay_api_keys;
create policy skieepay_api_keys_owner_update on public.skieepay_api_keys
for update to authenticated
using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_businesses_owner_insert on public.skieepay_businesses;
create policy skieepay_businesses_owner_insert on public.skieepay_businesses
for insert to authenticated with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_businesses_owner_read on public.skieepay_businesses;
create policy skieepay_businesses_owner_read on public.skieepay_businesses
for select to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_payment_methods_owner_read on public.skieepay_payment_methods;
create policy skieepay_payment_methods_owner_read on public.skieepay_payment_methods
for select to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_webhook_deliveries_owner_read on public.skieepay_webhook_deliveries;
create policy skieepay_webhook_deliveries_owner_read on public.skieepay_webhook_deliveries
for select to authenticated using (
  exists (select 1 from public.skieepay_webhook_endpoints e
    join public.skieepay_admins a on a.user_id=(select auth.uid())
    where e.id=skieepay_webhook_deliveries.endpoint_id)
);

drop policy if exists skieepay_webhook_endpoints_owner_delete on public.skieepay_webhook_endpoints;
create policy skieepay_webhook_endpoints_owner_delete on public.skieepay_webhook_endpoints
for delete to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_webhook_endpoints_owner_insert on public.skieepay_webhook_endpoints;
create policy skieepay_webhook_endpoints_owner_insert on public.skieepay_webhook_endpoints
for insert to authenticated with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_webhook_endpoints_owner_read on public.skieepay_webhook_endpoints;
create policy skieepay_webhook_endpoints_owner_read on public.skieepay_webhook_endpoints
for select to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_webhook_endpoints_owner_update on public.skieepay_webhook_endpoints;
create policy skieepay_webhook_endpoints_owner_update on public.skieepay_webhook_endpoints
for update to authenticated
using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));

drop policy if exists skieepay_webhook_secrets_owner_delete on public.skieepay_webhook_secrets;
create policy skieepay_webhook_secrets_owner_delete on public.skieepay_webhook_secrets
for delete to authenticated using (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));
drop policy if exists skieepay_webhook_secrets_owner_insert on public.skieepay_webhook_secrets;
create policy skieepay_webhook_secrets_owner_insert on public.skieepay_webhook_secrets
for insert to authenticated with check (exists(select 1 from public.skieepay_admins a where a.user_id=(select auth.uid())));

create or replace function public.skieepay_create_invoice(
  p_amount bigint, p_order_id uuid default null, p_customer_ref text default null,
  p_payment_method text default 'qris', p_payment_payload text default null, p_expires_minutes integer default 15
) returns jsonb language plpgsql security definer set search_path=public as $function$
declare v_business_id uuid; v_invoice public.skieepay_invoices%rowtype; v_code text;
begin
  if p_amount is null or p_amount<1 then raise exception 'amount must be positive'; end if;
  if p_expires_minutes is null or p_expires_minutes<5 or p_expires_minutes>60 then raise exception 'expires_minutes must be between 5 and 60'; end if;
  if p_payment_method is distinct from 'qris' then raise exception 'only QRIS is supported'; end if;
  select id into v_business_id from public.skieepay_businesses where code='skieepay' and status='active' limit 1;
  if v_business_id is null then raise exception 'SkieePay business is not active'; end if;
  v_code := 'SKP'||upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.skieepay_invoices(invoice_code,order_id,customer_ref,amount,currency,status,payment_method,payment_payload,expires_at,business_id,mode)
  values(v_code,p_order_id,nullif(trim(p_customer_ref),''),p_amount,'IDR','pending','qris',p_payment_payload,now()+make_interval(mins=>p_expires_minutes),v_business_id,'test')
  returning * into v_invoice;
  insert into public.skieepay_ledger(invoice_id,entry_type,amount,reference,metadata)
  values(v_invoice.id,'payment_pending',p_amount,v_code,jsonb_build_object('source','skieepay-api','currency','IDR','mode','test'));
  return jsonb_build_object('ok',true,'invoice_id',v_invoice.id,'invoice_code',v_invoice.invoice_code,'amount',v_invoice.amount,
    'currency',v_invoice.currency,'status',v_invoice.status,'payment_method',v_invoice.payment_method,'mode',v_invoice.mode,
    'payment_payload',v_invoice.payment_payload,'created_at',v_invoice.created_at,'expires_at',v_invoice.expires_at);
end;
$function$;

create or replace function public.skieepay_create_invoice_mode(
  p_amount bigint, p_order_id uuid default null, p_customer_ref text default null,
  p_payment_method text default 'qris', p_payment_payload text default null,
  p_expires_minutes integer default 15, p_mode text default 'test'
) returns jsonb language plpgsql security definer set search_path=public as $function$
declare v_business_id uuid; v_invoice public.skieepay_invoices%rowtype; v_code text;
begin
  if p_amount is null or p_amount<1 then raise exception 'amount must be positive'; end if;
  if p_expires_minutes is null or p_expires_minutes<5 or p_expires_minutes>60 then raise exception 'expires_minutes must be between 5 and 60'; end if;
  if p_payment_method is distinct from 'qris' then raise exception 'only QRIS is supported'; end if;
  if p_mode not in ('test','live') then raise exception 'mode must be test or live'; end if;
  if p_mode='live' and not exists(select 1 from public.skieepay_provider_sessions where provider='skieepay_gopay_merchant') then
    raise exception 'SkieePay GoPay Merchant session is not connected';
  end if;
  select id into v_business_id from public.skieepay_businesses where code='skieepay' and status='active' limit 1;
  if v_business_id is null then raise exception 'SkieePay business is not active'; end if;
  v_code := 'SKP'||upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.skieepay_invoices(invoice_code,order_id,customer_ref,amount,currency,status,payment_method,payment_payload,expires_at,business_id,mode,payment_provider,fee_amount,unique_code,payer_amount,merchant_net_amount)
  values(v_code,p_order_id,nullif(trim(p_customer_ref),''),p_amount,'IDR','pending','qris',p_payment_payload,now()+make_interval(mins=>p_expires_minutes),v_business_id,p_mode,
    case when p_mode='live' then 'gopay_merchant' else 'sandbox' end,0,0,p_amount,case when p_mode='test' then p_amount else null end)
  returning * into v_invoice;
  insert into public.skieepay_ledger(invoice_id,entry_type,amount,reference,metadata)
  values(v_invoice.id,'payment_pending',p_amount,v_code,jsonb_build_object('source','skieepay-api','currency','IDR','mode',p_mode));
  return jsonb_build_object('ok',true,'invoice_id',v_invoice.id,'invoice_code',v_invoice.invoice_code,'amount',v_invoice.amount,
    'currency',v_invoice.currency,'status',v_invoice.status,'payment_method',v_invoice.payment_method,'mode',v_invoice.mode,
    'payment_payload',v_invoice.payment_payload,'created_at',v_invoice.created_at,'expires_at',v_invoice.expires_at);
end;
$function$;
