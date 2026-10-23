# ClinicConsilium implementation tracker

**Product:** ClinicConsilium  
**Tagline:** Trusted Healthcare. Without Borders.  
**Initial market:** Nigeria  
**Current status:** Front-end prototype; not a live healthcare service  
**Tracker owner:** Project owner  
**Working rule:** For each phase, define acceptance criteria → build → test → review → owner approval. Do not start the next phase until the current phase's exit gate is met, except for explicitly approved parallel discovery.

## Phase tracker

| Phase | Scope | Status | Exit gate |
|---|---|---|---|
| 0 | Project audit, product scope, governance, risk and MVP definition | **In progress** | Audit reviewed; operating model, service boundary, blockers and Phase 1 criteria agreed |
| 1 | Public information website, visual identity, privacy/terms pages, accessible enquiry experience | Not started | Owner approves content/design; legal notices reviewed; forms and service status tested |
| 2 | Identity, partner directories and verification workflows | Blocked by Phase 0 governance | Auth, roles, verification sources and access tests approved |
| 3 | Health-record MVP | Not started; high-risk gate | Privacy impact assessment, secure storage, consent, audit, recovery and security testing approved |
| 4 | Medicine access operations | Not started; high-risk gate | Licensed partners, product/prescription/import checks and operational accountability approved |
| 5 | Clinical and commercial integrations | Not started | Each integration has agreements, clinical/regulatory review and failure handling |
| 6 | Multi-country expansion | Not started | Country-specific legal, privacy, professional, medicine and operational review completed |

## Phase 0 checklist

- [x] Inspect repository and public landing-page source.
- [x] Read README, architecture, roadmap and security checklist.
- [x] Review proposed Prisma data model at a planning level.
- [x] Document what is and is not operational.
- [x] Recommend a low-risk first release and identify governance blockers.
- [ ] Owner confirms legal operating entity and service boundary.
- [ ] Owner decides whether medicine access is deferred from the first release.
- [ ] Identify qualified advisers and partner leads for required reviews.
- [ ] Approve Phase 1 scope and acceptance criteria.
- [ ] Owner approves Phase 0 findings.

## Current decisions / working assumptions

1. Nigeria is the first market; wider African expansion follows country-by-country review.
2. The current website is a prototype and must not be presented as an operational healthcare service.
3. The original logo will be provided by the owner later; retain the current placeholder until then.
4. No real patient data should be collected or uploaded during prototype testing.
5. No provider, pharmacy, stock, treatment or professional verification claim should be made without evidence.
6. Medicine access must not promise supply and must not begin without qualified pharmacy/regulatory review and authorised partners.
7. Recommended first release is public information plus secure partner-interest/general enquiries, with dedicated reviewed privacy and terms pages.
8. Real patient records, telehealth, payments and clinical workflows are separate gated releases.

## Change log

- 2026-10-23 — Started Phase 0 and recorded initial repository/product audit.
