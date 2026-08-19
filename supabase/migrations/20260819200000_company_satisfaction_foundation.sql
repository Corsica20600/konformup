-- Company satisfaction is deliberately separate from candidate satisfaction.
-- The invoice option is explicit: no invoice kind is inferred from its number or amount.
alter table public.invoices
  add column if not exists send_company_satisfaction boolean not null default false;

comment on column public.invoices.send_company_satisfaction is
  'When true, the invoice email may include the company satisfaction questionnaire link.';

create table if not exists public.company_satisfaction_surveys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.client_companies(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  session_id uuid references public.training_sessions(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'sent', 'completed', 'delivery_error')),
  sent_at timestamptz,
  delivery_error_at timestamptz,
  submitted_at timestamptz,
  overall_rating smallint check (overall_rating between 1 and 5),
  organization_rating smallint check (organization_rating between 1 and 5),
  needs_rating smallint check (needs_rating between 1 and 5),
  comment text,
  publication_consent boolean not null default false,
  public_identity text check (public_identity in ('company_name', 'first_name_initial', 'anonymous')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderated_at timestamptz,
  moderated_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint company_satisfaction_identity_requires_consent check (
    public_identity is null or publication_consent
  ),
  constraint company_satisfaction_publication_requires_approval check (
    published_at is null or (publication_consent and moderation_status = 'approved')
  ),
  constraint company_satisfaction_completion_has_answers check (
    submitted_at is null or (overall_rating is not null and organization_rating is not null and needs_rating is not null)
  )
);

create unique index if not exists company_satisfaction_surveys_invoice_id_key
  on public.company_satisfaction_surveys(invoice_id);
create unique index if not exists company_satisfaction_surveys_company_session_key
  on public.company_satisfaction_surveys(company_id, session_id)
  where session_id is not null;
create index if not exists idx_company_satisfaction_surveys_company_id
  on public.company_satisfaction_surveys(company_id, created_at desc);
create index if not exists idx_company_satisfaction_surveys_session_id
  on public.company_satisfaction_surveys(session_id) where session_id is not null;

drop trigger if exists company_satisfaction_surveys_updated_at on public.company_satisfaction_surveys;
create trigger company_satisfaction_surveys_updated_at
  before update on public.company_satisfaction_surveys
  for each row execute function public.set_updated_at();

alter table public.company_satisfaction_surveys enable row level security;

create policy company_satisfaction_surveys_read
  on public.company_satisfaction_surveys for select to authenticated
  using (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
  );

create policy company_satisfaction_surveys_manager_write
  on public.company_satisfaction_surveys for all to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

-- Creates at most one survey per invoice and, for a linked session, one per company/session.
-- The token is supplied as a hash only. Raw tokens never enter the database.
create or replace function public.create_or_get_company_satisfaction_survey(
  p_company_id uuid,
  p_invoice_id uuid,
  p_quote_id uuid,
  p_session_id uuid,
  p_token_hash text
)
returns table (id uuid, invoice_id uuid, token_hash text, status text, submitted_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare
  survey public.company_satisfaction_surveys%rowtype;
begin
  if not public.can_access_company(p_company_id) or not public.can_access_invoice(p_invoice_id)
    or (p_session_id is not null and not public.can_access_session(p_session_id)) then
    raise exception 'company satisfaction unavailable';
  end if;

  if not exists (
    select 1 from public.invoices invoice
    where invoice.id = p_invoice_id and invoice.company_id = p_company_id and invoice.quote_id = p_quote_id
  ) then
    raise exception 'company satisfaction unavailable';
  end if;

  insert into public.company_satisfaction_surveys (company_id, invoice_id, quote_id, session_id, token_hash)
  values (p_company_id, p_invoice_id, p_quote_id, p_session_id, p_token_hash)
  on conflict do nothing
  returning * into survey;

  if survey.id is null and p_session_id is not null then
    select * into survey from public.company_satisfaction_surveys
    where company_id = p_company_id and session_id = p_session_id
    limit 1;
  end if;

  if survey.id is null then
    select * into survey from public.company_satisfaction_surveys where invoice_id = p_invoice_id;
  end if;

  return query select survey.id, survey.invoice_id, survey.token_hash, survey.status, survey.submitted_at;
end;
$$;

create or replace function public.get_company_satisfaction_context(p_token text)
returns table (available boolean, completed boolean, company_name text, training_title text)
language sql security definer set search_path = public, extensions as $$
  select
    true,
    survey.submitted_at is not null,
    company.company_name,
    quote.title
  from public.company_satisfaction_surveys survey
  join public.client_companies company on company.id = survey.company_id
  left join public.quotes quote on quote.id = survey.quote_id
  where survey.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  limit 1;
$$;

create or replace function public.submit_company_satisfaction_survey(
  p_token text,
  p_overall_rating smallint,
  p_organization_rating smallint,
  p_needs_rating smallint,
  p_comment text,
  p_publication_consent boolean,
  p_public_identity text
)
returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_overall_rating not between 1 and 5
    or p_organization_rating not between 1 and 5
    or p_needs_rating not between 1 and 5
    or (p_public_identity is not null and p_public_identity not in ('company_name', 'first_name_initial', 'anonymous'))
    or (p_public_identity is not null and not p_publication_consent) then
    return 'invalid';
  end if;

  update public.company_satisfaction_surveys
  set overall_rating = p_overall_rating,
      organization_rating = p_organization_rating,
      needs_rating = p_needs_rating,
      comment = nullif(trim(coalesce(p_comment, '')), ''),
      publication_consent = p_publication_consent,
      public_identity = case when p_publication_consent then p_public_identity else null end,
      submitted_at = timezone('utc', now()),
      status = 'completed',
      updated_at = timezone('utc', now())
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and submitted_at is null;

  if found then return 'submitted'; end if;
  if exists (select 1 from public.company_satisfaction_surveys where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')) then
    return 'already_completed';
  end if;
  return 'invalid';
end;
$$;

create or replace function public.mark_company_satisfaction_delivery(
  p_survey_id uuid,
  p_success boolean
)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_operational_manager() then raise exception 'company satisfaction unavailable'; end if;
  update public.company_satisfaction_surveys
  set status = case when p_success then 'sent' else 'delivery_error' end,
      sent_at = case when p_success then timezone('utc', now()) else sent_at end,
      delivery_error_at = case when p_success then delivery_error_at else timezone('utc', now()) end,
      updated_at = timezone('utc', now())
  where id = p_survey_id and submitted_at is null;
  return found;
end;
$$;

revoke all on public.company_satisfaction_surveys from anon;
grant execute on function public.get_company_satisfaction_context(text) to anon, authenticated;
grant execute on function public.submit_company_satisfaction_survey(text, smallint, smallint, smallint, text, boolean, text) to anon, authenticated;
grant execute on function public.create_or_get_company_satisfaction_survey(uuid, uuid, uuid, uuid, text) to authenticated;
grant execute on function public.mark_company_satisfaction_delivery(uuid, boolean) to authenticated;
