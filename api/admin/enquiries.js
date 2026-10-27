const ALLOWED_STATUSES = new Set(['new', 'in_review', 'responded', 'closed', 'spam']);
const MAX_ROWS = 500;

function reply(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function headers(serviceKey, extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function requireAdmin(req) {
  const authorization = String(req.headers.authorization || '');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: 'sign_in_required' };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowed = String(process.env.CLINICCONSILIUM_ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (!supabaseUrl || !serviceKey || allowed.length === 0) {
    return { ok: false, status: 503, error: 'admin_access_not_configured' };
  }

  let response;
  try {
    response = await fetch(supabaseUrl + '/auth/v1/user', {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + match[1]
      }
    });
  } catch (_) {
    return { ok: false, status: 503, error: 'identity_service_unavailable' };
  }

  if (!response.ok) return { ok: false, status: 401, error: 'invalid_or_expired_session' };
  let user;
  try { user = await response.json(); } catch (_) {
    return { ok: false, status: 401, error: 'invalid_session_response' };
  }

  const email = clean(user && user.email, 254).toLowerCase();
  if (!email || !allowed.includes(email)) {
    return { ok: false, status: 403, error: 'admin_access_denied' };
  }
  return { ok: true, email };
}

module.exports = async (req, res) => {
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return reply(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return reply(res, auth.status, { ok: false, error: auth.error });

  const supabaseUrl = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (req.method === 'GET') {
    const status = clean(req.query && req.query.status, 20);
    const search = clean(req.query && req.query.search, 120);
    if (status && status !== 'all' && !ALLOWED_STATUSES.has(status)) {
      return reply(res, 400, { ok: false, error: 'invalid_status_filter' });
    }

    const query = new URLSearchParams({
      select: 'id,name,email,role,interest,enquiry_type,status,source,email_delivery_status,admin_notes,created_at,updated_at',
      order: 'created_at.desc',
      limit: String(MAX_ROWS)
    });
    if (status && status !== 'all') query.set('status', 'eq.' + status);
    if (search) {
      const safeSearch = search.replace(/[,%()]/g, ' ').trim();
      if (safeSearch) query.set('or', '(name.ilike.*' + safeSearch + '*,email.ilike.*' + safeSearch + '*,role.ilike.*' + safeSearch + '*)');
    }

    try {
      const response = await fetch(supabaseUrl + '/rest/v1/enquiries?' + query.toString(), {
        headers: headers(serviceKey)
      });
      if (!response.ok) return reply(res, 503, { ok: false, error: 'enquiries_unavailable' });
      const enquiries = await response.json();
      const rows = Array.isArray(enquiries) ? enquiries : [];
      const stats = { total: rows.length, new: 0, in_review: 0, responded: 0, closed: 0, spam: 0 };
      rows.forEach(row => { if (Object.prototype.hasOwnProperty.call(stats, row.status)) stats[row.status]++; });
      return reply(res, 200, { ok: true, enquiries: rows, stats, limit: MAX_ROWS, admin: auth.email });
    } catch (_) {
      return reply(res, 503, { ok: false, error: 'database_unavailable' });
    }
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) {
      return reply(res, 400, { ok: false, error: 'invalid_json' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return reply(res, 400, { ok: false, error: 'invalid_request' });
  }

  const id = clean(body.id, 50);
  const status = clean(body.status, 20);
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : undefined;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(res, 400, { ok: false, error: 'invalid_enquiry_id' });
  if (status && !ALLOWED_STATUSES.has(status)) return reply(res, 400, { ok: false, error: 'invalid_status' });
  if (adminNotes !== undefined && adminNotes.length > 2000) return reply(res, 400, { ok: false, error: 'notes_too_long' });
  if (!status && adminNotes === undefined) return reply(res, 400, { ok: false, error: 'no_changes_requested' });

  const update = {};
  if (status) update.status = status;
  if (adminNotes !== undefined) update.admin_notes = adminNotes;

  try {
    const response = await fetch(supabaseUrl + '/rest/v1/enquiries?id=eq.' + encodeURIComponent(id) + '&select=id,status,admin_notes,updated_at', {
      method: 'PATCH',
      headers: headers(serviceKey, { Prefer: 'return=representation' }),
      body: JSON.stringify(update)
    });
    if (!response.ok) return reply(res, 503, { ok: false, error: 'update_failed' });
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return reply(res, 404, { ok: false, error: 'enquiry_not_found' });
    return reply(res, 200, { ok: true, enquiry: rows[0] });
  } catch (_) {
    return reply(res, 503, { ok: false, error: 'database_unavailable' });
  }
};
