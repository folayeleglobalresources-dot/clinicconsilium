# Admin dashboard functionality audit

**Date:** 2026-10-27  
**Repository:** `folayeleglobalresources-dot/clinicconsilium`  
**Branch inspected:** `main`  
**File inspected:** `admin-dashboard.html`  
**Audit type:** Static code inspection; this is not a browser-based end-to-end test.

## Executive finding

The dashboard is a client-side prototype. Its table is populated from six hard-coded fictional records in a JavaScript `records` array. It does not fetch enquiries from an API, persist updates, authenticate an administrator, or load database-backed metrics. The UI itself warns users not to enter patient information.

## Control-by-control results

| Control / area | Current behaviour in code | Classification |
|---|---|---|
| Command centre / overview link | Scrolls to the overview anchor | Works locally |
| Enquiry triage navigation | Navigates to the queue anchor | Works locally |
| Care pathways navigation | Navigates to the journey anchor | Works locally; sample-only content |
| Professionals shortcut | Opens `providers.html` | Navigation only |
| Care partners shortcut | Opens `partnerships.html` | Navigation only |
| Health information shortcut | Opens `insights.html` | Navigation only |
| Trust & access shortcut | Opens `trust-security.html` | Navigation only |
| Review care queue button | Smooth-scrolls to the queue | Works locally |
| Search field | Searches ID, name, email, type and status in the in-memory sample array | Works locally; not live data |
| Status filter | Filters the in-memory sample array | Works locally; not live data |
| Open enquiry row | Opens a modal with the selected fictional record | Works locally; not live data |
| Close modal / Escape / click backdrop | Closes the modal | Works locally |
| Apply sample update | Mutates the JavaScript object in memory and redraws the UI | Temporary only; refresh loses the change |
| Export sample CSV | Downloads the currently filtered fictional records | Works locally; not a real enquiry export |
| Notifications bell | Shows “No live notifications are connected.” | Placeholder only |
| Metric cards / new count / journey counts | Calculated from the six hard-coded sample records | Sample metrics only |
| Coordination activity | Four hard-coded illustrative events | Static placeholder |
| Date and copyright year | Generated from the browser's local date | Works locally |
| Admin profile | Displays a fixed “Administrator” label and initials | Not authenticated identity |
| Logo | Loads `assets/clinicconsilium-logo-optimized.png` and falls back to text if it fails | Asset reference exists; exact match to owner's original logo not verified |

## Backend integration status from repository code

- `GET /api/health` returns a process-health response explicitly reporting `database: not_configured` and `enquiry_delivery: not_configured`.
- `POST /api/enquiries` validates a general enquiry and can email it via Resend only when `RESEND_API_KEY`, `CLINICCONSILIUM_ENQUIRY_TO`, and `CLINICCONSILIUM_FROM_EMAIL` are configured. It returns HTTP 503 if they are missing.
- The current enquiry endpoint does **not** persist submissions to a database. A successful email response is not the same as a stored dashboard record.
- `package.json` has syntax-check and Node test scripts, but the reviewed package manifest declares no database or authentication dependency.
- `prisma/schema.prisma` is explicitly labelled a proposed starting model; its presence does not prove a database is provisioned or connected.

## Recommended implementation order

1. Choose and provision a managed PostgreSQL database; keep credentials in deployment environment variables.
2. Design a narrow, privacy-reviewed general-enquiry table and migration. Do not put clinical records into this initial workflow.
3. Persist validated enquiries server-side and send notification email to the confirmed recipient `clinicconsilium@gmail.com` only after secure configuration and a verified sender are in place.
4. Add admin authentication and server-side authorisation before exposing any enquiry list or update endpoint. Never rely on hiding the HTML page or on client-side checks.
5. Replace the hard-coded array with authenticated API requests. Make status updates persistent and record an audit trail.
6. Export only the authorised, filtered server data; add pagination, input/output safeguards, retention/deletion rules and abuse protection.
7. Test the full flow: valid submission, invalid input, delivery failure, database failure, unauthorised access, persistent status change, filtering, export, and mobile layout.
8. Verify the deployed build and endpoints before describing the dashboard as live.

## Important release gate

The confirmed enquiry recipient is `clinicconsilium@gmail.com`. Do not claim live delivery or database-backed administration until the relevant deployment environment variables, sender identity, database, authentication and end-to-end tests are actually configured and verified. Keep the prototype warning visible until then.
