require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// Replace require with dynamic import for node-fetch ESM compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.post('/api/ai', async (req, res) => {
  console.log('Received:', req.body.inputs); // Add this line
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: req.body.inputs })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
