-- An analysis of training needs is collected before a quote is produced.
-- Existing quote-linked analyses remain valid and readable.
alter table public.training_needs_analyses
  alter column quote_id drop not null;

alter table public.training_needs_analyses
  drop constraint if exists training_needs_analyses_quote_company_fkey;
alter table public.training_needs_analyses
  drop constraint if exists training_needs_analyses_quote_id_fkey;

alter table public.training_needs_analyses
  add constraint training_needs_analyses_quote_company_fkey
  foreign key (quote_id, company_id)
  references public.quotes(id, company_id)
  on update cascade
  on delete set null;

drop index if exists public.training_needs_analyses_one_active_quote;
create unique index training_needs_analyses_one_active_quote
  on public.training_needs_analyses(quote_id)
  where quote_id is not null and status in ('draft', 'sent', 'in_progress');

drop policy if exists training_needs_analyses_read_by_role on public.training_needs_analyses;
drop policy if exists training_needs_analyses_write_by_role on public.training_needs_analyses;

create policy training_needs_analyses_read_by_role on public.training_needs_analyses for select to authenticated
  using (public.can_access_company(company_id) and (quote_id is null or public.can_access_quote(quote_id)));
create policy training_needs_analyses_write_by_role on public.training_needs_analyses for all to authenticated
  using (public.can_access_company(company_id) and (quote_id is null or public.can_access_quote(quote_id)))
  with check (public.can_access_company(company_id) and (quote_id is null or public.can_access_quote(quote_id)));
