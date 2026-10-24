-- Run this once in Supabase SQL Editor.
-- The public client may INSERT valid emails only. It cannot SELECT the list.
create extension if not exists pgcrypto;

create table public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    char_length(trim(email)) between 5 and 254
    and email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
  ),
  role text not null default 'player'
    check (role in ('player', 'scout', 'club')),
  created_at timestamptz not null default now()
);

alter table public.launch_waitlist enable row level security;
revoke all on public.launch_waitlist from anon, authenticated;
grant insert on public.launch_waitlist to anon, authenticated;

drop policy if exists "Public can join launch waitlist" on public.launch_waitlist;
create policy "Public can join launch waitlist"
  on public.launch_waitlist
  for insert
  to anon, authenticated
  with check (
    char_length(trim(email)) between 5 and 254
    and role in ('player', 'scout', 'club')
  );

-- Intentionally do not create a public SELECT policy. Protect collected email addresses.
