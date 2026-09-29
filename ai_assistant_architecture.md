# 🤖 AI Assistant — Architecture & Design

## Overview
"ResQ Assist" is a floating chat widget that guides first-time visitors through the ResqBite platform and answers any question about its features.

## Files involved

| File | Role |
|---|---|
| `server.ts` | `/api/assistant/chat` endpoint, engine orchestration, rate limiting |
| `src/components/AIAssistantWidget.tsx` | Floating chat UI (launcher bubble + panel) |
| `src/App.tsx` | Mounts the widget globally with page context |

## Data flow

```
User types a question
        │
        ▼
AIAssistantWidget (client)
  POST /api/assistant/chat
  { messages: [...last 14 turns],
    pageContext: { tab, tabLabel, role, city } }
        │
        ▼
Express server
  1. Rate-limit check (20 req/min/IP)      ── 429 if exceeded
  2. Sanitize & clamp history (2000 chars/msg, 14 msgs)
  3. Prepend page-context marker to first turn
        │
        ▼
Engine cascade (first success wins)
  ① Groq  api.groq.com  openai/gpt-oss-120b   (system prompt inline)
  ② Gemini generateContent gemini-3.8-flash   (systemInstruction)
  ③ Static "offline quick-answers" text       (never fails)
        │
        ▼
{ success: true, reply, poweredBy: "Groq · openai/gpt-oss-120b" }
```

## Key design decisions

1. **Groq primary, Gemini fallback** — Groq's LPU inference returns in ~1s which keeps the chat feeling instant; Gemini (already used by all other features) covers outages or quota exhaustion.
2. **Server-side keys only** — the browser never sees `GROQ_API_KEY` / `GEMINI_API_KEY`; everything is proxied through Express, eliminating key-theft risk.
3. **Platform knowledge via system prompt** — the entire feature map (11 tabs, 4 roles, key workflow, impact math) is embedded as the system prompt, so the LLM answers accurately about *this* product without retrieval infrastructure.
4. **Page-context injection** — the widget sends the active tab/role/city so answers are situation-aware ("you're viewing the Driver HUD…").
5. **Graceful degradation everywhere** — no keys? both providers down? The widget still responds with a useful canned tour; the 6 existing Gemini features likewise fall back to FSSAI-based heuristics.
6. **Abuse protection** — per-IP sliding-window rate limiter + message sanitization (role whitelist, 2,000-char clamp, 14-turn window) keeps token costs bounded on a public deployment.
7. **Health probe** — `GET /api/health` reports which engines are configured, for uptime checks and quick debugging.

## Extending
- Swap models via env: `GROQ_MODEL`, `GEMINI_MODEL`.
- Add a "messages" persistence layer (DB) by hooking `sendMessage` in the widget.
- Add streaming (SSE) by enabling `stream: true` on the Groq call and piping chunks through.
