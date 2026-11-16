-- Align RPC-generated invoice codes with the public invoice lookup route.
create or replace function public.skieepay_create_invoice(
  p_amount bigint,
  p_order_id uuid default null,
  p_customer_ref text default null,
  p_payment_method text default 'qris',
  p_payment_payload text default null,
  p_expires_minutes integer default 15
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

  select id into v_business_id from public.skieepay_businesses
  where code = 'xpaypoint' and status = 'active' limit 1;
  if v_business_id is null then raise exception 'SKIEESTORE business is not active'; end if;

  v_code := 'SKP' || upper(replace(gen_random_uuid()::text, '-', ''));

  insert into public.skieepay_invoices(
    invoice_code, order_id, customer_ref, amount, currency, status,
    payment_method, payment_payload, expires_at, business_id, mode
  ) values (
    v_code, p_order_id, nullif(trim(p_customer_ref), ''), p_amount, 'IDR', 'pending',
    'qris', p_payment_payload, now() + make_interval(mins => p_expires_minutes), v_business_id, 'test'
  ) returning * into v_invoice;

  insert into public.skieepay_ledger(invoice_id, entry_type, amount, reference, metadata)
  values (v_invoice.id, 'payment_pending', p_amount, v_code,
          jsonb_build_object('source','skieepay-api','currency','IDR','mode','test'));

  return jsonb_build_object(
    'ok', true, 'invoice_id', v_invoice.id, 'invoice_code', v_invoice.invoice_code,
    'amount', v_invoice.amount, 'currency', v_invoice.currency,
    'status', v_invoice.status, 'payment_method', v_invoice.payment_method,
    'mode', v_invoice.mode, 'payment_payload', v_invoice.payment_payload,
    'created_at', v_invoice.created_at, 'expires_at', v_invoice.expires_at
  );
end;
$function$;
