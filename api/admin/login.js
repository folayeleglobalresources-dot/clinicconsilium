const crypto = require('node:crypto');
const { reply, issueCookie, clearCookie, originAllowed, safeEqual } = require('../lib/admin-auth');

module.exports = async (req, res) => {
  if (!['POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'POST, DELETE'); return reply(res, 405, { ok:false, error:'method_not_allowed' }); }
  if (!originAllowed(req)) return reply(res, 403, { ok:false, error:'origin_not_allowed' });
  if (req.method === 'DELETE') { clearCookie(res); return reply(res, 200, { ok:true }); }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const password = typeof body.password === 'string' ? body.password : '';
  const configured = process.env.ADMIN_PASSWORD_HASH || '';
  const [salt, expected] = configured.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expected || '') || !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return reply(res, 503, { ok:false, error:'admin_not_configured', message:'Admin access has not been configured by the site owner.' });
  }
  if (password.length < 1 || password.length > 1024) return reply(res, 400, { ok:false, error:'invalid_credentials' });
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  if (!safeEqual(actual, expected.toLowerCase())) {
    // Avoid revealing whether the admin configuration or password was the cause.
    return reply(res, 401, { ok:false, error:'invalid_credentials', message:'The password was not accepted.' });
  }
  issueCookie(res);
  return reply(res, 200, { ok:true, message:'Signed in.' });
};