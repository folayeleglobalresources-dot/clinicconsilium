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
  'International care enquiry',
  'Medicine access enquiry',
  'Pharmacy partner application',
  'Medicine supplier partnership'
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

function enquiryType(role) {
  if (['Partnership enquiry', 'Medicine access enquiry', 'Pharmacy partner application', 'Medicine supplier partnership'].includes(role)) return 'partnership';
  if (role === 'Doctor or healthcare professional') return 'professional_interest';
  if (role === 'Clinic or hospital representative' || role === 'Laboratory or diagnostic provider') {
    return 'organisation_interest';
  }
  return 'general';
}

function supabaseHeaders(serviceKey, extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
    ...extra
  };
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
    const allowedHosts = new Set([host, 'clinicconsilium.vercel.app']);
    if (!allowedHosts.has(originHost)) {
      return reply(res, 403, { ok: false, error: 'origin_not_allowed' });
    }
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return reply(res, 415, { ok: false, error: 'json_required' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      return reply(res, 413, { ok: false, error: 'request_too_large' });
    }
    try { body = JSON.parse(body); } catch (_) {
      return reply(res, 400, { ok: false, error: 'invalid_json' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return reply(res, 400, { ok: false, error: 'invalid_request' });
  }

  if (clean(body.website, 200)) {
    return reply(res, 200, { ok: true, message: 'Thank you for your interest.' });
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const role = clean(body.role, 80);
  const interest = clean(body.interest, 1500);

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ALLOWED_ROLES.has(role)) {
    return reply(res, 400, { ok: false, error: 'check_required_fields' });
  }
  if (/[\r\n]/.test(email)) {
    return reply(res, 400, { ok: false, error: 'invalid_email' });
  }

  // The first release must not collect clinical or identifying health information.
  const forbiddenTerms = /\b(patient diagnosis|medical record|medical history|prescription details|date of birth|national identification number)\b/i;
  if (forbiddenTerms.test(interest)) {
    return reply(res, 400, {
      ok: false,
      error: 'sensitive_information_not_allowed',
      message: 'Please remove personal or health information and submit only a general enquiry.'
    });
  }

  const supabaseUrl = clean(process.env.SUPABASE_URL, 500).replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return reply(res, 503, {
      ok: false,
      error: 'database_not_configured',
      message: 'The enquiry service is not ready yet. Your information has not been stored or sent.'
    });
  }

  let baseUrl;
  try {
    baseUrl = new URL(supabaseUrl);
    if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost') throw new Error('https_required');
  } catch (_) {
    return reply(res, 503, { ok: false, error: 'database_configuration_invalid' });
  }

  let saved;
  try {
    const insertResponse = await fetch(supabaseUrl + '/rest/v1/enquiries', {
      method: 'POST',
      headers: supabaseHeaders(serviceKey, { Prefer: 'return=representation' }),
      body: JSON.stringify({
        name,
        email,
        role,
        interest,
        enquiry_type: enquiryType(role),
        source: 'website',
        email_delivery_status: 'pending'
      })
    });
    if (!insertResponse.ok) {
      return reply(res, 503, {
        ok: false,
        error: 'database_save_failed',
        message: 'We could not securely save your enquiry. Please try again later.'
      });
    }
    const rows = await insertResponse.json();
    saved = Array.isArray(rows) ? rows[0] : null;
    if (!saved || !saved.id) {
      return reply(res, 503, { ok: false, error: 'database_save_unconfirmed' });
    }
  } catch (_) {
    return reply(res, 503, {
      ok: false,
      error: 'database_unavailable',
      message: 'The enquiry service is temporarily unavailable. Please try again later.'
    });
  }

  let deliveryStatus = 'not_configured';
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CLINICCONSILIUM_ENQUIRY_TO || 'clinicconsilium@gmail.com';
  const sender = process.env.CLINICCONSILIUM_FROM_EMAIL;

  if (apiKey && sender) {
    const text = [
      'New ClinicConsilium enquiry',
      '',
      'Reference: ' + saved.id,
      'Name: ' + name,
      'Email: ' + email,
      'Role: ' + role,
      '',
      'General enquiry:',
      interest || '(No additional message)',
      '',
      'Reminder: general enquiries only; do not use this endpoint for clinical or sensitive health information.'
    ].join('\n');

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: sender,
          to: [recipient],
          reply_to: email,
          subject: 'ClinicConsilium — ' + role,
          text
        })
      });
      deliveryStatus = response.ok ? 'sent' : 'failed';
    } catch (_) {
      deliveryStatus = 'failed';
    }
  }

  if (deliveryStatus !== 'pending') {
    try {
      await fetch(supabaseUrl + '/rest/v1/enquiries?id=eq.' + encodeURIComponent(saved.id), {
        method: 'PATCH',
        headers: supabaseHeaders(serviceKey, { Prefer: 'return=minimal' }),
        body: JSON.stringify({ email_delivery_status: deliveryStatus })
      });
    } catch (_) {
      // The saved enquiry remains available even if notification status could not be updated.
    }
  }

  if (deliveryStatus === 'sent') {
    return reply(res, 200, {
      ok: true,
      message: 'Your general enquiry has been received and the team has been notified.',
      reference: saved.id
    });
  }
  return reply(res, 200, {
    ok: true,
    message: 'Your general enquiry has been safely received. Email notifications are not yet active.',
    reference: saved.id,
    notification: deliveryStatus
  });
};
