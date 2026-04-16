create table if not exists public.invoice_complaints (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references public.invoices(id) on delete cascade,
  company_id uuid not null references public.client_companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  status text not null default 'open',
  severity text not null default 'medium',
  dissatisfaction_summary text not null default '',
  complaint_details text not null default '',
  customer_expectation text not null default '',
  root_cause text not null default '',
  corrective_actions text not null default '',
  preventive_actions text not null default '',
  follow_up_actions text not null default '',
  internal_notes text not null default '',
  send_with_invoice boolean not null default false,
  sent_with_invoice_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists invoice_complaints_company_id_idx on public.invoice_complaints(company_id);
create index if not exists invoice_complaints_quote_id_idx on public.invoice_complaints(quote_id);

create or replace function public.touch_invoice_complaints_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_invoice_complaints_updated_at on public.invoice_complaints;

create trigger touch_invoice_complaints_updated_at
before update on public.invoice_complaints
for each row
execute function public.touch_invoice_complaints_updated_at();
