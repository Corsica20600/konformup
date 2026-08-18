create table if not exists public.candidate_satisfaction_surveys (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  attendance_response_id uuid not null unique references public.attendance_responses(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_candidate_satisfaction_surveys_candidate_id on public.candidate_satisfaction_surveys(candidate_id);
alter table public.candidate_satisfaction_surveys enable row level security;

create policy candidate_satisfaction_surveys_manager_read
  on public.candidate_satisfaction_surveys for select to authenticated
  using (public.is_operational_manager() or public.can_access_candidate(candidate_id));

create policy candidate_satisfaction_surveys_manager_write
  on public.candidate_satisfaction_surveys for all to authenticated
  using (public.is_operational_manager()) with check (public.is_operational_manager());

create or replace function public.get_candidate_satisfaction_context(p_token text)
returns table (is_final_slot boolean, submitted boolean)
language sql security definer set search_path = public as $$
  select
    response.attendance_slot_id = (
      select latest.id from public.attendance_slots latest
      where latest.session_id = slot.session_id
      order by latest.slot_date desc, latest.ends_at desc nulls last, latest.created_at desc
      limit 1
    ) as is_final_slot,
    exists(select 1 from public.candidate_satisfaction_surveys survey where survey.attendance_response_id = response.id) as submitted
  from public.attendance_responses response
  join public.attendance_slots slot on slot.id = response.attendance_slot_id
  where response.response_token = p_token
  limit 1;
$$;

create or replace function public.submit_candidate_satisfaction_survey(p_token text, p_answers jsonb)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  response_row public.attendance_responses%rowtype;
  is_final boolean;
begin
  select response.* into response_row from public.attendance_responses response where response.response_token = p_token;
  if response_row.id is null then raise exception 'attendance response not found'; end if;
  select response_row.attendance_slot_id = (
    select slot.id from public.attendance_slots slot
    where slot.session_id = (select session_id from public.attendance_slots where id = response_row.attendance_slot_id)
    order by slot.slot_date desc, slot.ends_at desc nulls last, slot.created_at desc limit 1
  ) into is_final;
  if not is_final then raise exception 'satisfaction survey is only available for the final attendance slot'; end if;
  insert into public.candidate_satisfaction_surveys (candidate_id, session_id, attendance_response_id, answers, submitted_at, updated_at)
  values (response_row.candidate_id, (select session_id from public.attendance_slots where id = response_row.attendance_slot_id), response_row.id, coalesce(p_answers, '{}'::jsonb), timezone('utc', now()), timezone('utc', now()))
  on conflict (attendance_response_id) do update set answers = excluded.answers, submitted_at = excluded.submitted_at, updated_at = excluded.updated_at;
  return true;
end;
$$;

grant execute on function public.get_candidate_satisfaction_context(text) to anon, authenticated;
grant execute on function public.submit_candidate_satisfaction_survey(text, jsonb) to anon, authenticated;
