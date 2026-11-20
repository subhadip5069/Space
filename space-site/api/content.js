const { db, auth } = require('./_lib');
const crypto = require('crypto');

async function trackVisit(req, database) {
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

function readContent(req) {
  const data = req.body && req.body.content;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  try {
    if (Buffer.byteLength(JSON.stringify(data), 'utf8') > 4 * 1024 * 1024) return null;
  } catch {
    return null;
  }
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const method = String(req.method || '').toUpperCase();

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization before opening a database connection for any write operation.
  if (method !== 'GET' && !auth(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const database = await db();
    const content = database.collection('content');

    if (method === 'GET') {
      // Analytics is best-effort so a tracking hiccup never prevents the portfolio from rendering.
      try { await trackVisit(req, database); }
      catch (error) { console.error('Visit tracking failed:', error.message); }
      const entry = await content.findOne({ _id: 'site' });
      return res.status(200).json(entry ? entry.data : {});
    }

    if (method === 'POST' || method === 'PUT') {
      const data = readContent(req);
      if (!data) return res.status(400).json({ error: 'Content must be a JSON object no larger than 4 MB.' });
      const document = { _id: 'site', data, at: Date.now() };

      if (method === 'POST') {
        try {
          await content.insertOne(document);
        } catch (error) {
          if (error.code === 11000) return res.status(409).json({ error: 'Site content already exists. Use PUT to update it.' });
          throw error;
        }
        return res.status(201).json({ ok: true, content: data });
      }

      await content.replaceOne({ _id: 'site' }, document, { upsert: true });
      return res.status(200).json({ ok: true, content: data });
    }

    const result = await content.deleteOne({ _id: 'site' });
    return res.status(200).json({ ok: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error('Content API failed:', error.message);
    return res.status(500).json({ error: 'Content service is unavailable. Check the database configuration and server logs.' });
  }
};

