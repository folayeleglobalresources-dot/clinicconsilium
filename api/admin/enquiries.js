const { query } = require('../lib/db');
const { reply, verifySession, originAllowed } = require('../lib/admin-auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return reply(res, 405, { ok:false, error:'method_not_allowed' }); }
  if (!originAllowed(req)) return reply(res, 403, { ok:false, error:'origin_not_allowed' });
  if (!verifySession(req)) return reply(res, 401, { ok:false, error:'authentication_required' });
  const status = String((req.query && req.query.status) || '').slice(0, 24);
  const allowed = new Set(['new','in_review','awaiting_response','resolved','closed']);
  const limit = Math.min(100, Math.max(1, Number.parseInt((req.query && req.query.limit) || '50', 10) || 50));
  const offset = Math.max(0, Number.parseInt((req.query && req.query.offset) || '0', 10) || 0);
  if (status && !allowed.has(status)) return reply(res, 400, { ok:false, error:'invalid_status' });
  try {
    const values = [];
    let where = '';
    if (status) { values.push(status); where = 'WHERE status = $1'; }
    values.push(limit, offset);
    const result = await query(
      'SELECT id, name, email, role, details, form_data, status, assigned_to, internal_notes, created_at, updated_at FROM public.enquiries ' + where +
      ' ORDER BY created_at DESC LIMIT $' + (values.length - 1) + ' OFFSET $' + values.length, values
    );
    return reply(res, 200, { ok:true, enquiries:result.rows, limit, offset });
  } catch (_) {
    return reply(res, 503, { ok:false, error:'database_unavailable', message:'The enquiry database is not configured or is temporarily unavailable.' });
  }
};