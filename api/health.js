module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let database = 'not_configured';

  if (supabaseUrl && serviceKey) {
    try {
      const baseUrl = new URL(supabaseUrl);
      if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost') {
        throw new Error('https_required');
      }

      const response = await fetch(
        supabaseUrl + '/rest/v1/enquiries?select=id&limit=0',
        {
          method: 'GET',
          headers: {
            apikey: serviceKey,
            Authorization: 'Bearer ' + serviceKey,
            Accept: 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      database = response.ok ? 'connected' : 'unavailable';
    } catch (_) {
      database = 'unavailable';
    }
  }

  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.CLINICCONSILIUM_FROM_EMAIL &&
    (process.env.CLINICCONSILIUM_ENQUIRY_TO || 'clinicconsilium@gmail.com')
  );

  return res.status(200).json({
    ok: true,
    service: 'clinicconsilium-web-api',
    status: 'available',
    scope: 'initial-release-general-enquiries',
    database,
    enquiry_delivery: emailConfigured ? 'configured_not_delivery_verified' : 'not_configured',
    patient_services: 'not_available',
    timestamp: new Date().toISOString()
  });
};
