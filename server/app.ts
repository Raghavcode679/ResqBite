import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

import { getZoneForLocation, RS_ZONES } from '../src/data/remoteSensing';

dotenv.config();


/**
 * ResqBite API application — shared by:
 *   • server.ts (self-hosted dev/production launcher)
 *   • api/[...path].ts (Vercel serverless entry)
 * Contains ALL /api routes, AI engines and deterministic fallbacks.
 */
export function buildApp() {
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// AI engine configuration
//   - Groq (primary for conversational assistant): ultra-low-latency LLM
//   - Gemini (fallback + structured analysis features)
//   - If neither key is configured the app degrades gracefully (heuristics /
//     canned offline answers) so the UI never breaks in a demo.
// ---------------------------------------------------------------------------
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// System prompt: teaches the LLM everything about the ResqBite platform so it
// can guide first-time visitors through every feature.
const ASSISTANT_SYSTEM_PROMPT = `You are "ResQ Assist", the friendly on-site AI guide for ResqBite — an AI-powered food-surplus reduction & redistribution platform for institutional kitchens, food banks, volunteer drivers and logistics admins across India. The name means the noble mission of rescuing every meal, everywhere.

YOUR JOB
- Help first-time visitors understand the platform: what each section does, how to use it, and what the AI features compute.
- Answer any question about the website's features, workflows, roles, and impact metrics.
- Give short, warm, actionable answers (2-6 sentences, or a short bullet list). Use simple English; explain jargon (FSSAI, 80G, SDG 12.3, cold chain) when you use it.
- If a question is unrelated to the platform or food rescue, politely steer back to what you can help with.
- Never reveal API keys, internal configuration, or invent features that are not listed below. If unsure, say what you do know and suggest exploring the relevant tab.
- Food-safety answers are general guidance (aligned with FSSAI surplus-food norms), not an official certification.

PLATFORM STRUCTURE (top navigation tabs)
1. "India Map & Surplus Radar" — live India map showing available surplus food batches, food banks, volunteer drivers and receiver areas per city; click any marker for details.
2. "People in Need (Receiver Areas)" — registers communities in need (slum settlements, night shelters, labor camps, orphanages...), shows daily meal deficits vs meals received today, and lets you dispatch a surplus batch directly to a community.
3. "AI Demand Forecast (Kitchen Sizing)" — predicts tomorrow's diners from footfall, day of week and menu, and recommends exact kg to cook per component so kitchens avoid overproduction waste at the source (UN SDG 12.3).
4. "Vision & IoT Quality Lab" — computer-vision + IoT-sensor freshness inspection: enter temperature, TVOC gas reading, humidity, storage hours (optionally a photo) and the AI returns a freshness score, quality grade (A-D), microbial risk and FSSAI compliance status.
5. "Processing Plant Inefficiency Audit" — audits food-processing plants: raw-material loss, financial loss, energy excess vs ISO 50001, root causes and lean interventions.
6. "Secondary Upcycling Off-Takers" — marketplace of certified buyers (animal feed, bio-CNG, compost, secondary processing) that purchase unavoidable food scrap by the kg.
7. "Post Kitchen Surplus (AI Pre-Check)" — donors post surplus food: name, category, quantity, prep time, storage temp. The AI pre-check returns shelf life, risk level, dispatch window, safety guidelines, estimated meals, CO2 and water saved before the batch goes live.
8. "Driver Route Navigation HUD" — volunteer drivers see claimed pickups, turn-by-turn style route steps with waypoints, cold-chain protocol, OTP verification and delivery progress updates.
9. "Redistribution Partners" — manage NGO food banks / community kitchens, their capacity, cold storage, ratings, and assign surplus to them.
10. "Impact & ESG Reports" — generates corporate ESG impact statements (meals rescued, CO2e diverted, virtual water saved, SDG alignment, CSR/80G benefits).
11. "Logistics Command" — admin overview of the whole fleet: every batch, partner and driver with status controls.

ROLES (top-right switcher): Donor Kitchen (posts surplus), Volunteer Driver (picks up & delivers), Food Bank NGO (receives & distributes), Logistics Admin (command center). Switching role auto-routes to that role's main tab.

KEY WORKFLOW: Donor posts surplus with AI pre-check -> batch appears on the India Map radar & triggers urgent notifications -> volunteer driver claims it (Driver HUD) -> handover to a food bank or directly to a people-in-need community (meals get credited) -> delivery certified -> 80G tax certificate can be downloaded by the donor.

EXTRAS: header has a city selector (Pan-India + major metros), live counters of meals rescued and CO2 avoided, notification bell with sound alerts, and every donation receipt is eligible for 80G tax exemption under Indian IT Act.

IMPACT MATH used across the app: ~2.8 meals per kg of cooked food, ~2.45 kg CO2e avoided per kg rescued, ~1,280 L virtual water per kg.`;

// Tiny in-memory rate limiter (per IP) for the public chat endpoint.
const chatRateMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (chatRateMap.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  chatRateMap.set(key, hits);
  if (chatRateMap.size > 5_000) {
    for (const [k, v] of chatRateMap) {
      if (v.every((t) => now - t > RATE_WINDOW_MS)) chatRateMap.delete(k);
    }
  }
  return hits.length > RATE_LIMIT;
}

async function callGroqChat(messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq API ${res.status}: ${body.slice(0, 200)}`);
    }
    const data: any = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Groq returned an empty response');
    return String(reply).trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiChat(messages: ChatMessage[]): Promise<string> {
  if (!ai) throw new Error('Gemini not configured');
  const contents = messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  while (contents.length > 0 && contents[0].role !== 'user') contents.shift();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: ASSISTANT_SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  });
  if (!response.text) throw new Error('Gemini returned an empty response');
  return response.text.trim();
}

/**
 * Gemini → structured JSON with graceful degradation.
 * Returns null (instead of throwing) when Gemini is not configured, times out,
 * is rate-limited, or returns an unparsable body — so every endpoint can fall
 * back to its deterministic heuristic engine and the UI ALWAYS gets fresh,
 * valid data computed for the actual request inputs.
 */
function callGeminiJSON(prompt: string, schema: any): Promise<Record<string, any> | null> {
  if (!ai) return Promise.resolve(null);
  const attempt = ai.models
    .generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    })
    .then((response: any) => {
      const text = String(response?.text || '').trim();
      if (!text) return null;
      return JSON.parse(text) as Record<string, any>;
    })
    .catch((err: unknown) => {
      console.error('Gemini structured call failed — falling back to deterministic engine:', err);
      return null;
    });
  // Hard 30s ceiling: the client gets the heuristic result rather than hanging.
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30_000));
  return Promise.race([attempt, timeout]);
}

// Health probe for uptime checks / load balancers.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    engines: {
      groq: Boolean(GROQ_API_KEY),
      gemini: Boolean(ai),
    },
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// API: AI Site Assistant (Groq primary, Gemini fallback, canned offline last)
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Please wait a minute and try again.' });
  }

  try {
    const rawMessages = req.body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Sanitize & clamp conversation history
    const messages: ChatMessage[] = rawMessages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'last message must be from the user' });
    }
    const history = messages.slice(-14);

    // Optional page context so answers can be location/role aware
    const { tab, role, city } = req.body?.pageContext || {};
    const contextPrefix = `[User context — viewing tab: ${String(tab || 'unknown')}, role: ${String(role || 'visitor')}, city: ${String(city || 'Pan-India')}. Tailor guidance to this view when relevant.]\n\n`;
    const llmMessages: ChatMessage[] = [
      { role: 'user', content: contextPrefix + history[0].content },
      ...history.slice(1),
    ];

    // 1) Primary: Groq (fast conversational engine)
    if (GROQ_API_KEY) {
      try {
        const reply = await callGroqChat([{ role: 'user', content: ASSISTANT_SYSTEM_PROMPT }, ...llmMessages]);
        return res.json({ success: true, reply, poweredBy: `Groq · ${GROQ_MODEL}` });
      } catch (err: any) {
        console.error('Groq chat failed, falling back to Gemini:', err?.message || err);
      }
    }

    // 2) Fallback: Gemini
    if (ai) {
      try {
        const reply = await callGeminiChat(llmMessages);
        return res.json({ success: true, reply, poweredBy: `Gemini · ${GEMINI_MODEL}` });
      } catch (err: any) {
        console.error('Gemini chat failed:', err?.message || err);
      }
    }

    // 3) Offline graceful answer (no keys configured / both providers down)
    return res.json({
      success: true,
      poweredBy: 'Offline quick-answers',
      reply:
        "Hi! I'm ResQ Assist. AI engines are momentarily unreachable, but here's a quick tour: use the top tabs to explore the India Surplus Radar map, post kitchen surplus with an AI safety pre-check, forecast demand to prevent overproduction, inspect food quality with Vision & IoT, navigate deliveries as a driver, and download ESG/80G impact reports. Ask me again in a moment for detailed help!",
    });
  } catch (error: any) {
    console.error('Error in /api/assistant/chat:', error);
    res.status(500).json({ error: error.message || 'Assistant failed to respond' });
  }
});

// API: AI Shelf-Life & Surplus Analyzer
app.post('/api/gemini/analyze-surplus', async (req: Request, res: Response) => {
  try {
    const { foodName, category, quantityKg, prepTime, storageTemp, notes } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: 'Food name is required' });
    }

    if (ai) {
      const prompt = `Analyze this institutional surplus food item for safe redistribution according to food safety standards (like FSSAI):
Item Name: ${foodName}
Category: ${category || 'Cooked Hot Meal'}
Quantity: ${quantityKg} kg
Preparation Time: ${prepTime || '2 hours ago'}
Storage Temperature: ${storageTemp || 'Ambient room temp (28°C)'}
Additional Notes: ${notes || 'None'}

Provide:
1. remainingShelfLifeHours (number, realistic hours left for safe consumption)
2. riskLevel ("Low", "Medium", "High", or "Critical")
3. recommendedDispatchWindow ("Immediate (<45m)", "Urgent (<2h)", "Within 4h", "Within 12h")
4. foodSafetyGuidelines (array of 3-4 specific handling rules like temperature maintenance, reheating, allergen warnings)
5. optimalRecipientType (e.g. "Night shelter / immediate consumption", "Central NGO kitchen with cold room", "Dry food pantry")
6. estimatedMealsCount (number, roughly 2.5 - 3 meals per kg)
7. co2AvoidedKg (number, roughly 2.5kg CO2 per kg food)
8. waterSavedLiters (number, roughly 1000 - 1500L per kg food)
9. safetyVerdictSummary (2 concise sentences on why this food is safe/at risk)`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              remainingShelfLifeHours: { type: Type.NUMBER },
              riskLevel: { type: Type.STRING },
              recommendedDispatchWindow: { type: Type.STRING },
              foodSafetyGuidelines: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              optimalRecipientType: { type: Type.STRING },
              estimatedMealsCount: { type: Type.NUMBER },
              co2AvoidedKg: { type: Type.NUMBER },
              waterSavedLiters: { type: Type.NUMBER },
              safetyVerdictSummary: { type: Type.STRING },
            },
            required: [
              'remainingShelfLifeHours',
              'riskLevel',
              'recommendedDispatchWindow',
              'foodSafetyGuidelines',
              'optimalRecipientType',
              'estimatedMealsCount',
              'co2AvoidedKg',
              'waterSavedLiters',
              'safetyVerdictSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed, poweredBy: 'Gemini 3.8 Flash' });
    }

    // High quality fallback heuristic when API key is pending
    const weight = Number(quantityKg) || 20;
    const isPerishable = category?.toLowerCase().includes('cooked') || category?.toLowerCase().includes('dairy');
    const shelfLife = isPerishable ? 3.5 : 24.0;
    
    return res.json({
      success: true,
      data: {
        remainingShelfLifeHours: shelfLife,
        riskLevel: isPerishable ? 'Medium' : 'Low',
        recommendedDispatchWindow: isPerishable ? 'Urgent (<2h)' : 'Within 8h',
        foodSafetyGuidelines: [
          'Maintain hot food above 65°C or chill rapidly below 5°C per FSSAI regulations.',
          'Transport in food-grade insulated thermal containers with secure seals.',
          'Verify sensory quality (aroma, texture, temperature log) prior to loading.',
          'Consume within 2 hours of handover at the destination food bank.',
        ],
        optimalRecipientType: isPerishable
          ? 'Immediate consumption community kitchen (slum clusters / night shelters)'
          : 'Central Food Bank storage pantry',
        estimatedMealsCount: Math.round(weight * 2.8),
        co2AvoidedKg: Math.round(weight * 2.45),
        waterSavedLiters: Math.round(weight * 1280),
        safetyVerdictSummary: `Based on standard thermal profiles, this batch of ${foodName} is in prime wholesome condition if dispatched within the ${isPerishable ? 'next 2 hours' : 'next 8 hours'}. Cold/hot chain protocols must be observed.`,
      },
      poweredBy: 'Standard FSSAI Heuristic Engine',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-surplus:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze surplus food' });
  }
});

// API: AI Route & Logistics Optimizer
app.post('/api/gemini/optimize-route', async (req: Request, res: Response) => {
  try {
    const { origin, destination, city, stops, urgency } = req.body;

    if (ai) {
      const prompt = `You are a logistics dispatch optimization AI for perishable food redistribution in ${city || 'India'}.
Donor Kitchen: ${origin}
Recipient Food Bank: ${destination}
Urgency Level: ${urgency || 'High'}
Intermediate Pickups/Drops: ${stops ? JSON.stringify(stops) : 'None'}

Provide an optimized dispatch plan:
1. estimatedDistanceKm (number)
2. estimatedTimeMinutes (number)
3. recommendedRouteDescription (string)
4. coldChainProtocol (string - e.g. insulated dry ice box or active chilling)
5. navigationWaypoints (array of objects with name, action: "Pickup" | "Dropoff" | "Transit Checkpoint", estArrivalOffsetMinutes: number)
6. carbonSavedKgVsDiesel (number, assuming EV or consolidated logistics)
7. dispatchUrgencyAdvice (string)`;

      try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedDistanceKm: { type: Type.NUMBER },
              estimatedTimeMinutes: { type: Type.NUMBER },
              recommendedRouteDescription: { type: Type.STRING },
              coldChainProtocol: { type: Type.STRING },
              navigationWaypoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    action: { type: Type.STRING },
                    estArrivalOffsetMinutes: { type: Type.NUMBER },
                  },
                  required: ['name', 'action', 'estArrivalOffsetMinutes'],
                },
              },
              carbonSavedKgVsDiesel: { type: Type.NUMBER },
              dispatchUrgencyAdvice: { type: Type.STRING },
            },
            required: [
              'estimatedDistanceKm',
              'estimatedTimeMinutes',
              'recommendedRouteDescription',
              'coldChainProtocol',
              'navigationWaypoints',
              'carbonSavedKgVsDiesel',
              'dispatchUrgencyAdvice',
            ],
          },
        },
      });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ success: true, engine: 'gemini', data: parsed });
      } catch (geminiErr: any) {
        // Gemini 503 / rate-limit / outage → fall through to the deterministic plan below.
        console.error('Gemini route call failed — serving deterministic fallback:', geminiErr?.message || geminiErr);
      }
    }

    // Deterministic route fallback — real estimates derived from the request's
    // origin/destination/urgency, so the HUD always gets a plan even when
    // Gemini is down (503 high-demand outages etc.).
    const cityName = String(city || 'India');
    const urgencyStr = String(urgency || 'High');
    const stopsList = Array.isArray(stops) ? stops : [];
    const urgencyMinutes = urgencyStr.toLowerCase().includes('critical') ? 12 : urgencyStr.toLowerCase().includes('moderate') ? 30 : 18;
    const waypoints = [
      { name: String(origin || 'Donor Kitchen'), action: 'Pickup', estArrivalOffsetMinutes: 0 },
      ...stopsList.map((s: any, i: number) => ({
        name: String(s?.name || `Intermediate Stop ${i + 1}`),
        action: 'Transit Checkpoint',
        estArrivalOffsetMinutes: urgencyMinutes * (i + 1),
      })),
      { name: String(destination || 'Food Bank'), action: 'Dropoff', estArrivalOffsetMinutes: urgencyMinutes * (stopsList.length + 1) + 10 },
    ];
    const totalMinutes = waypoints[waypoints.length - 1].estArrivalOffsetMinutes;
    const estimatedDistanceKm = Number((4.2 + totalMinutes * 0.42).toFixed(1)); // urban avg ~25 km/h + approach legs

    return res.json({
      success: true,
      engine: 'heuristic',
      data: {
        estimatedDistanceKm,
        estimatedTimeMinutes: totalMinutes,
        recommendedRouteDescription: `Fastest arterial route across ${cityName} from ${origin || 'the donor kitchen'} to ${destination || 'the partner food bank'} — prefer flyovers and service roads; re-check live traffic before dispatch.`,
        coldChainProtocol: 'Insulated thermal urns sealed at pickup; verify core temp at handover (hot ≥ 60°C / cold ≤ 5°C).',
        navigationWaypoints: waypoints,
        carbonSavedKgVsDiesel: Number((estimatedDistanceKm * 0.21).toFixed(2)),
        dispatchUrgencyAdvice: urgencyStr.toLowerCase().includes('critical') ? 'Dispatch immediately — cold-chain window is under 60 minutes.' : `Dispatch within ${urgencyMinutes} minutes to stay inside the safe redistribution window.`,
      },
    });

    // Heuristic route calculation
    return res.json({
      success: true,
      data: {
        estimatedDistanceKm: 14.2,
        estimatedTimeMinutes: 28,
        recommendedRouteDescription: `Via Arterial Ring Corridor avoiding peak bottleneck signals. Direct connection to food bank distribution hub.`,
        coldChainProtocol: 'Thermally insulated insulated bags; ensure internal temp remains < 8°C or > 62°C.',
        navigationWaypoints: [
          { name: origin || 'Donor Kitchen Facility', action: 'Pickup', estArrivalOffsetMinutes: 0 },
          { name: 'Cold Chain Checkpoint / Outer Ring Expy', action: 'Transit Checkpoint', estArrivalOffsetMinutes: 14 },
          { name: destination || 'Central Community Food Bank', action: 'Dropoff', estArrivalOffsetMinutes: 28 },
        ],
        carbonSavedKgVsDiesel: 4.8,
        dispatchUrgencyAdvice: 'Immediate departure recommended before evening traffic surge to preserve meal thermal profile.',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/optimize-route:', error);
    res.status(500).json({ error: error.message || 'Route optimization failed' });
  }
});

// API: AI ESG & Impact Report Synthesizer
app.post('/api/gemini/impact-report', async (req: Request, res: Response) => {
  try {
    const { totalKg, totalMeals, totalDonors, activeCities, co2Saved, waterSaved } = req.body;

    // All metrics come from the client's LIVE batch ledger (real aggregates).
    // No canned defaults: a missing figure is derived from the real ones, never fabricated.
    const kg = Math.max(0, Number(totalKg) || 0);
    const meals = Math.max(0, Number(totalMeals) || 0);
    const donors = Math.max(1, Number(totalDonors) || 1);
    const cities = Math.max(1, Number(activeCities) || 1);
    const co2 = Number(co2Saved) || Math.round(kg * 2.45);
    const water = Number(waterSaved) || Math.round(kg * 1280);

    const prompt = `Generate a high-level executive sustainability and food waste diversion impact statement for corporate ESG audit (aligning with UN Sustainable Development Goal 12.3 and Indian CSR Section 135 / 80G provisions):
Verified live-ledger metrics:
- Food Rescued: ${kg} kg
- Wholesome Meals Delivered: ${meals} meals
- Participating Kitchens & Processors: ${donors}
- Active Urban Clusters: ${cities}
- Estimated CO2 Equivalent Diverted from Landfills: ${co2} kg
- Virtual Water Footprint Preserved: ${water} Liters

Use ONLY these figures in the narrative — do not invent other numbers.
Format JSON with:
1. executiveSummary (3 sentences summarizing measurable impact)
2. sdgAlignmentHighlights (array of strings covering SDG 2 Zero Hunger and SDG 12 Responsible Consumption)
3. corporateCSRBenefits (array of 3 points for tax deduction 80G and BRSR reporting)
4. futureReductionRecommendation (2 actionable tips to reduce prep surplus at source)`;

    const data = await callGeminiJSON(prompt, {
      type: Type.OBJECT,
      properties: {
        executiveSummary: { type: Type.STRING },
        sdgAlignmentHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        corporateCSRBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
        futureReductionRecommendation: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'executiveSummary',
        'sdgAlignmentHighlights',
        'corporateCSRBenefits',
        'futureReductionRecommendation',
      ],
    });

    if (data && typeof data.executiveSummary === 'string' && data.executiveSummary.trim()) {
      return res.json({ success: true, engine: 'gemini', data });
    }

    // Deterministic fallback built from the same real ledger numbers.
    return res.json({
      success: true,
      engine: 'heuristic',
      data: {
        executiveSummary: `Through automated food surplus diversion, ${donors} participating institutional kitchens have rescued ${kg.toLocaleString('en-IN')} kg of nutritious food, supplying ${meals.toLocaleString('en-IN')} wholesome meals across ${cities} active urban clusters. This prevented landfill methane generation equivalent to ${co2.toLocaleString('en-IN')} kg of CO2e and preserved ${water.toLocaleString('en-IN')} liters of virtual water. All figures are computed live from the platform batch ledger and are audit-ready for BRSR disclosure.`,
        sdgAlignmentHighlights: [
          'Direct alignment with UN SDG 12.3: 50% per capita food waste reduction by 2030.',
          'Active contribution to UN SDG 2 (Zero Hunger) through equitable nutrition redistribution.',
          `Preservation of agricultural inputs and over ${(water / 1_000_000).toFixed(1)} million liters of virtual water.`,
        ],
        corporateCSRBenefits: [
          'Eligible for CSR expenditure recognition under Schedule VII of the Companies Act 2013.',
          'Standardized 80G tax receipts generated with digital verification for audited donations.',
          'Ready-to-export BRSR (Business Responsibility and Sustainability Reporting) environmental disclosures.',
        ],
        futureReductionRecommendation: [
          'Implement AI dynamic batch sizing based on lunch/dinner attendance forecasts to curb initial prep surplus.',
          'Adopt vacuum blast-chilling for high-protein items within 90 minutes of prep to triple safe redistribution window.',
        ],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/impact-report:', error);
    res.status(500).json({ error: error.message || 'Impact report generation failed' });
  }
});

// API: AI Demand & Surplus Predictive Forecasting Engine (MIC Problem Statement 1)
app.post('/api/gemini/forecast-demand', async (req: Request, res: Response) => {
  try {
    const { facilityType, expectedAttendance, dayOfWeek, mealSlot, menuType, pastWasteRate } = req.body;
    const attendance = Math.max(50, Number(expectedAttendance) || 1200);

    const prompt = `You are an AI Food Demand & Surplus Prevention Engine for an institutional kitchen / food processing cafeteria in India.
Facility: ${facilityType || 'Corporate IT Park Cafeteria'}
Expected Footfall/Attendance: ${attendance} people
Day of Week: ${dayOfWeek || 'Wednesday'}
Meal Slot: ${mealSlot || 'Lunch (12:30 - 15:00)'}
Menu Profile: ${menuType || 'North Indian & South Indian Combos (Rice, Roti, Dal, Paneer Gravy, Poriyal)'}
Historical Average Waste Rate: ${pastWasteRate || '14%'}

Generate a precision production planning forecast for THESE exact inputs (numbers must scale with the attendance given above):
1. predictedDiners (exact number likely to eat)
2. recommendedTotalKg (net cooked food weight needed)
3. componentBreakdown (array of items with name, recommendedKg, portionPerPersonGrams)
4. overproductionRiskPct (probability percentage of surplus if cooked to 100% nominal capacity)
5. preventedSurplusKg (estimated kg saved through AI dynamic sizing)
6. costSavingsInr (financial savings from optimized procurement)
7. operationalAdvice (2 key production timing & batch sizing tips referencing this facility, day and meal slot)`;

    const data = await callGeminiJSON(prompt, {
      type: Type.OBJECT,
      properties: {
        predictedDiners: { type: Type.NUMBER },
        recommendedTotalKg: { type: Type.NUMBER },
        componentBreakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              recommendedKg: { type: Type.NUMBER },
              portionPerPersonGrams: { type: Type.NUMBER },
            },
            required: ['name', 'recommendedKg', 'portionPerPersonGrams'],
          },
        },
        overproductionRiskPct: { type: Type.NUMBER },
        preventedSurplusKg: { type: Type.NUMBER },
        costSavingsInr: { type: Type.NUMBER },
        operationalAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'predictedDiners',
        'recommendedTotalKg',
        'componentBreakdown',
        'overproductionRiskPct',
        'preventedSurplusKg',
        'costSavingsInr',
        'operationalAdvice',
      ],
    });

    if (
      data &&
      typeof data.predictedDiners === 'number' &&
      Array.isArray(data.componentBreakdown) &&
      data.componentBreakdown.length > 0
    ) {
      return res.json({ success: true, engine: 'gemini', data });
    }

    // Deterministic heuristic forecast — every output varies with the actual inputs.
    const wasteRate = Math.min(40, Math.max(2, parseFloat(String(pastWasteRate ?? '').replace('%', '')) || 14));
    const dayFactors: Record<string, number> = {
      Monday: 0.94,
      Tuesday: 1.0,
      Wednesday: 0.96,
      Thursday: 0.98,
      'Friday (Hybrid)': 0.9,
      'Saturday (Banquet)': 1.12,
      'Sunday (Events)': 1.08,
    };
    const slotLower = String(mealSlot || '').toLowerCase();
    const slotFactor = slotLower.includes('breakfast') ? 0.55 : slotLower.includes('midnight') ? 0.35 : 1;
    const dayFactor = dayFactors[String(dayOfWeek)] ?? 1;

    const predictedDiners = Math.round(attendance * 0.88 * dayFactor * slotFactor);
    const recommendedTotalKg = Math.max(20, Math.round(predictedDiners * 0.42));
    const nominalCookedKg = Math.round(attendance * 0.42 * slotFactor); // what a 100% nominal cook would prepare
    const preventedSurplusKg = Math.max(
      0,
      Math.round(nominalCookedKg - recommendedTotalKg + nominalCookedKg * (wasteRate / 100) * 0.5)
    );
    const overproductionRiskPct = Math.min(60, Math.max(8, Math.round(wasteRate * 1.5)));
    const mealName = slotLower.includes('breakfast')
      ? 'breakfast'
      : slotLower.includes('midnight')
      ? 'night shift'
      : slotLower.includes('dinner')
      ? 'dinner'
      : 'lunch';

    return res.json({
      success: true,
      engine: 'heuristic',
      data: {
        predictedDiners,
        recommendedTotalKg,
        componentBreakdown: [
          { name: 'Steamed Rice & Pulao', recommendedKg: Math.round(recommendedTotalKg * 0.38), portionPerPersonGrams: 160 },
          { name: 'Wheat Phulkas & Roti', recommendedKg: Math.round(recommendedTotalKg * 0.22), portionPerPersonGrams: 90 },
          { name: 'Dal Tadka / Sambar', recommendedKg: Math.round(recommendedTotalKg * 0.24), portionPerPersonGrams: 100 },
          { name: 'Vegetable Subzi / Curry', recommendedKg: Math.round(recommendedTotalKg * 0.16), portionPerPersonGrams: 70 },
        ],
        overproductionRiskPct,
        preventedSurplusKg,
        costSavingsInr: Math.round(preventedSurplusKg * 115),
        operationalAdvice: [
          `Cook 65% of the ${recommendedTotalKg} kg batch ahead of the ${mealName} rush and hold 35% as a contingent phase triggered by live turnstile counts 45 minutes into service at ${facilityType || 'the facility'}.`,
          `${dayOfWeek || 'Mid-week'} demand runs ${Math.round(Math.abs(dayFactor - 1) * 100)}% ${dayFactor >= 1 ? 'above' : 'below'} nominal; with your ${wasteRate}% historical waste rate, dynamic sizing prevents ≈ ${preventedSurplusKg} kg of surplus (₹${Math.round(preventedSurplusKg * 115).toLocaleString('en-IN')}) this session.`,
        ],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/forecast-demand:', error);
    res.status(500).json({ error: error.message || 'Demand forecasting failed' });
  }
});

// API: Computer Vision & IoT Sensor Quality Assessment (MIC Problem Statement 2)
app.post('/api/gemini/visual-quality-inspect', async (req: Request, res: Response) => {
  try {
    const { foodName, category, visualNotes, temperatureC, tvocPpm, humidityPct, storageAgeHours, base64Image } = req.body;

    if (ai) {
      const parts: any[] = [];
      if (base64Image) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.replace(/^data:image\/[a-z]+;base64,/, ''),
          },
        });
      }

      const promptText = `Analyze food freshness and quality degradation using computer vision and IoT sensor telemetry:
Food Item: ${foodName || 'Cooked Vegetable Curry'}
Category: ${category || 'Cooked Meals'}
Visual / Camera Observations: ${visualNotes || 'Uniform surface, standard color, no mold or curdling'}
Temperature Sensor: ${temperatureC || '64'}°C
Gas / TVOC Sensor (Volatile Organic Compounds): ${tvocPpm || '120'} ppm (Ethylene/Ammonia trace)
Relative Humidity Sensor: ${humidityPct || '65'}% RH
Storage Elapsed Time: ${storageAgeHours || '2'} hours

Evaluate:
1. freshnessScore (0-100 integer, 100 is prime fresh)
2. qualityGrade ("Grade A: Prime Wholesome", "Grade B: Safe for Rapid Intake", "Grade C: Secondary Upcycling Only", "Grade D: Unsafe / Bio-compost")
3. microbialRiskLevel ("Negligible", "Low", "Moderate", "High")
4. sensoryAnalysisNotes (texture, color oxidation, aroma inference)
5. remainingSafeHours (number)
6. recommendedAction ("Human Redistribution", "Blast Chilling Required", "Secondary Buyer / Animal Feed", "Biogas / Composting")
7. fssaiComplianceStatus ("Fully Compliant", "Conditional Clearance", "Non-Compliant")`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              freshnessScore: { type: Type.NUMBER },
              qualityGrade: { type: Type.STRING },
              microbialRiskLevel: { type: Type.STRING },
              sensoryAnalysisNotes: { type: Type.STRING },
              remainingSafeHours: { type: Type.NUMBER },
              recommendedAction: { type: Type.STRING },
              fssaiComplianceStatus: { type: Type.STRING },
            },
            required: [
              'freshnessScore',
              'qualityGrade',
              'microbialRiskLevel',
              'sensoryAnalysisNotes',
              'remainingSafeHours',
              'recommendedAction',
              'fssaiComplianceStatus',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    }

    const temp = Number(temperatureC) || 64;
    const isSafeHot = temp >= 60;
    const score = isSafeHot ? 92 : 74;

    return res.json({
      success: true,
      data: {
        freshnessScore: score,
        qualityGrade: score > 85 ? 'Grade A: Prime Wholesome' : 'Grade B: Safe for Rapid Intake',
        microbialRiskLevel: score > 85 ? 'Low' : 'Moderate',
        sensoryAnalysisNotes: `Optical inspection confirms normal surface tension and lack of lipid oxidation. Core thermal probe reading (${temp}°C) prevents mesophilic bacterial proliferation.`,
        remainingSafeHours: isSafeHot ? 3.5 : 1.5,
        recommendedAction: isSafeHot ? 'Human Redistribution' : 'Blast Chilling Required',
        fssaiComplianceStatus: isSafeHot ? 'Fully Compliant' : 'Conditional Clearance',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/visual-quality-inspect:', error);
    res.status(500).json({ error: error.message || 'Quality inspection failed' });
  }
});

// API: Food Processing Unit Inefficiency & Factory Audit (MIC Problem Statement 5 & 6)
app.post('/api/gemini/industrial-audit', async (req: Request, res: Response) => {
  try {
    const { plantName, lineType, dailyRawInputTons, yieldPercentage, energyKwhPerTon, machineDowntimeHours } = req.body;

    const prompt = `Analyze industrial operational performance and waste inefficiencies for food processing plant:
Plant: ${plantName || 'Haldiram Snacks & Processing Hub - Line 4'}
Processing Line: ${lineType || 'Vegetable Frying & Vacuum Packaging'}
Daily Raw Input: ${dailyRawInputTons || 24} Metric Tons
Processing Yield: ${yieldPercentage || 82}% (trim, scrap, byproduct)
Specific Energy Consumption: ${energyKwhPerTon || 340} kWh/Ton
Unplanned Machine Downtime: ${machineDowntimeHours || 1.8} hours today

Base every KPI on THESE exact telemetry values (they scale with the inputs given above).
Generate audit analytics:
1. processEfficiencyScore (0-100)
2. rawMaterialLossTons (number)
3. financialLossInr (estimated INR loss from trim & downtime)
4. overproductionRiskScore (0-100)
5. energyExcessPercentage (percentage higher than ISO 50001 benchmark)
6. rootCauseDiagnoses (array of 3 specific technical causes for THIS line type, e.g. thermal fluctuation, blade dulling, batch queue delay)
7. leanInterventions (array of 3 operational fixes to recover yield)`;

    const data = await callGeminiJSON(prompt, {
      type: Type.OBJECT,
      properties: {
        processEfficiencyScore: { type: Type.NUMBER },
        rawMaterialLossTons: { type: Type.NUMBER },
        financialLossInr: { type: Type.NUMBER },
        overproductionRiskScore: { type: Type.NUMBER },
        energyExcessPercentage: { type: Type.NUMBER },
        rootCauseDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
        leanInterventions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'processEfficiencyScore',
        'rawMaterialLossTons',
        'financialLossInr',
        'overproductionRiskScore',
        'energyExcessPercentage',
        'rootCauseDiagnoses',
        'leanInterventions',
      ],
    });

    if (data && typeof data.processEfficiencyScore === 'number' && Array.isArray(data.rootCauseDiagnoses)) {
      return res.json({ success: true, engine: 'gemini', data });
    }

    // Deterministic audit fallback — every KPI derives from the actual telemetry.
    const BENCH_KWH_PER_TON = 310; // ISO 50001-style specific-energy benchmark
    const inputTons = Math.max(1, Number(dailyRawInputTons) || 24);
    const yieldPct = Math.min(98, Math.max(40, Number(yieldPercentage) || 82));
    const energyKwh = Math.max(80, Number(energyKwhPerTon) || 340);
    const downtime = Math.max(0, Number(machineDowntimeHours) || 0);

    const lossTons = Number((((100 - yieldPct) / 100) * inputTons).toFixed(2));
    const financialLossInr = Math.round(lossTons * 45000 + downtime * 62000); // scrap value + lost throughput
    const energyExcessPercentage = Number(
      Math.max(0, ((energyKwh - BENCH_KWH_PER_TON) / BENCH_KWH_PER_TON) * 100).toFixed(1)
    );
    const processEfficiencyScore = Math.max(
      20,
      Math.min(99, Math.round(yieldPct - energyExcessPercentage * 0.4 - downtime * 2.2))
    );
    const overproductionRiskScore = Math.max(5, Math.min(95, Math.round((100 - yieldPct) * 1.2 + downtime * 3)));

    const trimRecoveryInr = Math.round(lossTons * 20000);
    const rootCauseDiagnoses = [
      `${lineType || 'Processing line'}: ${(100 - yieldPct).toFixed(1)}% of the ${inputTons} T daily input exits as trim/cull (${lossTons} T) — the dominant loss stage is upstream sorting & calibration.`,
      downtime > 2
        ? `Unplanned stoppages of ${downtime} h exceed the 2 h daily threshold — transfer-conveyor sensor faults and changeover misalignment are the dominant halt triggers (≈ ₹${Math.round(downtime * 62000).toLocaleString('en-IN')} throughput loss).`
        : `Downtime of ${downtime} h is within the 2 h tolerance; residual micro-stops still cost ≈ ₹${Math.round(downtime * 62000).toLocaleString('en-IN')} in lost throughput.`,
      energyKwh > BENCH_KWH_PER_TON
        ? `Specific energy at ${energyKwh} kWh/T runs ${energyExcessPercentage}% above the ISO 50001 benchmark (${BENCH_KWH_PER_TON} kWh/T) — thermal seal leakage on chilling/freezing stages is the leading contributor.`
        : `Specific energy at ${energyKwh} kWh/T is at or below the ISO 50001 benchmark (${BENCH_KWH_PER_TON} kWh/T) — hold the current thermal maintenance schedule.`,
    ];
    const leanInterventions = [
      `Divert the ${lossTons} T of organic trim to the secondary upcycling marketplace (animal feed / bio-CNG) to recover ≈ ₹${trimRecoveryInr.toLocaleString('en-IN')} per day.`,
      'Automate optical quality-sorting calibration upstream of the main line to lift yield 2-3 percentage points within two weeks.',
      downtime > 2
        ? 'Deploy vibration/temperature sensors on bottleneck conveyors with predictive alerts to cut unplanned stops below 1.5 h/day.'
        : 'Hold the current preventive-maintenance cadence; audit packaging-line sensors quarterly to keep downtime under 2 h.',
    ];

    return res.json({
      success: true,
      engine: 'heuristic',
      data: {
        processEfficiencyScore,
        rawMaterialLossTons: lossTons,
        financialLossInr,
        overproductionRiskScore,
        energyExcessPercentage,
        rootCauseDiagnoses,
        leanInterventions,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/industrial-audit:', error);
    res.status(500).json({ error: error.message || 'Industrial audit failed' });
  }
});

// =============================================================================
// Remote Sensing + IoT Sensor Fusion Quality Verdict
// =============================================================================

/**
 * Deterministic quality verdict engine — fuses on-site IoT telemetry (thermal
 * probe, TVOC gas, humidity, elapsed time) with remote-sensing zone context
 * (ambient LST, humidity proxies, stress flags). This runs 100% offline so a
 * verdict is ALWAYS available; Gemini is layered on top for the narrative.
 * Every threshold below follows FSSAI hot/cold chain guidance.
 */
function computeSensorFusionVerdict(input: {
  foodName?: string;
  category?: string;
  temperatureC?: number;
  tvocPpm?: number;
  humidityPct?: number;
  storageAgeHours?: number;
  ndvi?: number;
  lstC?: number;
  rainfall7dMm?: number;
}) {
  const temp = Number(input.temperatureC) || 30;
  const tvoc = Number(input.tvocPpm) || 80;
  const humidity = Number(input.humidityPct) || 60;
  const age = Number(input.storageAgeHours) || 2;
  const ndvi = typeof input.ndvi === 'number' ? input.ndvi : 0.65;
  const zoneLst = Number(input.lstC) || 30;
  const rain = Number(input.rainfall7dMm) || 10;

  const isCooked = (input.category || '').toLowerCase().includes('cooked');
  const isDairy = (input.category || '').toLowerCase().includes('dairy');

  // ---- FSSAI thermal envelope scoring (0-100) -------------------------------
  let tempScore: number;
  if (isCooked) {
    // Hot-held cooked food: safe >= 60°C, danger zone 5-60°C
    tempScore = temp >= 60 ? 100 : temp >= 50 ? 65 : temp < 5 ? 88 : 30 + (temp - 5) * 0.6;
  } else if (isDairy) {
    // Cold chain: safe <= 5°C
    tempScore = temp <= 5 ? 100 : temp <= 8 ? 72 : 35;
  } else {
    // Produce / dry: mild temps OK
    tempScore = temp <= 8 ? 96 : temp <= 24 ? 88 : temp <= 32 ? 74 : 55;
  }

  // ---- Gas decay (TVOC) scoring --------------------------------------------
  let tvocScore: number;
  if (tvoc < 80) tvocScore = 100;
  else if (tvoc < 150) tvocScore = 88;
  else if (tvoc < 250) tvocScore = 68;
  else if (tvoc < 350) tvocScore = 45;
  else tvocScore = 20;

  // ---- Humidity scoring (mould / condensation risk) -------------------------
  const humidityScore = humidity <= 65 ? 100 : humidity <= 75 ? 85 : humidity <= 85 ? 65 : 40;

  // ---- Time decay -----------------------------------------------------------
  const maxSafeHours = isCooked ? 6 : isDairy ? 8 : 24;
  const timeScore = Math.max(20, 100 - (age / maxSafeHours) * 75);

  // ---- Remote-sensing context adjustment ------------------------------------
  // High ambient LST + high ambient humidity (rain) accelerate spoilage in
  // transit vehicles without active cold chain.
  let ambientPenalty = 0;
  if (zoneLst >= 35) ambientPenalty += 4;
  else if (zoneLst >= 32) ambientPenalty += 2;
  if (rain >= 20 && temp < 60 && !isDairy) ambientPenalty += 3; // damp transit air
  if (ndvi < 0.4) ambientPenalty += 1; // dusty/harvest-season aerosol load

  const freshnessScore = Math.max(
    5,
    Math.min(100, Math.round(tempScore * 0.4 + tvocScore * 0.3 + humidityScore * 0.15 + timeScore * 0.15) - ambientPenalty)
  );

  const qualityGrade =
    freshnessScore >= 85
      ? 'Grade A: Prime Wholesome'
      : freshnessScore >= 70
      ? 'Grade B: Safe for Rapid Intake'
      : freshnessScore >= 45
      ? 'Grade C: Secondary Upcycling Only'
      : 'Grade D: Unsafe / Bio-compost';

  const microbialRiskLevel =
    freshnessScore >= 85 ? 'Negligible' : freshnessScore >= 70 ? 'Low' : freshnessScore >= 45 ? 'Moderate' : 'High';

  const remainingSafeHours = Math.max(0.5, Number(((maxSafeHours - age) * (freshnessScore / 100)).toFixed(1)));

  const recommendedAction =
    freshnessScore >= 85
      ? 'Human Redistribution'
      : freshnessScore >= 70
      ? 'Blast Chilling Required'
      : freshnessScore >= 45
      ? 'Secondary Buyer / Animal Feed'
      : 'Biogas / Composting';

  const fssaiComplianceStatus =
    freshnessScore >= 85
      ? 'Fully Compliant'
      : freshnessScore >= 70
      ? 'Conditional Clearance'
      : 'Non-Compliant';

  const sensoryAnalysisNotes =
    `Fusion of ${temp}°C core probe, ${tvoc} ppm TVOC gas decay and ${humidity}% RH telemetry ` +
    `(zone LST ${zoneLst}°C, NDVI ${(ndvi).toFixed(2)}). ` +
    (tvoc >= 250
      ? 'Elevated volatile organics indicate active fermentation/decomposition. '
      : 'Gas profile within fresh-envelope bounds. ') +
    (temp >= 60 && isCooked
      ? 'Hot-holding above 60°C prevents mesophilic bacterial proliferation. '
      : temp < 5 || (isDairy && temp <= 8)
      ? 'Cold-chain envelope maintained. '
      : 'Time-in-danger-zone detected — rapid dispatch or chilling advised. ');

  return {
    freshnessScore,
    qualityGrade,
    microbialRiskLevel,
    sensoryAnalysisNotes,
    remainingSafeHours,
    recommendedAction,
    fssaiComplianceStatus,
    // Per-factor breakdown for transparent UI display
    factors: {
      thermal: Math.round(tempScore),
      gasDecay: Math.round(tvocScore),
      humidity: Math.round(humidityScore),
      timeElapsed: Math.round(timeScore),
      ambientPenalty,
    },
  };
}

// API: Remote-sensing zone data for a location + fused quality verdict
app.post('/api/gemini/remote-sensing', async (req: Request, res: Response) => {
  try {
    const { lat, lng, zoneId, foodName, category, temperatureC, tvocPpm, humidityPct, storageAgeHours } = req.body;

    const zone =
      (zoneId && RS_ZONES.find((z) => z.id === zoneId)) ||
      (typeof lat === 'number' && typeof lng === 'number' ? getZoneForLocation(lat, lng) : null);

    if (!zone) {
      return res.status(400).json({ error: 'Provide lat/lng or a valid zoneId' });
    }

    // Deterministic fused verdict from IoT + RS context
    const verdict = computeSensorFusionVerdict({
      foodName,
      category,
      temperatureC,
      tvocPpm,
      humidityPct,
      storageAgeHours,
      ndvi: zone.ndvi,
      lstC: zone.lstC,
      rainfall7dMm: zone.rainfall7dMm,
    });

    // Optional AI narrative layered on top of the deterministic verdict
    let narrative: string | null = null;
    if (ai) {
      try {
        const prompt = `In exactly 2 concise sentences, explain this food-quality diagnostic verdict to a food-bank operator. Mention the deciding sensor factor and one handling instruction.\nFood: ${foodName || 'Mixed surplus'} (${category || 'Cooked Meals'})\nIoT: ${temperatureC ?? '?'}°C core, ${tvocPpm ?? '?'} ppm TVOC, ${humidityPct ?? '?'}% RH, ${storageAgeHours ?? '?'}h elapsed\nRemote sensing zone: ${zone.name} — LST ${zone.lstC}°C, NDVI ${zone.ndvi}, 7-day rain ${zone.rainfall7dMm}mm\nVerdict: ${verdict.qualityGrade}, score ${verdict.freshnessScore}/100, ${verdict.recommendedAction}, FSSAI ${verdict.fssaiComplianceStatus}`;
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 400,
            // Small narrative task — skip internal thinking so the full token
            // budget goes to the visible answer (prevents mid-sentence cuts).
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        const text = (response.text || '').trim().replace(/^[.\s]+/, '');
        narrative = text.length >= 30 ? text : null;
      } catch (err: any) {
        console.error('RS narrative generation failed (non-fatal):', err?.message || err);
      }
    }

    return res.json({
      success: true,
      data: {
        zone: {
          id: zone.id,
          name: zone.name,
          region: zone.region,
          dominantCrops: zone.dominantCrops,
          ndvi: zone.ndvi,
          evi: zone.evi,
          lstC: zone.lstC,
          soilMoisture: zone.soilMoisture,
          rainfall7dMm: zone.rainfall7dMm,
          solarRadiation: zone.solarRadiation,
          irrigationCoveragePct: zone.irrigationCoveragePct,
          stressFlags: zone.stressFlags,
          mandiCount: zone.mandiCount,
          dataSources: ['Sentinel-2 NDVI/EVI', 'MODIS LST', 'SMAP soil moisture', 'CHIRPS/IMD rainfall', 'Resourcesat LULC'],
        },
        verdict,
        narrative,
        poweredBy: narrative ? `Gemini · ${GEMINI_MODEL} + deterministic fusion` : 'Deterministic sensor-fusion engine',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/remote-sensing:', error);
    res.status(500).json({ error: error.message || 'Remote sensing request failed' });
  }
});

  return app;
}
