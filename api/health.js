const { query } = require('./lib/db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ ok:false, error:'method_not_allowed' }); }
  let database = 'not_configured';
  if (process.env.DATABASE_URL) {
    try { await query('SELECT 1'); database = 'connected'; }
    catch (_) { database = 'unavailable'; }
  }
  return res.status(200).json({
    ok:true, service:'clinicconsilium-web-api', status:'available',
    scope:'dependency-health', database, enquiry_delivery:'not_configured',
    patient_services:'not_available', timestamp:new Date().toISOString()
  });
};