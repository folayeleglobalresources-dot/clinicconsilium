# Backend first slice: health endpoint

## Endpoint

- Path: `GET /api/health`
- Runtime: Vercel Node.js serverless function convention (`api/health.js`)
- Dependencies: none
- Purpose: report that the function can respond, while explicitly showing that downstream services are not configured.

## Expected response

A successful GET returns JSON with:
- `ok: true`
- `scope: "process-health-only"`
- `database: "not_configured"`
- `enquiry_delivery: "not_configured"`
- `patient_services: "not_available"`
- a UTC timestamp

Non-GET methods return HTTP 405 and advertise `Allow: GET`.

## Important limitation

This endpoint is a first backend slice, not evidence that the full product is operational. It does not connect to PostgreSQL, Prisma, email, an enquiry inbox, authentication, patient records, healthcare providers or other services. It must not be used as a full readiness or uptime check.

## Deployment verification

After the deployment provider has built the commit, request `/api/health` on the deployed domain and confirm:
1. HTTP 200 for GET.
2. JSON content type and `Cache-Control: no-store`.
3. `scope` and dependency fields match the expected response.
4. HTTP 405 for POST.
5. Existing public pages still render.

If the endpoint returns 404, inspect the Vercel project root directory, framework settings and deployment logs. Do not declare the endpoint live until this check is completed.

## Next backend work

1. Add CI tests for method handling and response contract.
2. Confirm the production service owner, legal entity and authorised enquiry recipient.
3. Select and configure a managed PostgreSQL environment, secret storage and migration workflow.
4. Implement a real general-enquiry workflow only after data minimisation, privacy notice, retention, abuse controls, secure storage/delivery and operational ownership are approved.
5. Keep patient/clinical information out of this first public enquiry workflow.
