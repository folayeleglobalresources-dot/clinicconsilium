const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

function mockRes() {
  return {
    code: 0, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; }
  };
}
const req = (body, extra = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', host: 'clinicconsilium.vercel.app', ...extra },
  body
});

test('pharmacy-partners loads and rejects GET', async () => {
  const h = require('../api/pharmacy-partners.js');
  const res = mockRes();
  await h({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 405);
});

test('pharmacy-partners validates required fields', async () => {
  const h = require('../api/pharmacy-partners.js');
  const res = mockRes();
  await h(req({ organisation_name: 'A', contact_name: 'B', contact_email: 'bad', organisation_type: 'x' }), res);
  assert.equal(res.code, 400);
  assert.equal(res.body.error, 'check_required_fields');
});

test('pharmacy-partners refuses to claim success when database is not configured', async () => {
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const h = require('../api/pharmacy-partners.js');
  const res = mockRes();
  await h(req({ organisation_name: 'Test Pharmacy', contact_name: 'Test Person', contact_email: 'a@b.co', organisation_type: 'community_pharmacy' }), res);
  assert.equal(res.code, 503);
  assert.equal(res.body.ok, false);
});

test('pharmacy-partners saves as pending_review and never approved', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  let sent;
  global.fetch = async (url, opts) => { sent = JSON.parse(opts.body); return { ok: true, json: async () => [{ id: 'abc' }] }; };
  const h = require('../api/pharmacy-partners.js');
  const res = mockRes();
  await h(req({ organisation_name: 'Test Pharmacy', contact_name: 'Test Person', contact_email: 'A@B.co', organisation_type: 'community_pharmacy' }), res);
  assert.equal(res.code, 201);
  assert.equal(sent.status, 'pending_review');
  assert.equal(sent.contact_email, 'a@b.co');
});

test('enquiries blocks clinical details and unknown roles', async () => {
  const h = require('../api/enquiries.js');
  let res = mockRes();
  await h(req({ name: 'Test Person', email: 'a@b.co', role: 'Partnership enquiry', interest: 'my diagnosis is' }), res);
  assert.equal(res.body.error, 'sensitive_information_not_allowed');
  res = mockRes();
  await h(req({ name: 'Test Person', email: 'a@b.co', role: 'Made up role', interest: 'hello' }), res);
  assert.equal(res.code, 400);
});

test('enquiries rejects foreign origins', async () => {
  const h = require('../api/enquiries.js');
  const res = mockRes();
  await h(req({}, { origin: 'https://evil.example' }), res);
  assert.equal(res.code, 403);
});

test('health endpoint verifies the database without reading enquiry rows', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  let requested;
  global.fetch = async (url, options) => {
    requested = { url, options };
    return { ok: true, status: 200 };
  };
  const res = mockRes();
  await require('../api/health.js')({ method: 'GET' }, res);
  assert.equal(res.body.database, 'connected');
  assert.equal(res.body.accounts, 'not_yet_available');
  assert.equal(res.body.patient_services, 'not_available');
  assert.ok(requested.url.endsWith('/rest/v1/enquiries?select=id&limit=0'));
  assert.equal(requested.options.method, 'GET');
});

test('health endpoint reports database unavailable without exposing errors', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  global.fetch = async () => ({ ok: false, status: 503 });
  const res = mockRes();
  await require('../api/health.js')({ method: 'GET' }, res);
  assert.equal(res.body.database, 'unavailable');
  assert.equal(res.body.ok, true);
});

function adminEnv() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  process.env.CLINICCONSILIUM_ADMIN_EMAILS = 'boss@example.com';
}
const ID = '11111111-1111-4111-8111-111111111111';
const adminReq = (method, body, query) => ({ method, query: query || {}, body, headers: { authorization: 'Bearer tok' } });

test('pharmacy admin API requires sign-in and an allow-listed confirmed email', async () => {
  adminReq; adminEnv();
  const h = require('../api/admin/pharmacy-applications.js');
  let res = mockRes();
  await h({ method: 'GET', headers: {}, query: {} }, res);
  assert.equal(res.code, 401);
  global.fetch = async () => ({ ok: true, json: async () => ({ id: 'u1', email: 'x@example.com', email_confirmed_at: '2026-01-01' }) });
  res = mockRes(); await h(adminReq('GET'), res);
  assert.equal(res.code, 403);
  global.fetch = async () => ({ ok: true, json: async () => ({ id: 'u1', email: 'boss@example.com' }) });
  res = mockRes(); await h(adminReq('GET'), res);
  assert.equal(res.body.error, 'email_not_confirmed');
});

