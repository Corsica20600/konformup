-- Manual participant-guide sends reuse the existing pre-training delivery ledger.
-- A per-submit request UUID makes retries and double-clicks idempotent while
-- still allowing a later, explicitly confirmed resend.
alter table public.pre_training_document_deliveries
  add column if not exists requested_by uuid references public.profiles(id) on delete set null;

alter table public.pre_training_document_deliveries
  drop constraint if exists pre_training_document_deliveries_delivery_kind_check;
alter table public.pre_training_document_deliveries
  add constraint pre_training_document_deliveries_delivery_kind_check
  check (delivery_kind in ('documents_j5', 'reminder_j2', 'livret_ia_manual'));

alter table public.pre_training_document_deliveries
  drop constraint if exists pre_training_document_deliveries_session_id_candidate_id_delivery_kind_key;
create unique index if not exists pre_training_document_deliveries_automatic_kind_unique
  on public.pre_training_document_deliveries(session_id, candidate_id, delivery_kind)
  where delivery_kind in ('documents_j5', 'reminder_j2');

create or replace function public.claim_ai_participant_guide_delivery(
  p_session_id uuid,
  p_candidate_id uuid,
  p_recipient_email text,
  p_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text;
begin
  if auth.uid() is null or not public.can_access_session(p_session_id) then
    raise exception 'Accès refusé à cette session.';
  end if;

  if not exists (
    select 1
    from public.training_sessions session
    join public.candidates candidate on candidate.session_id = session.id
    where session.id = p_session_id
      and session.training_type = 'ai'
      and candidate.id = p_candidate_id
      and lower(btrim(candidate.email)) = lower(btrim(p_recipient_email))
      and exists (select 1 from public.attendance_slots slot where slot.session_id = session.id)
      and not exists (
        select 1
        from public.attendance_slots slot
        where slot.session_id = session.id
          and not exists (
            select 1
            from public.attendance_responses response
            where response.attendance_slot_id = slot.id
              and response.candidate_id = candidate.id
              and coalesce(response.trainer_override_status, response.response_status) = 'present'
          )
      )
  ) then
    raise exception 'Le candidat doit appartenir à cette formation IA et être présent à tous les créneaux.';
  end if;

  v_key := concat('livret_ia_manual:', p_session_id::text, ':', p_candidate_id::text, ':', p_request_id::text);
  insert into public.pre_training_document_deliveries (
    session_id, candidate_id, delivery_kind, recipient_email, status, idempotency_key, requested_by
  ) values (
    p_session_id, p_candidate_id, 'livret_ia_manual', lower(btrim(p_recipient_email)), 'pending', v_key, auth.uid()
  ) on conflict (idempotency_key) do nothing;

  update public.pre_training_document_deliveries
  set status = 'processing',
      attempt_count = attempt_count + 1,
      last_attempt_at = timezone('utc', now()),
      technical_error = null,
      updated_at = timezone('utc', now())
  where idempotency_key = v_key
    and requested_by = auth.uid()
    and status = 'pending'
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.finish_ai_participant_guide_delivery(
  p_delivery_id uuid,
  p_success boolean,
  p_technical_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  update public.pre_training_document_deliveries delivery
  set status = case when p_success then 'sent' else 'error' end,
      sent_at = case when p_success then timezone('utc', now()) else null end,
      technical_error = case when p_success then null else left(coalesce(p_technical_error, 'Échec de livraison'), 240) end,
      updated_at = timezone('utc', now())
  where delivery.id = p_delivery_id
    and delivery.delivery_kind = 'livret_ia_manual'
    and delivery.status = 'processing'
    and delivery.requested_by = auth.uid()
    and public.can_access_session(delivery.session_id);
  return found;
end;
$$;

revoke all on function public.claim_ai_participant_guide_delivery(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.claim_ai_participant_guide_delivery(uuid, uuid, text, uuid) to authenticated;
revoke all on function public.finish_ai_participant_guide_delivery(uuid, boolean, text) from public, anon;
grant execute on function public.finish_ai_participant_guide_delivery(uuid, boolean, text) to authenticated;
