# Security and governance checklist — Nigeria-first

This is an engineering checklist, not legal advice. Obtain qualified Nigerian legal, clinical, pharmacy and data-protection advice before live operation. Review obligations in every additional country before enabling service there.

- Map the data controller/processor roles and lawful basis for each purpose; health information is sensitive personal data.
- Complete privacy impact assessment and retention/deletion schedule.
- Enforce MFA for privileged and clinical accounts, least privilege, server-side authorisation, tenant isolation and organisation-scoped access.
- Obtain and record appropriate consent/authority for record sharing; support withdrawal where applicable.
- Keep immutable audit events for viewing, creating, exporting and changing health records.
- Store documents in private object storage with encryption, malware scanning, short-lived signed links and download auditing.
- Do not place medical documents or sensitive health data in logs, analytics, email notifications or public URLs.
- Use secure sessions, CSRF protection where applicable, rate limits, input validation, secrets management, backups and tested disaster recovery.
- Verify professional credentials and facility/pharmacy licences with authoritative sources; track verifier, evidence, expiry and re-check date.
- Confirm medicine registration, prescription rules, import permits, customs, storage, transport and destination-country requirements before sourcing or shipping.
- Define incident response, breach notification, support escalation and access-review processes.
- Test with synthetic data only until production controls and approvals are complete.
