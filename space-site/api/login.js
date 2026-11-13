const crypto = require('crypto');
const { sign, limit } = require('./_lib');
const h = s => crypto.createHash('sha256').update(String(s)).digest();
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (limit(req, 8)) return res.status(429).json({ error: 'Too many attempts' });
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server' });
  const ok = crypto.timingSafeEqual(h((req.body || {}).password || ''), h(pw));
  if (!ok) return res.status(401).json({ error: 'Wrong password' });
  res.json({ token: sign() });
};
