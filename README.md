# Qiza.id — Toko + Admin (Vercel + Supabase)

Toko publik dan panel admin dipisah menjadi **dua project Vercel** (origin berbeda, jadi celah XSS di toko tidak bisa membaca sesi admin).

```
store/            -> project Vercel #1 (toko publik)   Root Directory = store
admin/            -> project Vercel #2 (panel admin)   Root Directory = admin
shared/           sumber bersama (utils.js, config.js, style.css, tailwind.input.css)
supabase/schema.sql   tabel + RLS + fungsi create_order   (JALANKAN DI SUPABASE)
scripts/build.mjs     salin shared/* ke store & admin + kompilasi Tailwind
tests/                tes RLS (Postgres lokal) + tes unit/statis
scripts/pentest-browser.mjs   pentest di Chromium (XSS, CSP, alur beli & admin)
scripts/security-check.mjs    pentest non-destruktif ke Supabase ASLI kamu
```

## Setup (urut)

1. **Supabase → SQL Editor** → tempel seluruh `supabase/schema.sql` → Run (aman dijalankan ulang; policy lama yang longgar ikut dibersihkan).
2. **Authentication → Users → Add user** (centang *Auto Confirm*) untuk akun admin.
3. Daftarkan akun itu sebagai admin (ganti emailnya):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EMAIL_ADMIN_KAMU' on conflict do nothing;
   ```
4. **Authentication → Sign In / Providers** → matikan *Allow new users to sign up*. Disarankan aktifkan CAPTCHA dan MFA.
5. Deploy ke Vercel dua kali dari repo yang sama:
   - Project toko: Root Directory `store`, Framework *Other*, tanpa build command.
   - Project admin: Root Directory `admin` (mis. domain `admin.qiza.id`), Framework *Other*, tanpa build command.
6. Buka halaman admin → login → tab *Kelola Produk* → **Import 13 Produk Awal** (hanya menambah yang belum ada).
7. Ganti nomor rekening di `admin/assets/admin.js` (`STORE_PAYMENT_INFO`). Nilai `1234567890` hanya contoh.

Jika URL Supabase berubah, ubah di `shared/config.js` **dan** di `connect-src` pada `store/vercel.json` + `admin/vercel.json`, lalu `npm run build`.

## Mengubah kode

```
npm install        # sekali saja (Tailwind untuk build)
npm run build      # setelah mengubah shared/* atau menambah class Tailwind
npm test           # tes unit + audit statis
```
Tailwind dikompilasi ke `assets/tailwind.css` (bukan lagi CDN), sehingga CSP bisa ketat tanpa `unsafe-inline` / `unsafe-eval`.

## Kenapa harga dari admin sebelumnya tidak masuk / tidak muncul

1. `script.js` toko membandingkan URL Supabase dengan dirinya sendiri, hasilnya selalu "belum dikonfigurasi", sehingga toko **tidak pernah memanggil Supabase**.
2. Tanpa RLS yang benar, `update` oleh admin ditolak **tanpa error** (0 baris berubah) dan kode lama tetap menampilkan "berhasil". Sekarang admin memeriksa baris yang terdampak dan menampilkan pesan jelas.
3. Kolom harga di form admin memakai `step="500"`, sehingga harga seperti 8.750 diblokir validasi browser dan form tidak terkirim. Sekarang kelipatan 1.
4. `openDirectAdminChat()` dipakai di HTML tetapi tidak pernah didefinisikan (tombol WhatsApp mati). Sudah ditambahkan.

Perubahan harga tampil di toko saat halaman dimuat, saat tab dibuka kembali, dan saat keranjang dibuka. Jika database gagal dibaca, toko menampilkan pesan error dengan tombol *Coba Lagi*, bukan harga bawaan yang sudah basi.

## Keamanan yang diterapkan

- Harga dan total dihitung **di server** (fungsi `create_order`); harga dari browser diabaikan. Order tidak bisa di-INSERT langsung dari browser.
- RLS: pengunjung hanya bisa membaca produk yang tampil; hanya akun di tabel `admins` yang bisa menulis produk dan membaca/mengubah order (admin hanya bisa mengubah kolom `status`).
- Semua data dari database di-escape; URL logo wajib `https://`; class badge dan slug divalidasi (di browser dan di constraint database).
- CSP ketat, HSTS, X-Frame-Options DENY, nosniff; admin `noindex` + `no-store`.
- Rate limit per nomor WhatsApp di `create_order`.

## Hal yang masih perlu kamu lakukan

- Aktifkan CAPTCHA dan MFA di Supabase Auth (tidak bisa diatur dari kode).
- Jalankan `node scripts/security-check.mjs` dari komputermu setelah schema dijalankan; semua baris harus PASS.
- Rate limit di level jaringan (Vercel Firewall) bila toko mulai ramai; pembatasan di database hanya per nomor WA.
