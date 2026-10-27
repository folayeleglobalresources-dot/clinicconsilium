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
    check (enquiry_type in ('general', 'partnership', 'professional_interest', 'organisation_interest')),
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
