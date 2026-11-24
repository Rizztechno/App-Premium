-- Tes RLS + create_order. Dijalankan oleh tests/run-rls-test.sh pada Postgres lokal
-- dengan tiruan lingkungan Supabase (role anon/authenticated, auth.uid()).
\set ON_ERROR_STOP off
\pset format unaligned
\pset tuples_only on

create temp table results(name text, pass boolean, detail text);
grant all on results to public;

create or replace function pg_temp.t(p_name text, p_pass boolean, p_detail text default '') returns void
language sql as $$ insert into results values (p_name, p_pass, p_detail) $$;

-- helper: jalankan SQL sebagai role tertentu, kembalikan 'OK:<rows>' atau 'ERR:<pesan>'
create or replace function pg_temp.try(p_role text, p_sub text, p_sql text) returns text
language plpgsql as $$
declare n int; res text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub,''), true);
  execute 'set local role ' || p_role;
  begin
    if p_sql ~* '^\s*select' then
      execute 'select count(*) from (' || p_sql || ') q' into n;
    else
      execute p_sql; get diagnostics n = row_count;
    end if;
    res := 'OK:' || n;
  exception when others then
    res := 'ERR:' || sqlerrm;
  end;
  reset role;
  return res;
end $$;

-- ---------- data awal (sebagai superuser) ----------
insert into auth.users(id,email) values
  ('11111111-1111-1111-1111-111111111111','admin@qiza.test'),
  ('22222222-2222-2222-2222-222222222222','biasa@qiza.test');
