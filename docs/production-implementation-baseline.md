# Production implementation baseline

**Product direction:** ClinicConsilium is intended to become a real healthcare access and coordination service, not remain a visual demo.

## Verified repository baseline (2026-10-23)

- The default branch contains a single-file public website at `index.html` and supporting static pages.
- No `package.json` was found at the repository root at the time of this audit.
- `prisma/schema.prisma` is explicitly labelled a proposed starting model. It contains patient, health-record, organisation, credential, medicine-sourcing and audit models, but it has not been demonstrated as a migrated, deployed database.
- `docs/architecture.md`, `docs/roadmap.md`, and `docs/security-and-compliance.md` describe future capabilities and requirements; they do not themselves implement those capabilities.
- The current website has previously been described in repository documentation as a front-end prototype. No evidence in this audit establishes working patient accounts, a provider directory, record storage, appointments, referral handling, medicine fulfilment or payments.
- The existing Vercel deployment and its current build configuration must be checked independently before relying on any live change.

## Delivery principle

Build and verify working features in deployable increments. Do not label a feature live until it has an end-to-end test in the deployed environment, safe failure behaviour, monitoring/operational ownership and accurate user-facing copy.

## First implementation slice

1. Preserve the current public website while adding a minimal, dependency-free backend health endpoint.
2. Establish explicit production configuration and deployment documentation.
3. Implement enquiry intake only after the accountable recipient, data handling, retention, privacy notice, spam protection and secure delivery/storage are agreed and configured.
4. Use synthetic test data only until appropriate privacy/security controls and professional approvals are in place.

## Current blockers to patient-facing operations

- Authorised service owner and enquiry recipient are not yet confirmed.
- The legal operating entity and controller/processor roles need confirmation.
- Privacy notice, lawful basis, retention/deletion and incident response need qualified review.
- Clinical content and any emergency escalation language require qualified clinical review.
- No deployed backend/database, authentication, private document storage, or verified provider workflow has been demonstrated.

## Release scope

Initial release can provide reviewed public information and a real, securely operated general enquiry/partner-interest workflow. Patient accounts, patient health records, clinical referrals, appointment booking, consultations, payments and medicine sourcing/fulfilment must remain unavailable until each workflow is implemented, tested and approved.

## Acceptance checklist

- [ ] Source changes reviewed and committed.
- [ ] CI checks and automated tests pass.
- [ ] Deployment target and environment variables documented.
- [ ] Backend health endpoint returns truthful service status.
- [ ] Deployed version smoke-tested.
- [ ] Logs and monitoring do not expose personal or health information.
- [ ] Security, accessibility, privacy and clinical reviews completed for the features being launched.
- [ ] Owner approves launch and operating procedures.
