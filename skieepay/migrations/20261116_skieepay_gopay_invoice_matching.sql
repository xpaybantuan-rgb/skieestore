-- Mode-aware invoice creation and atomic GoPay transaction matching.
create or replace function public.skieepay_create_invoice_mode(
  p_amount bigint,
  p_order_id uuid default null,
  p_customer_ref text default null,
  p_payment_method text default 'qris',
  p_payment_payload text default null,
  p_expires_minutes integer default 15,
  p_mode text default 'test'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_business_id uuid;
  v_invoice public.skieepay_invoices%rowtype;
  v_code text;
begin
  if p_amount is null or p_amount < 1 then raise exception 'amount must be positive'; end if;
  if p_expires_minutes is null or p_expires_minutes < 5 or p_expires_minutes > 60 then
    raise exception 'expires_minutes must be between 5 and 60';
  end if;
  if p_payment_method is distinct from 'qris' then raise exception 'only QRIS is supported'; end if;
  if p_mode not in ('test','live') then raise exception 'mode must be test or live'; end if;
  if p_mode='live' and not exists(select 1 from public.skieepay_provider_sessions where provider='gopay_merchant') then
    raise exception 'GoPay Merchant session is not connected';
  end if;

  select id into v_business_id from public.skieepay_businesses
  where code='xpaypoint' and status='active' limit 1;
  if v_business_id is null then raise exception 'SKIEESTORE business is not active'; end if;

  v_code := 'SKP' || upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.skieepay_invoices(
    invoice_code,order_id,customer_ref,amount,currency,status,payment_method,payment_payload,
    expires_at,business_id,mode,payment_provider,fee_amount,unique_code,payer_amount,merchant_net_amount
  ) values (
    v_code,p_order_id,nullif(trim(p_customer_ref),''),p_amount,'IDR','pending','qris',p_payment_payload,
    now()+make_interval(mins=>p_expires_minutes),v_business_id,p_mode,
    case when p_mode='live' then 'gopay_merchant' else 'sandbox' end,
    0,0,p_amount,p_amount
  ) returning * into v_invoice;

  insert into public.skieepay_ledger(invoice_id,entry_type,amount,reference,metadata)
  values(v_invoice.id,'payment_pending',p_amount,v_code,jsonb_build_object('source','skieepay-api','currency','IDR','mode',p_mode));

  return jsonb_build_object('ok',true,'invoice_id',v_invoice.id,'invoice_code',v_invoice.invoice_code,
    'amount',v_invoice.amount,'currency',v_invoice.currency,'status',v_invoice.status,
    'payment_method',v_invoice.payment_method,'mode',v_invoice.mode,'payment_payload',v_invoice.payment_payload,
    'created_at',v_invoice.created_at,'expires_at',v_invoice.expires_at);
end;
$function$;

revoke all on function public.skieepay_create_invoice_mode(bigint,uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.skieepay_create_invoice_mode(bigint,uuid,text,text,text,integer,text) to service_role;

create or replace function public.skieepay_apply_gopay_payment(
  p_invoice_code text,
  p_transaction_id text,
  p_amount bigint,
  p_transaction_time timestamptz,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_invoice public.skieepay_invoices%rowtype;
  v_claim_id uuid;
begin
  if nullif(trim(p_transaction_id),'') is null or p_amount is null or p_amount < 1 or p_transaction_time is null then
    raise exception 'transaction details are incomplete';
  end if;

  select * into v_invoice from public.skieepay_invoices
  where invoice_code=upper(trim(p_invoice_code)) for update;
  if not found then return jsonb_build_object('ok',false,'reason','invoice_not_found'); end if;
  if v_invoice.mode <> 'live' then raise exception 'GoPay matching is only allowed for live invoices'; end if;
  if v_invoice.status <> 'pending' then
    return jsonb_build_object('ok',true,'duplicate',true,'invoice_code',v_invoice.invoice_code,'status',v_invoice.status);
  end if;
  if v_invoice.amount <> p_amount then return jsonb_build_object('ok',false,'reason','amount_mismatch'); end if;
  if p_transaction_time < v_invoice.created_at - interval '5 minutes'
     or p_transaction_time > v_invoice.expires_at + interval '5 minutes' then
    return jsonb_build_object('ok',false,'reason','transaction_outside_invoice_window');
  end if;

  insert into public.skieepay_provider_transaction_claims(provider,external_transaction_id,invoice_id,amount,transaction_time)
  values('gopay_merchant',p_transaction_id,v_invoice.id,p_amount,p_transaction_time)
  on conflict(provider,external_transaction_id) do nothing
  returning id into v_claim_id;
  if v_claim_id is null then return jsonb_build_object('ok',false,'reason','transaction_already_claimed'); end if;

  update public.skieepay_invoices
  set status='paid',paid_at=p_transaction_time,provider_reference=p_transaction_id,
      payment_provider='gopay_merchant',fee_amount=0,unique_code=0,
      payer_amount=amount,merchant_net_amount=amount,updated_at=now()
  where id=v_invoice.id;

  insert into public.skieepay_payment_events(
    invoice_id,source,external_event_id,event_type,amount,payload,verified,mode
  ) values (
    v_invoice.id,'gopay_private',p_transaction_id,'payment.paid',p_amount,
    coalesce(p_payload,'{}'::jsonb),true,'live'
  ) on conflict(source,external_event_id) do nothing;

  insert into public.skieepay_ledger(invoice_id,entry_type,amount,reference,metadata)
  values(v_invoice.id,'payment_confirmed',p_amount,p_transaction_id,
    jsonb_build_object('mode','live','source','gopay_merchant','fee_amount',0,'unique_code',0));

  return jsonb_build_object('ok',true,'invoice_code',v_invoice.invoice_code,'status','paid',
    'amount',p_amount,'provider_reference',p_transaction_id,'paid_at',p_transaction_time);
end;
$function$;

revoke all on function public.skieepay_apply_gopay_payment(text,text,bigint,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.skieepay_apply_gopay_payment(text,text,bigint,timestamptz,jsonb) to service_role;

create index if not exists skieepay_pending_live_invoices_idx
  on public.skieepay_invoices(expires_at,created_at) where mode='live' and status='pending';
