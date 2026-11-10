// api/pricing.js
// Stores and retrieves pricing settings using Vercel KV
// Enable KV in your Vercel project: Storage → Create → KV

import { kv } from '@vercel/kv';

const DEFAULTS = {
  pricePerFoot: 28,
  multHigh: 1.8,
  multMod: 1.35,
  multRemoval: 1.6,
  minPrice: 450,
  spreadPercent: 20
};

export default async function handler(req, res) {
  // Simple shared secret so random people can't change your prices
  const ADMIN_KEY = process.env.ADMIN_KEY || 'demo-key-change-me';

  if (req.method === 'GET') {
    try {
      const saved = await kv.get('pricing');
      return res.status(200).json(saved || DEFAULTS);
    } catch (err) {
      console.error(err);
      return res.status(200).json(DEFAULTS);
    }
  }

  if (req.method === 'POST') {
    const key = req.headers['x-admin-key'] || req.query.key;
    if (key !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const settings = {
        pricePerFoot: Number(body.pricePerFoot) || DEFAULTS.pricePerFoot,
        multHigh: Number(body.multHigh) || DEFAULTS.multHigh,
        multMod: Number(body.multMod) || DEFAULTS.multMod,
        multRemoval: Number(body.multRemoval) || DEFAULTS.multRemoval,
        minPrice: Number(body.minPrice) || DEFAULTS.minPrice,
        spreadPercent: Number(body.spreadPercent) || DEFAULTS.spreadPercent
      };
      await kv.set('pricing', settings);
      return res.status(200).json({ ok: true, settings });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}