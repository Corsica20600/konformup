alter table public.quotes
  add column if not exists training_type text not null default 'sst_initial',
  add column if not exists training_family text not null default 'sst',
  add column if not exists duration_hours numeric(5,2),
  add column if not exists prerequisites text,
  add column if not exists objectives text,
  add column if not exists programme_outline text,
  add column if not exists accessibility_details text,
  add column if not exists mac_previous_certificate_date date,
  add column if not exists mac_previous_certificate_ref text;

alter table public.training_sessions
  add column if not exists training_type text not null default 'sst_initial',
  add column if not exists training_family text not null default 'sst',
  add column if not exists prerequisites text,
  add column if not exists objectives text,
  add column if not exists programme_outline text,
  add column if not exists accessibility_details text,
  add column if not exists mac_previous_certificate_date date,
  add column if not exists mac_previous_certificate_ref text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotes_training_type_allowed'
      and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_training_type_allowed
      check (training_type in ('sst_initial', 'mac_sst', 'hygiene'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'training_sessions_training_type_allowed'
      and conrelid = 'public.training_sessions'::regclass
  ) then
    alter table public.training_sessions
      add constraint training_sessions_training_type_allowed
      check (training_type in ('sst_initial', 'mac_sst', 'hygiene'));
  end if;
end
$$;

update public.quotes
set training_family = case
  when training_type = 'hygiene' then 'hygiene'
  else 'sst'
end
where training_family is null
   or btrim(training_family) = '';

update public.training_sessions
set training_family = case
  when training_type = 'hygiene' then 'hygiene'
  else 'sst'
end
where training_family is null
   or btrim(training_family) = '';

create index if not exists idx_quotes_training_type on public.quotes(training_type);
create index if not exists idx_training_sessions_training_type on public.training_sessions(training_type);
