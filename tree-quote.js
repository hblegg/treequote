// api/tree-quote.js
export const config = {
  api: {
    bodyParser: false, // needed so we can read the raw multipart form
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData?.() || await parseFormData(req);
    
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

    // Convert image to base64 (for sending to a vision API later)
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    // ========== MVP QUOTE LOGIC ==========
    // For the first version we return a realistic mock based on simple heuristics.
    // Later you can replace this block with a real call to Grok / GPT-4o / Claude vision.
    
    const height = Math.round(25 + Math.random() * 30); // 25–55 ft
    const complexities = ['Low', 'Moderate', 'High'];
    const complexity = complexities[Math.floor(Math.random() * 3)];
    const hazardOptions = [
      'Open yard',
      'Near fence',
      'Power lines nearby',
      'Tight access',
      'Close to structure'
    ];
    const hazards = hazardOptions[Math.floor(Math.random() * hazardOptions.length)];

    // Simple pricing model (adjust to Happy’s real rates)
    let base = height * 14;
    if (complexity === 'High') base *= 1.7;
    else if (complexity === 'Moderate') base *= 1.25;
    if (service === 'removal') base *= 1.4;
    if (service === 'stump') base *= 0.6;

    const low = Math.round(base * 0.85);
    const high = Math.round(base * 1.3);

    const result = {
      height: `${height} ft`,
      complexity,
      hazards,
      quoteRange: `$${low.toLocaleString()} – $${high.toLocaleString()}`,
      // Extra fields you may want later
      customer: { name, email, phone, address, service, notes },
      imageReceived: true
    };

    // Optional: log for debugging
    console.log('Quote generated:', result);

    return res.status(200).json(result);

  } catch (err) {
    console.error('Quote error:', err);
    return res.status(500).json({ error: 'Failed to process quote' });
  }
}

// Fallback parser if req.formData is not available
async function parseFormData(req) {
  const busboy = require('busboy');
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (d) => chunks.push(d));
      file.on('end', () => {
        files[name] = {
          buffer: Buffer.concat(chunks),
          filename: info.filename,
          mimeType: info.mimeType
        };
      });
    });

    bb.on('finish', () => {
      const formData = {
        get: (key) => fields[key] || (files[key] ? {
          arrayBuffer: async () => files[key].buffer,
          type: files[key].mimeType,
          name: files[key].filename
        } : null)
      };
      resolve(formData);
    });

    bb.on('error', reject);
    req.pipe(bb);
  });
}