insert into public.admins(user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.products(slug,name,category,category_label,badge_color,variants,is_visible,is_ready) values
 ('canva','Canva Pro','editing','Desain','bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  '[{"id":"canva-1m","label":"1 Bulan","price":8000},{"id":"canva-1y","label":"1 Tahun","price":25000}]',true,true),
 ('hidden-app','Rahasia','editing','x',null,'[{"id":"h1","label":"x","price":1000}]',false,true),
 ('habis','Habis','music','x',null,'[{"id":"h2","label":"x","price":1000}]',true,false);
insert into public.orders(order_code,buyer_name,buyer_wa,items,total) values ('QZA-SEED0001','Seed','6281111111111','[]',0);

-- ---------- ANON ----------
select pg_temp.t('anon: SELECT products hanya yang visible',
  pg_temp.try('anon',null,'select 1 from public.products') = 'OK:2', pg_temp.try('anon',null,'select 1 from public.products'));
select pg_temp.t('anon: TIDAK bisa melihat produk tersembunyi',
  pg_temp.try('anon',null,$q$select 1 from public.products where slug='hidden-app'$q$) = 'OK:0');
select pg_temp.t('anon: TIDAK bisa UPDATE harga',
  pg_temp.try('anon',null,$q$update public.products set variants='[{"id":"canva-1m","label":"x","price":1}]' where slug='canva'$q$) like 'ERR:%', pg_temp.try('anon',null,$q$update public.products set name='h' where slug='canva'$q$));
select pg_temp.t('anon: TIDAK bisa INSERT produk',
  pg_temp.try('anon',null,$q$insert into public.products(slug,name,category,category_label,variants) values ('x','x','editing','x','[]')$q$) like 'ERR:%');
select pg_temp.t('anon: TIDAK bisa DELETE produk',
  pg_temp.try('anon',null,$q$delete from public.products where slug='canva'$q$) like 'ERR:%');
select pg_temp.t('anon: TIDAK bisa membaca orders',
  pg_temp.try('anon',null,'select 1 from public.orders') like 'ERR:%', pg_temp.try('anon',null,'select 1 from public.orders'));
select pg_temp.t('anon: TIDAK bisa INSERT orders langsung',
  pg_temp.try('anon',null,$q$insert into public.orders(order_code,buyer_name,buyer_wa,items,total) values ('X1','x','628111111111','[]',1)$q$) like 'ERR:%');
select pg_temp.t('anon: TIDAK bisa UPDATE orders',
  pg_temp.try('anon',null,$q$update public.orders set status='approved'$q$) like 'ERR:%');
select pg_temp.t('anon: TIDAK bisa membaca admins',
  pg_temp.try('anon',null,'select 1 from public.admins') like 'ERR:%');
select pg_temp.t('anon: is_admin() = false',
  pg_temp.try('anon',null,'select public.is_admin() where public.is_admin() = false') = 'OK:1');

-- ---------- USER LOGIN TAPI BUKAN ADMIN ----------
select pg_temp.t('non-admin: UPDATE harga memengaruhi 0 baris / ditolak',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$update public.products set name='hack' where slug='canva'$q$) in ('OK:0') or
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$update public.products set name='hack' where slug='canva'$q$) like 'ERR:%');
select pg_temp.t('non-admin: INSERT produk ditolak',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$insert into public.products(slug,name,category,category_label,variants) values ('y','y','editing','y','[]')$q$) like 'ERR:%');
select pg_temp.t('non-admin: DELETE produk 0 baris / ditolak',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$delete from public.products where slug='canva'$q$) in ('OK:0') or
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$delete from public.products where slug='canva'$q$) like 'ERR:%');
select pg_temp.t('non-admin: orders tidak terbaca (0 baris)',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222','select 1 from public.orders') = 'OK:0');
select pg_temp.t('non-admin: TIDAK bisa menambah diri ke admins',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222',$q$insert into public.admins values ('22222222-2222-2222-2222-222222222222')$q$) like 'ERR:%');
select pg_temp.t('non-admin: is_admin() = false',
  pg_temp.try('authenticated','22222222-2222-2222-2222-222222222222','select 1 where public.is_admin() = false') = 'OK:1');

-- ---------- ADMIN ----------
select pg_temp.t('admin: is_admin() = true',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111','select 1 where public.is_admin()') = 'OK:1');
select pg_temp.t('admin: melihat SEMUA produk (termasuk tersembunyi)',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111','select 1 from public.products') = 'OK:3');
select pg_temp.t('admin: UPDATE harga berhasil (1 baris)',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set variants='[{"id":"canva-1m","label":"1 Bulan","price":9000},{"id":"canva-1y","label":"1 Tahun","price":25000}]' where slug='canva'$q$) = 'OK:1',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set name='Canva Pro' where slug='canva'$q$));
select pg_temp.t('admin: INSERT produk berhasil',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$insert into public.products(slug,name,category,category_label,variants) values ('baru','Baru','music','x','[{"id":"b1","label":"1 Bln","price":5000}]')$q$) = 'OK:1');
select pg_temp.t('admin: harga negatif ditolak trigger',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set variants='[{"id":"a","label":"x","price":-5}]' where slug='canva'$q$) like 'ERR:%invalid_variants%');
select pg_temp.t('admin: harga pecahan/teks ditolak trigger',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set variants='[{"id":"a","label":"x","price":"1000"}]' where slug='canva'$q$) like 'ERR:%invalid_variants%');
select pg_temp.t('admin: harga > 10 juta ditolak',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set variants='[{"id":"a","label":"x","price":99999999}]' where slug='canva'$q$) like 'ERR:%invalid_variants%');
select pg_temp.t('admin: slug berbahaya ditolak constraint',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$insert into public.products(slug,name,category,category_label,variants) values ('a'';x','x','music','x','[]')$q$) like 'ERR:%');
select pg_temp.t('admin: class badge sembarang ditolak',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set badge_color='x" onclick="alert(1)' where slug='canva'$q$) like 'ERR:%');
select pg_temp.t('admin: image_url javascript: ditolak',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.products set image_url='javascript:alert(1)' where slug='canva'$q$) like 'ERR:%');
select pg_temp.t('admin: membaca orders',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111','select 1 from public.orders') = 'OK:1');
select pg_temp.t('admin: ubah status order OK',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.orders set status='approved' where order_code='QZA-SEED0001'$q$) = 'OK:1');
select pg_temp.t('admin: status sembarang ditolak',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.orders set status='lunas-palsu' where order_code='QZA-SEED0001'$q$) like 'ERR:%');
select pg_temp.t('admin: TIDAK bisa mengubah total/buyer di order (hanya kolom status)',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$update public.orders set total=1 where order_code='QZA-SEED0001'$q$) like 'ERR:%');
select pg_temp.t('admin: TIDAK bisa DELETE orders',
  pg_temp.try('authenticated','11111111-1111-1111-1111-111111111111',$q$delete from public.orders$q$) like 'ERR:%');

-- ---------- create_order (anon) ----------
create or replace function pg_temp.co(p_name text, p_wa text, p_email text, p_pay text, p_note text, p_items text, p_exp int default null) returns text
language plpgsql as $$
declare r jsonb;
begin
  execute 'set local role anon';
  begin
    select public.create_order(p_name,p_wa,p_email,p_pay,p_note,p_items::jsonb,p_exp) into r;
    reset role; return 'OK:' || r::text;
  exception when others then reset role; return 'ERR:' || sqlerrm;
  end;
end $$;

select pg_temp.t('create_order: sukses, total dihitung SERVER (9000x2=18000)',
  pg_temp.co('Budi','08123456789','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":2}]') like 'OK:%"total": 18000%',
  pg_temp.co('Budi2','08123456780','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":2}]'));
