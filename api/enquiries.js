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

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
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

  // Honeypot field for simple automated form submissions.
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

  // Never accept clinical details through this general enquiry endpoint.
  const forbiddenTerms = /\b(patient diagnosis|medical record|medical history|prescription details|date of birth|national identification number)\b/i;
  if (forbiddenTerms.test(interest)) {
    return reply(res, 400, {
      ok: false,
      error: 'sensitive_information_not_allowed',
      message: 'Please remove personal or health information and submit only a general enquiry.'
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CLINICCONSILIUM_ENQUIRY_TO;
  const sender = process.env.CLINICCONSILIUM_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    return reply(res, 503, {
      ok: false,
      error: 'enquiry_delivery_not_configured',
      message: 'The enquiry service is not ready yet. Your information has not been sent or stored.'
    });
  }

  const text = [
    'New ClinicConsilium enquiry',
    '',
    'Name: ' + name,
    'Email: ' + email,
    'Role: ' + role,
    '',
    'General enquiry:',
    interest || '(No additional message)',
    '',
    'Reminder: this endpoint is for general enquiries only; do not use it for clinical or sensitive health information.'
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

    if (!response.ok) {
      return reply(res, 502, {
        ok: false,
        error: 'delivery_failed',
        message: 'We could not send your enquiry. Please try again later.'
      });
    }
    return reply(res, 200, {
      ok: true,
      message: 'Your general enquiry has been sent successfully.'
    });
  } catch (_) {
    return reply(res, 502, {
      ok: false,
      error: 'delivery_unavailable',
      message: 'We could not send your enquiry. Please try again later.'
    });
  }
};
