exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Use POST to send a message.' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return reply(500, { error: 'GEMINI_API_KEY is missing in Netlify environment variables.' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid JSON request.' }); }
  const mode = String(body.mode || 'Core AI').slice(0, 80);
  const systemPrompt = String(body.prompt || 'You are a helpful assistant.').slice(0, 6000);
  const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
  const contents = history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.text || '').slice(0, 12000) }] }));
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: `You are X AI. Current mode: ${mode}. ${systemPrompt}` }] }, contents, generationConfig: { maxOutputTokens: 2048 } })
    });
    const data = await response.json();
    if (!response.ok) {
      const apiMessage = data?.error?.message || `Gemini returned HTTP ${response.status}`;
      return reply(response.status === 429 ? 429 : 502, { error: apiMessage });
    }
    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!text) return reply(502, { error: 'Gemini returned an empty response. Try again.' });
    return reply(200, { reply: text });
  } catch (err) {
    return reply(502, { error: 'Could not reach Gemini: ' + (err.message || 'network error') });
  }
};
function reply(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }; }
