
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Use POST to send a message." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return reply(500, {
      error: "GEMINI_API_KEY is missing."
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return reply(400, { error: "Invalid JSON." });
  }

  const mode = String(body.mode || "Core AI");
  const prompt = String(body.prompt || "You are a helpful assistant.");
  const history = Array.isArray(body.history)
    ? body.history.slice(-12)
    : [];

  const contents = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.text || "").slice(0, 8000) }]
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are X, a personal AI assistant. Current mode: ${mode}. ${prompt}`
            }]
          },
          contents: contents.length
            ? contents
            : [{ role: "user", parts: [{ text: "Hello" }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7
          }
        })
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {
      return reply(502, {
        error: data?.error?.message || "Gemini API request failed."
      });
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("")
      .trim();

    if (!answer) {
      return reply(502, {
        error: "Gemini returned no response."
      });
    }

    return reply(200, { reply: answer });

  } catch (err) {
    return reply(502, {
      error: err.name === "AbortError"
        ? "Gemini timed out. Please try again."
        : "Connection failed: " + (err.message || "Network error")
    });
  }
};

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
