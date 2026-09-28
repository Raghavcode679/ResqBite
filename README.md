# ♾️ OmniResQ — Every Meal Rescued, Everywhere

*(formerly Annapurna Connect / ResQFood)*

AI-powered food-surplus reduction & redistribution platform for institutional kitchens, food banks, volunteer drivers and logistics admins across India. The infinity-loop logo says it all: no meal left behind, anywhere.

Built with **React 19 + Vite + Tailwind CSS 4 + Express (TypeScript)**, powered by **Groq** (conversational AI) and **Google Gemini** (structured analysis AI).

---

## ✨ Features

| Tab | What it does |
|---|---|
| **India Map & Surplus Radar** | Live map of surplus food batches, food banks, drivers & receiver areas per city, with a satellite **Remote-Sensing overlay** (15 agro zones, NDVI crop-health cells) and the **Punjab Agro-Hub** focus view |
| **People in Need (Receiver Areas)** | Register communities in need and dispatch surplus batches directly to them |
| **AI Demand Forecast** | Predicts diners & recommends exact kg to cook — prevents overproduction waste (SDG 12.3) |
| **Vision & IoT Quality Lab** | Triple-fusion diagnostic — CV notes + IoT telemetry (thermal probe, TVOC, humidity) + **satellite remote-sensing context** (NDVI, LST, rainfall) → deterministic FSSAI Grade A–D verdict with per-factor transparency |
| **Processing Plant Inefficiency Audit** | Factory audit: yield loss, energy excess, root causes, lean fixes |
| **Secondary Upcycling Off-Takers** | Marketplace of certified buyers for unavoidable food scrap |
| **Post Kitchen Surplus (AI Pre-Check)** | Donors post surplus with instant AI shelf-life / risk / meals / CO₂ analysis |
| **Driver Route Navigation HUD** | Claimed pickups, route steps, cold-chain protocol, OTP, delivery progress |
| **Redistribution Partners** | Manage NGO food banks & assign surplus |
| **Impact & ESG Reports** | Corporate ESG statements, SDG alignment, CSR/80G benefits |
| **Logistics Command** | Admin overview of all batches, partners & drivers |
| **♾️ Omni Assist** | Floating AI assistant (bottom-right) that answers any question about the platform — perfect for first-time visitors |

### 🤖 AI Assistant (new)
A chat bubble lives on every page. Ask it things like:
- "What does this website do?"
- "How do I donate surplus food?"
- "How does the AI quality check work?"
- "How do I get an 80G tax certificate?"

It is **context-aware** (knows which tab, role and city you're viewing) and runs on:
1. **Groq** (`openai/gpt-oss-120b`) — primary, ultra-low-latency
2. **Gemini** (`gemini-3.8-flash`) — automatic fallback
3. **Offline quick-answers** — if both providers are unreachable, the UI still works

---

## 🚀 Steps to Run

### 1. Prerequisites
- **Node.js ≥ 20** (check with `node -v`)
- npm (comes with Node)

### 2. Configure API keys
Create a file named `.env` in this folder (a working `.env` may already exist):

```env
GROQ_API_KEY=your_groq_key          # from https://console.groq.com/keys
GEMINI_API_KEY=your_gemini_key      # from https://aistudio.google.com/apikey
PORT=3000
# Optional overrides:
# GROQ_MODEL=openai/gpt-oss-120b
# GEMINI_MODEL=gemini-3.8-flash
```

> The app **runs even without keys** — AI features gracefully fall back to built-in heuristic engines so demos never break.

### 3. Install dependencies
```bash
npm install
```

### 4. Development mode (hot reload)
```bash
npm run dev
```
Open **http://localhost:3000**

### 5. Production mode
```bash
npm run build        # builds the optimized frontend into dist/
NODE_ENV=production npm start   # Windows PowerShell: $env:NODE_ENV="production"; npm start
```
The Express server serves the built app **and** all AI API routes on one port.

### 6. Verify it's healthy
```bash
curl http://localhost:3000/api/health
# → {"ok":true,"engines":{"groq":true,"gemini":true},...}
```

---

## 🔌 API Endpoints

| Endpoint | Purpose | Engine |
|---|---|---|
| `POST /api/assistant/chat` | AI site assistant (chat) | Groq → Gemini → offline |
| `POST /api/gemini/analyze-surplus` | Shelf-life & safety pre-check | Gemini → heuristic |
| `POST /api/gemini/optimize-route` | Route & cold-chain optimization | Gemini → heuristic |
| `POST /api/gemini/impact-report` | ESG / CSR impact statements | Gemini → heuristic |
| `POST /api/gemini/forecast-demand` | Demand & batch-size forecasting | Gemini → heuristic |
| `POST /api/gemini/visual-quality-inspect` | CV + IoT freshness inspection | Gemini → heuristic |
| `POST /api/gemini/industrial-audit` | Plant inefficiency audit | Gemini → heuristic |
| `POST /api/gemini/remote-sensing` | Satellite zone data + IoT/RS fused quality verdict | Deterministic fusion + Gemini narrative |
| `GET /api/health` | Uptime probe | — |

---

## 🛰️ Remote Sensing & the Punjab Agro-Hub
- The map's **Remote Sensing** toggle renders 15 agro-climatic foodshed zones as NDVI crop-health cells (green = vigorous ≥0.70, lime ≥0.55, amber ≥0.40 stressed, red barren). Click a cell to open the satellite feed panel: NDVI/EVI, MODIS LST, SMAP soil moisture, CHIRPS/IMD 7-day rainfall, crop type (Resourcesat LULC), irrigation %, mandi count & stress alerts.
- The **🌾 Punjab Agro-Hub** button focuses India's granary zone with a live data chip (LST, soil moisture, live rescue-batch count, mandi network) and the full Punjab story + crop calendar in the RS panel.
- In production the same schema plugs into live Google Earth Engine / ISRO Bhuvan / Sentinel Hub tile services.

## 🔒 Production notes
- API keys are **never exposed to the browser** — all AI calls go through the Express server.
- The `/api/assistant/chat` endpoint is rate-limited (20 req/min per IP) and input-sanitized.
- Keep `.env` out of version control (already in `.gitignore`).
- Before deploying, **rotate any API key that was ever shared publicly**.
- Deploy targets: any Node host (Render, Railway, Fly.io, Cloud Run) — set `NODE_ENV=production`, run `npm run build && npm start`.

## 🧰 Scripts
| Command | Action |
|---|---|
| `npm run dev` | Dev server with HMR (Vite middleware + API) |
| `npm run build` | Production frontend build → `dist/` |
| `npm start` | Production server (serves `dist/` + APIs) |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm run preview` | Vite static preview (no API routes) |
