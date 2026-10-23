module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  return res.status(200).json({
    ok: true,
    service: 'clinicconsilium-web-api',
    status: 'available',
    scope: 'process-health-only',
    database: 'not_configured',
    enquiry_delivery: 'not_configured',
    patient_services: 'not_available',
    timestamp: new Date().toISOString()
  });
};
