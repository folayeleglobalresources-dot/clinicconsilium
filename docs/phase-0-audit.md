# Phase 0 — Project audit and discovery

**Status:** In progress — owner decisions partially confirmed  
**Audit date:** 2026-10-23  
**Repository:** https://github.com/folayeleglobalresources-dot/clinicconsilium  
**Current public preview:** https://clinicconsilium.vercel.app  
**Product tagline:** Trusted Healthcare. Without Borders.

## 1. Executive summary

ClinicConsilium currently has a responsive, single-file HTML/CSS/JavaScript landing-page prototype and initial planning documents. It communicates the intended Nigeria-first healthcare access concept, but it is not yet a functioning healthcare platform. There is no confirmed production backend, user authentication, persisted enquiry submission, live provider directory, medicine inventory, appointment workflow, health-record storage, payment integration, or clinical messaging.

**Phase 0 conclusion:** Do not collect or process real patient information or represent the service as operational. The next implementation should begin with a scoped, low-risk public information website and partner-interest workflow, while product governance, regulatory advice, data protection, clinical responsibilities and medicine-sourcing boundaries are clarified.

## 2. Repository audit

### Confirmed present
- `index.html`: responsive landing page with navigation, service descriptions, record-continuity concept, provider-partner messaging, FAQs, and demo forms.
- `README.md`: documents the prototype status and limitations.
- `docs/architecture.md`: outlines patient, professional, facility, pharmacy/sourcing, coordination and admin areas.
- `docs/roadmap.md`: initial staged production roadmap.
- `docs/security-and-compliance.md`: initial Nigeria-first security and governance checklist.
- `prisma/schema.prisma`: proposed PostgreSQL/Prisma data model starter.

### Not found in repository root during this audit
- Application package manifest/build scripts or an application framework.
- Backend/API implementation.
- Database migrations or a deployed database configuration.
- Authentication/session management or role enforcement.
- Automated test suite or CI test workflow.
- Private file-storage integration.
- Working email, SMS, payment, telehealth or partner-system integrations.
- Implemented privacy policy, terms of service, consent flow, or operational incident process.

These are repository observations, not claims about any external systems that may exist outside this repository.

## 3. Prototype behaviour and user-facing risks

- The interest form and newsletter are handled in browser JavaScript only; they do not send or persist submissions.
- The page itself warns that forms are demonstrations and tells users not to enter sensitive health information.
- Service descriptions include future-state concepts such as patient accounts, health records and provider coordination. Those must remain clearly marked as planned until implemented.
- The page uses a generic plus-symbol wordmark, not the original logo asset. The owner will provide the intended logo later; preserve the current placeholder until then.
- The page references remote Unsplash images and Google Fonts, so the public page depends partly on third-party availability and requests.
- A privacy approach and terms/service-status links currently point to the FAQ area rather than dedicated legal pages.
- A static landing page can be deployed independently, but deployment alone does not establish that healthcare workflows or compliance controls are operational.

## 4. Initial data-model review

The Prisma schema is explicitly labelled a proposed starter model. It contains useful initial concepts: users, patient profiles, organisations, memberships, credentials, health records, access grants, medicines, medicine listings, sourcing cases/events and audit events.

It is **not ready for production migrations**. Before use, review at least:
- Authentication identity, account recovery, MFA and session lifecycle.
- Explicit role/permission model and organisation/tenant boundaries; avoid relying on free-text role fields.
- Record access-grant semantics, consent/legal basis, expiry, revocation and audit coverage.
- Versioning and correction workflows for clinical records, with provenance and no silent overwrites.
- Safe storage of sensitive emergency-contact details and all clinical documents.
- Credential evidence access, verification source, verifier accountability and re-check schedules.
- Medicine listing freshness, supplier/pharmacy licence evidence, registration status, prescription checks and route-specific regulatory review.
- Referential integrity, deletion/retention rules, indexes, migration strategy and tests.
- Audit event integrity, minimisation of metadata and protection from unauthorised alteration.
- Separation of patient-entered, provider-authored, imported and independently verified data.

## 5. Recommended initial product scope

### First release candidate: public information and partner interest
1. Clear explanation of ClinicConsilium and the current service status.
2. Healthcare education and carefully reviewed non-diagnostic information.
3. Partner-interest and general contact forms connected to a secure server-side submission workflow.
4. Dedicated privacy notice and terms/service-status pages reviewed by qualified advisers.
5. Accessibility, mobile responsiveness, basic performance and abuse-protection checks.
6. A simple, authorised administrative workflow to review and respond to enquiries, if approved.

Do not include real patient accounts, medical-record uploads, clinical advice, medicine ordering, appointment guarantees, payment collection or telehealth in this first release unless separately scoped and approved.

## 6. Governance questions that block higher-risk phases

These need owner decisions and qualified professional advice; this audit does not provide legal or clinical determinations.

- **Operating entity (still open):** Which legal entity will operate the service, contract with users and partner organisations, and handle complaints?
- **Service boundary (initial assumption confirmed):** ClinicConsilium will begin as a healthcare access and coordination platform working with qualified providers. Direct clinical service provision is not in the first-release scope unless separately approved.
- **Clinical governance:** Who is accountable for clinical content, referrals, escalation and any future telehealth?
- **Data protection:** Who will be controller and processor for each data flow? What lawful basis, privacy notice, retention schedule, data-subject process and impact assessment are required?
- **Partner verification:** Which authoritative bodies and procedures will be used to verify each professional, facility and pharmacy category?
- **Medicines (decision confirmed):** Defer medicine sourcing from the first release. Begin with public information and partner enquiries. Do not accept medicine orders or promise supply. Any later medicine-access service requires a separate scope decision, authorised partners and qualified pharmacy/regulatory review.
- **Emergency handling:** What is the service's scope and escalation process for emergencies? The website must not imply emergency-response capability without an operational arrangement.
- **Geography:** Confirm Nigeria as the initial market and defer each additional country until country-specific review and partnerships are ready.
- **Data hosting and vendors:** Approve hosting, database, file storage, email/SMS vendors, access locations, backups and incident responsibilities before sensitive data is introduced.

