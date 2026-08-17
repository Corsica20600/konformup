alter table public.training_sessions
  add column if not exists closure_status text not null default 'open',
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users(id) on delete set null,
  add column if not exists trainer_report text,
  add column if not exists administrative_observations text,
  add column if not exists final_registered_count integer not null default 0,
  add column if not exists final_present_count integer not null default 0,
  add column if not exists final_admitted_count integer not null default 0,
  add column if not exists final_not_admitted_count integer not null default 0,
  add column if not exists final_absent_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'training_sessions_closure_status_allowed'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_closure_status_allowed
      check (closure_status in ('open', 'ready', 'closed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'training_sessions_final_counts_positive'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_final_counts_positive
      check (
        final_registered_count >= 0
        and final_present_count >= 0
        and final_admitted_count >= 0
        and final_not_admitted_count >= 0
        and final_absent_count >= 0
      );
  end if;
end
$$;

alter table public.candidates
  add column if not exists sst_certificate_ref text,
  add column if not exists sst_certificate_obtained_at date,
  add column if not exists sst_certificate_expires_at date,
  add column if not exists forprev_registration_status text not null default 'non_applicable';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'candidates_forprev_registration_status_allowed'
  ) then
    alter table public.candidates
      add constraint candidates_forprev_registration_status_allowed
      check (forprev_registration_status in ('non_applicable', 'a_saisir', 'saisi', 'transmis', 'erreur'));
  end if;
end
$$;

create index if not exists idx_training_sessions_closure_status on public.training_sessions(closure_status);
create index if not exists idx_training_sessions_closed_by on public.training_sessions(closed_by);
create index if not exists idx_candidates_forprev_registration_status on public.candidates(forprev_registration_status);
