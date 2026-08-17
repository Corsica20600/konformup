create or replace function public.verify_generated_document(p_ref text)
returns table (
  document_ref text,
  document_type text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    document.document_ref,
    document.document_type,
    document.status,
    document.created_at
  from public.generated_documents document
  where document.document_ref = btrim(p_ref)
    and document.document_type in ('attestation', 'certificat', 'certificat_realisation')
  limit 1;
$$;

revoke all on function public.verify_generated_document(text) from public;
grant execute on function public.verify_generated_document(text) to anon, authenticated;
