const { ObjectId } = require('mongodb');
const { db, auth, limit } = require('./_lib');
module.exports = async (req, res) => {
  try {
    const c = (await db()).collection('messages');
    if (req.method === 'POST') {
      if (limit(req, 5)) return res.status(429).json({ error: 'Too many messages — please try again later' });
      const b = req.body || {};
      if (b.website) return res.json({ ok: true }); // honeypot
      const name = String(b.name || '').trim().slice(0, 80), email = String(b.email || '').trim().slice(0, 120), message = String(b.message || '').trim().slice(0, 2000);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 3) return res.status(400).json({ error: 'Please enter your name, a valid email and a message' });
      await c.insertOne({ name, email, message, at: Date.now() });
      return res.json({ ok: true });
    }
    if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
    if (req.method === 'GET') return res.json({ items: await c.find().sort({ at: -1 }).limit(300).toArray() });
    if (req.method === 'DELETE') { await c.deleteOne({ _id: new ObjectId(String(req.query.id)) }); return res.json({ ok: true }); }
    res.status(405).json({ error: 'method' });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
