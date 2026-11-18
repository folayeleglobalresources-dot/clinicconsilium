# Identity, access control and patient consent foundation

This foundation supports the ClinicConsilium platform and organisation workspaces. It is not a clinical-record system and does not make the platform ready for live patient care.

## Data structures

- `organisations`: hospitals, clinics, pharmacies, laboratories and provider groups.
- `platform_role_assignments`: server-managed platform roles (super admin, platform admin, support, care coordination, credential review and privacy officer).
- `organisation_memberships`: server-managed, organisation-scoped facility and professional roles.
- `patient_data_consents`: patient-authorised sharing scope, recipient, purpose, expiry and revocation.
- `security_audit_events`: append-only server-written audit events.

## Access boundaries

- Platform role assignments and organisation memberships are not self-service writable. Trusted server-side administration provisions and revokes them.
- A signed-in user can read only their own role assignments and memberships.
- An organisation is visible to a signed-in user only when they have an active membership.
- A patient can create a consent for their own account and revoke an active consent. Recipients can read only active, unexpired consent records addressed to them or to an organisation where they hold an active membership.
- Audit events have no end-user read/write grants. The trusted server role appends events; database triggers reject updates and deletes.
- No platform administrator receives blanket access to clinical records through these role tables.

## Operational requirements before live use

1. Build authenticated server endpoints for provisioning roles, organisations and memberships; never accept role changes from editable user metadata.
2. Write an audit event for every sensitive record view, creation, update, export, consent grant/revocation and privileged access decision. Do not put diagnoses, record contents, passwords, tokens or other health data in audit metadata.
3. Require MFA for privileged and clinical accounts and verify identity and professional credentials before activating access.
4. Implement record-level policies that combine patient identity, verified care relationship, organisation membership, consent/legal authority, purpose and minimum-necessary data scope.
5. Keep medical documents in private storage with short-lived signed access and audited downloads.
6. Complete a Nigerian data-protection impact assessment, retention schedule, incident-response plan and legal/clinical review before collecting live health records.

## Migration notes

The migrations in this directory add the identity/access/consent foundation and harden recipient expiry checks plus audit-event append-only behaviour. Earlier database migrations were already applied to the connected project before these source files were added; reconcile the repository's pre-existing migration history before running a fresh local database bootstrap.
