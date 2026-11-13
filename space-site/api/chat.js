// Space Bot. Uses a free Gemini key if GEMINI_API_KEY is set, else Anthropic if ANTHROPIC_API_KEY is set.
// With neither, it answers {fallback:true} and the browser uses the built-in space knowledge base (100% free).
const { limit } = require('./_lib');
const SYS = 'You are Space Bot, a friendly astronomy and spaceflight expert on a portfolio website. Answer only space-related questions (planets, stars, galaxies, black holes, missions, telescopes, cosmology, space history). Be accurate, concise (under 120 words) and say when something is uncertain or theoretical. If asked something unrelated, politely steer back to space.';
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (limit(req, 15)) return res.status(429).json({ error: 'Too many questions — wait a minute' });
  const b = req.body || {}, msg = String(b.message || '').slice(0, 400);
  if (!msg) return res.status(400).json({ error: 'Empty question' });
  const hist = (Array.isArray(b.history) ? b.history : []).slice(-6).map(h => (h.r === 'u' ? 'User: ' : 'Bot: ') + String(h.t || '').slice(0, 500)).join('\n');
  const prompt = (hist ? 'Conversation so far:\n' + hist + '\n\n' : '') + 'User: ' + msg;
  try {
    let reply = null;
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 400, temperature: 0.6 } })
      });
      const j = await r.json();
      reply = j.candidates && j.candidates[0] && j.candidates[0].content.parts.map(p => p.text).join('');
    } else if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: SYS, messages: [{ role: 'user', content: prompt }] })
      });
      const j = await r.json();
      reply = j.content && j.content.map(p => p.text || '').join('');
    }
    return res.json(reply ? { reply: reply.trim() } : { fallback: true });
  } catch (e) { return res.json({ fallback: true }); }
};
