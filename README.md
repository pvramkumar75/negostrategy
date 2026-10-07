# Thermo Group Deal Desk

A buyer-side negotiation planner for Indian industrial procurement.

Answer one question at a time — large choices, with dropdowns where a list is clearer. The app builds a position, opening line, trades, script, objection replies, and a meeting checklist from those answers. No API key is required.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Optional AI

In the app, open **AI key** and paste one key:

- DeepSeek
- Sarvam AI
- Google Gemini
- ChatGPT (OpenAI)

Saving a key turns that coach on. It rewrites the same plan in sharper meeting language. The key stays in the browser and is sent only when you ask that provider to write.

Clear the provider to turn AI off again. The rule-based plan keeps working.

## Note

This is decision support. It does not invent supplier costs or market prices. Check tax, freight, specifications, and your approval limits before you commit.
