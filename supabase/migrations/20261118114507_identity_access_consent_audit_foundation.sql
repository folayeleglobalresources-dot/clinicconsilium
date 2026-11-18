-- ClinicConsilium identity, organisation access, patient consent and audit foundation.
-- No clinical-record content is stored in these tables.

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(legal_name) between 2 and 200),
  display_name text not null check (char_length(display_name) between 2 and 160),
  organisation_type text not null check (organisation_type in ('hospital','clinic','pharmacy','laboratory','provider_group','other')),
  country_code char(2) not null default 'NG',
  state_region text,
  city text,
  status text not null default 'pending_review' check (status in ('pending_review','active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','platform_admin','support_agent','care_coordinator','credential_reviewer','privacy_officer')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (revoked_at is null or revoked_at >= granted_at)
);
create unique index platform_role_assignments_one_active_role
  on public.platform_role_assignments(user_id, role) where revoked_at is null;
create index platform_role_assignments_user_idx
  on public.platform_role_assignments(user_id);

create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('facility_admin','clinician','nurse','records_officer','pharmacist','lab_staff','coordinator')),
  status text not null default 'invited' check (status in ('invited','active','suspended','removed')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);
create index organisation_memberships_user_status_idx
  on public.organisation_memberships(user_id, status);
create index organisation_memberships_org_status_idx
  on public.organisation_memberships(organisation_id, status);

create table public.patient_data_consents (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_organisation_id uuid references public.organisations(id) on delete cascade,
  purpose text not null check (char_length(purpose) between 3 and 500),
  data_categories text[] not null check (
    cardinality(data_categories) between 1 and 20
    and data_categories <@ array['profile','appointments','medication_list','consultation_notes','diagnostic_reports','imaging','prescriptions','discharge_summaries','care_plan','full_record']::text[]
  ),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((recipient_user_id is not null)::integer + (recipient_organisation_id is not null)::integer = 1),
  check (expires_at is null or expires_at > granted_at),
  check ((status = 'revoked' and revoked_at is not null) or (status <> 'revoked' and revoked_at is null))
);
create index patient_data_consents_patient_status_idx
  on public.patient_data_consents(patient_user_id, status);
create index patient_data_consents_recipient_user_idx
  on public.patient_data_consents(recipient_user_id, status) where recipient_user_id is not null;
create index patient_data_consents_recipient_org_idx
  on public.patient_data_consents(recipient_organisation_id, status) where recipient_organisation_id is not null;

create table public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete set null,
  patient_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  resource_type text not null check (char_length(resource_type) between 2 and 100),
  resource_id text,
  purpose text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index security_audit_events_created_idx on public.security_audit_events(created_at desc);
create index security_audit_events_actor_idx on public.security_audit_events(actor_user_id, created_at desc);
create index security_audit_events_patient_idx on public.security_audit_events(patient_user_id, created_at desc);
create index security_audit_events_org_idx on public.security_audit_events(organisation_id, created_at desc);

alter table public.organisations enable row level security;
alter table public.platform_role_assignments enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.patient_data_consents enable row level security;
alter table public.security_audit_events enable row level security;

create policy "users_read_own_platform_role_assignments"
  on public.platform_role_assignments for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "service_role_manage_platform_role_assignments"
  on public.platform_role_assignments for all to service_role
  using (true) with check (true);

create policy "users_read_own_organisation_memberships"
  on public.organisation_memberships for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "service_role_manage_organisation_memberships"
  on public.organisation_memberships for all to service_role
  using (true) with check (true);

create policy "members_read_their_organisations"
  on public.organisations for select to authenticated
  using (exists (
    select 1 from public.organisation_memberships m
    where m.organisation_id = organisations.id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  ));
create policy "service_role_manage_organisations"
  on public.organisations for all to service_role
  using (true) with check (true);

create policy "patients_read_own_data_consents"
  on public.patient_data_consents for select to authenticated
  using ((select auth.uid()) = patient_user_id);
create policy "named_recipients_read_active_consents"
  on public.patient_data_consents for select to authenticated
  using (
    status = 'active'
    and (
      recipient_user_id = (select auth.uid())
      or (
        recipient_organisation_id is not null
        and exists (
          select 1 from public.organisation_memberships m
          where m.organisation_id = patient_data_consents.recipient_organisation_id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
        )
      )
    )
  );
create policy "patients_create_own_data_consents"
  on public.patient_data_consents for insert to authenticated
  with check (
    (select auth.uid()) = patient_user_id
    and status = 'active'
    and revoked_at is null
  );
create policy "patients_revoke_own_data_consents"
  on public.patient_data_consents for update to authenticated
  using ((select auth.uid()) = patient_user_id and status = 'active')
  with check (
    (select auth.uid()) = patient_user_id
    and status = 'revoked'
    and revoked_at is not null
  );
create policy "service_role_manage_patient_data_consents"
  on public.patient_data_consents for all to service_role
  using (true) with check (true);

create policy "service_role_manage_security_audit_events"
  on public.security_audit_events for all to service_role
  using (true) with check (true);

revoke all on public.organisations, public.platform_role_assignments,
  public.organisation_memberships, public.patient_data_consents,
  public.security_audit_events from anon;
grant select on public.organisations, public.platform_role_assignments,
  public.organisation_memberships to authenticated;
grant select, insert, update on public.patient_data_consents to authenticated;
grant all on public.organisations, public.platform_role_assignments,
  public.organisation_memberships, public.patient_data_consents,
  public.security_audit_events to service_role;
