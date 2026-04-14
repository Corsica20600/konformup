create table if not exists public.attendance_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  slot_label text not null,
  slot_date date not null,
  period text not null default 'custom',
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft',
  sent_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint attendance_slots_label_not_blank check (btrim(slot_label) <> ''),
  constraint attendance_slots_period_allowed check (period in ('morning', 'afternoon', 'custom')),
  constraint attendance_slots_status_allowed check (status in ('draft', 'sent', 'open', 'closed')),
  constraint attendance_slots_session_period_unique unique (session_id, slot_date, period)
);

create table if not exists public.attendance_responses (
  id uuid primary key default gen_random_uuid(),
  attendance_slot_id uuid not null references public.attendance_slots(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  response_token text not null unique,
  delivery_channel text not null default 'email',
  delivery_sent_at timestamptz,
  delivery_status text not null default 'pending',
  responded_at timestamptz,
  response_status text not null default 'pending',
  trainer_override_status text,
  trainer_overridden_at timestamptz,
  trainer_override_note text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint attendance_responses_delivery_channel_allowed check (delivery_channel in ('email', 'sms')),
  constraint attendance_responses_delivery_status_allowed check (delivery_status in ('pending', 'sent', 'failed')),
  constraint attendance_responses_response_status_allowed check (response_status in ('pending', 'present', 'absent', 'issue')),
  constraint attendance_responses_trainer_override_status_allowed check (
    trainer_override_status is null or trainer_override_status in ('pending', 'present', 'absent', 'issue')
  ),
  constraint attendance_responses_slot_candidate_unique unique (attendance_slot_id, candidate_id)
);

create index if not exists idx_attendance_slots_session_id on public.attendance_slots(session_id);
create index if not exists idx_attendance_responses_slot_id on public.attendance_responses(attendance_slot_id);
create index if not exists idx_attendance_responses_candidate_id on public.attendance_responses(candidate_id);
create index if not exists idx_attendance_responses_token on public.attendance_responses(response_token);

create or replace function public.get_attendance_response_by_token(p_token text)
returns table (
  response_id uuid,
  token text,
  slot_id uuid,
  slot_label text,
  slot_date date,
  session_id uuid,
  session_title text,
  session_location text,
  candidate_id uuid,
  candidate_name text,
  candidate_email text,
  response_status text,
  trainer_override_status text,
  responded_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ar.id as response_id,
    ar.response_token as token,
    ats.id as slot_id,
    ats.slot_label,
    ats.slot_date,
    ts.id as session_id,
    ts.title as session_title,
    ts.location as session_location,
    c.id as candidate_id,
    trim(c.first_name || ' ' || c.last_name) as candidate_name,
    c.email as candidate_email,
    ar.response_status,
    ar.trainer_override_status,
    ar.responded_at
  from public.attendance_responses ar
  join public.attendance_slots ats on ats.id = ar.attendance_slot_id
  join public.training_sessions ts on ts.id = ats.session_id
  join public.candidates c on c.id = ar.candidate_id
  where ar.response_token = p_token
  limit 1;
$$;

grant execute on function public.get_attendance_response_by_token(text) to anon, authenticated;

create or replace function public.confirm_attendance_response(
  p_token text,
  p_response_status text default 'present',
  p_ip text default null,
  p_user_agent text default null
)
returns table (
  response_id uuid,
  token text,
  slot_id uuid,
  slot_label text,
  slot_date date,
  session_id uuid,
  session_title text,
  session_location text,
  candidate_id uuid,
  candidate_name text,
  candidate_email text,
  response_status text,
  trainer_override_status text,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_response_status not in ('present', 'absent', 'issue') then
    raise exception 'invalid attendance response status';
  end if;

  update public.attendance_responses
  set
    response_status = p_response_status,
    responded_at = coalesce(responded_at, timezone('utc', now())),
    ip_address = coalesce(p_ip, ip_address),
    user_agent = coalesce(p_user_agent, user_agent),
    updated_at = timezone('utc', now())
  where response_token = p_token;

  return query
  select *
  from public.get_attendance_response_by_token(p_token);
end;
$$;

grant execute on function public.confirm_attendance_response(text, text, text, text) to anon, authenticated;
