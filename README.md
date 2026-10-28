# 🌹 Jelita Putra Florist — Toko Bunga Online Purwakarta

Website toko bunga modern (React + Vite + Tailwind v4 + Supabase + PWA) yang diadopsi dari
tokobungapurwakarta.com dengan desain lebih elegan, lengkap dengan:

- 🛍️ Katalog produk + kategori, keranjang, dan checkout
- 💳 Pembayaran **transfer bank** → pengirim isi **nama/bank pengirim, tanggal & jam transfer, nominal, dan foto bukti transfer** (upload langsung ke Supabase Storage)
- 🔔 **Notifikasi realtime** (Supabase Realtime + toast + bell + Web Notification) untuk **admin & owner** saat ada pesanan masuk & bukti transfer diunggah/diverifikasi
- 🔐 Login **admin & owner** (role-based: laporan & pengaturan khusus owner)
- 📊 Dashboard, kelola pesanan (verifikasi bukti, ubah status), kelola produk/kategori/berita, laporan omzet
- 📲 **PWA** — bisa di-install di HP (manifest + service worker + icon toko)
- 📍 Lacak pesanan by kode, berita & galeri karya

---

## 🚀 Setup (sekali, ±5 menit)

1. **Jalankan skema database**
   - Buka [Supabase Dashboard](https://supabase.com/dashboard) → pilih project → **SQL Editor**
   - Tempel seluruh isi `supabase/schema.sql` → **Run**
   - Ini otomatis membuat tabel, RLS, trigger notifikasi, bucket storage, dan **seed data produk/kategori/berita** (foto asli dari toko)

2. **Kredensial Supabase**
   Sudah otomatis terbaca dari file `.env` project ini (mendukung `SUPABASE_URL`/`SUPABASE_ANON_KEY`,
   `VITE_`-prefixed, maupun `NEXT_PUBLIC_`). Jika gagal, banner peringatan akan tampil di aplikasi.

3. **Buat akun login admin & owner**
   ```bash
   node scripts/create-users.mjs
   ```
   Default akan dibuat: `owner@jelitaputra.id` / `OwnerJelita123!` dan `admin@jelitaputra.id` / `AdminJelita123!`
   (bisa diganti lewat argumen). **Butuh** `SUPABASE_SERVICE_ROLE_KEY` di `.env` — ambil di
   *Supabase Dashboard > Settings > API > service_role key*, taruh di `.env` lalu hapus lagi setelah selesai.
   
   Alternatif manual: *Authentication > Add user > Create new user* (email+password), lalu di SQL Editor:
   ```sql
   update public.profiles set role='owner' where id='<USER_ID_OWNER>';
   ```
   (akun baru otomatis jadi `admin` lewat trigger; ubah satu saja jadi owner)

4. **Jalankan**
   ```bash
   npm run dev       # http://localhost:5173
   npm run build     # build produksi ke dist/
   ```

---

## ⛏️ Alur Pembelian

1. Pelanggan pilih produk → keranjang → **Checkout** (nama, WA, alamat, tanggal kirim)
2. Pesanan dibuat (kode otomatis, contoh `JPF-20261028-ABCD`) → admin & owner **langsung dapat notifikasi**
3. Pelanggan diarahkan ke halaman **Pembayaran**: transfer ke rekening toko, isi bank & nama pengirim,
   **tanggal + jam transfer**, nominal, dan **upload screenshot bukti**
4. Bukti masuk → notifikasi kedua → admin klik **Verifikasi** / **Tolak** di *Admin > Pesanan*
5. Status berubah otomatis (pending → menunggu_verifikasi → diproses → dikirim → selesai),
   pelanggan bisa pantau di **/lacak** dengan kode pesanannya

> ⚠️ **Ganti nomor rekening** di *Admin > Pengaturan* (login owner) menggunakan rekening asli toko —
> nilai seed masih placeholder.

## 🧱 Struktur

```
supabase/schema.sql      ← skema DB (jalankan di SQL Editor)
scripts/create-users.mjs ← buat akun admin/owner
src/lib/                 ← supabase client, format, hooks realtime
src/context/             ← auth & cart
src/components/site/     ← navbar, footer, product card, WA float
src/pages/               ← toko (Home, Produk, Bayar, ...)
src/pages/admin/         ← dashboard staff (Pesanan, Produk, Laporan, ...)
public/                  ← manifest PWA, service worker, ikon (dari logo toko)
```

## 🔒 Catatan Keamanan

RLS sudah diaktifkan: anon hanya bisa membaca produk/kategori/berita dan membuat pesanan;
perubahan data proses & verifikasi hanya untuk login staff. Bucket `payments` memperbolehkan
upload anonim (untuk bukti transfer pelanggan tanpa login) dengan batas ukuran 5 MB.
