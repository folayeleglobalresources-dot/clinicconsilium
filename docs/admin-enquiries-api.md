# Secure admin enquiry workspace setup

The admin enquiry API is designed for the Phase 0 release only. It handles general enquiries and partner-interest submissions; it is not a clinical record system.

## Required Vercel environment variables

Set these for Production, Preview, and Development as appropriate:

- `SUPABASE_URL`: `https://izuiuttwjyvthlkpjikn.supabase.co`
- `SUPABASE_ANON_KEY`: the project's public anon/publishable key. This key is intended for browser sign-in and is not a service-role secret.
- `SUPABASE_SERVICE_ROLE_KEY`: the project service-role key. Keep it server-side and encrypted in Vercel. Never put it in HTML, browser JavaScript, or GitHub.
- `CLINICCONSILIUM_ADMIN_EMAILS`: comma-separated exact email addresses allowed to use the admin workspace.

After changing environment variables, redeploy the project.

## Supabase Auth setup

1. In Supabase Dashboard, open Authentication → Providers and ensure Email/password sign-in is enabled.
2. Under Authentication → Users, create the intended administrator account(s). Use secure passwords and MFA where available.
3. Put only those account email addresses in `CLINICCONSILIUM_ADMIN_EMAILS`.
4. Keep public sign-up disabled unless there is a separate, reviewed reason to enable it.
5. Verify the administrator can sign in and that a non-allowlisted account receives a 403 response.

## API behavior

- `GET /api/admin/config` returns only the Supabase URL and public anon key needed by the sign-in page.
- `GET /api/admin/enquiries` requires a valid Supabase access token and an allowlisted email. It supports `status` and `search` query parameters and caps the response at 500 rows.
- `PATCH /api/admin/enquiries` requires the same authorization and updates only status and/or internal admin notes for a valid enquiry ID.
- All admin responses are marked no-store. The service-role key is used only inside serverless functions.

## Launch limitations

This is not a full healthcare operations system. Do not store patient clinical information, diagnoses, prescriptions, medical records, or other sensitive health data in the Phase 0 enquiry workflow. Add audit logging, stronger abuse/rate controls, operational monitoring, and a formal access review before production use with sensitive or regulated information. Test with non-sensitive dummy enquiries before enabling public submissions.
