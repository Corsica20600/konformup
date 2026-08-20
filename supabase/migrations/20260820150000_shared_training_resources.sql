-- Private collaborative workspace for administrators and lead trainers. No public access.
insert into storage.buckets (id, name, public)
values ('shared-training-resources', 'shared-training-resources', false)
on conflict (id) do update set public = false;

create table if not exists public.shared_training_resources (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in ('file', 'link')),
  title text not null check (btrim(title) <> ''),
  description text null,
  category text not null default 'other' check (category in ('support', 'video', 'regulation', 'exercise', 'quiz', 'administrative', 'other')),
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  requested_change text null,
  status text not null default 'to_review' check (status in ('to_review', 'approved', 'integrated', 'rejected', 'obsolete')),
  training_module_id uuid null references public.training_modules(id) on delete set null,
  integrated_note text null,
  integrated_at timestamptz null,
  integrated_by uuid null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_activity_at timestamptz not null default timezone('utc', now())
);
comment on table public.shared_training_resources is 'Private resources submitted for later pedagogical review. It never changes a module automatically.';

create table if not exists public.shared_training_resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.shared_training_resources(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  resource_type text not null check (resource_type in ('file', 'link')),
  storage_bucket text null check (storage_bucket is null or storage_bucket = 'shared-training-resources'),
  storage_path text null unique,
  external_url text null check (external_url is null or external_url ~ '^https://'),
  original_filename text null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or (size_bytes > 0 and size_bytes <= 20971520)),
  sha256 text null check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  check ((resource_type = 'file' and storage_bucket is not null and storage_path is not null and external_url is null and mime_type is not null and size_bytes is not null and sha256 is not null) or (resource_type = 'link' and external_url is not null and storage_path is null and storage_bucket is null))
);
create unique index if not exists shared_training_resource_versions_number_idx on public.shared_training_resource_versions(resource_id, version_number);
create index if not exists shared_training_resources_activity_idx on public.shared_training_resources(status, last_activity_at desc);

create table if not exists public.shared_training_resource_comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.shared_training_resources(id) on delete restrict,
  body text not null check (btrim(body) <> ''),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shared_training_resource_audit (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.shared_training_resources(id) on delete restrict,
  event_type text not null check (event_type in ('created', 'version_added', 'commented', 'status_changed', 'metadata_updated', 'marked_integrated')),
  details jsonb not null default '{}'::jsonb,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shared_training_resource_notifications (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.shared_training_resources(id) on delete restrict,
  recipient_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check (event_type in ('new_resource', 'new_version', 'new_comment', 'status_changed')),
  dedupe_key text not null unique,
  read_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists shared_training_resource_notifications_recipient_idx on public.shared_training_resource_notifications(recipient_id, read_at, created_at desc);

alter table public.shared_training_resources enable row level security;
alter table public.shared_training_resource_versions enable row level security;
alter table public.shared_training_resource_comments enable row level security;
alter table public.shared_training_resource_audit enable row level security;
alter table public.shared_training_resource_notifications enable row level security;

create policy shared_resources_manager_read on public.shared_training_resources for select to authenticated using (public.is_operational_manager());
create policy shared_resources_manager_insert on public.shared_training_resources for insert to authenticated with check (public.is_operational_manager() and created_by = auth.uid());
create policy shared_resources_admin_update on public.shared_training_resources for update to authenticated using (public.current_app_role()::text = 'admin') with check (public.current_app_role()::text = 'admin');
create policy shared_resources_lead_own_draft_update on public.shared_training_resources for update to authenticated using (created_by = auth.uid() and status = 'to_review' and public.current_app_role()::text = 'lead_trainer') with check (created_by = auth.uid() and status = 'to_review');
create policy shared_resource_versions_read on public.shared_training_resource_versions for select to authenticated using (public.is_operational_manager());
create policy shared_resource_versions_write on public.shared_training_resource_versions for insert to authenticated with check (
  public.is_operational_manager() and created_by = auth.uid() and (
    public.current_app_role()::text = 'admin'
    or exists (select 1 from public.shared_training_resources resource where resource.id = resource_id and resource.created_by = auth.uid())
  )
);
create policy shared_resource_comments_read on public.shared_training_resource_comments for select to authenticated using (public.is_operational_manager());
create policy shared_resource_comments_write on public.shared_training_resource_comments for insert to authenticated with check (public.is_operational_manager() and created_by = auth.uid());
create policy shared_resource_audit_read on public.shared_training_resource_audit for select to authenticated using (public.is_operational_manager());
create policy shared_resource_audit_write on public.shared_training_resource_audit for insert to authenticated with check (public.is_operational_manager() and performed_by = auth.uid());
create policy shared_resource_notifications_read on public.shared_training_resource_notifications for select to authenticated using (recipient_id = auth.uid());
create policy shared_resource_notifications_manager_insert on public.shared_training_resource_notifications for insert to authenticated with check (public.is_operational_manager());
create policy shared_resource_notifications_update on public.shared_training_resource_notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy shared_resource_storage_read on storage.objects for select to authenticated using (bucket_id = 'shared-training-resources' and public.is_operational_manager());
create policy shared_resource_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'shared-training-resources' and public.is_operational_manager() and (
    public.current_app_role()::text = 'admin'
    or exists (select 1 from public.shared_training_resources resource where resource.id = public.uuid_or_null(split_part(name, '/', 2)) and resource.created_by = auth.uid())
  )
);
create policy shared_resource_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'shared-training-resources' and public.is_operational_manager() and (
    public.current_app_role()::text = 'admin'
    or exists (select 1 from public.shared_training_resources resource where resource.id = public.uuid_or_null(split_part(name, '/', 2)) and resource.created_by = auth.uid())
  )
);

revoke all on table public.shared_training_resources, public.shared_training_resource_versions, public.shared_training_resource_comments, public.shared_training_resource_audit, public.shared_training_resource_notifications from anon;
