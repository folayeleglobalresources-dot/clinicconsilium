# ClinicConsilium — Launch Security Checklist

## Secrets and deployment
- [ ] Add `SUPABASE_URL` in Vercel.
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` as an encrypted/sensitive server-side variable in Vercel only.
- [ ] Add `CLINICCONSILIUM_ENQUIRY_TO` after confirming who monitors the inbox.
- [ ] Apply variables to Production, Preview, and Development only as appropriate; redeploy after changes.
- [ ] Confirm no secrets are committed to GitHub, included in frontend bundles, or written to logs.

## Database
- [x] Initial enquiries table exists.
- [x] Row-level security is enabled.
- [x] Public anon/authenticated table access is revoked.
- [ ] Review Supabase security and performance advisors.
- [ ] Add authenticated server-side admin access before any enquiry listing or mutation endpoint.
- [ ] Add audit events for status changes and admin notes.
- [ ] Define retention, deletion, backup, and incident-response procedures.

## Public forms
- [ ] Validate all fields server-side and constrain accepted enquiry types.
- [ ] Reject detailed health records and unnecessary sensitive information during Phase 0.
- [ ] Add rate limiting, spam controls, request size limits, and safe error messages.
- [ ] Confirm privacy notice and consent language before enabling live submissions.
- [ ] Test database failure and email-provider failure separately.
- [ ] Confirm recipient ownership and email delivery configuration.

## Admin dashboard
- [ ] Require real authentication and server-side authorization on every API route.
- [ ] Never rely on obscurity or frontend-only checks.
- [ ] Add pagination, safe search, status updates, notes, and audit trail.
- [ ] Test that anonymous users cannot read or modify enquiries.
- [ ] Verify access control with automated tests before production use.

## Product governance
- [ ] Confirm operating entity and accountable owner.
- [ ] Obtain appropriate Nigerian data-protection and healthcare regulatory review.
- [ ] Keep medicine sourcing, clinical records, diagnosis, prescriptions, payments, and treatment booking out of Phase 0.
- [ ] Publish a clear emergency disclaimer and support/contact route.
