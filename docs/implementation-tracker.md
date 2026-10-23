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
| 0 | Project audit, product scope, governance, risk and MVP definition | **In progress — legal-entity direction agreed; formation and governance remain open** | Legal form/name, accountable service owner, remaining service boundaries and review owners agreed; owner approves audit |
| 1 | Public information website, visual identity, privacy/terms pages, accessible enquiry experience | **Acceptance criteria drafted — awaiting approval** | Meet `docs/phase-1-acceptance-criteria.md`; owner approves; relevant legal/privacy/clinical/security gates pass for the features actually launching |
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
- [x] Owner confirms medicine sourcing is deferred from the first release.
- [x] Initial operating role set as healthcare access and coordination working with qualified providers.
- [x] Owner chooses direction: establish a new company or registered organisation as ClinicConsilium's operating entity.
- [ ] Determine and register the specific legal form and name; confirm accountable service owner.
- [x] Owner confirms first-release scope: public health information, education, general enquiries and partner-interest forms only.
- [x] Owner sets initial partner priority: doctors and other qualified healthcare professionals.
- [x] Enquiry recipient remains undecided; live forms must not be enabled until assigned and secure handling is ready.
- [ ] Name accountable reviewer for health education and confirm emergency/escalation limits.
- [ ] Identify qualified advisers and partner leads for required reviews.
- [x] Draft Phase 1 scope and acceptance criteria in `docs/phase-1-acceptance-criteria.md`.
- [ ] Owner approves Phase 1 criteria.
- [ ] Owner approves Phase 0 findings.

## Current decisions / working assumptions

1. Nigeria is the first market; wider African expansion follows country-by-country review.
2. The current website is a prototype and must not be presented as an operational healthcare service.
3. The original logo will be provided by the owner later; retain the current placeholder until then.
4. No real patient data should be collected or uploaded during prototype testing.
5. No provider, pharmacy, stock, treatment or professional verification claim should be made without evidence.
6. Medicine access must not promise supply and must not begin without qualified pharmacy/regulatory review and authorised partners.
7. First-release decision: defer medicine sourcing; begin with public information and partner enquiries. No ordering or supply promises.
8. Initial operating role: healthcare access and coordination working with qualified providers, subject to confirming the exact service boundary and qualified review.
9. **Legal-entity direction:** establish a new company or registered organisation for ClinicConsilium. The specific legal form, registered name, registration and accountable service owner are not yet confirmed; do not represent the entity as already incorporated.
10. Dedicated reviewed privacy and terms pages are required; live personal-data collection also requires an approved secure handling process.
11. Real patient records, telehealth, payments and clinical workflows are separate gated releases.
12. Phase 1 criteria are drafted; they do not themselves authorise launch or live data collection.

## Remaining owner decisions

- [ ] Select the specific legal form and name, complete required registration, and identify the accountable service owner.
- [x] First-release scope confirmed: public health information, education, general enquiries and partner-interest only; referral/coordination workflows excluded unless separately approved.
- [ ] Name the accountable reviewer for health education and define emergency/urgent-enquiry boundaries.
- [x] Initial partner priority: doctors and other qualified healthcare professionals.
- [ ] Assign the person/team responsible for partner outreach, credential review and replies.
- [ ] Assign authorised enquiry recipient and approve public contact channels before live forms are enabled.
- [ ] Approve data-handling and hosting approach after qualified privacy review.
- [ ] Approve Phase 1 acceptance criteria.
- [ ] Upload original logo when available; keep placeholder until then.

## Professional review gates

- [ ] Nigerian legal/regulatory review of the proposed operating model, entity form and public claims.
- [ ] Data-protection review of controller/processor roles, data minimisation, notice, retention/deletion and impact-assessment needs.
- [ ] Clinical review of educational content, referral wording and escalation limits.
- [ ] Security review before live collection of personal information.

## Change log

- 2026-10-23 — Completed a source-level pass across the homepage and five information pages: checked document titles and same-page fragment targets, confirmed prototype/form disclosures and preliminary legal-page labels, removed a duplicate form option, and documented remaining browser/accessibility/security checks in `docs/phase-1-prototype-qa.md`. This is not production sign-off.

- 2026-10-23 — Added dedicated About, Contact/Enquiries, Privacy Notice, Terms of Use and Service Status prototype pages, and linked them from the homepage. Privacy and terms copy is explicitly preliminary and requires qualified review; the Contact page explains that submissions are not active. Page files were fetched back from GitHub to confirm they exist.

- 2026-10-23 — Updated the public prototype to display a clear not-live status, clarify that demo forms do not transmit or store submissions, and align health-record and medicine-sourcing copy with the approved first-release scope. This is a copy/scope pass, not a compliance approval or production launch.

- 2026-10-23 — Started Phase 0 and recorded initial repository/product audit.
- 2026-10-23 — Owner confirmed medicine sourcing is deferred from first release and initial operating role is healthcare access/coordination with qualified providers.
- 2026-10-23 — Owner confirmed first-release scope is public health information, education, general enquiries and partner-interest forms only; initial partner priority is doctors and other qualified healthcare professionals. Enquiry recipient remains undecided.
- 2026-10-23 — Drafted Phase 1 acceptance criteria covering scope, content, form safety, privacy/legal pages, accessibility, security and release sign-off.
- 2026-10-23 — Owner chose to establish a new company or registered organisation as the intended legal operating entity. Specific legal form, name, registration and accountable service owner remain to be determined.
