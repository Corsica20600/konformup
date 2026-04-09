insert into public.training_sessions (
  id,
  title,
  start_date,
  end_date,
  location,
  status,
  trainer_name,
  duration_hours
)
values (
  '11111111-1111-1111-1111-111111111111',
  'SST initiale - Démonstration',
  date '2026-04-20',
  date '2026-04-21',
  'Centre de formation - Paris',
  'in_progress',
  'Camille Rousseau',
  14
)
on conflict (id) do nothing;

insert into public.training_modules (
  id,
  session_id,
  title,
  summary,
  module_order,
  estimated_minutes,
  content_text,
  video_url,
  pdf_url,
  trainer_guidance
)
values
  (
    '21111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Accueil et cadre SST',
    'Présenter le rôle du SST et le déroulé de la session.',
    1,
    45,
    'Le SST intervient pour protéger, examiner, faire alerter et secourir. Ce premier module pose le cadre de la formation.',
    'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'Présenter les objectifs pédagogiques et rappeler le rôle du SST dans l entreprise.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Protéger et examiner',
    'Analyser la situation et rechercher une détresse vitale.',
    2,
    75,
    'Le formateur accompagne la lecture de situation, la protection et l examen de la victime.',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'Faire verbaliser les étapes avant chaque exercice pratique.'
  )
on conflict (id) do nothing;

insert into public.session_module_progress (
  id,
  session_id,
  module_id,
  is_completed,
  completed_at
)
values
  (
    '31111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '21111111-1111-1111-1111-111111111111',
    true,
    timezone('utc', now())
  ),
  (
    '32222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    false,
    null
  )
on conflict (id) do nothing;

insert into public.candidates (
  id,
  session_id,
  first_name,
  last_name,
  email,
  company,
  phone,
  validation_status,
  validated_at
)
values
  (
    '41111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Alice',
    'Martin',
    'alice.martin@example.test',
    'Atelier Horizon',
    '0600000001',
    'validated',
    timezone('utc', now())
  ),
  (
    '42222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Karim',
    'Benali',
    'karim.benali@example.test',
    'LogiNord',
    '0600000002',
    'pending',
    null
  )
on conflict (id) do nothing;

insert into public.organization_settings (
  id,
  organization_name,
  address,
  siret,
  training_declaration_number,
  qualiopi_mention,
  certificate_signatory_name,
  certificate_signatory_title
)
values (
  '51111111-1111-1111-1111-111111111111',
  'Formation SST Horizon',
  '12 rue des Secouristes, 75012 Paris',
  '123 456 789 00012',
  '11 75 12345 75',
  'Organisme certifié Qualiopi au titre de la catégorie actions de formation.',
  'Direction pédagogique',
  'Responsable de formation'
)
on conflict (id) do nothing;
