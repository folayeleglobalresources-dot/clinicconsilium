-- Pending account registration and trusted role provisioning.
create table if not exists public.account_registrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  requested_account_type text not null check (requested_account_type in ('patient','professional')),
  status text not null default 'pending_email'
    check (status in ('pending_email','pending_review','approved','rejected','suspended')),
  verification_status text not null default 'not_required'
    check (verification_status in ('not_required','pending','verified','rejected')),
  credential_type text,
  credential_reference text,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_access_role text check (approved_access_role in ('patient','professional')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((requested_account_type = 'patient' and verification_status = 'not_required') or requested_account_type = 'professional'),
  check ((status = 'approved' and approved_access_role = requested_account_type) or (status <> 'approved' and approved_access_role is null))
);
create index if not exists account_registrations_status_created_idx on public.account_registrations(status, created_at desc);
create index if not exists account_registrations_type_status_idx on public.account_registrations(requested_account_type, status);
alter table public.account_registrations enable row level security;
revoke all on public.account_registrations from anon, authenticated;
grant all on public.account_registrations to service_role;

create or replace function public.create_pending_account_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_type text; display_name text; initial_status text; initial_verification text;
begin
  requested_type := case when new.raw_user_meta_data ->> 'account_intent' = 'professional' then 'professional' else 'patient' end;
  display_name := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '');
  if display_name is null then display_name := left(coalesce(split_part(new.email, '@', 1), 'ClinicConsilium user'), 120); end if;
  initial_status := case when new.email_confirmed_at is null then 'pending_email' else 'pending_review' end;
  initial_verification := case when requested_type = 'professional' then 'pending' else 'not_required' end;
  insert into public.account_registrations(user_id,email,full_name,requested_account_type,status,verification_status)
  values(new.id,lower(new.email),display_name,requested_type,initial_status,initial_verification)
  on conflict(user_id) do nothing;
  return new;
end; $$;
revoke all on function public.create_pending_account_registration() from public, anon, authenticated;
drop trigger if exists auth_user_create_pending_registration on auth.users;
create trigger auth_user_create_pending_registration after insert on auth.users
for each row execute function public.create_pending_account_registration();
