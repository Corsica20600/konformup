-- One open pre-quote analysis is sufficient for a company and a training type.
-- Older duplicate drafts created before this safeguard are retained for traceability
-- but cancelled so they no longer appear in the active workflow.
with ranked_duplicates as (
  select id, row_number() over (partition by company_id, training_type order by created_at asc, id asc) as position
  from public.training_needs_analyses
  where quote_id is null and status in ('draft', 'sent', 'in_progress')
)
update public.training_needs_analyses analysis
set status = 'cancelled', updated_at = timezone('utc', now())
from ranked_duplicates duplicate
where analysis.id = duplicate.id and duplicate.position > 1;

create unique index training_needs_analyses_one_active_prequote
  on public.training_needs_analyses(company_id, training_type)
  where quote_id is null and status in ('draft', 'sent', 'in_progress');
