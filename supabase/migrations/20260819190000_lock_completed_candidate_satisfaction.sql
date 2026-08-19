-- A satisfaction survey is final at its first public submission.  The existing
-- unique constraint on attendance_response_id is the concurrency guard: exactly
-- one insert wins, and later submissions return false without changing the row.
create or replace function public.submit_candidate_satisfaction_survey(p_token text, p_answers jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  response_row public.attendance_responses%rowtype;
  is_final boolean;
begin
  select response.*
    into response_row
  from public.attendance_responses response
  where response.response_token = p_token;

  if response_row.id is null then
    raise exception 'invalid satisfaction survey context';
  end if;

  select response_row.attendance_slot_id = (
    select slot.id
    from public.attendance_slots slot
    where slot.session_id = (
      select session_id
      from public.attendance_slots
      where id = response_row.attendance_slot_id
    )
    order by slot.slot_date desc, slot.ends_at desc nulls last, slot.created_at desc
    limit 1
  ) into is_final;

  if not coalesce(is_final, false) then
    raise exception 'satisfaction survey is not available';
  end if;

  insert into public.candidate_satisfaction_surveys (
    candidate_id,
    session_id,
    attendance_response_id,
    answers,
    submitted_at,
    updated_at
  )
  values (
    response_row.candidate_id,
    (select session_id from public.attendance_slots where id = response_row.attendance_slot_id),
    response_row.id,
    coalesce(p_answers, '{}'::jsonb),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (attendance_response_id) do nothing;

  -- FOUND is true only for the winning insert. No completed row is updated.
  return found;
end;
$$;

grant execute on function public.submit_candidate_satisfaction_survey(text, jsonb) to anon, authenticated;