test('pharmacy admin PATCH validates input and records the reviewer', async () => {
  adminEnv();
  const h = require('../api/admin/pharmacy-applications.js');
  let patched;
  global.fetch = async (url, opts) => {
    if (url.includes('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'u1', email: 'Boss@example.com', email_confirmed_at: '2026-01-01' }) };
    patched = JSON.parse(opts.body); return { ok: true, json: async () => [{ id: ID, status: patched.status }] };
  };
  let res = mockRes(); await h(adminReq('PATCH', { id: 'nope', status: 'approved' }), res);
  assert.equal(res.body.error, 'invalid_id');
  res = mockRes(); await h(adminReq('PATCH', { id: ID, status: 'hacked' }), res);
  assert.equal(res.body.error, 'invalid_status');
  res = mockRes(); await h(adminReq('PATCH', { id: ID, status: 'approved', internal_notes: 'Licence checked' }), res);
  assert.equal(res.code, 200);
  assert.equal(patched.reviewed_by, 'u1');
  assert.equal(patched.status, 'approved');
});


test('account status requires a bearer session', async () => {
  const h = require('../api/account/status.js');
  const res = mockRes();
  await h({ method: 'GET', headers: {} }, res);
  assert.equal(res.code, 401);
  assert.equal(res.body.error, 'sign_in_required');
});

test('registration review API requires an allow-listed administrator session', async () => {
  const h = require('../api/admin/registrations.js');
  const res = mockRes();
  await h({ method: 'GET', headers: {}, query: {} }, res);
  assert.equal(res.code, 401);
});

test('registration review API rejects unconfirmed or non-admin users', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.CLINICCONSILIUM_ADMIN_EMAILS = 'boss@example.com';
  const h = require('../api/admin/registrations.js');
  global.fetch = async () => ({ ok: true, json: async () => ({ id: 'u1', email: 'other@example.com', email_confirmed_at: '2026-01-01' }) });
  const res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: {} }, res);
  assert.equal(res.code, 403);
  assert.equal(res.body.error, 'admin_access_denied');
});


test('professional registration cannot be approved before credential verification', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  const h = require('../api/admin/registrations.js');
  let patchCalled = false;
  global.fetch = async (url, opts = {}) => {
    if (url.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'admin-id', email: 'boss@example.com', email_confirmed_at: '2026-01-01' }) };
    if (url.includes('/rest/v1/account_registrations?user_id=')) return { ok: true, json: async () => [{ user_id: ID, email: 'doctor@example.com', full_name: 'Doctor', requested_account_type: 'professional', status: 'pending_review', verification_status: 'pending', approved_access_role: null }] };
    if (url.endsWith('/auth/v1/admin/users/' + ID)) return { ok: true, json: async () => ({ id: ID, email: 'doctor@example.com', email_confirmed_at: '2026-01-01', app_metadata: {} }) };
    if (url.includes('/rest/v1/account_registrations?user_id=') && opts.method === 'PATCH') patchCalled = true;
    return { ok: true, json: async () => [] };
  };
  const res = mockRes();
  await h(adminReq('PATCH', { user_id: ID, action: 'approve' }), res);
  assert.equal(res.code, 409);
  assert.equal(res.body.error, 'professional_credentials_not_verified');
  assert.equal(patchCalled, false);
});


