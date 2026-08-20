-- Explicit, non-heuristic identity for SST renewal. Email remains delivery-only.
create table if not exists public.candidate_mac_identities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null,
  notes text
);
comment on table public.candidate_mac_identities is 'Administrative identity used only to link the same SST holder across sessions. It is never inferred from email, name or company.';

alter table public.candidates add column if not exists mac_identity_id uuid references public.candidate_mac_identities(id) on delete restrict;
create index if not exists candidates_mac_identity_idx on public.candidates(mac_identity_id) where mac_identity_id is not null;

alter table public.mac_sst_reminders alter column recipient_email drop not null;
alter table public.mac_sst_reminders add column if not exists mac_identity_id uuid references public.candidate_mac_identities(id) on delete restrict;
create index if not exists mac_sst_reminders_identity_idx on public.mac_sst_reminders(mac_identity_id, reference_session_id);

alter table public.candidate_mac_identities enable row level security;
create policy candidate_mac_identities_read on public.candidate_mac_identities for select to authenticated using (public.is_operational_manager());
create policy candidate_mac_identities_write on public.candidate_mac_identities for all to authenticated using (public.is_operational_manager()) with check (public.is_operational_manager());
revoke all on table public.candidate_mac_identities from anon;

drop policy if exists session_archives_update_unfinished on public.session_archives;
create policy session_archives_update_building_only on public.session_archives for update to authenticated
  using (public.can_access_session(session_id) and status = 'building')
  with check (public.can_access_session(session_id) and status in ('complete', 'partial', 'error'));

-- The archive bucket remains private; only files belonging to the archive currently being built can be removed.
create or replace function public.can_delete_building_session_archive(p_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.session_archives archive
    where archive.session_id = public.uuid_or_null(split_part(p_path, '/', 2))
      and archive.version = case when split_part(p_path, '/', 4) ~ '^v[0-9]+$' then substring(split_part(p_path, '/', 4) from 2)::integer else null end
      and archive.status = 'building'
      and public.can_access_session(archive.session_id)
  );
$$;
grant execute on function public.can_delete_building_session_archive(text) to authenticated;
drop policy if exists session_archives_storage_delete_building on storage.objects;
create policy session_archives_storage_delete_building on storage.objects for delete to authenticated using (
  bucket_id = 'session-archives' and public.can_delete_building_session_archive(name)
);
