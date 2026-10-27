const MAX_BODY_BYTES = 12000;
const TYPES = new Set([
  'community_pharmacy',
  'hospital_pharmacy',
  'licensed_distributor',
  'manufacturer',
  'other_qualified_supplier'
]);

function reply(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(payload);
}
function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function headers(key, extra = {}) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...extra };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  const origin = req.headers.origin;
  const host = String(req.headers.host || '').toLowerCase();
  if (origin) {
    let originHost = '';
    try { originHost = new URL(origin).host.toLowerCase(); } catch (_) {}
    if (!new Set([host, 'clinicconsilium.vercel.app']).has(originHost)) {
      return reply(res, 403, { ok: false, error: 'origin_not_allowed' });
    }
  }
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) return reply(res, 415, { ok: false, error: 'json_required' });

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return reply(res, 413, { ok: false, error: 'request_too_large' });
    try { body = JSON.parse(body); } catch (_) { return reply(res, 400, { ok: false, error: 'invalid_json' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(res, 400, { ok: false, error: 'invalid_request' });
  if (clean(body.website, 200)) return reply(res, 200, { ok: true, message: 'Thank you for your interest.' });

  const organisationName = clean(body.organisation_name, 180);
  const contactName = clean(body.contact_name, 120);
  const contactEmail = clean(body.contact_email, 254).toLowerCase();
  const phone = clean(body.phone, 40);
  const organisationType = clean(body.organisation_type, 40);
  const licenceType = clean(body.licence_type, 120);
  const licenceNumber = clean(body.licence_number, 120);
  const stateRegion = clean(body.state_region, 100);
  const city = clean(body.city, 100);
  const website = clean(body.organisation_website, 200);

  if (organisationName.length < 2 || contactName.length < 2 ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(contactEmail) ||
      !TYPES.has(organisationType)) {
    return reply(res, 400, { ok: false, error: 'check_required_fields' });
  }
  if (/[\\r\\n]/.test(contactEmail)) return reply(res, 400, { ok: false, error: 'invalid_email' });
  if (website && !/^https:\/\//i.test(website)) {
    return reply(res, 400, { ok: false, error: 'website_must_use_https' });
  }

  const supabaseUrl = clean(process.env.SUPABASE_URL, 500).replace(/\\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return reply(res, 503, {
      ok: false,
      error: 'database_not_configured',
      message: 'The secure partner application service is not ready yet. Your information has not been stored.'
    });
  }
  try {
    const base = new URL(supabaseUrl);
    if (base.protocol !== 'https:' && base.hostname !== 'localhost') throw new Error('https_required');
  } catch (_) {
    return reply(res, 503, { ok: false, error: 'database_configuration_invalid' });
  }

  try {
    const response = await fetch(supabaseUrl + '/rest/v1/pharmacy_partner_applications', {
      method: 'POST',
      headers: headers(serviceKey, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        organisation_name: organisationName,
        contact_name: contactName,
        contact_email: contactEmail,
        phone: phone || null,
        organisation_type: organisationType,
        licence_type: licenceType || null,
        licence_number: licenceNumber || null,
        state_region: stateRegion || null,
        city: city || null,
        website: website || null,
        status: 'pending_review'
      })
    });
    if (!response.ok) return reply(res, 503, {
      ok: false,
      error: 'application_save_failed',
      message: 'We could not securely save this application. Please try again later.'
    });
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows[0]?.id) return reply(res, 503, { ok: false, error: 'application_save_unconfirmed' });
    return reply(res, 201, {
      ok: true,
      message: 'Your partner application has been received for review. Submission does not mean approval or verified-partner status.',
      reference: rows[0].id
    });
  } catch (_) {
    return reply(res, 503, {
      ok: false,
      error: 'database_unavailable',
      message: 'The secure partner application service is temporarily unavailable. Please try again later.'
    });
  }
};
