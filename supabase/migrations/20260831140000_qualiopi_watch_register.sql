create table if not exists public.qualiopi_watch_entries (
  id uuid primary key default gen_random_uuid(),
  indicator smallint not null check (indicator in (23, 24, 25, 26)),
  topic text not null check (btrim(topic) <> ''),
  source_name text not null check (btrim(source_name) <> ''),
  source_url text not null check (source_url ~ '^https://'),
  consulted_on date not null,
  summary text not null check (btrim(summary) <> ''),
  impact text not null check (btrim(impact) <> ''),
  decision text not null check (btrim(decision) <> ''),
  evidence_url text null check (evidence_url is null or evidence_url ~ '^https://'),
  next_review_on date null,
  status text not null default 'to_review' check (status in ('to_review', 'action_required', 'applied', 'not_retained')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.qualiopi_watch_entries is 'Traceability register for Qualiopi indicators 23, 24, 25 and 26: source, analysis, decision and evidence.';
create index if not exists qualiopi_watch_entries_indicator_date_idx on public.qualiopi_watch_entries(indicator, consulted_on desc);

drop trigger if exists qualiopi_watch_entries_updated_at on public.qualiopi_watch_entries;
create trigger qualiopi_watch_entries_updated_at before update on public.qualiopi_watch_entries for each row execute function public.set_updated_at();

alter table public.qualiopi_watch_entries enable row level security;
create policy qualiopi_watch_entries_manager_read on public.qualiopi_watch_entries for select to authenticated using (public.is_operational_manager());
create policy qualiopi_watch_entries_manager_insert on public.qualiopi_watch_entries for insert to authenticated with check (public.is_operational_manager() and created_by = auth.uid());
create policy qualiopi_watch_entries_manager_update on public.qualiopi_watch_entries for update to authenticated using (public.is_operational_manager()) with check (public.is_operational_manager());
revoke all on table public.qualiopi_watch_entries from anon;
