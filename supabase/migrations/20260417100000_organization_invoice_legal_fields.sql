alter table public.organization_settings
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists legal_form text,
  add column if not exists share_capital text,
  add column if not exists vat_number text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists payment_terms text,
  add column if not exists late_penalty_terms text,
  add column if not exists collection_fee_terms text,
  add column if not exists vat_exemption_text text;

update public.organization_settings
set
  address = coalesce(nullif(address, ''), 'BAT A MINELLI'),
  postal_code = coalesce(postal_code, '20200'),
  city = coalesce(city, 'VILLE-DI-PIETRABUGNO'),
  vat_number = coalesce(vat_number, 'FR36 994 300 739'),
  legal_form = coalesce(legal_form, 'SAS, societe par actions simplifiee')
where regexp_replace(coalesce(siret, ''), '\D', '', 'g') = '99430073900012';
