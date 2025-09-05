// api/chat.js
export default async function handler(req, res) {
  // CORS (allow your site; during dev you can set * and tighten later)
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on the server." });
    }

    const { model, messages, temperature = 0.7, max_tokens = 100 } = req.body || {};
    if (!model || !messages) {
      return res.status(400).json({ error: "Missing 'model' or 'messages' in request body." });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });

    const data = await r.json();
    if (!r.ok) {
      // bubble up the real reason
      return res.status(r.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Serverless error:", err);
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