test('dashboard access guard requires a signed-in user', async () => {
 const h=require('../api/access/dashboard.js'),res=mockRes();
 await h({method:'POST',headers:{},body:{workspace:'patient'}},res);
 assert.equal(res.code,401);assert.equal(res.body.error,'sign_in_required');
});
test('dashboard access guard rejects unknown workspace keys', async () => {
 const h=require('../api/access/dashboard.js'),res=mockRes();
 await h({method:'POST',headers:{authorization:'Bearer token'},body:{workspace:'super_admin'}},res);
 assert.equal(res.code,400);assert.equal(res.body.error,'invalid_workspace');
});
test('patient dashboard access requires approved patient registration', async () => {
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='svc';
 const h=require('../api/access/dashboard.js');
 global.fetch=async url=>{if(url.endsWith('/auth/v1/user'))return{ok:true,json:async()=>({id:ID,email:'patient@example.com',email_confirmed_at:'2026-01-01'})};if(url.includes('/rest/v1/account_registrations?'))return{ok:true,json:async()=>[{status:'approved',requested_account_type:'patient',verification_status:'not_required',approved_access_role:'patient'}]};throw Error('unexpected request');};
 const res=mockRes();await h({method:'POST',headers:{authorization:'Bearer token'},body:{workspace:'patient'}},res);
 assert.equal(res.code,200);assert.equal(res.body.access,'granted');
});
test('dashboard access denies professional accounts pending credential review', async () => {
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='svc';
 const h=require('../api/access/dashboard.js');
 global.fetch=async url=>{if(url.endsWith('/auth/v1/user'))return{ok:true,json:async()=>({id:ID,email:'doctor@example.com',email_confirmed_at:'2026-01-01'})};if(url.includes('/rest/v1/account_registrations?'))return{ok:true,json:async()=>[{status:'pending_review',requested_account_type:'professional',verification_status:'pending',approved_access_role:null}]};throw Error('unexpected request');};
 const res=mockRes();await h({method:'POST',headers:{authorization:'Bearer token'},body:{workspace:'professional'}},res);
 assert.equal(res.code,403);assert.equal(res.body.error,'registration_pending_review');
});
test('organisation dashboard requires active organisation membership', async () => {
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='svc';
 const h=require('../api/access/dashboard.js');
 global.fetch=async url=>{if(url.endsWith('/auth/v1/user'))return{ok:true,json:async()=>({id:ID,email:'user@example.com',email_confirmed_at:'2026-01-01'})};if(url.includes('/rest/v1/organisation_memberships?'))return{ok:true,json:async()=>[]};throw Error('unexpected request');};
 const res=mockRes();await h({method:'POST',headers:{authorization:'Bearer token'},body:{workspace:'pharmacy'}},res);
 assert.equal(res.code,403);assert.equal(res.body.error,'active_membership_required');
});
test('coordination dashboard requires active platform role assignment', async () => {
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='anon';process.env.SUPABASE_SERVICE_ROLE_KEY='svc';
 const h=require('../api/access/dashboard.js');
 global.fetch=async url=>{if(url.endsWith('/auth/v1/user'))return{ok:true,json:async()=>({id:ID,email:'user@example.com',email_confirmed_at:'2026-01-01'})};if(url.includes('/rest/v1/platform_role_assignments?'))return{ok:true,json:async()=>[]};throw Error('unexpected request');};
 const res=mockRes();await h({method:'POST',headers:{authorization:'Bearer token'},body:{workspace:'coordination'}},res);
 assert.equal(res.code,403);assert.equal(res.body.error,'platform_role_required');
});


test('enquiries returns a reference and does not attempt email without configuration', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  delete process.env.RESEND_API_KEY;
  delete process.env.CLINICCONSILIUM_FROM_EMAIL;
  delete process.env.CLINICCONSILIUM_ENQUIRY_TO;
  let insertedBody, resendCalls = 0, patchCalls = 0;
  global.fetch = async (url, options = {}) => {
    if (url.endsWith('/rest/v1/enquiries') && options.method === 'POST') {
      insertedBody = JSON.parse(options.body);
      return { ok: true, json: async () => [{ id: ID, reference_number: 'CC-2026-000001' }] };
    }
    if (url === 'https://api.resend.com/emails') { resendCalls++; return { ok: true, json: async () => ({ id: 'unexpected' }) }; }
    if (url.includes('/rest/v1/enquiries?id=eq.')) { patchCalls++; return { ok: true }; }
    throw new Error('unexpected request');
  };
  const h = require('../api/enquiries.js');
  const res = mockRes();
  await h(req({ name: 'Test Person', email: 'a@b.co', role: 'Partnership enquiry', interest: 'General enquiry' }), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.reference, 'CC-2026-000001');
  assert.equal(insertedBody.email_delivery_status, 'not_configured');
  assert.equal(resendCalls, 0);
  assert.equal(patchCalls, 0);
});

