const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/api/ai', async (req, res) => {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
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

app.listen(3000, () => console.log('Proxy running on http://localhost:3000'));
