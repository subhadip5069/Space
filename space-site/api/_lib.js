const { MongoClient } = require('mongodb');
const crypto = require('crypto');
let cached = null;
async function db() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  if (!cached) {
    cached = new MongoClient(process.env.MONGODB_URI).connect()
      .then(c => c.db(process.env.MONGODB_DB || 'space'))
      .catch(e => { cached = null; throw e; });
  }
  return cached;
}
const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
const mac = p => crypto.createHmac('sha256', secret()).update(p).digest('hex');
function sign() { const p = String(Date.now() + 12 * 3600e3); return p + '.' + mac(p); }
function auth(req) {
  if (!secret()) return false;
  const t = String(req.headers.authorization || '').replace('Bearer ', '');
  const [p, h] = t.split('.');
  if (!p || !h) return false;
  const e = mac(p);
  return h.length === e.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(e)) && Date.now() < Number(p);
}
const hits = new Map();
function limit(req, n = 10, ms = 60000) {
  const k = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms);
  a.push(now); hits.set(k, a);
  return a.length > n;
}
module.exports = { db, sign, auth, limit };
