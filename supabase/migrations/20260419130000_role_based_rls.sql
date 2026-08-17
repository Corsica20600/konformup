alter type public.app_role add value if not exists 'lead_trainer';

insert into public.profiles (id, full_name, role)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.email),
  'admin'::public.app_role
from auth.users
on conflict (id) do nothing;

create or replace function public.is_operational_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role()::text in ('admin', 'lead_trainer');
$$;

create or replace function public.uuid_or_null(p_value text)
returns uuid
language plpgsql
immutable
strict
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.can_access_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.training_sessions session
      where session.id = p_session_id
        and session.trainer_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_candidate(p_candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.candidates candidate
      join public.training_sessions session on session.id = candidate.session_id
      where candidate.id = p_candidate_id
        and session.trainer_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.candidates candidate
      join public.training_sessions session on session.id = candidate.session_id
      where candidate.company_id = p_company_id
        and session.trainer_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.quotes quote
      join public.training_sessions session on session.id = quote.session_id
      where quote.company_id = p_company_id
        and session.trainer_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_quote(p_quote_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.quotes quote
      join public.training_sessions session on session.id = quote.session_id
      where quote.id = p_quote_id
        and session.trainer_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_invoice(p_invoice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.invoices invoice
      join public.quotes quote on quote.id = invoice.quote_id
      join public.training_sessions session on session.id = quote.session_id
      where invoice.id = p_invoice_id
        and session.trainer_user_id = auth.uid()
    );
$$;

create or replace function public.can_access_invoice_complaint(p_complaint_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.invoice_complaints complaint
      where complaint.id = p_complaint_id
        and public.can_access_invoice(complaint.invoice_id)
    );
$$;

create or replace function public.can_access_attendance_slot(p_slot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.attendance_slots slot
      where slot.id = p_slot_id
        and public.can_access_session(slot.session_id)
    );
$$;

create or replace function public.can_access_attendance_response(p_response_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.attendance_responses response
      join public.attendance_slots slot on slot.id = response.attendance_slot_id
      where response.id = p_response_id
        and public.can_access_session(slot.session_id)
    );
$$;

create or replace function public.can_access_generated_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_operational_manager()
    or exists (
      select 1
      from public.generated_documents document
      where document.id = p_document_id
        and (
          (document.session_id is not null and public.can_access_session(document.session_id))
          or (document.candidate_id is not null and public.can_access_candidate(document.candidate_id))
          or (
            document.metadata ? 'quote_id'
            and public.can_access_quote(public.uuid_or_null(document.metadata ->> 'quote_id'))
          )
          or (
            document.metadata ? 'invoice_id'
            and public.can_access_invoice(public.uuid_or_null(document.metadata ->> 'invoice_id'))
          )
        )
    );
$$;

create or replace function public.can_access_storage_path(p_path text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  entity text;
  entity_id uuid;
begin
  if public.is_operational_manager() then
    return true;
  end if;

  entity := split_part(p_path, '/', 1);
  entity_id := public.uuid_or_null(split_part(p_path, '/', 2));

  if entity_id is null then
    return false;
  end if;

  if entity = 'sessions' then
    return public.can_access_session(entity_id);
  elsif entity = 'candidates' then
    return public.can_access_candidate(entity_id);
  elsif entity = 'quotes' then
    return public.can_access_quote(entity_id);
  elsif entity = 'invoices' then
    return public.can_access_invoice(entity_id);
  end if;

  return false;
end;
$$;

grant execute on function public.is_operational_manager() to authenticated;
grant execute on function public.uuid_or_null(text) to authenticated;
grant execute on function public.can_access_session(uuid) to authenticated;
grant execute on function public.can_access_candidate(uuid) to authenticated;
grant execute on function public.can_access_company(uuid) to authenticated;
grant execute on function public.can_access_quote(uuid) to authenticated;
grant execute on function public.can_access_invoice(uuid) to authenticated;
grant execute on function public.can_access_invoice_complaint(uuid) to authenticated;
grant execute on function public.can_access_attendance_slot(uuid) to authenticated;
grant execute on function public.can_access_attendance_response(uuid) to authenticated;
grant execute on function public.can_access_generated_document(uuid) to authenticated;
grant execute on function public.can_access_storage_path(text) to authenticated;

do $$
declare
  table_name text;
  table_names text[] := array[
    'attendance_slots',
    'attendance_responses',
    'quotes',
    'training_sessions',
    'candidates',
    'session_module_progress',
    'trainers',
    'training_modules',
    'invoice_complaints',
    'organization_settings',
    'invoices',
    'generated_documents',
    'invoice_lines',
    'client_companies',
    'training_quizzes'
  ];
begin
  foreach table_name in array table_names loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    end if;
  end loop;
end
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own_or_manager
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_operational_manager());

create policy profiles_admin_insert
  on public.profiles
  for insert
  to authenticated
  with check (public.current_app_role() = 'admin'::public.app_role);

create policy profiles_admin_update
  on public.profiles
  for update
  to authenticated
  using (public.current_app_role() = 'admin'::public.app_role)
  with check (public.current_app_role() = 'admin'::public.app_role);

create policy profiles_admin_delete
  on public.profiles
  for delete
  to authenticated
  using (public.current_app_role() = 'admin'::public.app_role);

create policy client_companies_select_by_role
  on public.client_companies
  for select
  to authenticated
  using (public.can_access_company(id));

create policy client_companies_manager_write
  on public.client_companies
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy trainers_authenticated_read
  on public.trainers
  for select
  to authenticated
  using (true);

create policy trainers_manager_write
  on public.trainers
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy training_sessions_select_by_role
  on public.training_sessions
  for select
  to authenticated
  using (public.can_access_session(id));

create policy training_sessions_insert_by_role
  on public.training_sessions
  for insert
  to authenticated
  with check (public.is_operational_manager() or trainer_user_id = auth.uid());

create policy training_sessions_update_by_role
  on public.training_sessions
  for update
  to authenticated
  using (public.can_access_session(id))
  with check (public.is_operational_manager() or trainer_user_id = auth.uid());

create policy training_sessions_delete_manager
  on public.training_sessions
  for delete
  to authenticated
  using (public.is_operational_manager());

create policy candidates_select_by_role
  on public.candidates
  for select
  to authenticated
  using (public.can_access_candidate(id));

create policy candidates_insert_by_role
  on public.candidates
  for insert
  to authenticated
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
  );

create policy candidates_update_by_role
  on public.candidates
  for update
  to authenticated
  using (public.can_access_candidate(id))
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
  );

