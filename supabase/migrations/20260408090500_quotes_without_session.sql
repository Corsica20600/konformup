alter table if exists public.quotes
  alter column session_id drop not null;

alter table if exists public.generated_documents
  alter column session_id drop not null;

alter table if exists public.candidates
  alter column session_id drop not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'quotes_session_id_fkey'
      and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes drop constraint quotes_session_id_fkey;
  end if;
end
$$;

alter table if exists public.quotes
  add constraint quotes_session_id_fkey
  foreign key (session_id) references public.training_sessions(id) on delete set null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'generated_documents_session_id_fkey'
      and conrelid = 'public.generated_documents'::regclass
  ) then
    alter table public.generated_documents drop constraint generated_documents_session_id_fkey;
  end if;
end
$$;

alter table if exists public.generated_documents
  add constraint generated_documents_session_id_fkey
  foreign key (session_id) references public.training_sessions(id) on delete set null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'candidates_session_id_fkey'
      and conrelid = 'public.candidates'::regclass
  ) then
    alter table public.candidates drop constraint candidates_session_id_fkey;
  end if;
end
$$;

alter table if exists public.candidates
  add constraint candidates_session_id_fkey
  foreign key (session_id) references public.training_sessions(id) on delete set null;
