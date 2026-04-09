alter table if exists public.training_sessions
  add column if not exists source_quote_id uuid references public.quotes(id) on delete set null;

create index if not exists idx_training_sessions_source_quote_id on public.training_sessions(source_quote_id);
