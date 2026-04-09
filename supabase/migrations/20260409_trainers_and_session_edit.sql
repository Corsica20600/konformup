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

alter table if exists public.training_sessions
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null;

create index if not exists idx_trainers_name on public.trainers(last_name, first_name);
create index if not exists idx_training_sessions_trainer_id on public.training_sessions(trainer_id);
