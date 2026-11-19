const crypto = require('crypto');
const { db, limit } = require('./_lib');

const digest = value => crypto.createHash('sha256').update(String(value)).digest();
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (limit(req, 5)) return res.status(429).json({ error: 'Too many registration attempts. Please wait and try again.' });

  const { setupKey, password, confirmPassword } = req.body || {};
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  if (!bootstrapPassword) return res.status(503).json({ error: 'Set ADMIN_PASSWORD in Vercel project settings before creating the first admin account.' });
  if (!process.env.MONGODB_URI) return res.status(503).json({ error: 'Admin registration requires MONGODB_URI. Check the Vercel project Root Directory and environment variables.' });
  if (!same(String(setupKey || ''), bootstrapPassword)) return res.status(401).json({ error: 'Setup key does not match the ADMIN_PASSWORD configured in Vercel.' });

  const newPassword = String(password || '');
  if (newPassword.length < 12 || newPassword.length > 256) {
    return res.status(400).json({ error: 'Choose a password between 12 and 256 characters.' });
  }
  if (newPassword !== String(confirmPassword || '')) return res.status(400).json({ error: 'The passwords do not match.' });

  try {
    const admins = (await db()).collection('admins');
    if (await admins.findOne({ _id: 'owner' })) {
      return res.status(409).json({ error: 'An admin account is already registered. Registration is one-time; log in instead.' });
    }
    const salt = crypto.randomBytes(16);
    const passwordHash = crypto.scryptSync(newPassword, salt, 64);
    await admins.insertOne({
      _id: 'owner',
      salt: salt.toString('hex'),
      passwordHash: passwordHash.toString('hex'),
      createdAt: new Date()
    });
    return res.status(201).json({ ok: true, message: 'Admin account created. You can now log in with your new password.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An admin account was just registered. Please log in.' });
    console.error('Admin registration failed:', error.message);
    return res.status(503).json({ error: 'Registration could not reach MongoDB. Verify MONGODB_URI and Atlas Network Access in Vercel.' });
  }
};
