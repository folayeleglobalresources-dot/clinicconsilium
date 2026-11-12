const STATUSES = ['pending_review', 'under_review', 'approved', 'rejected', 'suspended'];
const COLS = 'id,organisation_name,contact_name,contact_email,phone,organisation_type,licence_type,licence_number,country_code,state_region,city,website,status,internal_notes,reviewed_at,created_at,updated_at';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reply(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function requireAdmin(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, error: 'sign_in_required' };
  const url = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowed = String(process.env.CLINICCONSILIUM_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!url || !key || !allowed.length) return { ok: false, status: 503, error: 'admin_access_not_configured' };
  let r;
  try {
    r = await fetch(url + '/auth/v1/user', { headers: { apikey: process.env.SUPABASE_ANON_KEY || key, Authorization: 'Bearer ' + m[1] } });
  } catch (_) { return { ok: false, status: 503, error: 'identity_service_unavailable' }; }
  if (!r.ok) return { ok: false, status: 401, error: 'invalid_or_expired_session' };
  let user;
  try { user = await r.json(); } catch (_) { return { ok: false, status: 401, error: 'invalid_session_response' }; }
  if (!user || !user.email_confirmed_at) return { ok: false, status: 403, error: 'email_not_confirmed' };
  const email = clean(user.email, 254).toLowerCase();
  if (!email || !allowed.includes(email)) return { ok: false, status: 403, error: 'admin_access_denied' };
  return { ok: true, email, id: user.id, url, key };
}

module.exports = async (req, res) => {
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return reply(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  const admin = await requireAdmin(req);
  if (!admin.ok) return reply(res, admin.status, { ok: false, error: admin.error });
  const h = { apikey: admin.key, Authorization: 'Bearer ' + admin.key, 'Content-Type': 'application/json' };
  const base = admin.url + '/rest/v1/pharmacy_partner_applications';

  if (req.method === 'GET') {
    const status = clean(req.query && req.query.status, 40);
    let q = base + '?select=' + COLS + '&order=created_at.desc&limit=500';
    if (status) {
      if (!STATUSES.includes(status)) return reply(res, 400, { ok: false, error: 'invalid_status' });
      q += '&status=eq.' + status;
    }
    try {
      const r = await fetch(q, { headers: h });
      if (!r.ok) return reply(res, 502, { ok: false, error: 'database_read_failed' });
      return reply(res, 200, { ok: true, applications: await r.json() });
    } catch (_) { return reply(res, 502, { ok: false, error: 'database_unreachable' }); }
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = null; } }
  if (!body || typeof body !== 'object') return reply(res, 400, { ok: false, error: 'invalid_json' });
  const id = clean(body.id, 60);
  if (!UUID.test(id)) return reply(res, 400, { ok: false, error: 'invalid_id' });
  const patch = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return reply(res, 400, { ok: false, error: 'invalid_status' });
    patch.status = body.status;
  }
  if (body.internal_notes !== undefined) {
    if (typeof body.internal_notes !== 'string' || body.internal_notes.length > 2000) return reply(res, 400, { ok: false, error: 'invalid_notes' });
    patch.internal_notes = body.internal_notes.trim();
  }
  if (!Object.keys(patch).length) return reply(res, 400, { ok: false, error: 'nothing_to_update' });
  const now = new Date().toISOString();
  Object.assign(patch, { reviewed_by: admin.id, reviewed_at: now, updated_at: now });
  // Approving an application never creates a public pharmacy listing; that is a separate verified step.
  try {
    const r = await fetch(base + '?id=eq.' + id + '&select=' + COLS, { method: 'PATCH', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify(patch) });
    if (!r.ok) return reply(res, 502, { ok: false, error: 'database_update_failed' });
    const rows = await r.json();
    if (!rows.length) return reply(res, 404, { ok: false, error: 'not_found' });
    return reply(res, 200, { ok: true, application: rows[0] });
  } catch (_) { return reply(res, 502, { ok: false, error: 'database_unreachable' }); }
};
