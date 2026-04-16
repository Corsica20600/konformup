drop policy if exists "authenticated can read generated documents" on storage.objects;
drop policy if exists "authenticated can write generated documents" on storage.objects;
drop policy if exists "authenticated can update generated documents" on storage.objects;
drop policy if exists "authenticated can delete generated documents" on storage.objects;

insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', false)
on conflict (id) do nothing;

create policy "authenticated can read generated documents"
on storage.objects
for select
to authenticated
using (bucket_id = 'generated-documents');

create policy "authenticated can write generated documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'generated-documents');

create policy "authenticated can update generated documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'generated-documents')
with check (bucket_id = 'generated-documents');

create policy "authenticated can delete generated documents"
on storage.objects
for delete
to authenticated
using (bucket_id = 'generated-documents');
