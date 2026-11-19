const { db, auth, limit } = require('./_lib');
const { ObjectId } = require('mongodb');

const clean = value => String(value || '').trim();
const safeEvent = body => {
  const title = clean(body.title).slice(0, 120);
  const date = new Date(body.date);
  const description = clean(body.description).slice(0, 2000);
  const location = clean(body.location).slice(0, 200);
  if (!title || !body.date || Number.isNaN(date.getTime())) return { error: 'Add an event title and a valid date/time.' };
  return { value: { title, date, description, location, updatedAt: new Date() } };
};

module.exports = async (req, res) => {
  if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const events = (await db()).collection('events');
    if (req.method === 'GET') {
      const items = await events.find().sort({ date: 1 }).limit(200).toArray();
      return res.setHeader('Cache-Control', 'private, no-store'), res.json({ items });
    }
    if (req.method === 'POST') {
      if (limit(req, 20)) return res.status(429).json({ error: 'Too many changes. Please wait a moment.' });
      const parsed = safeEvent(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      const event = { ...parsed.value, createdAt: new Date() };
      const result = await events.insertOne(event);
      return res.status(201).json({ item: { ...event, _id: result.insertedId } });
    }
    if (req.method === 'PUT') {
      const id = clean((req.body || {}).id);
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid event ID.' });
      const parsed = safeEvent(req.body || {});
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      const result = await events.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: parsed.value },
        { returnDocument: 'after' }
      );
      if (!result) return res.status(404).json({ error: 'Event not found.' });
      return res.json({ item: result });
    }
    if (req.method === 'DELETE') {
      const id = clean(req.query.id);
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid event ID.' });
      const result = await events.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return res.status(404).json({ error: 'Event not found.' });
      return res.json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Events API failed:', error.message);
    return res.status(500).json({ error: 'Could not save events. Check MongoDB and Vercel function logs.' });
  }
};
