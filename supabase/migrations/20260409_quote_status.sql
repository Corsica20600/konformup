do $$
begin
  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'archived');
  end if;
end
$$;

alter table if exists public.quotes
  add column if not exists status public.quote_status not null default 'draft';
