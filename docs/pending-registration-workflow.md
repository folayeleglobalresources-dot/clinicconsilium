# Pending registration and verification workflow

## Registration lifecycle
- Supabase Auth creates the identity and sends the configured email confirmation.
- A database trigger records a pending registration from the submitted name and account intent. The intent is limited to patient or professional and is not an access grant.
- Unconfirmed accounts remain `pending_email`.
- When a confirmed patient checks account status, the server moves the registration to `approved` and provisions the `patient` app-metadata role.
- Confirmed professional registrations move to `pending_review`. An allow-listed administrator must verify the stated professional credential and then separately approve access.
- Rejection or suspension clears the relevant ClinicConsilium role from server-managed `app_metadata`.
- Organisation workspaces remain governed by organisation records and active organisation memberships. This workflow never creates an organisation membership.

## Security boundaries
- `account_registrations` has RLS enabled and no browser-role grants. Only trusted server routes use the service-role key.
- The trigger reads `raw_user_meta_data` only to record the user's requested pathway. It does not use user metadata for authorization.
- Role claims are written only to `app_metadata` by trusted server routes after checking email confirmation and the registration record.
- Professional access requires a separate credential-verification action before approval.
- The registration record is the source of truth; future dashboard APIs must verify approved status and the appropriate role, not rely on a user-editable profile field.
- No patient clinical records are collected in this process.

## Required environment
Keep these values configured in Vercel Preview and Production:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `CLINICCONSILIUM_ADMIN_EMAILS` (comma-separated administrator emails)

Supabase Auth must have email confirmation enabled and the allowed redirect URL `https://clinicconsilium.vercel.app/account.html` configured. Use a trusted SMTP provider before broad public onboarding.

## Review interface
- `/admin-registrations.html` is an administrator-only interface backed by `/api/admin/registrations`.
- The API revalidates the signed-in identity and the configured admin allow-list on every request.
- Professional credential references and internal notes are restricted to the admin API.
- Do not store uploaded identity documents or clinical data in registration records.
