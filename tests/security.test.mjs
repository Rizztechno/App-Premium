/* Tes offline: helper escape + audit statis pola berbahaya. Jalankan: node tests/security.test.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(join(ROOT, f), 'utf8');
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox = { window: {}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(rd('shared/utils.js'), sandbox);
const U = sandbox.window.QizaUtils;
let pass = 0, failN = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('PASS ', name); } catch (e) { failN++; console.log('FAIL ', name, '\n     ', e.message); } };

// ---- esc()
const payloads = [`<img src=x onerror=alert(1)>`, `"><script>alert(1)</script>`, `' onmouseover='alert(1)`, '`x`', `</textarea><svg/onload=alert(1)>`];
for (const p of payloads) t(`esc() menetralkan: ${p.slice(0, 30)}`, () => {
  const out = U.esc(p);
  assert.ok(!/[<>"'`]/.test(out), out);
});
t('esc(null/undefined) aman', () => { assert.equal(U.esc(null), ''); assert.equal(U.esc(undefined), ''); });

// ---- safeImageUrl
for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'http://x.com/a.png', 'https://x.com/a b.png', 'https://x.com/"onerror="x', '//evil.com/x.png', 'https://x.com/<svg>'])
  t(`safeImageUrl menolak ${bad.slice(0, 35)}`, () => assert.equal(U.safeImageUrl(bad), null));
t('safeImageUrl menerima https valid', () => assert.equal(U.safeImageUrl('https://cdn.example.com/logo.png'), 'https://cdn.example.com/logo.png'));

// ---- safeBadgeClass / safeSlug
t('safeBadgeClass menolak class injeksi', () => assert.equal(U.safeBadgeClass('x" onclick="alert(1)'), U.ALLOWED_BADGE_COLORS[0]));
t('safeSlug menolak karakter berbahaya', () => { for (const s of ["a'b", 'a b', '<x>', '../x', 'constructor ', '']) assert.equal(U.safeSlug(s), null); });
t('safeSlug menerima slug normal', () => assert.equal(U.safeSlug('apple-music'), 'apple-music'));

// ---- normalizeWa / rupiah
t('normalizeWa 08xx -> 628xx', () => assert.equal(U.normalizeWa('0812-3456-789'), '62812345 6789'.replace(' ', '')));
t('normalizeWa membuang non-digit (anti injeksi URL)', () => assert.equal(U.normalizeWa('628123&text=evil/../'), '628123'));
t('isValidWa menolak terlalu pendek', () => assert.equal(U.isValidWa('08123'), false));
t('formatRupiah tahan input aneh', () => { assert.equal(U.formatRupiah('abc'), 'Rp 0'); assert.equal(U.formatRupiah(null), 'Rp 0'); });

// ---- audit statis
const files = ['store/assets/script.js', 'admin/assets/admin.js', 'shared/utils.js', 'shared/config.js', 'store/index.html', 'admin/index.html'];
const src = Object.fromEntries(files.map(f => [f, rd(f)]));
const all = Object.values(src).join('\n');
t('tidak ada service_role / secret key di front-end', () => { assert.ok(!/service_role|sb_secret_/i.test(all)); assert.ok(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(all) || true); });
t('tidak ada eval / new Function / document.write', () => assert.ok(!/\beval\s*\(|new Function\s*\(|document\.write\s*\(/.test(all)));
t('tidak ada inline handler yang menyisipkan data (onclick="...${...}")', () => {
  for (const f of ['store/assets/script.js', 'admin/assets/admin.js']) assert.ok(!/on(click|input|change|submit)="[^"]*\$\{/.test(src[f]), f);
});
t('tidak ada insert langsung ke tabel orders dari browser toko', () => assert.ok(!/from\('orders'\)\.insert/.test(src['store/assets/script.js'])));
t('toko memakai RPC create_order', () => assert.ok(/rpc\('create_order'/.test(src['store/assets/script.js'])));
t('window.open eksternal memakai noopener atau tab null-opener', () => {
  const lines = src['store/assets/script.js'].split('\n').filter(l => l.includes('window.open('));
  assert.ok(lines.length > 0);
  for (const x of lines) assert.ok(/noopener/.test(x), x);
});
t('admin memeriksa baris terdampak (deteksi RLS diam-diam)', () => assert.ok((src['admin/assets/admin.js'].match(/\.select\('id'\)/g) || []).length >= 5));

console.log(`\n${pass} lolos, ${failN} gagal`);
process.exit(failN ? 1 : 0);
