-- Store the AES-256-GCM master key in Supabase Vault; never expose it to browser clients.
do $$
begin
  if not exists (select 1 from vault.secrets where name='skieepay_gopay_master_key') then
    perform vault.create_secret(
      encode(gen_random_bytes(32),'hex'),
      'skieepay_gopay_master_key',
      'SkieePay GoPay Merchant session encryption key'
    );
  end if;
end $$;

create or replace function public.skieepay_get_gopay_master_key()
returns text
language sql
security definer
set search_path = public, vault
as $function$
  select decrypted_secret
  from vault.decrypted_secrets
  where name='skieepay_gopay_master_key'
  order by created_at desc
  limit 1;
$function$;

revoke all on function public.skieepay_get_gopay_master_key() from public, anon, authenticated;
grant execute on function public.skieepay_get_gopay_master_key() to service_role;
