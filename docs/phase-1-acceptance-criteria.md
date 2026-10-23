# Phase 1 acceptance criteria — ClinicConsilium

**Status:** Draft for owner approval  
**Product:** ClinicConsilium — *Trusted Healthcare. Without Borders.*  
**Initial market:** Nigeria  
**Release type:** Public-facing information website; not a clinical service  
**Prerequisite:** Phase 0 governance and professional review remain open. This document defines a safe build target; it does not authorise live collection of personal information.

## 1. Purpose and release boundary

Phase 1 should make the ClinicConsilium website clear, credible, accessible and safe for public visitors, while enabling the team to express interest in professional partnerships without implying that a working healthcare marketplace or clinical service already exists.

### Included
- Public explanation of the mission, intended users, initial Nigeria focus and planned direction.
- General health education only after clinical review; information must be non-diagnostic, dated/reviewed where appropriate, and linked to credible sources.
- General enquiries and partner-interest journeys designed and tested in a non-production mode until ownership, privacy and security gates are passed.
- Dedicated About, FAQ, Contact/Enquiries, Privacy Notice, Terms of Use and Service Status pages (final names/content subject to review).
- Clear prototype/service-status disclosure and accessible emergency guidance.
- Responsive layout, accessible navigation, performance and browser compatibility checks.
- Admin handling procedure and abuse controls documented before any live form is enabled.

### Excluded from Phase 1
- Diagnosis, treatment recommendations, triage, prescriptions or emergency response.
- Referral coordination or appointment booking.
- Patient accounts, medical records, document/image uploads or patient portals.
- Medicine ordering, sourcing, inventory claims, delivery, payment or guarantees of supply.
- Claims that a professional or organisation is verified unless evidence and a defined verification process support that exact claim.
- Claims of live integrations, secure submission, availability or operational service where these are not demonstrably implemented.

## 2. Public content acceptance criteria

- [ ] The home page states what ClinicConsilium is, its current service status and what visitors can do today.
- [ ] The phrase “Trusted Healthcare. Without Borders.” is used consistently, without implying a guarantee of clinical outcomes or cross-border availability.
- [ ] Public copy distinguishes current capabilities from planned features.
- [ ] No invented partner logos, testimonials, statistics, provider counts, credentials, regulatory approvals or success claims appear.
- [ ] Health education content has a named accountable clinical reviewer, credible sources, review date and a documented correction/removal process before publication.
- [ ] Content does not diagnose or prescribe and explains that general education is not a substitute for professional care.
- [ ] Emergency wording is clinically and locally reviewed, directs people to appropriate local emergency services, and does not imply ClinicConsilium monitors emergencies. Do not publish unverified phone numbers.
- [ ] Contact information, organisation identity and legal operator are not fabricated. Where not yet established, disclose the limitation and do not present placeholder contact details as live support.

## 3. Enquiry and partner-interest acceptance criteria

### Before enabling live submission
All gates below must be completed and approved:
- [ ] Legal operating entity and accountable service owner named.
- [ ] Authorised inbox/team and named recipient approved; access limited to those who need it.
- [ ] Data-protection review determines controller/processor roles, lawful basis, privacy notice, retention/deletion and whether an impact assessment is needed.
- [ ] Security review approves the backend, hosting, access controls, secrets management, abuse prevention, logging and incident process.
- [ ] Forms use server-side validation and safe error handling; submissions are not sent to third-party analytics or exposed in client code.
- [ ] A tested process exists for acknowledging, assigning, responding to and deleting enquiries.
- [ ] Privacy notice is visible at the point of collection and explains purpose, fields, recipients, retention, rights and contact route as approved by qualified review.
- [ ] End-to-end tests confirm submission, access restrictions, failure handling, retention/deletion and auditability.

