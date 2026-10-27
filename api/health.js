module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const databaseConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
    database: databaseConfigured ? 'configured_not_connection_verified' : 'not_configured',
    enquiry_delivery: emailConfigured ? 'configured_not_delivery_verified' : 'not_configured',
    patient_services: 'not_available',
    timestamp: new Date().toISOString()
  });
};
