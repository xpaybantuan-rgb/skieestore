-- Disable the old VIPayment callback surface without deleting its historical records.
revoke all on function public.skieepay_apply_vipayment_callback(text,text,text,bigint,jsonb) from public, anon, authenticated, service_role;
revoke all on table public.skieepay_vipayment_events from anon, authenticated;
drop policy if exists "SkieePay owner can read VIPayment events" on public.skieepay_vipayment_events;
comment on table public.skieepay_vipayment_events is
  'Legacy historical callback records only. Active SkieePay runtime does not accept or process VIPayment callbacks.';
