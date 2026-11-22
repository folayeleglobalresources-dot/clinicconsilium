alter table public.enquiries
  add column if not exists data_request_type text,
  add column if not exists data_request_authority_confirmed boolean;

alter table public.enquiries
  drop constraint if exists enquiries_enquiry_type_check;

alter table public.enquiries
  add constraint enquiries_enquiry_type_check
  check (enquiry_type = any (array[
    'general'::text,
    'partnership'::text,
    'professional_interest'::text,
    'organisation_interest'::text,
    'international_care'::text,
    'data_protection_request'::text
  ]));

alter table public.enquiries
  add constraint enquiries_data_request_type_check
  check (
    data_request_type is null
    or data_request_type = any (array[
      'access'::text,
      'rectification'::text,
      'erasure'::text,
      'restriction'::text,
      'objection'::text,
      'portability'::text,
      'withdraw_consent'::text,
      'automated_decision'::text,
      'complaint'::text,
      'other'::text
    ])
  );

alter table public.enquiries
  add constraint enquiries_data_request_authority_check
  check (
    (enquiry_type = 'data_protection_request'
      and data_request_type is not null
      and data_request_authority_confirmed is true)
    or
    (enquiry_type <> 'data_protection_request'
      and data_request_type is null
      and data_request_authority_confirmed is null)
  );

comment on column public.enquiries.data_request_type is
  'Data subject request category under the Nigeria Data Protection Act; null for ordinary enquiries.';
comment on column public.enquiries.data_request_authority_confirmed is
  'Records that the submitter affirmed they are the data subject or authorised representative; identity verification is handled separately.';
