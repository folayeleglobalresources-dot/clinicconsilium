# Supabase setup for ClinicConsilium (initial release)

This setup is intentionally limited to general enquiries and partner-interest applications. Do not use it for patient records, diagnoses, prescriptions, medical uploads, or other clinical data.

## Architecture
- GitHub: source code.
- Vercel: website and server-side API routes.
- Supabase: managed PostgreSQL database.
- Email provider: sends enquiry notifications.

## 1. Create the free project
1. Sign in to [Supabase](https://supabase.com/).
2. Create a project named `clinicconsilium` in a region suitable for your initial users and applicable data-protection obligations.
3. Keep the database password in a password manager. Do not paste it into ChatGPT or commit it to GitHub.
4. Open **SQL Editor** in the Supabase dashboard and run the migration file:
   `supabase/migrations/20261027_000001_initial_enquiries.sql`.

## 2. Add Vercel environment variables privately
In the ClinicConsilium Vercel project settings, add these to **Preview** first:
- `SUPABASE_URL`: the project URL shown in Supabase Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-side service-role key from the same settings page. Treat it as a password; it must never use a `NEXT_PUBLIC_` prefix or appear in browser code.
- `CLINICCONSILIUM_ENQUIRY_TO`: `clinicconsilium@gmail.com`.
- `RESEND_API_KEY`: the secret API key from the chosen email provider, if Resend is used.
- `CLINICCONSILIUM_FROM_EMAIL`: a sender address verified with the email provider.

Do not share secret values in this chat, screenshots, or source files. Enter them only in the provider's secure settings. Add them to Production only after Preview tests pass.

## 3. Verification before enabling live use
- Confirm the SQL migration succeeds.
- Confirm RLS is enabled and there are no public policies on `public.enquiries`.
- Submit a test general enquiry using non-sensitive test data.
- Verify exactly one row is created and email delivery is successful.
- Verify the browser cannot read the table directly.
- Verify admin routes require authenticated, server-validated admin authorization before listing, exporting, or changing enquiry status.
- Test invalid input, oversized input, duplicate submissions, rate limiting, and error paths.

## Important status
The SQL migration and this guide define the database foundation. They do not themselves create a Supabase project, set Vercel secrets, authenticate administrators, or connect the existing dashboard. Do not describe the dashboard as live until the API integration and access-control tests are complete.
