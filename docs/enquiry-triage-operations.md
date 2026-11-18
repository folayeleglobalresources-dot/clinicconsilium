# Enquiry triage operations

This workspace manages website general enquiries and partner-interest submissions only. It is not a clinical case-management system. Do not place diagnoses, medical records, prescriptions, patient identifiers or other sensitive health information in enquiry notes.

## Team access
- `CLINICCONSILIUM_ADMIN_EMAILS`: comma-separated, confirmed Supabase Auth email addresses with full operational administration access.
- `CLINICCONSILIUM_STAFF_EMAILS`: comma-separated, confirmed Supabase Auth email addresses allowed to access only enquiries assigned to their exact email address.
- Administrators can assign enquiries to any configured address. Staff cannot assign or reassign cases and cannot read or update another person's enquiries.
- Staff accounts must already exist in Supabase Auth. This implementation does not create accounts or send invitations.

Add `CLINICCONSILIUM_STAFF_EMAILS` in Vercel Project Settings → Environment Variables for the required deployment environments, then redeploy. Do not commit the list or place it in browser code.

## Operations
Enquiries support an owner, assigning administrator, follow-up timestamp, status and internal operational notes. The database RPC updates the enquiry and writes corresponding history events in one transaction. The activity table is append-only. Existing records are preserved; events before this migration are not reconstructed.

The dashboard shows the latest 500 matching enquiries, not lifetime totals. Administrator views include the shared queue; staff views are scoped to their own assignments. Follow-up alerts are operational reminders, not clinical triage or emergency monitoring.

## Deployment requirements
Keep `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `CLINICCONSILIUM_ADMIN_EMAILS` configured in Vercel. The service-role key must remain server-only. Add staff emails only after those team members have confirmed Auth accounts.
