const crypto = require('node:crypto');

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}
function secret() {
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) throw new Error('Admin session secret is not configured securely');
  return process.env.ADMIN_SESSION_SECRET;
}
function sign(value) { return crypto.createHmac('sha256', secret()).update(value).digest('base64url'); }
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function cookieValue(req) {
  const raw = String(req.headers.cookie || '');
  const match = raw.match(/(?:^|;\\s*)cc_admin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function verifySession(req) {
  try {
    const token = cookieValue(req);
    const split = token.lastIndexOf('.');
    if (split < 1) return false;
    const payload = token.slice(0, split), signature = token.slice(split + 1);
    if (!safeEqual(sign(payload), signature)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data && data.exp > Date.now() && data.sub === 'clinicconsilium-admin';
  } catch (_) { return false; }
}
function issueCookie(res) {
  const payload = Buffer.from(JSON.stringify({ sub: 'clinicconsilium-admin', exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  const token = payload + '.' + sign(payload);
  res.setHeader('Set-Cookie', 'cc_admin=' + encodeURIComponent(token) + '; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=28800');
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', 'cc_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0');
}
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const host = new URL(origin).host.toLowerCase();
    return host === String(req.headers.host || '').toLowerCase() || host === 'clinicconsilium.vercel.app';
  } catch (_) { return false; }
}
module.exports = { reply, verifySession, issueCookie, clearCookie, originAllowed, safeEqual };