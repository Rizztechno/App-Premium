#!/usr/bin/env bash
# Menjalankan supabase/schema.sql + tests/rls-test.sql di Postgres LOKAL sementara
# (tiruan Supabase: role anon/authenticated + auth.uid()). Butuh binary Postgres 14+.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-$(dirname "$(ls /usr/lib/postgresql/*/bin/postgres 2>/dev/null | sort -V | tail -1)")}
[ -x "$PGBIN/postgres" ] || { echo "Postgres tidak ditemukan (set PGBIN)"; exit 2; }
WORK=$(mktemp -d); PORT=${PGPORT:-54329}
if [ "$(id -u)" = 0 ]; then chown postgres "$WORK"; RUN=(runuser -u postgres --); else RUN=(); fi
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust -U postgres >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
PSQL=("${RUN[@]}" psql -h "$WORK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -d postgres -c "create database t" >/dev/null
"${PSQL[@]}" -d t >/dev/null <<'SQL'
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- tiruan default privileges Supabase: semua role API boleh apa saja di public (yang lalu dicabut oleh schema.sql)
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
SQL
echo "== Menjalankan schema.sql (kali 1) =="; "${PSQL[@]}" -d t < "${SCHEMA:-supabase/schema.sql}" >/dev/null
echo "== Menjalankan schema.sql (kali 2: uji idempotent) =="; "${PSQL[@]}" -d t < "${SCHEMA:-supabase/schema.sql}" >/dev/null && echo "OK"
echo "== Uji keamanan RLS & create_order =="
"${RUN[@]}" psql -h "$WORK" -p "$PORT" -U postgres -d t -q -f tests/rls-test.sql | tee "$WORK/out.txt"
! grep -q '^FAIL' "$WORK/out.txt"
