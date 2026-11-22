-- Healthcare network application intake and private credential evidence.
create table if not exists public.healthcare_network_applications (
  id uuid primary key default gen_random_uuid(),
  application_type text not null check (application_type in ('doctor','specialist','hospital','clinic','laboratory','pharmacy')),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  phone text,
  professional_title text,
  organisation_name text not null check (char_length(organisation_name) between 2 and 180),
  state_region text, city text, country_code char(2) not null default 'NG', practice_address text,
  registration_body text, registration_reference text, specialty text, services text,
  languages text[] not null default '{}', website text, summary text, participation_interest text,
  upload_token_hash text not null, upload_token_expires_at timestamptz not null default (now() + interval '24 hours'),
  status text not null default 'pending_review' check (status in ('pending_review','in_review','accepted','rejected','converted')),
  review_notes text, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
  listing_id uuid references public.healthcare_network_listings(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists healthcare_network_applications_status_idx on public.healthcare_network_applications(status, created_at desc);
create index if not exists healthcare_network_applications_type_idx on public.healthcare_network_applications(application_type, created_at desc);
alter table public.healthcare_network_applications enable row level security;
revoke all on public.healthcare_network_applications from anon, authenticated;
grant all on public.healthcare_network_applications to service_role;
drop policy if exists service_role_manage_healthcare_network_applications on public.healthcare_network_applications;
create policy service_role_manage_healthcare_network_applications on public.healthcare_network_applications for all to service_role using (true) with check (true);
create table if not exists public.healthcare_network_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.healthcare_network_applications(id) on delete cascade,
  object_path text not null unique,
  document_type text not null check (document_type in ('professional_registration','facility_licence','accreditation','other')),
  original_filename text not null check (char_length(original_filename) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size_bytes integer not null check (file_size_bytes between 1 and 3145728),
  review_status text not null default 'pending_review' check (review_status in ('pending_review','accepted','rejected')),
  uploaded_at timestamptz not null default now(), reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz
);
create index if not exists healthcare_network_documents_application_idx on public.healthcare_network_documents(application_id, uploaded_at desc);
alter table public.healthcare_network_documents enable row level security;
revoke all on public.healthcare_network_documents from anon, authenticated;
grant all on public.healthcare_network_documents to service_role;
drop policy if exists service_role_manage_healthcare_network_documents on public.healthcare_network_documents;
create policy service_role_manage_healthcare_network_documents on public.healthcare_network_documents for all to service_role using (true) with check (true);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('healthcare-network-credentials','healthcare-network-credentials',false,3145728,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set name=excluded.name,public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "healthcare_network_no_public_access" on storage.objects;
create policy "healthcare_network_no_public_access" on storage.objects for all to anon, authenticated
using (bucket_id='healthcare-network-credentials' and false)
with check (bucket_id='healthcare-network-credentials' and false);