#!/usr/bin/env node
/* Uji penetrasi NON-DESTRUKTIF terhadap proyek Supabase kamu, memakai hak akses
   pengunjung anonim (anon key) — persis seperti yang dimiliki penyerang.
   Jalankan SETELAH supabase/schema.sql dieksekusi:
       node scripts/security-check.mjs
   Butuh Node 18+. Tidak menulis/menghapus data apa pun. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cfg = readFileSync(join(here, '..', 'shared', 'config.js'), 'utf8');
const URL_ = (cfg.match(/SUPABASE_URL:\s*'([^']+)'/) || [])[1];
const KEY = (cfg.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/) || [])[1];
if (!URL_ || !KEY) { console.error('Tidak bisa membaca shared/config.js'); process.exit(2); }

const H = { apikey: KEY, 'Content-Type': 'application/json' };
let fail = 0;
const ok = (name, pass, detail = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!pass) fail++;
};
const call = async (method, path, body, extra = {}) => {
  const r = await fetch(`${URL_}${path}`, { method, headers: { ...H, ...extra }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
};
const denied = (r) => r.status === 401 || r.status === 403 || (r.status === 200 && Array.isArray(r.body) && r.body.length === 0);
const NOPE = '__pentest_nonexistent__';

// 1. Data sensitif tidak boleh bocor
let r = await call('GET', '/rest/v1/orders?select=*&limit=5');
ok('anon TIDAK bisa membaca tabel orders (data pembeli)', denied(r), `HTTP ${r.status}`);
r = await call('GET', '/rest/v1/admins?select=*');
ok('anon TIDAK bisa membaca tabel admins', denied(r), `HTTP ${r.status}`);

// 2. Anon tidak boleh menulis produk (ubah harga!)
r = await call('POST', '/rest/v1/products', { slug: NOPE, name: 'x', category: 'editing', category_label: 'x', variants: [] }, { Prefer: 'return=representation' });
ok('anon TIDAK bisa INSERT produk', r.status === 401 || r.status === 403, `HTTP ${r.status}`);
r = await call('PATCH', `/rest/v1/products?slug=eq.${NOPE}`, { name: 'hacked' }, { Prefer: 'return=representation' });
ok('anon TIDAK bisa UPDATE produk/harga', r.status === 401 || r.status === 403, `HTTP ${r.status}`);
r = await call('DELETE', `/rest/v1/products?slug=eq.${NOPE}`, null, { Prefer: 'return=representation' });
ok('anon TIDAK bisa DELETE produk', r.status === 401 || r.status === 403, `HTTP ${r.status}`);

// 3. Anon tidak boleh menyisipkan order langsung (harus lewat create_order)
r = await call('POST', '/rest/v1/orders', { order_code: NOPE, buyer_name: 'x', buyer_wa: '628123456789', items: [], total: 1 }, { Prefer: 'return=minimal' });
ok('anon TIDAK bisa INSERT order langsung (bypass harga)', r.status === 401 || r.status === 403, `HTTP ${r.status}`);

// 4. Katalog publik tetap terbaca & tidak membocorkan produk tersembunyi
r = await call('GET', '/rest/v1/products?select=slug,is_visible');
ok('katalog publik bisa dibaca', r.status === 200 && Array.isArray(r.body), `HTTP ${r.status}, ${Array.isArray(r.body) ? r.body.length : '?'} baris`);
ok('anon hanya melihat produk is_visible=true', Array.isArray(r.body) && r.body.every(p => p.is_visible === true));

// 5. RPC create_order: validasi di server (tidak membuat order)
r = await call('POST', '/rest/v1/rpc/create_order', { p_name: '', p_wa: '628123456789', p_email: '', p_payment: 'DANA', p_note: '', p_items: [{ slug: NOPE, variant_id: 'x', qty: 1 }] });
ok('create_order menolak nama kosong', r.status >= 400 && JSON.stringify(r.body).includes('invalid_name'), `HTTP ${r.status}`);
r = await call('POST', '/rest/v1/rpc/create_order', { p_name: 'Tester', p_wa: '628123456789', p_email: '', p_payment: 'BITCOIN', p_note: '', p_items: [{ slug: NOPE, variant_id: 'x', qty: 1 }] });
ok('create_order menolak metode bayar palsu', r.status >= 400 && JSON.stringify(r.body).includes('invalid_payment'), `HTTP ${r.status}`);
r = await call('POST', '/rest/v1/rpc/create_order', { p_name: 'Tester', p_wa: '628123456789', p_email: '', p_payment: 'DANA', p_note: '', p_items: [{ slug: NOPE, variant_id: 'x', qty: 999 }] });
ok('create_order menolak qty tidak wajar', r.status >= 400 && JSON.stringify(r.body).includes('invalid_qty'), `HTTP ${r.status}`);
r = await call('POST', '/rest/v1/rpc/create_order', { p_name: 'Tester', p_wa: '628123456789', p_email: '<script>', p_payment: 'DANA', p_note: '', p_items: [{ slug: NOPE, variant_id: 'x', qty: 1 }] });
ok('create_order menolak email berisi tag HTML', r.status >= 400 && JSON.stringify(r.body).includes('invalid_email'), `HTTP ${r.status}`);
r = await call('POST', '/rest/v1/rpc/create_order', { p_name: 'Tester', p_wa: '628123456789', p_email: '', p_payment: 'DANA', p_note: '', p_items: [{ slug: NOPE, variant_id: 'x', qty: 1 }] });
ok('create_order menolak produk yang tidak ada', r.status >= 400 && JSON.stringify(r.body).includes('product_unavailable'), `HTTP ${r.status}`);

// 6. is_admin untuk anon harus false
r = await call('POST', '/rest/v1/rpc/is_admin', {});
ok('is_admin() = false untuk anon', r.status === 200 && r.body === false, `HTTP ${r.status}`);

// 7. Pendaftaran publik harus dimatikan
r = await call('POST', '/auth/v1/signup', { email: `pentest-${Date.now()}@example.invalid`, password: 'Pentest-12345678!' });
const signupBlocked = r.status >= 400 || (r.body && r.body.error_code);
ok('signup publik DIMATIKAN (Auth → Providers → Allow new users to sign up = off)', signupBlocked, `HTTP ${r.status}`);

console.log(`\n${fail === 0 ? 'SEMUA LOLOS ✔' : fail + ' PEMERIKSAAN GAGAL ✘ — perbaiki sebelum go-live'}`);
process.exit(fail ? 1 : 0);
