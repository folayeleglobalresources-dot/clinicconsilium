const { query } = require('../lib/db');
const { reply, verifySession, originAllowed } = require('../lib/admin-auth');
const allowed = new Set(['new','in_review','awaiting_response','resolved','closed']);
const clean = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : undefined;

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') { res.setHeader('Allow', 'PATCH'); return reply(res, 405, { ok:false, error:'method_not_allowed' }); }
  if (!originAllowed(req)) return reply(res, 403, { ok:false, error:'origin_not_allowed' });
  if (!verifySession(req)) return reply(res, 401, { ok:false, error:'authentication_required' });
  const id = Number.parseInt((req.query && req.query.id) || '', 10);
  if (!Number.isSafeInteger(id) || id < 1) return reply(res, 400, { ok:false, error:'invalid_id' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const status = clean(body.status, 24);
  const assignedTo = clean(body.assigned_to, 254);
  const notes = clean(body.internal_notes, 4000);
  if (status !== undefined && !allowed.has(status)) return reply(res, 400, { ok:false, error:'invalid_status' });
  if (assignedTo !== undefined && assignedTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedTo)) return reply(res, 400, { ok:false, error:'invalid_assignee_email' });
  if (status === undefined && assignedTo === undefined && notes === undefined) return reply(res, 400, { ok:false, error:'no_changes' });
  try {
    const result = await query(
      'UPDATE public.enquiries SET status = COALESCE($2, status), assigned_to = CASE WHEN $3::boolean THEN $4 ELSE assigned_to END, internal_notes = COALESCE($5, internal_notes), updated_at = now() WHERE id = $1 RETURNING id, name, email, role, details, form_data, status, assigned_to, internal_notes, created_at, updated_at',
      [id, status || null, assignedTo !== undefined, assignedTo || null, notes === undefined ? null : notes]
    );
    if (!result.rowCount) return reply(res, 404, { ok:false, error:'not_found' });
    return reply(res, 200, { ok:true, enquiry:result.rows[0] });
  } catch (_) {
    return reply(res, 503, { ok:false, error:'database_unavailable', message:'The enquiry database is not configured or is temporarily unavailable.' });
  }
};