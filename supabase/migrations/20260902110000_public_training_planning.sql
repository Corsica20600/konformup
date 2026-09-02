-- Planning public : les sessions intra restent privées, les sessions inter sont publiables.
alter table public.quotes
  add column if not exists session_format text not null default 'intra';

alter table public.training_sessions
  add column if not exists session_format text not null default 'intra';

alter table public.quotes
  drop constraint if exists quotes_session_format_allowed;

alter table public.quotes
  add constraint quotes_session_format_allowed
  check (session_format in ('intra', 'inter'));

alter table public.training_sessions
  drop constraint if exists training_sessions_session_format_allowed;

alter table public.training_sessions
  add constraint training_sessions_session_format_allowed
  check (session_format in ('intra', 'inter'));

alter table public.quotes
  drop constraint if exists quotes_training_type_allowed;

alter table public.quotes
  add constraint quotes_training_type_allowed
  check (training_type in ('sst_initial', 'mac_sst', 'hygiene', 'ai'));

alter table public.training_sessions
  drop constraint if exists training_sessions_training_type_allowed;

alter table public.training_sessions
  add constraint training_sessions_training_type_allowed
  check (training_type in ('sst_initial', 'mac_sst', 'hygiene', 'ai'));

create index if not exists idx_training_sessions_public_planning
  on public.training_sessions (session_format, start_date)
  where session_format = 'inter';
