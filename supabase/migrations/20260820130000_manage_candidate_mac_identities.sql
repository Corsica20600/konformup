-- Explicit administrative MAC identities. They are never inferred from a name, email,
-- date of birth, company or session. Historical candidates are deliberately backfilled
-- one identity at a time and may only be consolidated by an administrator.

alter table public.candidate_mac_identities
  add column if not exists status text not null default 'active' check (status in ('active', 'merged')),
  add column if not exists merged_into_identity_id uuid references public.candidate_mac_identities(id) on delete restrict,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists merged_at timestamptz,
  add column if not exists merged_by uuid references auth.users(id) on delete set null,
  add column if not exists merge_reason text;

alter table public.candidate_mac_identities
  drop constraint if exists candidate_mac_identities_not_merged_into_self,
  add constraint candidate_mac_identities_not_merged_into_self check (merged_into_identity_id is null or merged_into_identity_id <> id),
  drop constraint if exists candidate_mac_identities_merged_state,
  add constraint candidate_mac_identities_merged_state check (
    (status = 'active' and merged_into_identity_id is null)
    or (status = 'merged' and merged_into_identity_id is not null and merge_reason is not null and length(btrim(merge_reason)) > 0)
  );

create index if not exists candidate_mac_identities_merged_into_idx
  on public.candidate_mac_identities(merged_into_identity_id)
  where merged_into_identity_id is not null;

