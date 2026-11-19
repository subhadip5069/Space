const { db, auth } = require('./_lib');
const crypto = require('crypto');

async function trackVisit(req) {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) return;
  const referer = String(req.headers.referer || '');
  if (/\/admin(?:\/|$)/i.test(referer)) return;
  const agent = String(req.headers['user-agent'] || '');
  if (/bot|crawler|spider|preview|uptime|monitor/i.test(agent)) return;

  const day = new Date().toISOString().slice(0, 10);
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const address = forwarded || String(req.socket?.remoteAddress || 'unknown');
  // Keep only a daily, keyed pseudonymous identifier; never persist the raw IP address.
  const visitor = crypto.createHmac('sha256', secret).update(`${day}:${address}`).digest('hex');
  const database = await db();
  await Promise.all([
    database.collection('analytics_visitors').updateOne(
      { _id: `${day}:${visitor}` },
      { $setOnInsert: { day, createdAt: new Date() } },
      { upsert: true }
    ),
    database.collection('analytics_daily').updateOne(
      { _id: day },
      { $inc: { pageviews: 1 }, $set: { day, updatedAt: new Date() } },
      { upsert: true }
    )
  ]);
}

module.exports = async (req, res) => {
  try {
    const database = await db();
    const content = database.collection('content');
    if (req.method === 'GET') {
      // Analytics is best-effort so a tracking hiccup never prevents the portfolio from rendering.
      try { await trackVisit(req); }
      catch (error) { console.error('Visit tracking failed:', error.message); }
      const entry = await content.findOne({ _id: 'site' });
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.json(entry ? entry.data : {});
    }
    if (req.method === 'PUT') {
      if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
      const data = (req.body || {}).content;
      if (!data || typeof data !== 'object' || JSON.stringify(data).length > 4e6) {
        return res.status(400).json({ error: 'Invalid content' });
      }
      await content.updateOne({ _id: 'site' }, { $set: { data, at: Date.now() } }, { upsert: true });
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'method' });
  } catch (error) {
    console.error('Content API failed:', error.message);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
