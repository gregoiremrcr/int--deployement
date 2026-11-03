-- Historique des migrations appliquées par scripts/migrate.mjs.
create table if not exists public.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default timezone('utc', now())
);