create table if not exists public.candidate_mac_identity_operations (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null check (operation_type in ('created', 'backfill', 'linked', 'merged')),
  candidate_id uuid references public.candidates(id) on delete restrict,
  source_identity_id uuid references public.candidate_mac_identities(id) on delete restrict,
  target_identity_id uuid references public.candidate_mac_identities(id) on delete restrict,
  reason text,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
comment on table public.candidate_mac_identity_operations is 'Append-only administrative audit trail for explicit MAC identity creation, links and merges.';
create index if not exists candidate_mac_identity_operations_target_idx on public.candidate_mac_identity_operations(target_identity_id, created_at desc);
create index if not exists candidate_mac_identity_operations_candidate_idx on public.candidate_mac_identity_operations(candidate_id, created_at desc);

alter table public.candidate_mac_identity_operations enable row level security;
create policy candidate_mac_identity_operations_read on public.candidate_mac_identity_operations
  for select to authenticated using (
    public.current_app_role()::text = 'admin'
    or (candidate_id is not null and public.can_access_candidate(candidate_id))
  );
revoke all on table public.candidate_mac_identity_operations from anon;

drop policy if exists candidate_mac_identities_read on public.candidate_mac_identities;
drop policy if exists candidate_mac_identities_write on public.candidate_mac_identities;
create policy candidate_mac_identities_read on public.candidate_mac_identities
  for select to authenticated using (
    public.is_operational_manager()
    or exists (
      select 1 from public.candidates candidate
      where candidate.mac_identity_id = candidate_mac_identities.id
        and public.can_access_candidate(candidate.id)
    )
  );
create policy candidate_mac_identities_admin_write on public.candidate_mac_identities
  for all to authenticated
  using (public.current_app_role()::text = 'admin')
  with check (public.current_app_role()::text = 'admin');
revoke all on table public.candidate_mac_identities from anon;

-- A new candidate always receives an explicit identity inside the candidate insert
-- transaction. Supplying an existing identity is the only way to reuse one.
create or replace function public.assign_candidate_mac_identity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_identity_id uuid;
begin
  if new.mac_identity_id is null then
    insert into public.candidate_mac_identities(created_by, notes)
    values (auth.uid(), 'Identité créée avec le dossier candidat.')
    returning id into v_identity_id;
    new.mac_identity_id := v_identity_id;
  end if;
  return new;
end;
$$;

drop trigger if exists candidates_assign_mac_identity on public.candidates;
create trigger candidates_assign_mac_identity
  before insert on public.candidates
  for each row execute function public.assign_candidate_mac_identity();

create or replace function public.audit_new_candidate_mac_identity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.candidate_mac_identity_operations(operation_type, candidate_id, target_identity_id, reason, performed_by)
  values ('created', new.id, new.mac_identity_id, 'Création de dossier candidat.', auth.uid());
  return new;
end;
$$;

drop trigger if exists candidates_audit_mac_identity on public.candidates;
create trigger candidates_audit_mac_identity
  after insert on public.candidates
  for each row execute function public.audit_new_candidate_mac_identity();

-- This function is safe to run repeatedly. It never merges records: each missing
-- historical candidate receives its own identity so an administrator can decide later.
create or replace function public.backfill_candidate_mac_identities()
returns integer language plpgsql security definer set search_path = public as $$
declare
  candidate_record record;
  v_identity_id uuid;
  v_count integer := 0;
begin
  for candidate_record in select id from public.candidates where mac_identity_id is null order by id loop
    insert into public.candidate_mac_identities(notes)
    values ('Identité créée par le backfill historique, à vérifier administrativement.')
    returning id into v_identity_id;

    update public.candidates
      set mac_identity_id = v_identity_id
      where id = candidate_record.id and mac_identity_id is null;

    if found then
      insert into public.candidate_mac_identity_operations(operation_type, candidate_id, target_identity_id, reason)
      values ('backfill', candidate_record.id, v_identity_id, 'Backfill historique sans rapprochement automatique.');
      v_count := v_count + 1;
    else
      delete from public.candidate_mac_identities where id = v_identity_id;
    end if;
  end loop;
  return v_count;
end;
$$;
select public.backfill_candidate_mac_identities();
revoke all on function public.backfill_candidate_mac_identities() from public;

-- Only an admin may attach a session-specific candidate record to a known identity.
create or replace function public.link_candidate_mac_identity(p_candidate_id uuid, p_identity_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_source_identity_id uuid;
begin
  if public.current_app_role()::text <> 'admin' then raise exception 'Accès refusé'; end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Motif administratif requis'; end if;
  select mac_identity_id into v_source_identity_id from public.candidates where id = p_candidate_id for update;
  if not found then raise exception 'Dossier candidat introuvable'; end if;
  perform 1 from public.candidate_mac_identities where id = p_identity_id and status = 'active' for update;
  if not found then raise exception 'Identité MAC active introuvable'; end if;
  if v_source_identity_id = p_identity_id then return p_identity_id; end if;
  update public.candidates set mac_identity_id = p_identity_id where id = p_candidate_id;
  update public.candidate_mac_identities
    set verified_at = coalesce(verified_at, timezone('utc', now())), verified_by = coalesce(verified_by, auth.uid())
    where id = p_identity_id;
  insert into public.candidate_mac_identity_operations(operation_type, candidate_id, source_identity_id, target_identity_id, reason, performed_by)
  values ('linked', p_candidate_id, v_source_identity_id, p_identity_id, btrim(p_reason), auth.uid());
  return p_identity_id;
end;
$$;
grant execute on function public.link_candidate_mac_identity(uuid, uuid, text) to authenticated;

-- Canonical identity is selected explicitly. Source records and reminder history stay
-- immutable; only candidate links move to the canonical active identity.
create or replace function public.merge_candidate_mac_identities(p_canonical_identity_id uuid, p_secondary_identity_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_canonical_status text;
  v_secondary_status text;
begin
  if public.current_app_role()::text <> 'admin' then raise exception 'Accès refusé'; end if;
  if p_canonical_identity_id = p_secondary_identity_id then raise exception 'Identités distinctes requises'; end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Motif administratif requis'; end if;
  select status into v_canonical_status from public.candidate_mac_identities where id = p_canonical_identity_id for update;
  select status into v_secondary_status from public.candidate_mac_identities where id = p_secondary_identity_id for update;
  if v_canonical_status <> 'active' or v_secondary_status <> 'active' then raise exception 'Seules deux identités MAC actives peuvent être regroupées'; end if;
  -- Both rows must be active; this makes merge chains and cycles impossible.
  update public.candidates set mac_identity_id = p_canonical_identity_id where mac_identity_id = p_secondary_identity_id;
  update public.candidate_mac_identities
    set verified_at = coalesce(verified_at, timezone('utc', now())), verified_by = coalesce(verified_by, auth.uid())
    where id = p_canonical_identity_id;
  update public.candidate_mac_identities
    set status = 'merged', merged_into_identity_id = p_canonical_identity_id,
        merged_at = timezone('utc', now()), merged_by = auth.uid(), merge_reason = btrim(p_reason)
    where id = p_secondary_identity_id;
  insert into public.candidate_mac_identity_operations(operation_type, source_identity_id, target_identity_id, reason, performed_by)
  values ('merged', p_secondary_identity_id, p_canonical_identity_id, btrim(p_reason), auth.uid());
  return p_canonical_identity_id;
end;
$$;
grant execute on function public.merge_candidate_mac_identities(uuid, uuid, text) to authenticated;

revoke all on function public.assign_candidate_mac_identity() from public;
revoke all on function public.audit_new_candidate_mac_identity() from public;
