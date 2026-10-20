create table if not exists public.empire_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null check (char_length(company_name) between 2 and 40),
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.empire_saves enable row level security;

revoke all on public.empire_saves from anon;
grant select, insert, update, delete on public.empire_saves to authenticated;

drop policy if exists "Players can read their own empire" on public.empire_saves;
create policy "Players can read their own empire"
  on public.empire_saves for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own empire" on public.empire_saves;
create policy "Players can create their own empire"
  on public.empire_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own empire" on public.empire_saves;
create policy "Players can update their own empire"
  on public.empire_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can delete their own empire" on public.empire_saves;
create policy "Players can delete their own empire"
  on public.empire_saves for delete to authenticated
  using ((select auth.uid()) = user_id);
