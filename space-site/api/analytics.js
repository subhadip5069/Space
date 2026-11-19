const { db, auth } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const days = Math.min(90, Math.max(7, Number.parseInt(req.query.days, 10) || 30));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startDay = start.toISOString().slice(0, 10);
    const database = await db();

    const [visitorRows, pageviewRows] = await Promise.all([
      database.collection('analytics_visitors').aggregate([
        { $match: { day: { $gte: startDay } } },
        { $group: { _id: '$day', visits: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      database.collection('analytics_daily').find(
        { day: { $gte: startDay } },
        { projection: { _id: 0, day: 1, pageviews: 1 } }
      ).sort({ day: 1 }).toArray()
    ]);

    const visitors = new Map(visitorRows.map(row => [row._id, row.visits]));
    const pageviews = new Map(pageviewRows.map(row => [row.day, row.pageviews || 0]));
    const series = [];
    for (let offset = 0; offset < days; offset++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      const day = date.toISOString().slice(0, 10);
      series.push({ day, visits: visitors.get(day) || 0, pageviews: pageviews.get(day) || 0 });
    }
    const sum = (field, count) => series.slice(-count).reduce((total, entry) => total + entry[field], 0);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({
      range: days,
      today: series[series.length - 1],
      totals: {
        visits7d: sum('visits', 7),
        pageviews7d: sum('pageviews', 7),
        visitsRange: sum('visits', days),
        pageviewsRange: sum('pageviews', days)
      },
      series
    });
  } catch (error) {
    console.error('Analytics API failed:', error.message);
    return res.status(500).json({ error: 'Could not load analytics. Check the MongoDB connection and Vercel function logs.' });
  }
};
