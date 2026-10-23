const { query } = require('./lib/db');
const MAX_BODY_BYTES = 12_000;
const ALLOWED_ROLES = new Set([
  'Patient or family member',
  'Doctor or healthcare professional',
  'Clinic or hospital representative',
  'Laboratory or diagnostic provider',
  'Other healthcare partner',
  'Partnership enquiry',
  'Job or volunteer enquiry',
  'Accessibility feedback',
  'International care enquiry'
]);
function reply(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(payload);
}
function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, { ok:false, error:'method_not_allowed' }); }
  const origin = req.headers.origin, host = String(req.headers.host || '').toLowerCase();
  if (origin) {
    let originHost = '';
    try { originHost = new URL(origin).host.toLowerCase(); } catch (_) {}
    if (!new Set([host, 'clinicconsilium.vercel.app']).has(originHost)) return reply(res, 403, { ok:false, error:'origin_not_allowed' });
  }
  if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return reply(res, 415, { ok:false, error:'json_required' });
  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return reply(res, 413, { ok:false, error:'request_too_large' });
    try { body = JSON.parse(body); } catch (_) { return reply(res, 400, { ok:false, error:'invalid_json' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(res, 400, { ok:false, error:'invalid_request' });
  if (clean(body.website, 200)) return reply(res, 200, { ok:true, message:'Thank you for your interest.' });
  const name = clean(body.name, 100), email = clean(body.email, 254).toLowerCase();
  const role = clean(body.role, 80), interest = clean(body.interest, 1500);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ALLOWED_ROLES.has(role)) return reply(res, 400, { ok:false, error:'check_required_fields' });
  if (/[\r\n]/.test(email)) return reply(res, 400, { ok:false, error:'invalid_email' });
  const forbiddenTerms = /\b(patient diagnosis|medical record|medical history|prescription details|date of birth|national identification number)\b/i;
  if (forbiddenTerms.test(interest)) return reply(res, 400, { ok:false, error:'sensitive_information_not_allowed', message:'Please remove personal or health information and submit only a general enquiry.' });
  try {
    const saved = await query(
      'INSERT INTO public.enquiries (name, email, role, details, form_data) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id, created_at',
      [name, email, role, interest, JSON.stringify({ interest })]
    );
    return reply(res, 201, {
      ok:true,
      message:'Your enquiry has been received. Our team has not yet enabled email acknowledgements.',
      reference:String(saved.rows[0].id)
    });
  } catch (_) {
    return reply(res, 503, {
      ok:false,
      error:'enquiry_storage_unavailable',
      message:'The enquiry service is not ready yet. Your information could not be saved. Please try again later.'
    });
  }
};