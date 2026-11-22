-- Cover foreign keys used by healthcare network administration and joins.
create index if not exists healthcare_network_listings_organisation_id_idx
  on public.healthcare_network_listings (organisation_id);
create index if not exists healthcare_network_listings_owner_user_id_idx
  on public.healthcare_network_listings (owner_user_id);
create index if not exists healthcare_network_listings_reviewed_by_idx
  on public.healthcare_network_listings (reviewed_by);
