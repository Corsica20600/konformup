create table if not exists public.trainer_documents (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  label text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trainer_documents_label_not_blank check (btrim(label) <> ''),
  constraint trainer_documents_file_name_not_blank check (btrim(file_name) <> '')
);

create index if not exists idx_trainer_documents_trainer_id on public.trainer_documents(trainer_id);

alter table public.trainer_documents enable row level security;

drop policy if exists trainer_documents_manager_access on public.trainer_documents;
create policy trainer_documents_manager_access
  on public.trainer_documents
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trainer-documents',
  'trainer-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "manager read trainer documents" on storage.objects;
drop policy if exists "manager write trainer documents" on storage.objects;
drop policy if exists "manager update trainer documents" on storage.objects;
drop policy if exists "manager delete trainer documents" on storage.objects;

create policy "manager read trainer documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'trainer-documents' and public.is_operational_manager());

create policy "manager write trainer documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'trainer-documents' and public.is_operational_manager());

create policy "manager update trainer documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'trainer-documents' and public.is_operational_manager())
  with check (bucket_id = 'trainer-documents' and public.is_operational_manager());

create policy "manager delete trainer documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'trainer-documents' and public.is_operational_manager());
