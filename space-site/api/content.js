const { db, auth } = require('./_lib');
module.exports = async (req, res) => {
  try {
    const c = (await db()).collection('content');
    if (req.method === 'GET') {
      const x = await c.findOne({ _id: 'site' });
      res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=120');
      return res.json(x ? x.data : {});
    }
    if (req.method === 'PUT') {
      if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
      const data = (req.body || {}).content;
      if (!data || typeof data !== 'object' || JSON.stringify(data).length > 4e6) return res.status(400).json({ error: 'Invalid content' });
      await c.updateOne({ _id: 'site' }, { $set: { data, at: Date.now() } }, { upsert: true });
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'method' });
  } catch (e) { res.status(500).json({ error: 'Server error: ' + e.message }); }
};
