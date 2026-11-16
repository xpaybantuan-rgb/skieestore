-- SkieePay sandbox foundation: isolated test invoices and safe payment simulation.
alter table public.skieepay_invoices
  add column if not exists mode text not null default 'test',
  add column if not exists payment_provider text,
  add column if not exists provider_reference text,
  add column if not exists fee_amount bigint not null default 0,
  add column if not exists unique_code bigint not null default 0,
  add column if not exists payer_amount bigint,
  add column if not exists merchant_net_amount bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skieepay_invoices_mode_check'
      and conrelid = 'public.skieepay_invoices'::regclass
  ) then
    alter table public.skieepay_invoices
      add constraint skieepay_invoices_mode_check check (mode in ('test','live'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'skieepay_invoices_fee_amount_check'
      and conrelid = 'public.skieepay_invoices'::regclass
  ) then
    alter table public.skieepay_invoices
      add constraint skieepay_invoices_fee_amount_check check (fee_amount >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'skieepay_invoices_unique_code_check'
      and conrelid = 'public.skieepay_invoices'::regclass
  ) then
    alter table public.skieepay_invoices
      add constraint skieepay_invoices_unique_code_check check (unique_code >= 0);
  end if;
end $$;

alter table public.skieepay_payment_events
  add column if not exists mode text not null default 'test';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skieepay_payment_events_mode_check'
      and conrelid = 'public.skieepay_payment_events'::regclass
  ) then
    alter table public.skieepay_payment_events
      add constraint skieepay_payment_events_mode_check check (mode in ('test','live'));
  end if;
end $$;

create index if not exists skieepay_invoices_mode_created_idx
  on public.skieepay_invoices(mode, created_at desc);

create or replace function public.skieepay_simulate_test_payment(
  p_invoice_code text,
  p_outcome text,
  p_event_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_invoice public.skieepay_invoices%rowtype;
  v_event_id text := coalesce(nullif(trim(p_event_id), ''), 'sbx_' || replace(gen_random_uuid()::text, '-', ''));
  v_now timestamptz := now();
begin
  if p_outcome not in ('paid','expired') then
    raise exception 'outcome must be paid or expired';
  end if;
  if nullif(trim(p_invoice_code), '') is null then
    raise exception 'invoice_code is required';
  end if;

  select * into v_invoice
  from public.skieepay_invoices
  where invoice_code = upper(trim(p_invoice_code))
  for update;

  if not found then
    return jsonb_build_object('ok',false,'reason','invoice_not_found');
  end if;
  if v_invoice.mode <> 'test' then
    raise exception 'sandbox simulation is only allowed for test invoices';
  end if;
  if v_invoice.status <> 'pending' then
    return jsonb_build_object('ok',true,'duplicate',true,'invoice_code',v_invoice.invoice_code,'status',v_invoice.status);
  end if;

  if p_outcome = 'paid' then
    if v_now > v_invoice.expires_at then
      return jsonb_build_object('ok',false,'reason','invoice_expired');
    end if;

    update public.skieepay_invoices
    set status = 'paid', paid_at = v_now, updated_at = v_now
    where id = v_invoice.id;

    insert into public.skieepay_payment_events(
      invoice_id, source, external_event_id, event_type, amount, payload, verified, mode
    ) values (
      v_invoice.id, 'sandbox_simulator', v_event_id, 'payment.paid', v_invoice.amount,
      jsonb_build_object('test',true,'simulated',true,'note','No real funds moved and no supplier fulfillment was triggered.'),
      true, 'test'
    ) on conflict (source, external_event_id) do nothing;

    insert into public.skieepay_ledger(invoice_id, entry_type, amount, reference, metadata)
    values (
      v_invoice.id, 'payment_confirmed', v_invoice.amount, v_event_id,
      jsonb_build_object('mode','test','source','sandbox_simulator')
    );

    return jsonb_build_object('ok',true,'simulated',true,'invoice_code',v_invoice.invoice_code,'status','paid','amount',v_invoice.amount);
  end if;

  update public.skieepay_invoices
  set status = 'expired', updated_at = v_now
  where id = v_invoice.id;

  insert into public.skieepay_payment_events(
    invoice_id, source, external_event_id, event_type, amount, payload, verified, mode
  ) values (
    v_invoice.id, 'sandbox_simulator', v_event_id, 'payment.expired', null,
    jsonb_build_object('test',true,'simulated',true,'note','Sandbox expiration simulation; no real funds moved.'),
    true, 'test'
  ) on conflict (source, external_event_id) do nothing;

  return jsonb_build_object('ok',true,'simulated',true,'invoice_code',v_invoice.invoice_code,'status','expired');
end;
$function$;

revoke all on function public.skieepay_simulate_test_payment(text,text,text) from public, anon, authenticated;
grant execute on function public.skieepay_simulate_test_payment(text,text,text) to service_role;
