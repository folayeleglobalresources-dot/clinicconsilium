-- Verified healthcare network directory.
-- Public users never receive access to private credential references or review metadata.
create table if not exists public.healthcare_network_listings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  listing_type text not null check (listing_type in ('doctor','specialist','hospital','clinic','laboratory','pharmacy')),
  display_name text not null check (char_length(display_name) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '' check (char_length(summary) <= 500),
  description text not null default '' check (char_length(description) <= 3000),
  country_code char(2) not null default 'NG',
  state_region text check (state_region is null or char_length(state_region) <= 100),
  city text check (city is null or char_length(city) <= 100),
  practice_address text check (practice_address is null or char_length(practice_address) <= 240),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  specialties text[] not null default '{}',
  services text[] not null default '{}',
  languages text[] not null default '{}',
  phone text check (phone is null or char_length(phone) <= 40),
  public_email text check (public_email is null or char_length(public_email) <= 254),
  website text check (website is null or char_length(website) <= 240),
  registration_body text check (registration_body is null or char_length(registration_body) <= 160),
  credential_reference text,
  verification_status text not null default 'pending_review'
    check (verification_status in ('pending_review','verified','rejected','suspended')),
  publication_status text not null default 'unpublished'
    check (publication_status in ('unpublished','published')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication_status <> 'published' or verification_status = 'verified')
);
create index if not exists healthcare_network_public_search_idx
  on public.healthcare_network_listings (listing_type, country_code, state_region, city)
  where verification_status = 'verified' and publication_status = 'published';
create index if not exists healthcare_network_specialties_idx
  on public.healthcare_network_listings using gin (specialties);
create index if not exists healthcare_network_services_idx
  on public.healthcare_network_listings using gin (services);
create index if not exists healthcare_network_review_queue_idx
  on public.healthcare_network_listings (verification_status, created_at desc);
create or replace function public.set_healthcare_network_listing_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists healthcare_network_listings_updated_at_trigger on public.healthcare_network_listings;
create trigger healthcare_network_listings_updated_at_trigger
before update on public.healthcare_network_listings
for each row execute function public.set_healthcare_network_listing_updated_at();
alter table public.healthcare_network_listings enable row level security;
revoke all on public.healthcare_network_listings from anon, authenticated;
grant all on public.healthcare_network_listings to service_role;
drop policy if exists service_role_manage_healthcare_network_listings on public.healthcare_network_listings;
create policy service_role_manage_healthcare_network_listings
on public.healthcare_network_listings for all to service_role
using (true) with check (true);