select pg_temp.t('create_order: harga dari browser diabaikan (expected_total salah -> price_changed)',
  pg_temp.co('Budi','08123456781','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]', 8000) like 'ERR:%price_changed%');
select pg_temp.t('create_order: produk tersembunyi ditolak',
  pg_temp.co('Budi','08123456782','','DANA','', '[{"slug":"hidden-app","variant_id":"h1","qty":1}]') like 'ERR:%product_unavailable%');
select pg_temp.t('create_order: stok habis ditolak',
  pg_temp.co('Budi','08123456783','','DANA','', '[{"slug":"habis","variant_id":"h2","qty":1}]') like 'ERR:%product_unavailable%');
select pg_temp.t('create_order: varian palsu ditolak',
  pg_temp.co('Budi','08123456784','','DANA','', '[{"slug":"canva","variant_id":"gratis","qty":1}]') like 'ERR:%variant_unavailable%');
select pg_temp.t('create_order: qty 0 / 11 / negatif / non-angka ditolak',
  pg_temp.co('Budi','08123456785','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":0}]') like 'ERR:%invalid_qty%'
  and pg_temp.co('Budi','08123456785','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":11}]') like 'ERR:%invalid_qty%'
  and pg_temp.co('Budi','08123456785','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":-1}]') like 'ERR:%invalid_qty%'
  and pg_temp.co('Budi','08123456785','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":"1; drop table"}]') like 'ERR:%invalid_qty%');
select pg_temp.t('create_order: nama berisi <script> / URL / newline ditolak',
  pg_temp.co('<script>alert(1)</script>','08123456786','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_name%'
  and pg_temp.co('Klik http://evil.com','08123456786','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_name%'
  and pg_temp.co(E'Budi\n*TRANSFER KE 123*','08123456786','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_name%');
select pg_temp.t('create_order: email/catatan/metode bayar/WA tidak valid ditolak',
  pg_temp.co('Budi','08123456787','a@b','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_email%'
  and pg_temp.co('Budi','08123456787','','BITCOIN','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_payment%'
  and pg_temp.co('Budi','08123456787','','DANA','<b>x</b>', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_note%'
  and pg_temp.co('Budi','123','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]') like 'ERR:%invalid_wa%');
select pg_temp.t('create_order: items bukan array / kosong / >20 ditolak',
  pg_temp.co('Budi','08123456788','','DANA','', '{"a":1}') like 'ERR:%invalid_items%'
  and pg_temp.co('Budi','08123456788','','DANA','', '[]') like 'ERR:%invalid_items%'
  and pg_temp.co('Budi','08123456788','','DANA','', (select jsonb_agg(jsonb_build_object('slug','canva','variant_id','canva-1m','qty',1))::text from generate_series(1,21))) like 'ERR:%invalid_items%');
select pg_temp.t('create_order: SQL injection di slug/variant tidak berefek',
  pg_temp.co('Budi','08123456789','','DANA','', $j$[{"slug":"canva'; drop table public.orders;--","variant_id":"x","qty":1}]$j$) like 'ERR:%product_unavailable%'
  and to_regclass('public.orders') is not null);

-- rate limit per nomor WA: 5 order / 10 menit
do $$ declare i int; r text; begin
  for i in 1..5 loop
    r := pg_temp.co('Spam','08999000111','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]');
  end loop;
  r := pg_temp.co('Spam','08999000111','','DANA','', '[{"slug":"canva","variant_id":"canva-1m","qty":1}]');
  perform pg_temp.t('create_order: rate limit per nomor WA (order ke-6 ditolak)', r like 'ERR:%rate_limited%', r);
end $$;

-- order tercatat dengan harga server & status pending
select pg_temp.t('order tersimpan: status pending & harga snapshot dari server',
  (select count(*) from public.orders where buyer_name='Budi' and total=18000 and status='pending') >= 1);

-- ---------- fungsi: hak eksekusi ----------
select pg_temp.t('anon TIDAK bisa memanggil validate_variants/set_updated_at sebagai RPC langsung',
  not has_function_privilege('anon','public.validate_variants()','execute')
  and not has_function_privilege('authenticated','public.set_updated_at()','execute'));

\pset format aligned
select case when pass then 'PASS' else 'FAIL' end || '  ' || name || case when pass then '' else '   <= ' || coalesce(detail,'') end from results order by pass, name;
select 'RINGKASAN: ' || count(*) filter (where pass) || ' lolos, ' || count(*) filter (where not pass) || ' gagal' from results;
