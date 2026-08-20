-- Durable MAC SST reminders and immutable session archive manifests.
-- This migration is additive: it never moves, renames or removes an existing document.

create table if not exists public.mac_sst_reminders (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete restrict,
  reference_session_id uuid not null references public.training_sessions(id) on delete restrict,
  certificate_end_date date not null,
  mac_due_date date not null,
  reminder_kind text not null check (reminder_kind in ('month_22', 'month_23')),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'error', 'skipped')),
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  brevo_message_id text,
  technical_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(candidate_id, reference_session_id, reminder_kind, recipient_email)
);
comment on table public.mac_sst_reminders is 'Idempotent MAC SST renewal reminder deliveries. Candidate email is used only when it is already present in the candidate record.';
create index if not exists mac_sst_reminders_candidate_idx on public.mac_sst_reminders(candidate_id, created_at desc);
create index if not exists mac_sst_reminders_reference_idx on public.mac_sst_reminders(reference_session_id, reminder_kind);

create table if not exists public.mac_sst_reminder_attempts (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.mac_sst_reminders(id) on delete restrict,
  status text not null check (status in ('pending', 'processing', 'sent', 'error', 'skipped')),
  attempted_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  brevo_message_id text,
  technical_error text
);
comment on table public.mac_sst_reminder_attempts is 'Append-only attempt history for MAC SST reminders.';
create index if not exists mac_sst_reminder_attempts_reminder_idx on public.mac_sst_reminder_attempts(reminder_id, attempted_at desc);

drop trigger if exists mac_sst_reminders_updated_at on public.mac_sst_reminders;
create trigger mac_sst_reminders_updated_at before update on public.mac_sst_reminders for each row execute function public.set_updated_at();

alter table public.mac_sst_reminders enable row level security;
alter table public.mac_sst_reminder_attempts enable row level security;
create policy mac_sst_reminders_read on public.mac_sst_reminders for select to authenticated using (public.can_access_session(reference_session_id));
create policy mac_sst_reminder_attempts_read on public.mac_sst_reminder_attempts for select to authenticated using (
  exists (select 1 from public.mac_sst_reminders reminder where reminder.id = reminder_id and public.can_access_session(reminder.reference_session_id))
);
revoke all on public.mac_sst_reminders from anon;
revoke all on public.mac_sst_reminder_attempts from anon;

-- The state transition is the delivery lock: concurrent cron invocations cannot both send one reminder.
create or replace function public.claim_mac_sst_reminder(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.mac_sst_reminders
  set status = 'processing', attempt_count = attempt_count + 1, last_attempt_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = p_id and status in ('pending', 'error');
  return found;
end;
$$;
grant execute on function public.claim_mac_sst_reminder(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('session-archives', 'session-archives', false)
on conflict (id) do update set public = false;

create table if not exists public.session_archives (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete restrict,
  version integer not null check (version > 0),
  previous_archive_id uuid references public.session_archives(id) on delete restrict,
  status text not null default 'building' check (status in ('building', 'complete', 'partial', 'error')),
  manifest_version text not null default '1',
  manifest jsonb not null default '{}'::jsonb,
  manifest_hash text,
  storage_bucket text not null default 'session-archives' check (storage_bucket = 'session-archives'),
  manifest_storage_path text unique,
  missing_items jsonb not null default '[]'::jsonb,
  error_summary text,
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(session_id, version),
  constraint session_archives_complete_integrity check (
    status <> 'complete' or (archived_at is not null and manifest_hash is not null and manifest_storage_path is not null)
  )
);
comment on table public.session_archives is 'Immutable, versioned session archive manifests. Existing files stay in their original private storage locations.';
create index if not exists session_archives_session_idx on public.session_archives(session_id, version desc);
drop trigger if exists session_archives_updated_at on public.session_archives;
create trigger session_archives_updated_at before update on public.session_archives for each row execute function public.set_updated_at();

alter table public.training_sessions add column if not exists archive_status text not null default 'none';
alter table public.training_sessions add column if not exists archived_at timestamptz;
alter table public.training_sessions add column if not exists archived_by uuid references auth.users(id) on delete set null;
alter table public.training_sessions add column if not exists current_archive_id uuid references public.session_archives(id) on delete set null;
alter table public.training_sessions drop constraint if exists training_sessions_archive_status_allowed;
alter table public.training_sessions add constraint training_sessions_archive_status_allowed check (archive_status in ('none', 'building', 'complete', 'partial', 'error'));
alter table public.training_sessions drop constraint if exists training_sessions_closure_status_allowed;
alter table public.training_sessions add constraint training_sessions_closure_status_allowed check (closure_status in ('open', 'ready', 'closed', 'archived'));

alter table public.session_archives enable row level security;
create policy session_archives_read on public.session_archives for select to authenticated using (public.can_access_session(session_id));
create policy session_archives_insert on public.session_archives for insert to authenticated with check (public.can_access_session(session_id) and archived_by = auth.uid());
create policy session_archives_update_unfinished on public.session_archives for update to authenticated using (public.can_access_session(session_id) and status <> 'complete') with check (public.can_access_session(session_id));
revoke all on public.session_archives from anon;

create policy session_archives_storage_read on storage.objects for select to authenticated using (
  bucket_id = 'session-archives' and public.can_access_session(public.uuid_or_null(split_part(name, '/', 2)))
);
create policy session_archives_storage_write on storage.objects for insert to authenticated with check (
  bucket_id = 'session-archives' and public.can_access_session(public.uuid_or_null(split_part(name, '/', 2)))
);
