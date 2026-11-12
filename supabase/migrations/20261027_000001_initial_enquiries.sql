-- ClinicConsilium initial-release enquiry storage.
-- Store only general enquiries and partner-interest submissions; never clinical records.
create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  role text not null check (char_length(role) between 1 and 80),
  interest text not null default '' check (char_length(interest) <= 1500),
  enquiry_type text not null default 'general'
    check (enquiry_type in ('general', 'partnership', 'professional_interest', 'organisation_interest', 'international_care')),
  status text not null default 'new'
    check (status in ('new', 'in_review', 'responded', 'closed', 'spam')),
  source text not null default 'website',
  email_delivery_status text not null default 'pending'
    check (email_delivery_status in ('pending', 'sent', 'failed', 'not_configured')),
  email_delivery_reference text,
  admin_notes text not null default '' check (char_length(admin_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_created_at_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_role_idx on public.enquiries (role);

create or replace function public.set_enquiries_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enquiries_updated_at_trigger on public.enquiries;
create trigger enquiries_updated_at_trigger
before update on public.enquiries
for each row execute function public.set_enquiries_updated_at();

-- No public/anon/authenticated access policies are intentionally created.
-- Only trusted server-side code using the Supabase service-role key may access
-- this table. Never expose that key in browser JavaScript or commit it to Git.
alter table public.enquiries enable row level security;
revoke all on table public.enquiries from anon, authenticated;


-- Pharmacy and qualified supplier applications are organisation data, not patient records.
create table if not exists public.pharmacy_partner_applications (
  id uuid primary key default gen_random_uuid(),
  organisation_name text not null check (char_length(organisation_name) between 2 and 180),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_email text not null check (char_length(contact_email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  organisation_type text not null
    check (organisation_type in ('community_pharmacy', 'hospital_pharmacy', 'licensed_distributor', 'manufacturer', 'other_qualified_supplier')),
  licence_type text check (licence_type is null or char_length(licence_type) <= 120),
  licence_number text check (licence_number is null or char_length(licence_number) <= 120),
  country_code text check (country_code is null or char_length(country_code) <= 3),
  state_region text check (state_region is null or char_length(state_region) <= 100),
  city text check (city is null or char_length(city) <= 100),
  website text check (website is null or char_length(website) <= 200),
  status text not null default 'pending_review'
    check (status in ('pending_review', 'under_review', 'approved', 'rejected', 'suspended')),
  internal_notes text not null default '' check (char_length(internal_notes) <= 2000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pharmacy_partner_applications_created_at_idx
  on public.pharmacy_partner_applications (created_at desc);
create index if not exists pharmacy_partner_applications_status_created_at_idx
  on public.pharmacy_partner_applications (status, created_at desc);

create or replace function public.set_pharmacy_partner_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pharmacy_partner_applications_updated_at_trigger
  on public.pharmacy_partner_applications;
create trigger pharmacy_partner_applications_updated_at_trigger
before update on public.pharmacy_partner_applications
for each row execute function public.set_pharmacy_partner_updated_at();

alter table public.pharmacy_partner_applications enable row level security;
revoke all on table public.pharmacy_partner_applications from anon, authenticated;
