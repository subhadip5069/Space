const { ObjectId } = require('mongodb');
const { db, auth, limit } = require('./_lib');
module.exports = async (req, res) => {
  try {
    const c = (await db()).collection('comments');
    if (req.method === 'GET') {
      if (req.query.all) {
        if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
        return res.json({ items: await c.find().sort({ at: -1 }).limit(500).toArray() });
      }
      const items = await c.find({ project: String(req.query.project || '') }, { projection: { _id: 0, name: 1, text: 1, at: 1 } }).sort({ at: 1 }).limit(100).toArray();
      return res.json({ items });
    }
    if (req.method === 'POST') {
      if (limit(req, 6)) return res.status(429).json({ error: 'Slow down — try again in a minute' });
      const b = req.body || {};
      const project = String(b.project || '').slice(0, 120), name = String(b.name || '').trim().slice(0, 60) || 'Guest', text = String(b.text || '').trim().slice(0, 600);
      if (!project || text.length < 2) return res.status(400).json({ error: 'Please write a comment' });
      const item = { project, name, text, at: Date.now() };
      await c.insertOne({ ...item });
      return res.json({ item });
    }
    if (req.method === 'DELETE') {
      if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
      await c.deleteOne({ _id: new ObjectId(String(req.query.id)) });
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'method' });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
