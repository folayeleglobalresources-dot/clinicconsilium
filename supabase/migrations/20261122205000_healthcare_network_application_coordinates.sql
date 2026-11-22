-- Optional facility coordinates support nearby verified-provider discovery.
alter table public.healthcare_network_applications
  add column if not exists latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  add column if not exists longitude numeric(9,6) check (longitude is null or longitude between -180 and 180);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='healthcare_network_applications_coordinates_pair_check') then
    alter table public.healthcare_network_applications
      add constraint healthcare_network_applications_coordinates_pair_check
      check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null));
  end if;
end $$;