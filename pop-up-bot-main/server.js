// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// if you're on Node < 18, this provides fetch()
let fetchFn = global.fetch;
try {
  if (!fetchFn) {
    // npm i undici
    const { fetch } = require('undici');
    fetchFn = fetch;
  }
} catch (_) { /* ignore */ }

const app = express();

app.use(cors({
  origin: ["http://127.0.0.1:5501", "http://localhost:5501"] // Live Server origins
}));
app.use(express.json());

// Quick health check (GET) so you can verify the server is up
app.get('/health', (_, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    // 1) Validate env
    const key = process.env.OPENAI_API_KEY;
    if (!key || !key.trim()) {
      console.error("❌ OPENAI_API_KEY missing or empty. Check your .env.");
      return res.status(500).json({ error: "Server misconfiguration: OPENAI_API_KEY missing." });
    }

    // 2) Validate body
    const { model, messages, temperature = 0.7, max_tokens = 500 } = req.body || {};
    if (!model || !messages) {
      return res.status(400).json({ error: "Missing 'model' or 'messages'." });
    }

    // 3) Call OpenAI
    const url = 'https://api.openai.com/v1/chat/completions';

  
    //   gpt-4o-mini   (cheap/fast)
    //   gpt-4o        (stronger)
    // The older "gpt-4-turbo" may return "model does not exist".
    const payload = { model, messages, temperature, max_tokens };

    if (!fetchFn) {
      console.error("❌ fetch is not available. Install undici or use Node 18+.");
      return res.status(500).json({ error: "fetch is not available in this Node runtime." });
    }

    const r = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("❌ OpenAI returned an error:", JSON.stringify(data, null, 2));
      return res.status(r.status).json(data); // bubble up the real reason to the browser
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('✅ Server running on port', PORT));
