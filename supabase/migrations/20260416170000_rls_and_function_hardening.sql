alter function public.set_updated_at()
  set search_path = public;

alter function public.touch_invoice_complaints_updated_at()
  set search_path = public;

alter table public.attendance_slots enable row level security;
alter table public.attendance_responses enable row level security;
alter table public.quotes enable row level security;
alter table public.training_sessions enable row level security;
alter table public.candidates enable row level security;
alter table public.session_module_progress enable row level security;
alter table public.trainers enable row level security;
alter table public.training_modules enable row level security;
alter table public.invoice_complaints enable row level security;
alter table public.organization_settings enable row level security;
alter table public.invoices enable row level security;
alter table public.generated_documents enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.client_companies enable row level security;
alter table public.training_quizzes enable row level security;

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
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'authenticated_full_access'
    ) then
      execute format(
        'create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)',
        table_name
      );
    end if;
  end loop;
end
$$;
