# ClinicConsilium — Implementation Roadmap

## Product vision
ClinicConsilium is a Nigeria-first healthcare access and coordination platform, with a planned path to serve other African countries. The long-term product should connect patients to qualified healthcare professionals, hospitals and clinics, pharmacies and legitimate medicine pathways, referrals, and international treatment options. It should support consent-based continuity of care and secure sharing of health records between participating providers.

## Phase 0 — Safe public launch (current scope)
The first release is deliberately limited to:
- Public health information and educational content.
- General enquiries.
- Partner-interest forms for qualified healthcare professionals, clinics/hospitals, pharmacies, and organisations.
- A secure, staff-only enquiry management dashboard.
- Privacy notice, terms, contact information, accessibility, and clear statements that the site is not an emergency service.
- Basic analytics and operational monitoring that avoid collecting unnecessary health information.

Medicine sourcing, patient accounts, clinical records, diagnosis/treatment workflows, appointments, payments, video consultations, and cross-border treatment booking are deferred until governance, licensing, partners, and security requirements are reviewed.

## Phase 1 — Partner and service directory
- Verified healthcare professional profiles and specialties.
- Participating hospital/clinic and pharmacy profiles.
- Search and filters by location, specialty, service, and availability where partners provide reliable data.
- Verification workflow, document review, expiry/re-verification, complaints and suspension process.
- Clear distinction between listed providers and services that ClinicConsilium directly operates.

## Phase 2 — Patient coordination
- Patient accounts with strong authentication and consent controls.
- Enquiry-to-referral workflow and appointment requests.
- Patient-controlled record upload and sharing, with audit logs and revocable permissions.
- Provider-to-provider information exchange only under a defined legal basis and explicit, recorded access controls.
- Notifications, support workflows, and accessibility/language preferences.

## Phase 3 — Medicines access pathways
- Pharmacy inventory/availability listings sourced from participating pharmacies.
- Time-stamped availability and stock freshness indicators.
- Lawful prescription checks and pharmacist review where required.
- No unverified sellers or claims of availability without current partner data.
- Cross-border sourcing or shipping only after regulatory, import, licensing, cold-chain, and pharmacovigilance requirements are validated for each jurisdiction.

## Phase 4 — Advanced coordination
- International treatment enquiry, provider quotations, referrals and booking coordination.
- Secure telehealth integrations with qualified providers.
- Payments only after provider, refund, safeguarding, and regulatory processes are established.
- Hospital/pharmacy integrations, structured interoperability, and country-specific expansion.

## Platform foundations
- GitHub: source code, migrations, tests, documentation, and reviewed changes.
- Vercel: website and server-side API deployment. Secrets must be server-side only.
- Supabase: PostgreSQL database, row-level security, migrations, and (when required) authentication.
- Email provider: transactional notifications only after sender/domain configuration and recipient ownership are confirmed.

## Current technical state
- Supabase project: ClinicConsilium Project.
- Initial `public.enquiries` table has been created with row-level security enabled and public table access revoked.
- `api/enquiries.js` exists for server-side enquiry storage and optional email delivery.
- `api/health.js` reports configuration state; it does not prove live database connectivity.
- Admin dashboard remains a prototype until real authentication, server-side list/update endpoints, audit logging, and end-to-end tests are implemented.
- Vercel needs `SUPABASE_SERVICE_ROLE_KEY` configured as an encrypted server-side secret before the API can persist enquiries. Never put this key in frontend code, GitHub, public environment variables, or chat.

## Immediate implementation checklist
1. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLINICCONSILIUM_ENQUIRY_TO` in Vercel for the required environments.
2. Add real admin authentication and role checks before building admin read/update endpoints.
3. Test enquiry validation, persistence, email failure handling, rate limiting, and abuse protection.
4. Implement server-side pagination, status changes, admin notes, and an audit trail.
5. Review privacy notice, data retention/deletion, consent wording, and incident response before enabling public forms.
6. Run Supabase security and performance advisors; resolve issues before launch.
7. Add automated tests and verify the production deployment after each change.

## Launch safety rules
- Do not collect medical records or detailed clinical histories during Phase 0.
- Never expose service-role credentials in browser bundles or logs.
- Restrict admin access; do not rely on a hidden URL as security.
- Keep access logs for administrative actions, minimize retained data, and define retention/deletion rules.
- Do not imply providers, medicines, emergency response, or international treatment are available unless confirmed.
- Obtain appropriate legal, clinical governance, data-protection, and regulatory review before expanding beyond informational and partner-enquiry functions.
