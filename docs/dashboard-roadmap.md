# ClinicConsilium dashboard roadmap

## Shared product direction
Build four role-specific workspaces on one coherent design system. Use the ClinicConsilium palette: navy #123B6D, teal #0D9488, white, and soft grey #F3F6FA. Keep navigation, status language, forms, accessibility patterns, and responsive behaviour consistent while showing each role only the information and actions they need.

## 1. Admin dashboard — build first
**Purpose:** Give authorised platform administrators an operational overview and a controlled place to manage general enquiries and platform setup.

Initial modules:
- Overview: enquiry totals, new items, items in review, resolved items, and recent activity.
- Enquiry inbox: search, status filters, priority/age cues, detail view, assignment-ready structure, and status updates.
- Provider and organisation review: future queue for verification, approvals, and profile completeness; no provider is considered verified by this prototype.
- Patient and user support: future support workflow, with minimum necessary data access.
- Content and service catalogue: manage public information and service availability when a backend exists.
- Partnerships: review partner-interest submissions and follow-up status.
- Audit and settings: future role permissions, audit history, retention settings, and operational configuration.

**Initial delivery boundary:** Build the responsive interface and interaction model first. Use synthetic demo records only. Do not collect real patient data or imply that demo actions are saved. The existing enquiry-database/admin pull request is a separate backend slice and must remain unmerged until database setup, environment configuration, and end-to-end security checks are completed.

## 2. Patient dashboard
**Purpose:** Help people navigate care without presenting the platform as a clinical provider.
- Profile, language, accessibility and contact preferences.
- Find and compare care providers/services using verified data once available.
- Care navigation requests and their progress.
- Appointment/referral summaries only after provider integrations are real.
- International-care enquiries and consent-aware document checklist.
- Secure messages and documents only after private storage, identity controls, consent, access logging and retention are implemented.

## 3. Healthcare provider dashboard
**Purpose:** Give approved care organisations a workspace for their public service information and incoming requests.
- Organisation profile and service catalogue.
- Staff access and role management.
- Incoming general enquiries/referrals and response status.
- Appointment availability only after a scheduling integration exists.
- Verification documents and renewal status with restricted access.
- Activity history and service performance summaries.

## 4. Partner dashboard
**Purpose:** Support non-clinical partners and approved organisations.
- Organisation profile and partnership contacts.
- Partnership proposals and review progress.
- Approved projects, shared milestones and communications.
- Aggregate operational reports where consent and privacy allow.
- Role-scoped access; no default access to identifiable patient records.

## Shared foundations required before production
- Server-enforced authentication, role-based access and least privilege.
- Secure sessions, rate limiting, MFA for privileged roles and account recovery.
- Server-side validation, CSRF/origin protection and audit events for sensitive actions.
- Database migrations, backups and tested restoration; no secrets in source control.
- Consent, retention/deletion, incident response and privacy/legal review.
- Accessibility testing, responsive QA, security testing and realistic end-to-end tests.

## Delivery order
1. Dashboard design system and admin interface prototype.
2. Configure and validate the enquiry database/admin API independently.
3. Connect the admin UI to the protected API and test the complete workflow.
4. Build provider dashboard foundations.
5. Build patient dashboard foundations.
6. Build partner dashboard foundations.
7. Add integrations only after partner, security, privacy and operational readiness checks.

## Current status
The admin dashboard page is an interface prototype using synthetic records. It is not an authenticated admin system and does not save changes. Do not use it for real operations or enter personal/clinical data.
