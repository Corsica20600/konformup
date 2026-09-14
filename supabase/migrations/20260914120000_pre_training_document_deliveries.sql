-- Traceable, idempotent delivery of the candidate dossier before a session.
create table if not exists public.pre_training_document_deliveries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete restrict,
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  delivery_kind text not null check (delivery_kind in ('documents_j5', 'reminder_j2')),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'skipped', 'error')),
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  technical_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(session_id, candidate_id, delivery_kind)
);

comment on table public.pre_training_document_deliveries is 'Automatic J-5 document and J-2 reminder deliveries for candidates.';
create index if not exists pre_training_document_deliveries_session_idx
  on public.pre_training_document_deliveries(session_id, candidate_id, delivery_kind);

drop trigger if exists pre_training_document_deliveries_updated_at on public.pre_training_document_deliveries;
create trigger pre_training_document_deliveries_updated_at
  before update on public.pre_training_document_deliveries
  for each row execute function public.set_updated_at();

alter table public.pre_training_document_deliveries enable row level security;
create policy pre_training_document_deliveries_read on public.pre_training_document_deliveries
  for select to authenticated using (public.can_access_session(session_id));
revoke all on public.pre_training_document_deliveries from anon;

-- The state transition is the lock: concurrent cron invocations cannot email twice.
create or replace function public.claim_pre_training_document_delivery(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.pre_training_document_deliveries
  set status = 'processing',
      attempt_count = attempt_count + 1,
      last_attempt_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = p_id and status in ('pending', 'error');
  return found;
end;
$$;
revoke all on function public.claim_pre_training_document_delivery(uuid) from public, anon, authenticated;
grant execute on function public.claim_pre_training_document_delivery(uuid) to service_role;
