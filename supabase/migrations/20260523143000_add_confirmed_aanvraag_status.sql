alter table public.aanvragen
  drop constraint if exists aanvragen_status_check;

alter table public.aanvragen
  add constraint aanvragen_status_check
  check (status in ('pending', 'accepted', 'confirmed', 'declined', 'cancelled'));

alter table public.aanvragen
  add column if not exists confirmed_at timestamptz;
