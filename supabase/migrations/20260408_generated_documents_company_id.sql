alter table if exists public.generated_documents
  add column if not exists company_id uuid references public.client_companies(id) on delete set null;

create index if not exists idx_generated_documents_company_id
  on public.generated_documents(company_id);
