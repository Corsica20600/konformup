-- Internal persistence only. Public token access will be mediated by narrowly
-- scoped security-definer functions added with the future public workflow.
alter table public.quotes
  add constraint quotes_id_company_id_unique unique (id, company_id);

create table public.training_needs_analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.client_companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  training_type text not null,
  status text not null default 'draft',
  answers jsonb not null default '{}'::jsonb,
  current_step smallint not null default 1,
  progress_percent smallint not null default 0,
  respondent_name text,
  respondent_role text,
  respondent_email text,
  first_opened_at timestamptz,
  last_saved_at timestamptz,
  completed_at timestamptz,
  questionnaire_version text not null default '1',
  quote_snapshot jsonb not null default '{}'::jsonb,
  token_hash char(64),
  token_expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint training_needs_analyses_quote_company_fkey foreign key (quote_id, company_id)
    references public.quotes(id, company_id) on update cascade on delete cascade,
  constraint training_needs_analyses_training_type_allowed check (training_type in ('sst_initial', 'mac_sst', 'hygiene')),
  constraint training_needs_analyses_status_allowed check (status in ('draft', 'sent', 'in_progress', 'completed', 'cancelled')),
  constraint training_needs_analyses_answers_object check (jsonb_typeof(answers) = 'object'),
  constraint training_needs_analyses_quote_snapshot_object check (jsonb_typeof(quote_snapshot) = 'object'),
  constraint training_needs_analyses_questionnaire_version_allowed check (questionnaire_version = '1'),
  constraint training_needs_analyses_token_hash_sha256 check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint training_needs_analyses_current_step_valid check (current_step between 1 and 5),
  constraint training_needs_analyses_progress_valid check (progress_percent between 0 and 100),
  constraint training_needs_analyses_completion_date_valid check ((status = 'completed') = (completed_at is not null))
);

create unique index training_needs_analyses_one_active_quote on public.training_needs_analyses(quote_id) where status in ('draft', 'sent', 'in_progress');
create index training_needs_analyses_company_id_idx on public.training_needs_analyses(company_id);
create index training_needs_analyses_quote_id_idx on public.training_needs_analyses(quote_id);
create index training_needs_analyses_expires_at_idx on public.training_needs_analyses(token_expires_at) where token_expires_at is not null;
create unique index training_needs_analyses_token_hash_unique_idx
  on public.training_needs_analyses(token_hash)
  where token_hash is not null;

create or replace function public.touch_training_needs_analyses_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger touch_training_needs_analyses_updated_at
before update on public.training_needs_analyses
for each row execute function public.touch_training_needs_analyses_updated_at();

alter table public.training_needs_analyses enable row level security;
revoke all on table public.training_needs_analyses from anon;
grant select, insert, update, delete on table public.training_needs_analyses to authenticated;
grant select, insert, update, delete on table public.training_needs_analyses to service_role;

create policy training_needs_analyses_read_by_role on public.training_needs_analyses for select to authenticated
  using (public.can_access_company(company_id) and public.can_access_quote(quote_id));
create policy training_needs_analyses_write_by_role on public.training_needs_analyses for all to authenticated
  using (public.can_access_company(company_id) and public.can_access_quote(quote_id))
  with check (public.can_access_company(company_id) and public.can_access_quote(quote_id));