### Prototype behaviour until gates pass
- [ ] Clearly label forms as a prototype/demo and state that submissions are not sent or monitored.
- [ ] Do not collect real personal, health, identity, credential-document or other sensitive information.
- [ ] Use client-side demo interactions only if they do not imply that a real enquiry has been received.
- [ ] Prefer disabling submission and providing no misleading success confirmation over collecting data without an approved process.
- [ ] Do not provide file uploads in Phase 1.

### Minimum field principles
Final fields must be approved by privacy review. Collect only what is necessary. A partner-interest form may eventually request a name, professional role, organisation, professional contact method, general location and a short non-sensitive message. Do not request patient details, medical history, identity numbers, bank details, passwords or credential documents through the public form. Credential checks should use a separately approved workflow.

## 4. Privacy, terms and service-status pages

- [ ] Privacy Notice is a dedicated page, not an FAQ link or generic placeholder.
- [ ] Terms of Use is a dedicated page, not an FAQ link or generic placeholder.
- [ ] Both are reviewed by qualified Nigerian legal/privacy advisers before launch.
- [ ] Pages accurately identify the operator and contact route; no invented entity or address.
- [ ] Service Status page (or equivalent prominent disclosure) distinguishes prototype features from live capabilities.
- [ ] Explain that the site does not currently provide emergency care, diagnosis, treatment, prescriptions, patient-record storage or medicine fulfilment.
- [ ] Avoid asserting compliance, certification or legal approval without documented evidence.

## 5. Accessibility, usability and quality

- [ ] Layout works at mobile, tablet and desktop widths without horizontal overflow.
- [ ] Keyboard navigation, visible focus, semantic headings, form labels and meaningful link text work.
- [ ] Text/background contrast is checked against WCAG 2.2 AA targets; colour is not the only way to convey status.
- [ ] Images have appropriate alternative text; decorative images are ignored by assistive technology.
- [ ] Reduced-motion preference is respected; animations do not block content.
- [ ] Interactive controls have clear disabled, loading, success and error states where applicable.
- [ ] No broken internal links, console errors or misleading placeholder actions remain.
- [ ] Check current major desktop/mobile browsers, 200% zoom, and a slow/mobile network profile.
- [ ] Third-party fonts/images and analytics (if any) are documented and reviewed for privacy, performance, licensing and availability.
- [ ] Basic SEO metadata, page titles, social preview metadata and a favicon/temporary brand mark are present. Keep the current logo placeholder until the owner supplies the original logo.

## 6. Security and abuse checks

- [ ] No secrets, private keys or service credentials are present in client-side source or repository history.
- [ ] No real personal or health information appears in code, test fixtures, screenshots, logs or public issues.
- [ ] External links use safe handling; user-supplied text is rendered without unsafe HTML execution.
- [ ] If any endpoint is added, test server-side validation, rate limiting/abuse controls, error disclosure and access control.
- [ ] Dependency and deployment configuration are reviewed; HTTPS and secure response headers are checked.
- [ ] Security findings are recorded with severity and an owner; critical/high findings block launch until resolved or formally risk-accepted by the accountable owner and qualified reviewer.

## 7. Release evidence and sign-off

The Phase 1 release candidate must include:
- [ ] A list of pages and features, labelled live, demo-only or planned.
- [ ] Test results for mobile/responsive, accessibility, links, browser compatibility and security checks.
- [ ] Approved public copy and reviewed privacy/terms documents.
- [ ] Written decision on whether forms remain disabled/demo-only or are approved for live collection.
- [ ] Named operator, service owner, content reviewer and enquiry handler (if live enquiries are approved).
- [ ] Outstanding risks, mitigations, owners and review dates.
- [ ] Owner approval and legal/privacy/clinical/security approvals relevant to the capabilities actually launching.

**Exit rule:** Phase 1 is not ready for public launch merely because the page renders or deploys. Any capability involving personal information must remain disabled until its specific governance, privacy and security gates pass. Phase 1 approval does not authorise patient accounts, clinical workflows, medicine access, payment collection or country expansion.
