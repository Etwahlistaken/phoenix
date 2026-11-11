-- Supabase > SQL Editor'e yapıştırıp bir kez çalıştırın.
create table if not exists public.records (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  collection text not null,
  id text not null,
  data jsonb not null,
  client_ts bigint not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

create or replace function public.records_touch() returns trigger
language plpgsql as $$
begin
  new.synced_at := now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
for each row execute function public.records_touch();

alter table public.records enable row level security;

drop policy if exists "own rows" on public.records;
create policy "own rows" on public.records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists records_sync_idx on public.records (user_id, synced_at);
