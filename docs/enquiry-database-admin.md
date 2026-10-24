# Enquiry database and admin inbox — implementation slice

## Scope
- PostgreSQL stores only general enquiries received through the existing five public forms.
- Admin workspace: `/admin/`; API routes under `/api/admin/`.
- No patient accounts, clinical records, document uploads, or clinical workflows are enabled.
- Email delivery remains intentionally disabled in this slice.

## Database
Apply `migrations/001_enquiries.sql` to a new PostgreSQL database. The migration is additive and creates only `public.enquiries`; it does not alter or delete existing tables. Use separate development and production databases. Run a backup/restore test before storing real enquiries.

## Required Vercel environment variables
- `DATABASE_URL`: PostgreSQL connection string for the application role. Use a restricted database role, TLS, and a provider-supported pooled connection string where appropriate.
- `ADMIN_SESSION_SECRET`: at least 32 random bytes, encoded as a long random string.
- `ADMIN_PASSWORD_HASH`: `salt:hash`, where salt is 32 random bytes as 64 hex characters and hash is 64 bytes of scrypt output as 128 hex characters. Generate locally with Node:
  ```js
  const crypto = require('node:crypto');
  const salt = crypto.randomBytes(32).toString('hex');
  const password = process.env.NEW_ADMIN_PASSWORD;
  if (!password || password.length < 16) throw new Error('Set a strong NEW_ADMIN_PASSWORD locally (16+ characters)');
  console.log(salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex'));
  ```
  Set the resulting value in Vercel without committing it. Never paste the password or hash into GitHub/chat.
- Optional `DATABASE_SSL=disable` is only for isolated local development; do not set it in production.

## Apply and validate
1. Create a managed PostgreSQL project and use a new empty database for this first migration.
2. Apply the SQL in `migrations/001_enquiries.sql` with the provider SQL editor or a secure database client.
3. Add the three environment variables to Vercel Production and Preview separately, then redeploy.
4. Visit `/api/health` and confirm `database: connected`.
5. Submit a synthetic test enquiry, confirm a row appears in the admin inbox, update its status and notes, sign out, and confirm the session is rejected.
6. Remove synthetic test records after the test; confirm backups and restore before operational use.

## Security and known limits
- Admin uses a signed, HttpOnly, Secure, SameSite=Strict cookie with an eight-hour expiry and a password hash. The password must be unique and strong. Provision only one trusted admin initially.
- This is a first admin workflow, not a full identity platform. Before wider staff access, add a persistent login rate limiter, MFA, explicit staff accounts/roles, audit events, and independent security testing.
- Do not put medical records, diagnoses, prescription details, identity numbers, or other clinical/sensitive information into these general enquiry forms.
- Email is not sent yet. The public form reports success only after database insertion succeeds.
- Configure retention/deletion, privacy notice, incident response and access ownership with qualified privacy/security advice before real operational use.
