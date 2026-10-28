# ClinicConsilium website map and page placement

Last updated: 28 October 2026

## Information architecture decisions

The website has three distinct surfaces:
1. **Public website** — discover what ClinicConsilium is, read general health information, contact the team, and register organisation interest.
2. **Secure workspaces** — role-specific tools after authentication and authorization are implemented. Existing dashboard HTML pages are previews only and must not be treated as production portals.
3. **Internal operations and technical routes** — APIs, database migrations, security documentation and health checks. These must not appear in the public navigation.

Keep the original ClinicConsilium logo unchanged. Public brand colors remain navy #123B6D, teal #0D9488, white and soft grey #F3F6FA. Use clear page-specific imagery rather than repeating the same image across sections.

## Public header navigation

Use a small, predictable navigation rather than listing every page in the header:
- Home → `index.html`
- About → `about.html`
- Services → `services.html`
- Health insights → `insights.html`
- Medicine access → `pharmaceutical-store.html`
- For providers → `providers.html`
- Contact → `contact.html`
- Primary CTA: **Make an enquiry** → `contact.html`

On mobile, keep the same destinations inside an accessible menu. Do not expose dashboard preview URLs as if they were live account portals.

## Public page inventory

### Brand and discovery
- `index.html` — homepage and primary entry point.
- `about.html` — mission, operating role and Nigeria-first vision.
- `how-it-works.html` — explain the current enquiry journey and future phases without implying unavailable features.
- `services.html` — overview of current and planned service pathways.
- `safety.html` and `trust-security.html` — safety boundaries, provider verification approach and platform security principles.
- `status.html` — service availability and honest feature-status disclosures.

### Healthcare information
- `insights.html` — public health information and educational articles; content should be editorially reviewed and not personalized diagnosis.
- `faq.html` — common questions.
- Future optional: a dedicated topic/category page only when there is enough reviewed content to justify it.

### Enquiries and partnerships
- `contact.html` — general non-clinical enquiries.
- `partnerships.html` — partner overview.
- `partnership-enquiry.html` — general organisation partnership interest.
- `provider-interest.html` — healthcare professional interest.
- `international-care.html` and `international-care-enquiry.html` — explain planned international-care coordination and collect only approved non-clinical interest until the service is operational.
- `pharmaceutical-store.html` — medicine-access information and separate pharmacy/supplier application.
- `careers.html` and `careers-enquiry.html` — careers information and interest.
- Future gap to add: a dedicated hospital/clinic partner information page if partner outreach needs a more specific route than the existing general partnership page.

### Legal, accessibility and support
- `privacy.html` — privacy notice; review against actual data collection and Nigerian data-protection requirements before launch.
- `terms.html` — terms of use, reviewed by qualified counsel before launch.
- `accessibility.html` — accessibility statement.
- `accessibility-feedback.html` — accessibility feedback.
- `faq.html` — support FAQs.
- `sitemap.html` — human-readable directory of public pages.
- Footer should link to Contact, FAQ, Privacy, Terms, Accessibility, Safety and Sitemap.

## Secure workspace pages (do not expose as live portals yet)

The existing HTML prototypes should remain separate by role and require real authentication, server-side authorization, audit logging and tested data access before being used with real people:
- `patient-dashboard.html` — patient workspace; future phase.
- `professional-dashboard.html` — verified healthcare professional workspace.
- `facility-dashboard.html` — hospital/clinic workspace.
- `pharmacy-dashboard.html` — pharmacy workspace; inventory disabled until regulatory/partner controls are ready.
- `coordination-dashboard.html` — authorized care-coordination staff.
- `admin-dashboard.html` — restricted platform administration.
- `portals.html` — internal preview directory for development/review only; use noindex and keep out of primary public navigation.

Do not add public sign-in, account creation or password reset links until a real authentication flow exists. When implemented, create dedicated routes for sign-in, account invitation/registration, email verification, password recovery, MFA where appropriate, and unauthorized/access-denied states.

## API and internal-only routes

- `/api/enquiries.js` — server-side enquiry submission.
- `/api/pharmacy-partners.js` — server-side pharmacy/supplier application submission.
- `/api/admin/*` — admin APIs, restricted to authenticated and authorized staff.
- `/api/health.js` — operational health/configuration check; avoid exposing secrets or sensitive infrastructure details.
- `supabase/migrations/*` — database schema migrations.
- `docs/*` — implementation, security, governance and launch checklists.

API routes are not web pages and should not be placed in navigation.

## Launch status labels

Use only these distinctions across public pages:
- **Available now:** public information and general/partner enquiries only where the relevant endpoint is configured and end-to-end tested.
- **In preparation:** partner verification and directory planning.
- **Not yet available:** patient accounts, live provider search, appointments, clinical record exchange, video consultations, payments, live medicine stock, medicine sales/sourcing and international treatment booking.

Do not claim an enquiry was received unless the server confirms storage. Do not label a pharmacy, provider or medicine as verified/listed without current, reviewed evidence.

## Recommended implementation order

1. Publish this map and standardize header/footer destinations.
2. Audit every existing public page for duplicate content, stale links, inaccurate live-feature claims and unique imagery.
3. Make forms consistent and test every submission against a working backend.
4. Finish secure admin sign-in, enquiry listing/status updates, and audit logs.
5. Add missing dedicated partner pages only where they improve a real workflow.
6. Build authentication and role dashboards before collecting patient records or enabling clinical features.
7. Add directories, appointments, record sharing and medicine inventory in later, separately reviewed phases.
