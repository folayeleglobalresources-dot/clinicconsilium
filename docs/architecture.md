# Architecture

## Application areas
- Public site and educational resources
- Patient portal: profile, language preference, appointments, medicine requests and health timeline
- Professional portal: credential verification, authorised patient relationships, consultation notes and referrals
- Hospital/clinic portal: organisation membership, referrals, record import/export and discharge summaries
- Pharmacy/sourcing portal: listings, availability confirmations, sourcing cases, regulatory checks and shipment milestones
- Care coordination workspace
- Admin and credential-review workspace

## Health-record continuity
Use a longitudinal patient record with provenance for every item: source organisation, author, date, record type, status, consent/legal basis, and audit history. Distinguish patient-submitted documents from provider-authored or verified records. Corrections should be versioned; do not silently overwrite prior clinical records.

## Interoperability
Start with controlled document exchange and manual review. Add standards-based APIs (for example, FHIR where partner systems support it) only after mapping data, identity matching, consent, security and operational responsibilities. Never assume an external record is accurate merely because it was received.

## Language
Store interface locale and communication preference separately. Support English initially and prepare localisation for Yoruba, Hausa, Igbo, Nigerian Pidgin and French. Do not imply a clinician speaks a language unless verified; interpreter needs should be explicit.

## Medicines
Prioritise local availability checks, then staff-assisted sourcing. Model medicine, strength, formulation, source, registration status, supplier/pharmacy licence, stock timestamp, prescription requirement, destination, import route, quote validity, shipment status and evidence of checks. A sourcing request is not a guarantee that a medicine can be legally imported or supplied.
