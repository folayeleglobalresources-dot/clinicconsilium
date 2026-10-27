module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    return res.status(503).json({ ok: false, error: 'sign_in_not_configured' });
  }
  return res.status(200).json({ ok: true, supabaseUrl: url, supabaseAnonKey: anonKey });
};
