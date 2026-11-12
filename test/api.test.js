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

test('health endpoint does not claim a verified connection', () => {
  process.env.SUPABASE_URL = 'x'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'y';
  const res = mockRes();
  require('../api/health.js')({ method: 'GET' }, res);
  assert.equal(res.body.database, 'configured_not_connection_verified');
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
