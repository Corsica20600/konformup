alter table public.attendance_responses
  add column if not exists satisfaction_delivery_status text not null default 'pending',
  add column if not exists satisfaction_delivery_sent_at timestamptz,
  add column if not exists satisfaction_delivery_error_at timestamptz;

alter table public.attendance_responses
  drop constraint if exists attendance_responses_satisfaction_delivery_status_allowed;

alter table public.attendance_responses
  add constraint attendance_responses_satisfaction_delivery_status_allowed
  check (satisfaction_delivery_status in ('pending', 'sent', 'failed'));
