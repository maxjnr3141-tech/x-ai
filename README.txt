X PERSONAL AI - CLEAN NETLIFY REBUILD

Includes:
- Responsive futuristic UI
- 5 selectable modes
- Server-side Gemini connection (API key never sent to browser)
- Conversation context (recent messages)
- Clear errors for missing key, API failures and network problems
- Netlify Function endpoint: /.netlify/functions/chat

DEPLOY
1. Deploy this folder to Netlify (or connect a Git repository containing these files).
2. Netlify project > Project configuration > Environment variables.
3. Set GEMINI_API_KEY to your Gemini API key. Do not share it or put it in app.js.
4. Redeploy after adding/updating the environment variable.
5. Test the deployed site's chat.

MODEL
The server function uses gemini-3.8-flash. If your API account doesn't have access, edit the model ID in netlify/functions/chat.js to an available stable model.

NOTE
Image Lab currently creates image prompts and visual concepts; actual image rendering needs a separate image-generation provider and integration.
Hacker Mode is intended for defensive cybersecurity learning only.