test('Resend notification stores accepted status and provider email id', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.CLINICCONSILIUM_FROM_EMAIL = 'ClinicConsilium <notifications@example.com>';
  process.env.CLINICCONSILIUM_ENQUIRY_TO = 'team@example.com';
  let insertedBody, resendRequest, patchBody;
  global.fetch = async (url, options = {}) => {
    if (url.endsWith('/rest/v1/enquiries') && options.method === 'POST') {
      insertedBody = JSON.parse(options.body);
      return { ok: true, json: async () => [{ id: ID, reference_number: 'CC-2026-000002' }] };
    }
    if (url === 'https://api.resend.com/emails') {
      resendRequest = { headers: options.headers, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ id: 'resend-email-123' }) };
    }
    if (url.includes('/rest/v1/enquiries?id=eq.')) {
      patchBody = JSON.parse(options.body);
      return { ok: true };
    }
    throw new Error('unexpected request');
  };
  const h = require('../api/enquiries.js');
  const res = mockRes();
  await h(req({ name: 'Test Person', email: 'a@b.co', role: 'Partnership enquiry', interest: 'General enquiry' }), res);
  assert.equal(res.code, 200);
  assert.equal(insertedBody.email_delivery_status, 'pending');
  assert.equal(res.body.reference, 'CC-2026-000002');
  assert.equal(resendRequest.body.to[0], 'team@example.com');
  assert.equal(resendRequest.headers['Idempotency-Key'], 'clinicconsilium-enquiry/' + ID);
  assert.equal(patchBody.email_delivery_status, 'sent');
  assert.equal(patchBody.email_delivery_reference, 'resend-email-123');
});

test('admin enquiry search includes the public reference number', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  let requestedUrl = '';
  global.fetch = async (url) => {
    if (url.endsWith('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'admin-id', email: 'boss@example.com', email_confirmed_at: '2026-01-01' }) };
    }
    requestedUrl = String(url);
    return { ok: true, json: async () => [] };
  };
  const h = require('../api/admin/enquiries.js');
  const res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { search: 'CC-2026-000001' } }, res);
  assert.equal(res.code, 200);
  const query = new URL(requestedUrl).searchParams;
  assert.match(query.get('select'), /reference_number/);
  assert.match(query.get('or'), /reference_number\.ilike/);
});


test('platform audit and users/roles views are administrator-only', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.CLINICCONSILIUM_STAFF_EMAILS = 'staff@example.com';
  global.fetch = async (url) => {
    if (String(url).endsWith('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'staff-id', email: 'staff@example.com', email_confirmed_at: '2026-01-01' }) };
    }
    throw new Error('staff access must not query protected views');
  };
  const h = require('../api/admin/enquiries.js');
  for (const view of ['audit', 'users']) {
    const res = mockRes();
    await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { view } }, res);
    assert.equal(res.code, 403);
    assert.equal(res.body.error, 'administrator_access_required');
  }
});

test('admin audit view combines safe security and enquiry events', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  global.fetch = async (url) => {
    if (String(url).endsWith('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'admin-id', email: 'boss@example.com', email_confirmed_at: '2026-01-01' }) };
    }
    if (String(url).includes('/rest/v1/security_audit_events?')) {
      return { ok: true, json: async () => [{ id: 'audit-id', actor_user_id: ID, action: 'account_registration_approved', resource_type: 'account_registration', resource_id: ID, metadata: { requested_account_type: 'professional', patient_user_id: 'must-not-leak' }, created_at: '2026-11-22T10:00:00Z' }] };
    }
    if (String(url).includes('/rest/v1/enquiry_activity?')) {
      return { ok: true, json: async () => [{ id: 'activity-id', enquiry_id: ID, actor_email: 'boss@example.com', event_type: 'status_changed', details: { from: 'new', to: 'in_review', note: 'private note content' }, created_at: '2026-11-22T11:00:00Z' }] };
    }
    throw new Error('unexpected request');
  };
  const h = require('../api/admin/enquiries.js');
  const res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { view: 'audit' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.read_only, true);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.events[0].source, 'enquiry');
  assert.equal(res.body.events[1].details.patient_user_id, undefined);
  assert.equal(res.body.events[0].details.note, undefined);
});

