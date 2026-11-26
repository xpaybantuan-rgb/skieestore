-- Complete SKIEESTORE member, banner, Flash Sale and Duitku QRIS schema.
-- Safe to re-run against the existing production schema.

create table if not exists public.xpaypoint_store_settings (
 setting_key text primary key,
 setting_value jsonb not null default '{}'::jsonb,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
insert into public.xpaypoint_store_settings(setting_key,setting_value)
values('store_status','{"open":true}'::jsonb) on conflict(setting_key) do nothing;

create table if not exists public.site_banners (
 id uuid primary key default gen_random_uuid(),
 title text not null default '',
 image_path text not null,
 image_url text,
 target_url text,
 sort_order integer not null default 100,
 is_active boolean not null default true,
 aspect_ratio text not null default '16:9' check(aspect_ratio in ('16:9','2:1')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.xpaypoint_flash_sales (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.xpaypoint_products(id) on delete cascade,
 promo_price bigint not null check(promo_price>0),
 starts_at timestamptz not null default now(),
 ends_at timestamptz not null,
 is_active boolean not null default false,
 created_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 constraint xpaypoint_flash_sales_time_check check(ends_at>starts_at)
);
create table if not exists public.skieestore_membership_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 tier text not null check(tier in ('pass','vip','pro')),
 amount bigint not null check(amount>0),
 gateway text not null default 'unknown',
 gateway_reference text,
 status text not null default 'pending' check(status in ('pending','paid','failed','expired','refunded')),
 payment_id uuid references public.xpaypoint_payments(id) on delete set null,
 starts_at timestamptz,
 expires_at timestamptz,
 paid_at timestamptz,
 raw_data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 payment_type text not null default 'qris' check(payment_type in ('qris','wallet_deposit','snap','manual'))
);

alter table public.xpaypoint_orders add column if not exists base_price_snapshot bigint check(base_price_snapshot is null or base_price_snapshot>=0);
alter table public.xpaypoint_memberships add column if not exists member_expired_at timestamptz;
alter table public.xpaypoint_payments
 add column if not exists purpose text not null default 'topup',
 add column if not exists merchant_order_id text,
 add column if not exists membership_transaction_id uuid;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='xpaypoint_payments_purpose_check') then
  alter table public.xpaypoint_payments add constraint xpaypoint_payments_purpose_check check(purpose in ('topup','membership'));
 end if;
 if not exists(select 1 from pg_constraint where conname='xpaypoint_payments_membership_transaction_fkey') then
  alter table public.xpaypoint_payments add constraint xpaypoint_payments_membership_transaction_fkey foreign key(membership_transaction_id) references public.skieestore_membership_transactions(id) on delete set null;
 end if;
end $$;
create unique index if not exists xpaypoint_payments_merchant_order_id_uidx on public.xpaypoint_payments(merchant_order_id) where merchant_order_id is not null;
create index if not exists xpaypoint_payments_purpose_status_created_idx on public.xpaypoint_payments(purpose,status,created_at desc);
create index if not exists xpaypoint_payments_membership_transaction_idx on public.xpaypoint_payments(membership_transaction_id);
create index if not exists skieestore_membership_transactions_payment_id_idx on public.skieestore_membership_transactions(payment_id);
create index if not exists skieestore_membership_transactions_user_created_idx on public.skieestore_membership_transactions(user_id,created_at desc);
create index if not exists site_banners_sort_active_idx on public.site_banners(is_active,sort_order,created_at desc);
create index if not exists xpaypoint_flash_sales_active_window_idx on public.xpaypoint_flash_sales(is_active,starts_at,ends_at);

create table if not exists public.skieestore_user_notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 notification_type text not null default 'payment',
 title text not null,
 body text not null,
 metadata jsonb not null default '{}'::jsonb,
 read_at timestamptz,
 created_at timestamptz not null default now(),
 unique(user_id,event_key)
);
alter table public.skieestore_user_notifications enable row level security;
drop policy if exists "users read own skieestore notifications" on public.skieestore_user_notifications;
create policy "users read own skieestore notifications" on public.skieestore_user_notifications for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "users update own skieestore notifications" on public.skieestore_user_notifications;
create policy "users update own skieestore notifications" on public.skieestore_user_notifications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,update on public.skieestore_user_notifications to authenticated;
grant all on public.skieestore_user_notifications to service_role;
create index if not exists skieestore_user_notifications_user_created_idx on public.skieestore_user_notifications(user_id,created_at desc);
drop policy if exists "public active flash sales read" on public.xpaypoint_flash_sales;
drop policy if exists "users read own memberships" on public.xpaypoint_memberships;
create policy "users read own memberships" on public.xpaypoint_memberships for select to authenticated using ((select auth.uid())=user_id);
grant select on public.xpaypoint_memberships to authenticated;
grant select on public.xpaypoint_flash_sales,public.site_banners to anon,authenticated;
-- User-facing read policies and private admin write paths.
alter table public.site_banners enable row level security;
alter table public.xpaypoint_flash_sales enable row level security;
alter table public.skieestore_membership_transactions enable row level security;
alter table public.skieestore_user_notifications enable row level security;
drop policy if exists "site banners active public read" on public.site_banners;
drop policy if exists "site banners public active read" on public.site_banners;
create policy "site banners active public read" on public.site_banners for select to anon,authenticated using(is_active=true);
drop policy if exists "Public reads active flash sales" on public.xpaypoint_flash_sales;
drop policy if exists "public active flash sales read" on public.xpaypoint_flash_sales;
create policy "public active flash sales read" on public.xpaypoint_flash_sales for select to anon,authenticated using(is_active=true and starts_at<=now() and ends_at>now());
drop policy if exists "users read own memberships" on public.xpaypoint_memberships;
create policy "users read own memberships" on public.xpaypoint_memberships for select to authenticated using((select auth.uid())=user_id);
drop policy if exists "users read own membership transactions" on public.skieestore_membership_transactions;
create policy "users read own membership transactions" on public.skieestore_membership_transactions for select to authenticated using((select auth.uid())=user_id);
grant select on public.xpaypoint_memberships,public.skieestore_membership_transactions to authenticated;
grant select on public.site_banners,public.xpaypoint_flash_sales to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-banners','site-banners',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Public read SKIEESTORE banners" on storage.objects;
create policy "Public read SKIEESTORE banners" on storage.objects for select to anon,authenticated using(bucket_id='site-banners');
drop policy if exists "Admins upload SKIEESTORE banners" on storage.objects;
create policy "Admins upload SKIEESTORE banners" on storage.objects for insert to authenticated with check(bucket_id='site-banners' and exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Admins update SKIEESTORE banners" on storage.objects;
create policy "Admins update SKIEESTORE banners" on storage.objects for update to authenticated using(bucket_id='site-banners' and exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid()))) with check(bucket_id='site-banners' and exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Admins delete SKIEESTORE banners" on storage.objects;
create policy "Admins delete SKIEESTORE banners" on storage.objects for delete to authenticated using(bucket_id='site-banners' and exists(select 1 from public.xpaypoint_admins a where a.user_id=(select auth.uid())));

create or replace function public.sync_membership_expiry_columns()
returns trigger language plpgsql set search_path=public as $$
begin
 if tg_op='INSERT' then
  if new.member_expired_at is null then new.member_expired_at:=new.expires_at;
  elsif new.expires_at is null then new.expires_at:=new.member_expired_at; end if;
 elsif new.member_expired_at is distinct from old.member_expired_at then new.expires_at:=new.member_expired_at;
 elsif new.expires_at is distinct from old.expires_at then new.member_expired_at:=new.expires_at;
 else new.member_expired_at:=new.expires_at; end if;
 return new;
end $$;
drop trigger if exists sync_membership_expiry_columns on public.xpaypoint_memberships;
create trigger sync_membership_expiry_columns before insert or update on public.xpaypoint_memberships for each row execute function public.sync_membership_expiry_columns();

create or replace function public.apply_skieestore_checkout_rules()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare v_open boolean:=true;v_cost bigint:=0;v_member_tier text;v_member_expiry timestamptz;v_member_price bigint;v_promo bigint;
begin
 select coalesce((setting_value->>'open')::boolean,true) into v_open from public.xpaypoint_store_settings where setting_key='store_status';
 if not coalesce(v_open,true) then raise exception 'Toko sedang maintenance. Checkout sementara ditutup.' using errcode='P0001'; end if;
 if new.product_id is not null then
  select coalesce(p.base_price,0),p.sell_price,m.tier,coalesce(m.member_expired_at,m.expires_at)
  into v_cost,v_member_price,v_member_tier,v_member_expiry from public.xpaypoint_products p
  left join public.xpaypoint_memberships m on m.user_id=new.user_id where p.id=new.product_id;
  new.base_price_snapshot:=coalesce(new.base_price_snapshot,v_cost);
  if v_member_tier in ('pass','vip','pro') and v_member_expiry>now() then
   select nullif(metadata->'member_prices'->>v_member_tier,'')::bigint into v_member_price from public.xpaypoint_products where id=new.product_id;
  else v_member_price:=null; end if;
  select promo_price into v_promo from public.xpaypoint_flash_sales where product_id=new.product_id and is_active=true and starts_at<=now() and ends_at>now() order by updated_at desc limit 1;
  if v_member_price is not null then new.sell_price:=least(new.sell_price,v_member_price); end if;
  if v_promo is not null then new.sell_price:=least(new.sell_price,v_promo); end if;
  if new.sell_price<ceil(v_cost*1.007) then raise exception 'Harga produk tidak memenuhi batas modal dan MDR QRIS.' using errcode='P0001'; end if;
  new.payable_amount:=greatest(new.sell_price-coalesce(new.discount_xc,0),0);
 end if;
 return new;
end $$;
drop trigger if exists trg_skieestore_checkout_rules on public.xpaypoint_orders;
create trigger trg_skieestore_checkout_rules before insert on public.xpaypoint_orders for each row execute function public.apply_skieestore_checkout_rules();
create or replace function public.skieestore_apply_duitku_callback(
 p_merchant_order_id text,p_amount bigint,p_reference text,p_payload jsonb,p_paid_at timestamptz default now()
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_payment public.xpaypoint_payments%rowtype;v_order public.xpaypoint_orders%rowtype;v_membership public.skieestore_membership_transactions%rowtype;v_expiry timestamptz;
begin
 select * into v_payment from public.xpaypoint_payments where merchant_order_id=p_merchant_order_id and gateway='duitku' for update;
 if not found then raise exception 'DUITKU_PAYMENT_NOT_FOUND'; end if;
 if v_payment.amount<>p_amount then raise exception 'DUITKU_AMOUNT_MISMATCH'; end if;
 if v_payment.status='paid' then return jsonb_build_object('ok',true,'result','duplicate_event','payment_id',v_payment.id,'order_id',v_payment.order_id,'purpose',v_payment.purpose); end if;
 if v_payment.status<>'pending' then raise exception 'DUITKU_PAYMENT_NOT_PENDING'; end if;
 update public.xpaypoint_payments set status='paid',paid_at=coalesce(p_paid_at,now()),gateway_reference=coalesce(nullif(p_reference,''),gateway_reference),raw_callback=coalesce(p_payload,'{}'::jsonb),updated_at=now() where id=v_payment.id;
 if v_payment.purpose='membership' then
  select * into v_membership from public.skieestore_membership_transactions where payment_id=v_payment.id for update;
  if not found then raise exception 'MEMBERSHIP_TRANSACTION_NOT_FOUND'; end if;
  update public.skieestore_membership_transactions set status='paid',gateway='duitku',gateway_reference=coalesce(nullif(p_reference,''),gateway_reference),paid_at=coalesce(p_paid_at,now()),starts_at=now(),expires_at=now()+interval '30 days',updated_at=now(),raw_data=coalesce(raw_data,'{}'::jsonb)||jsonb_build_object('duitku_callback',coalesce(p_payload,'{}'::jsonb)) where id=v_membership.id;
  select case when coalesce(member_expired_at,expires_at)>now() then coalesce(member_expired_at,expires_at) else now() end into v_expiry from public.xpaypoint_memberships where user_id=v_membership.user_id;
  v_expiry:=coalesce(v_expiry,now())+interval '30 days';
  insert into public.xpaypoint_memberships(user_id,tier,starts_at,expires_at,member_expired_at,is_manual,updated_at)
  values(v_membership.user_id,v_membership.tier,now(),v_expiry,v_expiry,false,now())
  on conflict(user_id) do update set tier=excluded.tier,starts_at=excluded.starts_at,expires_at=excluded.expires_at,member_expired_at=excluded.member_expired_at,is_manual=false,updated_by=null,updated_at=now();
  insert into public.skieestore_user_notifications(user_id,event_key,notification_type,title,body,metadata)
  values(v_membership.user_id,'duitku-membership-paid:'||v_payment.id,'membership','Langganan SKIEE aktif','Pembayaran berhasil. Paket SKIEE '||upper(v_membership.tier)||' aktif sampai '||to_char(v_expiry at time zone 'Asia/Jakarta','DD Mon YYYY HH24:MI')||' WIB.',jsonb_build_object('tier',v_membership.tier,'expires_at',v_expiry,'payment_id',v_payment.id))
  on conflict(user_id,event_key) do nothing;
  return jsonb_build_object('ok',true,'result','membership_paid','payment_id',v_payment.id,'user_id',v_membership.user_id,'tier',v_membership.tier,'expires_at',v_expiry);
 end if;
 if v_payment.order_id is not null then
  update public.xpaypoint_orders set status='paid',updated_at=now() where id=v_payment.order_id returning * into v_order;
  if v_order.user_id is not null then
   insert into public.skieestore_user_notifications(user_id,event_key,notification_type,title,body,metadata)
   values(v_order.user_id,'duitku-topup-paid:'||v_payment.id,'payment','Pembayaran top up berhasil','Pembayaran pesanan '||v_order.order_code||' berhasil. Pesanan sedang diteruskan ke supplier.',jsonb_build_object('order_id',v_order.id,'order_code',v_order.order_code,'payment_id',v_payment.id,'amount',p_amount))
   on conflict(user_id,event_key) do nothing;
  end if;
 end if;
 return jsonb_build_object('ok',true,'result','topup_paid','payment_id',v_payment.id,'order_id',v_payment.order_id,'order_code',v_order.order_code);
end $$;
revoke all on function public.skieestore_apply_duitku_callback(text,bigint,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.skieestore_apply_duitku_callback(text,bigint,text,jsonb,timestamptz) to service_role;
