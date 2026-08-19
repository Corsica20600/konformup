insert into storage.buckets (id, name, public)
values ('complaint-attachments', 'complaint-attachments', false)
on conflict (id) do update set public = false;

create table if not exists public.invoice_complaint_attachments (
  id uuid primary key default gen_random_uuid(),
  invoice_complaint_id uuid not null references public.invoice_complaints(id) on delete restrict,
  bucket_id text not null default 'complaint-attachments' check (bucket_id = 'complaint-attachments'),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);
comment on table public.invoice_complaint_attachments is 'Private client-returned complaint evidence. Deletion is restricted to preserve evidence.';
create index if not exists invoice_complaint_attachments_complaint_idx on public.invoice_complaint_attachments(invoice_complaint_id, created_at desc);
alter table public.invoice_complaint_attachments enable row level security;
create policy complaint_attachments_read on public.invoice_complaint_attachments for select to authenticated using (public.can_access_invoice_complaint(invoice_complaint_id));
create policy complaint_attachments_write on public.invoice_complaint_attachments for insert to authenticated with check (public.can_access_invoice_complaint(invoice_complaint_id) and uploaded_by = auth.uid());
create policy complaint_attachments_storage_read on storage.objects for select to authenticated using (bucket_id = 'complaint-attachments' and public.can_access_invoice_complaint(public.uuid_or_null(split_part(name, '/', 4))));
create policy complaint_attachments_storage_write on storage.objects for insert to authenticated with check (bucket_id = 'complaint-attachments' and public.can_access_invoice_complaint(public.uuid_or_null(split_part(name, '/', 4))));
