create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'training_session_status') then
    create type public.training_session_status as enum ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'candidate_validation_status') then
    create type public.candidate_validation_status as enum ('pending', 'validated', 'not_validated');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'archived');
  end if;
end
$$;

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date not null,
  location text not null,
  status public.training_session_status not null default 'draft',
  trainer_user_id uuid,
  trainer_name text,
  duration_hours numeric(5,2),
  created_at timestamptz not null default timezone('utc', now()),
  constraint training_sessions_title_not_blank check (btrim(title) <> ''),
  constraint training_sessions_location_not_blank check (btrim(location) <> ''),
  constraint training_sessions_dates_valid check (end_date >= start_date),
  constraint training_sessions_duration_hours_positive check (duration_hours is null or duration_hours > 0)
);

alter table public.training_sessions
  add column if not exists trainer_name text;

alter table public.training_sessions
  add column if not exists duration_hours numeric(5,2);

alter table public.training_sessions
  add column if not exists source_quote_id uuid references public.quotes(id) on delete set null;

create table if not exists public.client_companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  legal_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  billing_address text,
  postal_code text,
  city text,
  siret text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_companies_name_not_blank check (btrim(company_name) <> '')
);

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trainers_first_name_not_blank check (btrim(first_name) <> ''),
  constraint trainers_last_name_not_blank check (btrim(last_name) <> '')
);

alter table public.training_sessions
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null;

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  company text,
  phone text,
  validation_status public.candidate_validation_status not null default 'pending',
  validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint candidates_first_name_not_blank check (btrim(first_name) <> ''),
  constraint candidates_last_name_not_blank check (btrim(last_name) <> '')
);

alter table public.candidates
  add column if not exists validation_status public.candidate_validation_status not null default 'pending';

alter table public.candidates
  add column if not exists validated_at timestamptz;

alter table public.candidates
  add column if not exists company_id uuid references public.client_companies(id) on delete set null;

alter table public.candidates
  add column if not exists job_title text;

alter table public.candidates
  add column if not exists address text;

alter table public.candidates
  add column if not exists postal_code text;

alter table public.candidates
  add column if not exists city text;

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  title text not null,
  summary text,
  module_order integer not null,
  estimated_minutes integer,
  content_text text,
  video_url text,
  pdf_url text,
  trainer_guidance text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint training_modules_title_not_blank check (btrim(title) <> ''),
  constraint training_modules_order_positive check (module_order > 0),
  constraint training_modules_estimated_minutes_positive check (estimated_minutes is null or estimated_minutes > 0),
  constraint training_modules_session_order_unique unique (session_id, module_order)
);

create table if not exists public.session_module_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  module_id uuid not null references public.training_modules(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint session_module_progress_unique unique (session_id, module_id),
  constraint session_module_progress_completion_valid check (
    (is_completed = false and completed_at is null)
    or (is_completed = true and completed_at is not null)
  )
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_sessions(id) on delete set null,
  candidate_id uuid references public.candidates(id) on delete set null,
  company_id uuid references public.client_companies(id) on delete set null,
  document_type text not null,
  document_ref text not null,
  version integer not null default 1,
  status text not null default 'draft',
  file_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint generated_documents_document_type_not_blank check (btrim(document_type) <> ''),
  constraint generated_documents_document_ref_not_blank check (btrim(document_ref) <> ''),
  constraint generated_documents_version_positive check (version > 0),
  constraint generated_documents_status_allowed check (
    status in ('draft', 'generated', 'sent', 'signed', 'archived')
  )
);

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

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  status public.quote_status not null default 'draft',
  session_id uuid references public.training_sessions(id) on delete set null,
  company_id uuid not null references public.client_companies(id),
  title text not null,
  description text,
  candidate_count integer not null default 0,
  session_start_date date,
  session_end_date date,
  location text,
  price_ht numeric(10,2) not null,
  vat_rate numeric(5,2) not null default 20,
  total_ttc numeric(10,2) generated always as (round((price_ht * (1 + (vat_rate / 100)))::numeric, 2)) stored,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quotes_quote_number_not_blank check (btrim(quote_number) <> ''),
  constraint quotes_title_not_blank check (btrim(title) <> ''),
  constraint quotes_candidate_count_positive check (candidate_count >= 0),
  constraint quotes_price_ht_positive check (price_ht >= 0),
  constraint quotes_vat_rate_positive check (vat_rate >= 0),
  constraint quotes_dates_valid check (
    session_start_date is null
    or session_end_date is null
    or session_end_date >= session_start_date
  )
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  quote_id uuid not null unique references public.quotes(id) on delete restrict,
  company_id uuid not null references public.client_companies(id),
  price_ht numeric(10,2) not null,
  vat_rate numeric(5,2) not null default 20,
  total_ttc numeric(10,2) generated always as (round((price_ht * (1 + (vat_rate / 100)))::numeric, 2)) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invoices_invoice_number_not_blank check (btrim(invoice_number) <> ''),
  constraint invoices_price_ht_positive check (price_ht >= 0),
  constraint invoices_vat_rate_positive check (vat_rate >= 0)
);

alter table public.candidates
  alter column session_id drop not null;

alter table public.generated_documents
  alter column session_id drop not null;

alter table public.quotes
  alter column session_id drop not null;

alter table public.quotes
  add column if not exists status public.quote_status not null default 'draft';

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  address text not null,
  siret text,
  training_declaration_number text,
  qualiopi_mention text,
  logo_url text,
  signature_url text,
  certificate_signatory_name text,
  certificate_signatory_title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_settings_name_not_blank check (btrim(organization_name) <> ''),
  constraint organization_settings_address_not_blank check (btrim(address) <> '')
);

create index if not exists idx_candidates_session_id on public.candidates(session_id);
create index if not exists idx_candidates_company_id on public.candidates(company_id);
create index if not exists idx_client_companies_name on public.client_companies(company_name);
create index if not exists idx_trainers_name on public.trainers(last_name, first_name);
create index if not exists idx_training_modules_session_id on public.training_modules(session_id);
create index if not exists idx_session_module_progress_session_id on public.session_module_progress(session_id);
create index if not exists idx_session_module_progress_module_id on public.session_module_progress(module_id);
create index if not exists idx_generated_documents_session_id on public.generated_documents(session_id);
create index if not exists idx_generated_documents_candidate_id on public.generated_documents(candidate_id);
create index if not exists idx_generated_documents_company_id on public.generated_documents(company_id);
create index if not exists idx_attendance_slots_session_id on public.attendance_slots(session_id);
create index if not exists idx_attendance_responses_slot_id on public.attendance_responses(attendance_slot_id);
create index if not exists idx_attendance_responses_candidate_id on public.attendance_responses(candidate_id);
create index if not exists idx_attendance_responses_token on public.attendance_responses(response_token);
create index if not exists idx_training_sessions_trainer_id on public.training_sessions(trainer_id);
create index if not exists idx_quotes_session_id on public.quotes(session_id);
create index if not exists idx_quotes_company_id on public.quotes(company_id);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);
create index if not exists idx_invoices_quote_id on public.invoices(quote_id);
create index if not exists idx_invoices_company_id on public.invoices(company_id);
create index if not exists idx_invoices_created_at on public.invoices(created_at desc);
create index if not exists idx_training_sessions_source_quote_id on public.training_sessions(source_quote_id);

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