test('admin users/roles view aggregates auth users and assigned roles without write controls', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  global.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'admin-id', email: 'boss@example.com', email_confirmed_at: '2026-01-01' }) };
    if (u.includes('/auth/v1/admin/users?')) return { ok: true, json: async () => ({ users: [{ id: ID, email: 'person@example.com', email_confirmed_at: '2026-01-01', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: '2026-11-22T09:00:00Z', user_metadata: { full_name: 'Example Person' } }] }) };
    if (u.includes('/rest/v1/account_registrations?')) return { ok: true, json: async () => [{ user_id: ID, email: 'person@example.com', full_name: 'Example Person', requested_account_type: 'professional', status: 'approved', verification_status: 'verified', approved_access_role: 'professional', created_at: '2026-01-01T00:00:00Z' }] };
    if (u.includes('/rest/v1/platform_role_assignments?')) return { ok: true, json: async () => [{ user_id: ID, role: 'credential_reviewer', granted_at: '2026-01-02T00:00:00Z', revoked_at: null }] };
    if (u.includes('/rest/v1/organisation_memberships?')) return { ok: true, json: async () => [{ user_id: ID, organisation_id: '22222222-2222-4222-8222-222222222222', role: 'clinician', status: 'active', created_at: '2026-01-03T00:00:00Z' }] };
    if (u.includes('/rest/v1/organisations?')) return { ok: true, json: async () => [{ id: '22222222-2222-4222-8222-222222222222', display_name: 'Example Clinic' }] };
    throw new Error('unexpected request');
  };
  const h = require('../api/admin/enquiries.js');
  const res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { view: 'users' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.read_only, true);
  assert.equal(res.body.users[0].full_name, 'Example Person');
  assert.equal(res.body.users[0].platform_roles[0].role, 'credential_reviewer');
  assert.equal(res.body.users[0].organisation_memberships[0].organisation, 'Example Clinic');
  assert.equal(res.body.users[0].configured_workspace_role, 'none');
});

test('admin internal notes reject clinical or sensitive health information', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  global.fetch = async (url) => {
    if (String(url).endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'admin-id', email: 'boss@example.com', email_confirmed_at: '2026-01-01' }) };
    if (String(url).includes('/rest/v1/enquiries?id=eq.')) return { ok: true, json: async () => [{ id: ID, reference_number: 'CC-2026-000001', name: 'Test Person', email: 'a@b.co', role: 'Partnership enquiry', interest: 'General', status: 'new', admin_notes: '', owner_email: null }] };
    throw new Error('note validation should stop before write');
  };
  const h = require('../api/admin/enquiries.js');
  const res = mockRes();
  await h({ method: 'PATCH', headers: { authorization: 'Bearer token' }, body: { id: ID, admin_notes: 'Patient diagnosis: hypertension' } }, res);
  assert.equal(res.code, 400);
  assert.equal(res.body.error, 'sensitive_information_not_allowed');
});


test('LifeSaver page prioritises local emergency services and does not claim dispatch', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'lifesaver.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
  assert.ok(html.indexOf('CONTACT LOCAL EMERGENCY SERVICES FIRST') < html.indexOf('<header'));
  assert.match(html, /href="tel:112"/);
  assert.match(html, /does not receive emergency calls, dispatch ambulances/);
  assert.doesNotMatch(html, /api\/enquiries|api\/emergency/);
  assert.match(sitemap, /https:\/\/clinicconsilium\.vercel\.app\/lifesaver\.html/);
});