## 7. Risks and mitigations

| Risk | Initial mitigation |
|---|---|
| Visitors mistake concepts for live healthcare services | Keep status language visible; avoid fabricated listings, availability and verification badges. |
| Personal or health information is submitted to a demo form | Keep explicit warnings; do not collect real data until secure submission and privacy controls are reviewed. |
| Unauthorised access to future health records | No live records before server-side authorisation, tenant isolation, private storage, consent and audit tests pass. |
| Unsafe or unlawful medicine sourcing | Begin with information/partner discovery only; no supply promises or transactions before licensed review and route-specific checks. |
| Unverified providers or pharmacies | Define authoritative verification evidence, reviewer, expiry and re-check process before publishing verified claims. |
| Legal pages imply compliance that has not been assessed | Obtain qualified Nigerian legal/data-protection/clinical/pharmacy advice; publish reviewed notices before collecting data. |
| Third-party assets fail or create avoidable privacy/performance exposure | Review licensing, privacy and performance; consider self-hosted approved assets for production. |

## 8. Phase 0 exit criteria

- [x] Repository and current prototype inspected.
- [x] Existing planning documents and proposed schema reviewed.
- [x] Prototype vs. production boundary recorded.
- [x] Initial MVP scope and major risks documented.
- [ ] Owner confirms the legal operating entity and who contracts with users/partners. (Open)
- [ ] Qualified Nigerian legal, data-protection, clinical and pharmacy advisers identified for applicable reviews.
- [x] Owner confirms medicine sourcing is deferred from the first release.
- [ ] Define whether the initial service will provide only information, referral and coordination, and what clinical escalation it can support.
- [ ] Data-flow map, privacy impact assessment plan and retention requirements approved.
- [ ] Acceptance criteria for Phase 1 approved.
- [ ] Phase 0 findings reviewed and approved by the owner.

## 9. Recommendation

Proceed with a low-risk **public information and partner-interest MVP** first. Keep the present landing page as the visual baseline, preserve the placeholder brandmark until the original logo is supplied, and make service-status wording unmistakable. Build server-side enquiry handling only after the data-flow, privacy notice, access controls, retention and operational ownership are decided. Treat accounts, health records, medicine fulfilment and clinical workflows as separate gated releases.


## 10. Owner decisions recorded — 2026-10-23

### Confirmed
1. **First-release medicine scope:** Defer medicine sourcing. Focus on public information and partner enquiries first. No medicine ordering, fulfilment, or supply promises in the first release.
2. **Initial operating role:** Healthcare access and coordination platform working with qualified healthcare providers. This is the starting assumption, not a determination that ClinicConsilium itself is a licensed clinical provider.

### Remaining owner decisions
1. **Legal operating entity:** Identify the legal entity that will operate ClinicConsilium, own the service, contract with users/partners and handle complaints.
2. **First-release service boundary:** Confirmed as public health information, education, general enquiries and partner-interest forms only. Referral/coordination workflows are out of scope for the first release unless later approved.
3. **Clinical content and escalation:** Name the accountable reviewer for health education and define how urgent/emergency enquiries will be handled; do not imply emergency-response capability without an operational arrangement.
4. **Partner onboarding priorities:** Initial priority is doctors and other qualified healthcare professionals. Owner/team responsible for outreach and partner verification process remain open.
5. **Enquiry ownership and contact channels:** The recipient is undecided. Choose the authorised team/role and approved public contact channel before enabling live forms.
6. **Data handling and hosting:** Approve the intended data controller/processor arrangements and proposed vendors only after qualified data-protection review; define minimum data collected, access, retention and deletion.
7. **Phase 1 acceptance:** Approve the proposed public information and partner-interest MVP scope and its acceptance criteria before implementation begins.
8. **Brand asset:** Upload the original logo when available; keep the current placeholder until supplied.

### Professional review still required
- Nigerian legal and regulatory advice on the operating model and public claims.
- Data-protection review, including applicable Nigeria Data Protection Act obligations, privacy notice, lawful basis, retention/deletion and whether a privacy impact assessment is required.
- Clinical review of any health education, referral language and escalation process.
- Security review before collecting personal information through a live form.


## 11. Updated remaining decisions — 2026-10-23

### Owner decisions still open
- [ ] Select the legal operating entity and accountable service owner.
- [ ] Name the authorised enquiry recipient and approve public contact channels; live forms remain disabled/non-submitting until this is settled and secure handling is implemented.
- [ ] Name the accountable clinical reviewer for health education and approve the boundary for urgent/emergency enquiries.
- [ ] Decide who leads professional outreach and who is responsible for reviewing/recording credentials before any professional is described as verified.
- [ ] Approve the data-handling approach: minimum fields, access restrictions, retention/deletion, hosting/vendor choices and incident ownership after qualified privacy review.
- [ ] Approve Phase 1 acceptance criteria and final website wording.
- [ ] Provide original logo asset when available.

### Professional review gates still open
- [ ] Qualified Nigerian legal/regulatory review of the operating model and public claims.
- [ ] Qualified data-protection review of applicable obligations, privacy notice, lawful basis, retention/deletion and impact-assessment requirements.
- [ ] Clinical review of educational content and escalation language.
- [ ] Security review of the enquiry workflow before live personal-data collection.