create policy candidates_delete_by_role
  on public.candidates
  for delete
  to authenticated
  using (public.can_access_candidate(id));

create policy attendance_slots_select_by_role
  on public.attendance_slots
  for select
  to authenticated
  using (public.can_access_session(session_id));

create policy attendance_slots_write_by_role
  on public.attendance_slots
  for all
  to authenticated
  using (public.can_access_session(session_id))
  with check (public.can_access_session(session_id));

create policy attendance_responses_select_by_role
  on public.attendance_responses
  for select
  to authenticated
  using (public.can_access_attendance_response(id));

create policy attendance_responses_write_by_role
  on public.attendance_responses
  for all
  to authenticated
  using (public.can_access_attendance_response(id))
  with check (public.is_operational_manager() or public.can_access_attendance_slot(attendance_slot_id));

create policy quotes_select_by_role
  on public.quotes
  for select
  to authenticated
  using (public.can_access_quote(id));

create policy quotes_insert_by_role
  on public.quotes
  for insert
  to authenticated
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
  );

create policy quotes_update_by_role
  on public.quotes
  for update
  to authenticated
  using (public.can_access_quote(id))
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
  );

create policy quotes_delete_manager
  on public.quotes
  for delete
  to authenticated
  using (public.is_operational_manager());

create policy invoices_select_by_role
  on public.invoices
  for select
  to authenticated
  using (public.can_access_invoice(id));

create policy invoices_manager_write
  on public.invoices
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy invoice_complaints_select_by_role
  on public.invoice_complaints
  for select
  to authenticated
  using (public.can_access_invoice_complaint(id));

create policy invoice_complaints_manager_write
  on public.invoice_complaints
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy generated_documents_select_by_role
  on public.generated_documents
  for select
  to authenticated
  using (public.can_access_generated_document(id));

create policy generated_documents_insert_by_role
  on public.generated_documents
  for insert
  to authenticated
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
    or (candidate_id is not null and public.can_access_candidate(candidate_id))
    or (
      metadata ? 'quote_id'
      and public.can_access_quote(public.uuid_or_null(metadata ->> 'quote_id'))
    )
  );

create policy generated_documents_update_by_role
  on public.generated_documents
  for update
  to authenticated
  using (public.can_access_generated_document(id))
  with check (
    public.is_operational_manager()
    or (session_id is not null and public.can_access_session(session_id))
    or (candidate_id is not null and public.can_access_candidate(candidate_id))
    or (
      metadata ? 'quote_id'
      and public.can_access_quote(public.uuid_or_null(metadata ->> 'quote_id'))
    )
  );

create policy generated_documents_delete_manager
  on public.generated_documents
  for delete
  to authenticated
  using (public.is_operational_manager());

create policy session_module_progress_select_by_role
  on public.session_module_progress
  for select
  to authenticated
  using (public.can_access_session(session_id));

create policy session_module_progress_write_by_role
  on public.session_module_progress
  for all
  to authenticated
  using (public.can_access_session(session_id))
  with check (public.can_access_session(session_id));

create policy training_modules_authenticated_read
  on public.training_modules
  for select
  to authenticated
  using (true);

create policy training_modules_manager_write
  on public.training_modules
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy training_quizzes_authenticated_read
  on public.training_quizzes
  for select
  to authenticated
  using (true);

create policy training_quizzes_manager_write
  on public.training_quizzes
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

create policy organization_settings_authenticated_read
  on public.organization_settings
  for select
  to authenticated
  using (true);

create policy organization_settings_manager_write
  on public.organization_settings
  for all
  to authenticated
  using (public.is_operational_manager())
  with check (public.is_operational_manager());

do $$
begin
  if to_regclass('public.invoice_lines') is not null then
    drop policy if exists invoice_lines_select_by_role on public.invoice_lines;
    create policy invoice_lines_select_by_role
      on public.invoice_lines
      for select
      to authenticated
      using (public.can_access_invoice(invoice_id));

    drop policy if exists invoice_lines_manager_write on public.invoice_lines;
    create policy invoice_lines_manager_write
      on public.invoice_lines
      for all
      to authenticated
      using (public.is_operational_manager())
      with check (public.is_operational_manager());
  end if;
end
$$;

drop policy if exists "authenticated can read generated documents" on storage.objects;
drop policy if exists "authenticated can write generated documents" on storage.objects;
drop policy if exists "authenticated can update generated documents" on storage.objects;
drop policy if exists "authenticated can delete generated documents" on storage.objects;

create policy "role based read generated documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'generated-documents'
    and public.can_access_storage_path(name)
  );

create policy "role based write generated documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'generated-documents'
    and public.can_access_storage_path(name)
  );

create policy "role based update generated documents"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'generated-documents'
    and public.can_access_storage_path(name)
  )
  with check (
    bucket_id = 'generated-documents'
    and public.can_access_storage_path(name)
  );

create policy "role based delete generated documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'generated-documents'
    and public.is_operational_manager()
  );