test('data protection requests are validated and stored in the restricted enquiry workflow', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  delete process.env.RESEND_API_KEY;
  delete process.env.CLINICCONSILIUM_FROM_EMAIL;
  delete process.env.CLINICCONSILIUM_DATA_PROTECTION_EMAIL;
  let inserted;
  global.fetch = async (url, options = {}) => {
    if (url.endsWith('/rest/v1/enquiries') && options.method === 'POST') {
      inserted = JSON.parse(options.body);
      return { ok: true, json: async () => [{ id: ID, reference_number: 'CC-2026-000003' }] };
    }
    throw new Error('data request should not notify an unconfigured recipient');
  };
  const h = require('../api/enquiries.js');
  let res = mockRes();
  await h(req({ name: 'Data Subject', email: 'subject@example.com', role: 'Data protection request', data_request_type: 'access', authority_confirmed: false, interest: 'Please provide information about my account.' }), res);
  assert.equal(res.code, 400);
  assert.equal(res.body.error, 'data_request_confirmation_required');
  res = mockRes();
  await h(req({ name: 'Data Subject', email: 'subject@example.com', role: 'Data protection request', data_request_type: 'access', authority_confirmed: true, interest: 'Please provide information about my account.' }), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.reference, 'CC-2026-000003');
  assert.equal(inserted.enquiry_type, 'data_protection_request');
  assert.equal(inserted.data_request_type, 'access');
  assert.equal(inserted.data_request_authority_confirmed, true);
  assert.equal(inserted.email_delivery_status, 'not_configured');
});

test('staff cannot see or update data protection requests, even when assigned', async () => {
  adminEnv();
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.CLINICCONSILIUM_STAFF_EMAILS = 'staff@example.com';
  let activityFetched = false, requestedUrl = '';
  global.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'staff-id', email: 'staff@example.com', email_confirmed_at: '2026-01-01' }) };
    if (u.includes('/rest/v1/enquiries?id=eq.')) return { ok: true, json: async () => [{ id: ID, reference_number: 'CC-2026-000004', name: 'Data Subject', email: 'subject@example.com', role: 'Data protection request', interest: '', enquiry_type: 'data_protection_request', data_request_type: 'access', status: 'new', owner_email: 'staff@example.com' }] };
    if (u.includes('/rest/v1/enquiries?')) { requestedUrl = u; return { ok: true, json: async () => [] }; }
    if (u.includes('admin_get_enquiry_activity')) { activityFetched = true; return { ok: true, json: async () => [] }; }
    throw new Error('unexpected request');
  };
  const h = require('../api/admin/enquiries.js');
  let res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: { id: ID } }, res);
  assert.equal(res.code, 404);
  assert.equal(activityFetched, false);
  res = mockRes();
  await h({ method: 'GET', headers: { authorization: 'Bearer token' }, query: {} }, res);
  assert.equal(res.code, 200);
  assert.equal(new URL(requestedUrl).searchParams.get('enquiry_type'), 'neq.data_protection_request');
});

test('privacy, terms and data-request pages carry legal draft markers and a working route', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const privacy = read('privacy.html'), terms = read('terms.html'), request = read('data-request.html'), sitemap = read('sitemap.xml');
  assert.match(privacy, /DRAFT — PENDING LEGAL REVIEW/);
  assert.match(privacy, /retention schedule/);
  assert.match(privacy, /data-request\.html/);
  assert.match(terms, /DRAFT — PENDING LEGAL REVIEW/);
  assert.match(request, /Nigeria Data Protection Act 2023/);
  assert.match(request, /name="authority_confirmed"/);
  assert.match(request, /fetch\('\/api\/enquiries'/);
  assert.match(sitemap, /https:\/\/clinicconsilium\.vercel\.app\/data-request\.html/);
});


test('public account page only offers manual registration interest and creates no account', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'account.html'), 'utf8');
  assert.match(html, /Registration interest/);
  assert.match(html, /We review requests manually, and no account is created yet/);
  assert.doesNotMatch(html, /supabase-js|signInWithPassword|auth\\.signUp|Create secure account|Sign in/);
});

test('public navigation does not promote patient workspace or account sign-in', () => {
  const home = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const portals = fs.readFileSync(path.join(__dirname, '..', 'portals.html'), 'utf8');
  assert.doesNotMatch(home, /Patient workspace preview/);
  assert.doesNotMatch(portals, /Sign in or create an account/);
  assert.match(portals, /Register interest · manual review/);
});

test('status page states accounts are not yet available and manual interest creates no account', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'status.html'), 'utf8');
  assert.match(html, /Accounts are not yet available/);
  assert.match(html, /No account is created/i);
});
