create table if not exists public.candidate_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  evaluation_type text not null default 'globale',
  status text not null default 'non_evalue',
  result text not null default 'non_renseigne',
  trainer_notes text,
  evaluated_at timestamptz,
  evaluated_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint candidate_evaluations_type_allowed check (evaluation_type in ('theorique', 'pratique', 'globale')),
  constraint candidate_evaluations_status_allowed check (status in ('non_evalue', 'en_cours', 'acquis', 'non_acquis', 'absent')),
  constraint candidate_evaluations_result_allowed check (result in ('admis', 'non_admis', 'absent', 'partiel', 'non_renseigne')),
  constraint candidate_evaluations_candidate_session_type_unique unique (candidate_id, session_id, evaluation_type)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'candidates_id_session_id_unique'
  ) then
    alter table public.candidates
      add constraint candidates_id_session_id_unique unique (id, session_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'candidate_evaluations_candidate_session_fkey'
  ) then
    alter table public.candidate_evaluations
      add constraint candidate_evaluations_candidate_session_fkey
      foreign key (candidate_id, session_id)
      references public.candidates(id, session_id)
      on update cascade
      on delete cascade;
  end if;
end
$$;

create index if not exists idx_candidate_evaluations_session_id on public.candidate_evaluations(session_id);
create index if not exists idx_candidate_evaluations_candidate_id on public.candidate_evaluations(candidate_id);
create index if not exists idx_candidate_evaluations_evaluated_by on public.candidate_evaluations(evaluated_by);

create or replace function public.can_access_candidate_evaluation(p_evaluation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.candidate_evaluations evaluation
      where evaluation.id = p_evaluation_id
        and public.can_access_session(evaluation.session_id)
        and public.can_access_candidate(evaluation.candidate_id)
    );
$$;

grant execute on function public.can_access_candidate_evaluation(uuid) to authenticated;

alter table public.candidate_evaluations enable row level security;

drop policy if exists candidate_evaluations_select_by_role on public.candidate_evaluations;
create policy candidate_evaluations_select_by_role
  on public.candidate_evaluations
  for select
  to authenticated
  using (public.can_access_candidate_evaluation(id));

drop policy if exists candidate_evaluations_insert_by_role on public.candidate_evaluations;
create policy candidate_evaluations_insert_by_role
  on public.candidate_evaluations
  for insert
  to authenticated
  with check (
    public.is_operational_manager()
    or (
      public.can_access_session(session_id)
      and public.can_access_candidate(candidate_id)
    )
  );

drop policy if exists candidate_evaluations_update_by_role on public.candidate_evaluations;
create policy candidate_evaluations_update_by_role
  on public.candidate_evaluations
  for update
  to authenticated
  using (public.can_access_candidate_evaluation(id))
  with check (
    public.is_operational_manager()
    or (
      public.can_access_session(session_id)
      and public.can_access_candidate(candidate_id)
    )
  );

drop policy if exists candidate_evaluations_delete_manager on public.candidate_evaluations;
create policy candidate_evaluations_delete_manager
  on public.candidate_evaluations
  for delete
  to authenticated
  using (public.is_operational_manager());
