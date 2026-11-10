// api/tree-quote.js
// Updated to read pricing from Vercel KV (set by the admin slider page)

import { kv } from '@vercel/kv';

export const config = {
  api: {
    bodyParser: false,
  },
};

const DEFAULTS = {
  pricePerFoot: 28,
  multHigh: 1.8,
  multMod: 1.35,
  multRemoval: 1.6,
  minPrice: 450,
  spreadPercent: 20
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name') || '';
    const email = formData.get('email') || '';
    const phone = formData.get('phone') || '';
    const address = formData.get('address') || '';
    const service = formData.get('service') || '';
    const notes = formData.get('notes') || '';
    const imageFile = formData.get('combinedImage');

    if (!imageFile) {
      return res.status(400).json({ error: 'No image received' });
    }

    // Load current pricing (falls back to defaults)
    let pricing = DEFAULTS;
    try {
      const saved = await kv.get('pricing');
      if (saved) pricing = { ...DEFAULTS, ...saved };
    } catch (e) {
      console.warn('KV read failed, using defaults');
    }

    // Mock analysis (replace with real vision later)
    const height = Math.round(25 + Math.random() * 30);
    const complexities = ['Low', 'Moderate', 'High'];
    const complexity = complexities[Math.floor(Math.random() * 3)];
    const hazardOptions = ['Open yard', 'Near fence', 'Power lines nearby', 'Tight access', 'Close to structure'];
    const hazards = hazardOptions[Math.floor(Math.random() * hazardOptions.length)];

    // Apply pricing from admin sliders
    let base = height * pricing.pricePerFoot;
    if (complexity === 'High') base *= pricing.multHigh;
    else if (complexity === 'Moderate') base *= pricing.multMod;
    if (service === 'removal') base *= pricing.multRemoval;
    if (base < pricing.minPrice) base = pricing.minPrice;

    const spread = pricing.spreadPercent / 100;
    const low = Math.round(base * (1 - spread));
    const high = Math.round(base * (1 + spread));

    return res.status(200).json({
      height: `${height} ft`,
      complexity,
      hazards,
      quoteRange: `$${low.toLocaleString()} – $${high.toLocaleString()}`,
      customer: { name, email, phone, address, service, notes }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process quote' });
  }
}
