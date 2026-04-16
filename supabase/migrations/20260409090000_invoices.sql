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

create index if not exists idx_invoices_quote_id on public.invoices(quote_id);
create index if not exists idx_invoices_company_id on public.invoices(company_id);
create index if not exists idx_invoices_created_at on public.invoices(created_at desc);
