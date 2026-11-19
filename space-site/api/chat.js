// Offline-only mode: do not call Gemini, Anthropic, or any other hosted AI service.
// The public client uses its bundled local astronomy knowledge base when fallback is true.
const { limit } = require('./_lib');
module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (limit(req, 20)) return res.status(429).json({ error: 'Too many questions — wait a minute' });
  const message = String((req.body || {}).message || '').trim().slice(0, 400);
  if (!message) return res.status(400).json({ error: 'Empty question' });
  return res.json({ fallback: true, offline: true });
};
