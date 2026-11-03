-- Initialisation de la table utilisée par la wishlist Pokémon.
-- Ce fichier peut être exécuté dans le SQL Editor de Supabase.

create table if not exists public.wishlist (
  id integer primary key check (id > 0),
  name text not null check (btrim(name) <> ''),
  image text not null check (btrim(image) <> ''),
  types text[] not null default '{}'::text[],
  added_at timestamptz not null default timezone('utc', now())
);

create index if not exists wishlist_added_at_idx
  on public.wishlist (added_at desc);

-- La règle métier de l'application limite la wishlist à 6 Pokémon.
create or replace function public.enforce_wishlist_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Le verrou rend le contrôle fiable même en cas de deux insertions simultanées.
  perform pg_advisory_xact_lock(hashtext('public.wishlist:max-size'));

  if (select count(*) from public.wishlist) >= 6 then
    raise exception using
      errcode = 'check_violation',
      message = 'La wishlist est limitée à 6 Pokémon';
  end if;

  return new;
end;
$$;

drop trigger if exists wishlist_max_size on public.wishlist;

create trigger wishlist_max_size
before insert on public.wishlist
for each row
execute function public.enforce_wishlist_size();

-- L'application actuelle n'a pas encore de système d'authentification.
-- Ces politiques permettent donc au client anon de consulter et gérer la wishlist.
alter table public.wishlist enable row level security;

drop policy if exists "wishlist is readable" on public.wishlist;
create policy "wishlist is readable"
on public.wishlist
for select
to anon, authenticated
using (true);

drop policy if exists "wishlist items can be added" on public.wishlist;
create policy "wishlist items can be added"
on public.wishlist
for insert
to anon, authenticated
with check (true);

drop policy if exists "wishlist items can be removed" on public.wishlist;
create policy "wishlist items can be removed"
on public.wishlist
for delete
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, delete on table public.wishlist to anon, authenticated;

