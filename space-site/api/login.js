const crypto = require('crypto');
const { db, sign, limit } = require('./_lib');

const digest = value => crypto.createHash('sha256').update(String(value)).digest();
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (limit(req, 8)) return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });

  const password = String((req.body || {}).password || '');
  if (!password) return res.status(400).json({ error: 'Enter your admin password.' });
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_PASSWORD in the Vercel project settings and redeploy.' });
  if (!process.env.ADMIN_SECRET && !process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin token signing is not configured.' });

  try {
    // Once the first admin is registered, only the stored password hash is accepted.
    if (process.env.MONGODB_URI) {
      const admins = (await db()).collection('admins');
      const owner = await admins.findOne({ _id: 'owner' });
      if (owner) {
        const candidate = crypto.scryptSync(password, Buffer.from(owner.salt, 'hex'), 64);
        const expected = Buffer.from(owner.passwordHash, 'hex');
        if (expected.length !== candidate.length || !crypto.timingSafeEqual(candidate, expected)) {
          return res.status(401).json({ error: 'Incorrect admin password.' });
        }
        return res.json({ token: sign() });
      }
    }

    // Backward-compatible first login using the existing Vercel environment password.
    if (!same(password, process.env.ADMIN_PASSWORD)) {
      return res.status(401).json({ error: 'Incorrect admin password.' });
    }
    return res.json({ token: sign() });
  } catch (error) {
    console.error('Admin login failed:', error.message);
    return res.status(503).json({ error: 'Could not reach the admin database. Check MONGODB_URI, Atlas network access, and Vercel function logs.' });
  }
};
