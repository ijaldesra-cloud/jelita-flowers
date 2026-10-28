-- ============================================================
-- JELITA PUTRA FLORIST — Skema Database Supabase (jalankan 1x)
-- Tempel seluruh isi file ini ke: Dashboard Supabase > SQL Editor > Run
-- ============================================================

-- ---------- TABLES ----------
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'admin' check (role in ('admin','owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id int generated always as identity primary key,
  slug text unique not null,
  name text not null,
  image_url text not null default ''
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id int references public.categories(id) on delete set null,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  description text not null default '',
  image_url text not null default '',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  stock integer not null default 99,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null default '',
  delivery_date date not null default current_date,
  delivery_note text not null default '',
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','menunggu_verifikasi','diproses','dikirim','selesai','dibatalkan')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  price numeric(12,2) not null default 0,
  qty integer not null default 1
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  bank_pengirim text not null default '',
  nama_pengirim text not null default '',
  transfer_time timestamptz,
  transfer_amount numeric(12,2) not null default 0,
  proof_url text not null default '',
  status text not null default 'menunggu' check (status in ('menunggu','terverifikasi','ditolak')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'order'
    check (type in ('order','bukti_transfer','verifikasi','produk','sistem')),
  title text not null,
  message text not null default '',
  order_code text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text not null default '',
  content text not null default '',
  image_url text not null default '',
  published_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1,
  rekening jsonb not null default '[]'::jsonb,
  whatsapp text not null default '6281234567890',
  store_hours text not null default '07.00 - 21.00 WIB',
  store_address text not null default 'Jl. Basuki Rahmat No.88, Sindangkasih, Purwakarta',
  updated_at timestamptz not null default now()
);

-- ---------- HELPER ----------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','owner')
  );
$$;

-- Buat otomatis profile saat admin/owner baru dibuat
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- TRIGGER NOTIFIKASI (untuk admin & owner, realtime) ----------
create or replace function public.notify_staff(p_type text, p_title text, p_message text, p_code text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (type, title, message, order_code) values (p_type, p_title, p_message, p_code);
end;
$$;

-- Pesanan baru → notif
create or replace function public.on_order_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_staff(
    'order',
    'Pesanan baru masuk 🎉',
    'Pesanan ' || new.code || ' atas nama ' || new.customer_name || ' — total Rp ' ||
      to_char(new.total, 'FM999,999,999') || '. Menunggu bukti transfer.',
    new.code
  );
  return new;
end;
$$;
drop trigger if exists trg_order_created on public.orders;
create trigger trg_order_created after insert on public.orders
  for each row when (new.status = 'pending') execute function public.on_order_created();

-- Bukti transfer diunggah → notif + ubah status pesanan
create or replace function public.on_payment_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  update public.orders set status = 'menunggu_verifikasi' where id = new.order_id and status = 'pending';
  select code, customer_name into o from public.orders where id = new.order_id;
  perform public.notify_staff(
    'bukti_transfer',
    'Bukti transfer diterima 📩',
    'Bukti transfer untuk ' || o.code || ' dari ' || new.nama_pengirim ||
      ' (' || new.bank_pengirim || ', Rp ' || to_char(new.transfer_amount, 'FM999,999,999') || '). Mohon diverifikasi.',
    o.code
  );
  return new;
end;
$$;
drop trigger if exists trg_payment_created on public.payments;
create trigger trg_payment_created after insert on public.payments
  for each row execute function public.on_payment_created();

-- Verifikasi / penolakan bukti → notif
create or replace function public.on_payment_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  if new.status is distinct from old.status then
    select code, customer_name into o from public.orders where id = new.order_id;
    if new.status = 'terverifikasi' then
      update public.orders set status = 'diproses' where id = new.order_id and status in ('pending','menunggu_verifikasi');
      perform public.notify_staff('verifikasi', 'Transfer diverifikasi ✅',
        'Pembayaran ' || o.code || ' diterima. Pesanan siap diproses.', o.code);
    elsif new.status = 'ditolak' then
      update public.orders set status = 'pending' where id = new.order_id and status in ('menunggu_verifikasi','diproses');
      perform public.notify_staff('verifikasi', 'Bukti transfer ditolak ❌',
        'Bukti ' || o.code || ' ditolak' || (case when new.note <> '' then ': ' || new.note else '' end), o.code);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_payment_status on public.payments;
create trigger trg_payment_status after update on public.payments
  for each row execute function public.on_payment_status();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.news enable row level security;
alter table public.settings enable row level security;

-- profiles: hanya staff yang boleh lihat; admin/owner menciptakan sendiri saat login
drop policy if exists "staff read profiles" on public.profiles;
create policy "staff read profiles" on public.profiles for select to authenticated using (is_staff());

drop policy if exists "all read categories" on public.categories;
create policy "all read categories" on public.categories for select using (true);
drop policy if exists "staff write categories" on public.categories;
create policy "staff write categories" on public.categories for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "all read products" on public.products;
create policy "all read products" on public.products for select using (true);
drop policy if exists "staff write products" on public.products;
create policy "staff write products" on public.products for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "all read orders" on public.orders;
create policy "all read orders" on public.orders for select using (true);
drop policy if exists "anon create orders" on public.orders;
create policy "anon create orders" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "all read items" on public.order_items;
create policy "all read items" on public.order_items for select using (true);
drop policy if exists "anon create items" on public.order_items;
create policy "anon create items" on public.order_items for insert to anon, authenticated with check (true);

drop policy if exists "all read payments" on public.payments;
create policy "all read payments" on public.payments for select using (true);
drop policy if exists "anon create payments" on public.payments;
create policy "anon create payments" on public.payments for insert to anon, authenticated with check (true);
drop policy if exists "staff update payments" on public.payments;
create policy "staff update payments" on public.payments for update to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "staff read notifs" on public.notifications;
create policy "staff read notifs" on public.notifications for select to authenticated using (is_staff());
drop policy if exists "staff update notifs" on public.notifications;
create policy "staff update notifs" on public.notifications for update to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "all read news" on public.news;
create policy "all read news" on public.news for select using (true);
drop policy if exists "staff write news" on public.news;
create policy "staff write news" on public.news for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "all read settings" on public.settings;
create policy "all read settings" on public.settings for select using (true);
drop policy if exists "staff write settings" on public.settings;
create policy "staff write settings" on public.settings for all to authenticated using (is_staff()) with check (is_staff());

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.notifications;

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('payments', 'payments', true, 5242880), ('products', 'products', true, 5242880)
on conflict (id) do nothing;

drop policy if exists "public read payments bucket" on storage.objects;
create policy "public read payments bucket" on storage.objects for select using (bucket_id in ('payments','products'));
drop policy if exists "upload payments bucket" on storage.objects;
create policy "upload payments bucket" on storage.objects for insert
  with check (bucket_id = 'payments');
drop policy if exists "staff upload products bucket" on storage.objects;
create policy "staff upload products bucket" on storage.objects for insert
  to authenticated with check (bucket_id = 'products');

-- ---------- SEED ----------
insert into public.settings (id, rekening, whatsapp) values
(1, '[
  {"bank":"BCA","number":"1234567890","name":"Jelita Putra Florist"},
  {"bank":"BRI","number":"098765432112345","name":"Jelita Putra Florist"},
  {"bank":"BNI","number":"0123456789","name":"Jelita Putra Florist"}
]'::jsonb, '6281234567890')
on conflict (id) do nothing;

insert into public.categories (slug, name, image_url) values
('fresh-flower-bouquet','Fresh Flower Bouquet','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-07-11/01KX7XTEYQQ1282M2DMG05ZNHQ.jpg'),
('artificial-bouquet','Artificial Bouquet','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3M6Z5M9MVJH3Q3B1C30TGV.jpg'),
('bunga-meja','Bunga Meja','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3M4GNFP9AT3XYPJKC3193C.jpg'),
('bunga-papan','Bunga Papan','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3KH364DRBNTC9PHGF032XV.jpg'),
('custom-bouquet','Custom Bouquet','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3KFJDYH4CF6AGE9S85KPRD.jpg'),
('standing-flower','Standing Flower','https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3H9E49QFJ7TY460P7QEPEC.jpg')
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, old_price, description, image_url, is_featured) values
('Red Romance Buket Mawar Segar','red-romance-buket-mawar-segar',
 (select id from public.categories where slug='fresh-flower-bouquet'), 250000, 300000,
 'Buket mawar merah segar pilihan dengan handbouquet premium. Cocok untuk anniversary, proposal & momen romantis.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-07-11/01KX7XTEYQQ1282M2DMG05ZNHQ.jpg', true),
('Sunshine Buket Sunflower','sunshine-buket-sunflower',
 (select id from public.categories where slug='fresh-flower-bouquet'), 200000, null,
 'Buket bunga matahari ceria dan tahan lama, dirangkai segar setiap hari.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-04-10/01KNTXZQ2ZT49K35HV12FAWSXM.jpg', false),
('Buket Wisuda Segar','buket-wisuda-segar',
 (select id from public.categories where slug='fresh-flower-bouquet'), 175000, 200000,
 'Paling favorit buat moment wisuda! Desain cantik, dapat personal message card.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YPGDCAPTYK67MBQ5FF4T4.png', true),
('Artificial Bouquet Elegan','artificial-bouquet-elegan',
 (select id from public.categories where slug='artificial-bouquet'), 150000, null,
 'Buket bunga sintetis premium, abadi & bebas perawatan. Tepat untuk dekorasi indoor dan kado.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3M6Z5M9MVJH3Q3B1C30TGV.jpg', true),
('Buket Uang Hias Lucu','buket-uang-hias-lucu',
 (select id from public.categories where slug='artificial-bouquet'), 185000, null,
 'Kombinasi buket bunga artificial dengan uang hias. Kado wisuda paling favorit!',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YS2QY5BWDDS65HK4W5NNF.png', false),
('Bunga Meja 008','bunga-meja-008',
 (select id from public.categories where slug='bunga-meja'), 350000, null,
 'Rangkaian bunga meja elegan untuk sudut ruangan & dekorasi acara formal.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3M4GNFP9AT3XYPJKC3193C.jpg', false),
('Bunga Meja 009','bunga-meja-009',
 (select id from public.categories where slug='bunga-meja'), 375000, null,
 'Rangkaian bunga meja premium untuk dekorasi meja kerja, resepsi & kantor.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3H6JGT07MBXH3M55EGP33F.jpg', false),
('Bunga Papan Duka Cita','bunga-papan-duka-cita',
 (select id from public.categories where slug='bunga-papan'), 1000000, null,
 'Karangan bunga papan ucapan duka cita dengan desain khidmat & penuh empati.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3KH364DRBNTC9PHGF032XV.jpg', false),
('Papan Wedding Congratulation','papan-wedding-congratulation',
 (select id from public.categories where slug='bunga-papan'), 1500000, null,
 'Karangan bunga papan untuk ucapan pernikahan. Termasuk tulisan nama & spanduk.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3M6Z5M9MVJH3Q3B1C30TGV.jpg', false),
('Papan Grand Opening','papan-grand-opening',
 (select id from public.categories where slug='bunga-papan'), 1250000, null,
 'Karangan bunga papan untuk peresmian usaha, grand opening & anniversary perusahaan.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3H9E49QFJ7TY460P7QEPEC.jpg', false),
('Standing Flower Merry Bloom','standing-flower-merry-bloom',
 (select id from public.categories where slug='standing-flower'), 750000, null,
 'Standing flower tinggi dengan pilihan pesan desain fully custom. Dilengkapi stiker nama brand.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3H7ZH9PY1RJ95M6QPH3N2R.jpg', false),
('Custom Buket Wisuda','custom-buket-wisuda',
 (select id from public.categories where slug='custom-bouquet'), 300000, null,
 'Buket custom sesuai request: warna, jenis bunga & topper. Kirim referensi desain kalian.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-06-27/01KW3KFJDYH4CF6AGE9S85KPRD.jpg', true),
('Wedding Series Elegan','wedding-series-elegan',
 (select id from public.categories where slug='custom-bouquet'), 450000, null,
 'Rangkaian dekorasi pernikahan: handbouquet pengantin, boutonniere & accent meja.',
 'https://tokobungapurwakarta.com/storage/products/thumbnail/2026-07-11/01KX7XTEYQQ1282M2DMG05ZNHQ.jpg', false),
('JPF S&S-001 Tote Bloom','jpf-ss-001-tote-bloom',
 (select id from public.categories where slug='custom-bouquet'), 210000, null,
 'Buket + tote bag premium kombinasi bunga fresh & buatan. Seri spesial Jelita Putra.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YM6PE1P3YCM8NC8KR5GMV.png', false)
on conflict (slug) do nothing;

insert into public.news (title, slug, excerpt, content, image_url) values
('Pilih Buket Wisuda - Jelita Putra','pilih-buket-wisuda',
 'Tips & rekomendasi memilih buket wisuda yang bergaya dan abadi untuk moment spesial kamu.',
 'Pilih buket wisuda yang sesuai dengan alma mater kamu! Kami punya koleksi terbaik dari buket segar sampai buket uang. Tips utama: sesuaikan warna buket dengan toga, pilih ukuran yang tidak berlebihan, dan jangan lupa personal message card agar lebih berkesan. Pesan minimal H-2 hari sebelum acara wisuda agar rangkaiannya maksimal.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YPGD3YT0KZHB97RQ5T59V.png'),
('10 Ide Hadiah Romantis Jelita Putra Purwakarta','10-ide-hadiah-romantis',
 'Dari buket mawar merah sampai standing flower surprise, 10 ide hadiah paling romantis tahun ini.',
 'Mau bikin dia terharu? Coba: 1) Buket mawar plus chocolate, 2) Standing flower di kantor/gedung, 3) Buket wisuda custom, 4) Bouquet abadi artificial, 5) Bunga meja untuk ruang kerjanya. Kami juga menerima pesanan custom untuk surprise kamu!',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YH942VTQQKXBQH9MFRTPH.png'),
('Makna Bunga Pink untuk Hadiah Spesial','makna-bunga-pink',
 'Bunga pink melambangkan kelembutan dan kekaguman. Temukan waktu terbaik memberikannya.',
 'Bunga pink punya makna kelembutan, kekaguman, dan hati yang tulus. Waktu yang pas untuk memberikan buket pink: saat minta maaf secara romantis, perayaan kelahiran, atau sekadar bikin mood si dia jadi cerah. Kombinasi mawar pink dengan lily juga hasilnya cantik.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-02-10/01KH2YF1Y2CRPBY3CY5XNAAM1D.png'),
('Cara Merawat Buket Bunga Agar Awet','cara-merawat-buket-bunga',
 'Karangan bunga segar bisa bertahan hingga 7 hari dengan tips perawatan dari bunga Jelita.',
 'Rahasia buket awet: potong pangkal batang 45° sebelum dimasukkan ke vas, ganti air setiap hari, jauhkan dari sinar matahari langsung, dan semprotkan tipis air pada kelopak. Untuk bunga papan dan standing flower di ruangan ber-AC, hindari langsung didekatkan ke kipas untuk mencegah dehidrasi.',
 'https://tokobungapurwakarta.com/storage/galleries/2026-01-29/01KG3XF5BR2MCY0DRHK3XFW0VH.png')
on conflict (slug) do nothing;

-- ============================================================
-- SELESAI. Selanjutnya buat akun login:
--   Dashboard > Authentication > Add user (email+password), lalu
--   jalankan di SQL Editor:
--     update public.profiles set role='owner' where id='<USER_ID_OWNER>';
-- (akun baru otomatis jadi 'admin' lewat trigger; ubah satu saja jadi owner)
-- ============================================================
