const { db } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const checks = {
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
    adminSecret: Boolean(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD),
    mongodbUri: Boolean(process.env.MONGODB_URI),
    database: false
  };
  if (!checks.mongodbUri) {
    return res.status(503).json({ ok: false, checks, error: 'MONGODB_URI is missing. In Vercel, set Root Directory to space-site and add the environment variable to the active deployment environment.' });
  }
  try {
    await (await db()).command({ ping: 1 });
    checks.database = true;
    const accountExists = Boolean(await (await db()).collection('admins').findOne({ _id: 'owner' }, { projection: { _id: 1 } }));
    return res.status(200).json({ ok: true, checks, accountExists });
  } catch (error) {
    console.error('Admin health check failed:', error.message);
    return res.status(503).json({ ok: false, checks, error: 'MongoDB connection failed. Check the Vercel function logs, MongoDB URI, database user, and Atlas Network Access list.' });
  }
};
