import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migrationUrl = new URL(
  "../supabase/migrations/20260922000000_initial_schema.sql",
  import.meta.url,
);
const testUrl = new URL("../supabase/tests/initial_schema_test.sql", import.meta.url);

const bootstrapSql = String.raw`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create schema extensions;

  create table auth.users (
    id uuid primary key
  );

  create function auth.uid()
  returns uuid
  language sql
  stable
  set search_path = ''
  as $$
    select nullif(
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
      ''
    )::uuid;
  $$;

  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

const db = new PGlite();

try {
  await db.exec(bootstrapSql);
  const migration = (await readFile(migrationUrl, "utf8")).replace(
    /^create extension if not exists pgcrypto with schema extensions;$/m,
    "-- pgcrypto is provided by Supabase; PGlite has built-in gen_random_uuid()",
  );
  await db.exec(migration);
  await db.exec(await readFile(testUrl, "utf8"));
  console.log("Database migration and rollback tests passed.");
} finally {
  await db.close();
}
