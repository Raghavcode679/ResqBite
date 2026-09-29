import React, { useState } from 'react';
import {
  X,
  MapPin,
  Users,
  Sparkles,
  Camera,
  Factory,
  Recycle,
  ChefHat,
  Truck,
  Building2,
  TrendingUp,
  ShieldCheck,
  Satellite,
  BotMessageSquare,
  Layers,
  Cpu,
  Cloud,
  Leaf,
  Workflow,
  HelpCircle,
} from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES: {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  how: string;
  accent: string;
}[] = [
  {
    icon: <MapPin className="w-4 h-4" />,
    name: 'India Map & Surplus Radar',
    tagline: 'Live geo-map of every surplus batch, food bank, driver & hunger hotspot. Includes a satellite Remote-Sensing overlay (NDVI crop-health zones, LST, soil moisture) and the Punjab Agro-Hub focus view.',
    how: 'Pick a city (or Pan-India), toggle layers, click any node for restaurant/rider/delivery details. Open the 🛰️ Remote Sensing panel for satellite data; use 🌾 Punjab Agro-Hub for the granary story.',
    accent: 'text-emerald-400',
  },
  {
    icon: <Users className="w-4 h-4" />,
    name: 'People in Need (Receiver Areas)',
    tagline: 'Registers communities in need — slum settlements, night shelters, labor camps, orphanages — with live meal deficits vs meals received today.',
    how: 'Open the tab, register a new community, then dispatch any available surplus batch directly to it. Meals get credited instantly and the driver HUD auto-opens.',
    accent: 'text-amber-400',
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    name: 'AI Demand Forecast (Kitchen Sizing)',
    tagline: 'Predicts diners and recommends exact kg-per-component to cook — eliminating overproduction waste at the source (UN SDG 12.3).',
    how: 'Enter facility type, expected attendance, day, meal slot & menu → hit "Calculate Optimal Batch Sizing". Gemini returns component-wise production plan + savings.',
    accent: 'text-emerald-400',
  },
  {
    icon: <Camera className="w-4 h-4" />,
    name: 'CV + IoT + Remote-Sensing Quality Lab',
    tagline: 'Triple-fusion food diagnostic: thermal probe + TVOC gas + humidity telemetry, fused with satellite zone context (NDVI, land-surface temp, rainfall) — returns a deterministic, FSSAI-aligned Grade A–D verdict with per-factor transparency.',
    how: 'Pick a sample batch, drag the IoT sliders, choose the satellite zone of the pickup area, then "Run Fusion Diagnostic". The verdict shows exactly which sensor drove the decision.',
    accent: 'text-teal-400',
  },
  {
    icon: <Factory className="w-4 h-4" />,
    name: 'Processing Plant Inefficiency Audit',
    tagline: 'Factory audit for food processors: raw-material loss, financial loss, energy excess vs ISO 50001, root causes and lean interventions.',
    how: 'Enter plant tonnage, yield %, energy per ton & downtime → generate the audit report with AI diagnoses.',
    accent: 'text-purple-400',
  },
  {
    icon: <Recycle className="w-4 h-4" />,
    name: 'Secondary Upcycling Off-Takers',
    tagline: 'Certified circular-economy buyers — animal feed, bio-CNG, composting, secondary processing — that purchase unavoidable food scrap by the kg.',
    how: 'Browse buyers by city, check accepted materials & ₹/kg rates, contact directly for offtake contracts.',
    accent: 'text-amber-400',
  },
  {
    icon: <ChefHat className="w-4 h-4" />,
    name: 'Post Kitchen Surplus (AI Pre-Check)',
    tagline: 'Donors list surplus food with an instant AI safety pre-check: shelf life, risk level, dispatch window, meals, CO₂ & water saved.',
    how: 'Fill food name, category, quantity, prep time & storage temp → run "AI Analysis" → publish. The batch goes live on the radar and triggers driver notifications.',
    accent: 'text-emerald-400',
  },
  {
    icon: <Truck className="w-4 h-4" />,
    name: 'Driver Route Navigation HUD',
    tagline: 'Volunteer driver cockpit: claimed pickups, optimized route waypoints, cold-chain protocol, OTP handover and delivery progress.',
    how: 'Switch role to Volunteer Driver, claim a batch (or get auto-routed after a dispatch), then progress through Pickup → Transit → Delivered.',
    accent: 'text-blue-400',
  },
  {
    icon: <Building2 className="w-4 h-4" />,
    name: 'Redistribution Partners',
    tagline: 'NGO food banks & community kitchens with live capacity, cold-storage flags and ratings — assignable to any surplus batch.',
    how: 'Add partners, view capacity headroom, assign surplus directly from this tab.',
    accent: 'text-purple-400',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    name: 'Impact & ESG Reports',
    tagline: 'Corporate ESG impact statements: meals rescued, CO₂e diverted, virtual water saved, SDG alignment & CSR/80G tax benefits.',
    how: 'Open the tab for live aggregated impact; generate AI executive summaries for board/ESG reporting.',
    accent: 'text-teal-400',
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    name: 'Logistics Command (Admin)',
    tagline: 'Admin command center over the entire fleet: every batch, partner and driver with live status controls.',
    how: 'Switch role to Admin Hub → monitor and force-update any delivery in the network.',
    accent: 'text-slate-300',
  },
  {
    icon: <BotMessageSquare className="w-4 h-4" />,
    name: 'ResQ Assist (AI Chat)',
    tagline: 'Floating AI guide on every page — answers any question about the platform in seconds. Runs on Groq (primary) with Gemini fallback.',
    how: 'Click the green bubble at the bottom-right and ask anything — "how do I donate?", "what does this tab do?". Context-aware of your current tab/role/city.',
    accent: 'text-emerald-400',
  },
];

const WORKFLOW = [
  { step: '1', title: 'Kitchen posts surplus', detail: 'Donor runs the AI pre-check — shelf life & safety verdict in seconds.' },
  { step: '2', title: 'Radar lights up', detail: 'Batch appears on the India Map; urgent notifications ping nearby volunteers.' },
  { step: '3', title: 'Driver claims & navigates', detail: 'Route HUD with cold-chain protocol and waypoint ETAs.' },
  { step: '4', title: 'Quality gate', detail: 'CV + IoT + satellite fusion diagnostic confirms Grade A/B before handover.' },
  { step: '5', title: 'Community served', detail: 'Direct dispatch to People-in-Need areas or NGO food banks; meals credited.' },
  { step: '6', title: 'Impact certified', detail: '80G tax certificate + ESG impact auto-computed per donation.' },
];

const TECH_STACK: { icon: React.ReactNode; group: string; items: string[] }[] = [
  {
    icon: <Layers className="w-4 h-4" />,
    group: 'Frontend',
    items: ['React 19 + TypeScript', 'Vite 8 (rolldown)', 'Tailwind CSS 4', 'lucide-react icons', 'motion animations', 'Custom SVG India map engine'],
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    group: 'AI Engines',
    items: ['Groq LPU — gpt-oss-120b (assistant chat)', 'Google Gemini 3.8 Flash (analysis features)', 'Deterministic FSSAI sensor-fusion verdict engine', 'Graceful heuristic fallbacks (offline-safe)'],
  },
  {
    icon: <Cloud className="w-4 h-4" />,
    group: 'Backend & Infra',
    items: ['Express (TypeScript) API server', 'Vite dev middleware / static dist in prod', 'Server-side key vaulting (.env, never in browser)', 'Per-IP rate limiting + input sanitization', 'REST API: 9 endpoints + /api/health'],
  },
  {
    icon: <Satellite className="w-4 h-4" />,
    group: 'Remote Sensing & IoT',
    items: ['Sentinel-2 NDVI/EVI (simulated, GEE-ready schema)', 'MODIS LST + thermal anomalies', 'SMAP L4 soil moisture', 'CHIRPS/IMD merged rainfall', 'Resourcesat LULC crop classification', 'IoT: thermal probe, TVOC gas, RH sensors'],
  },
  {
    icon: <Leaf className="w-4 h-4" />,
    group: 'Domain Standards',
    items: ['FSSAI Surplus Food Regulations 2019', 'ISO 50001 energy benchmarks', 'UN SDG 2 & 12.3 alignment', 'India IT Act 80G tax receipts', 'BRSR / CSR Schedule VII reporting'],
  },
];

export const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'howto' | 'stack'>('features');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-emerald-950/70 to-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">About ResqBite</h2>
              <p className="text-[11px] text-slate-400">
                AI-powered food surplus reduction & redistribution network for India
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close about"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/60">
          {(
            [
              { id: 'features' as const, label: 'All Features', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'howto' as const, label: 'How to Use (Workflow)', icon: <Workflow className="w-3.5 h-3.5" /> },
              { id: 'stack' as const, label: 'Tech Stack', icon: <Cpu className="w-3.5 h-3.5" /> },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                activeTab === t.id
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.name}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={f.accent}>{f.icon}</span>
                    <span className="text-sm font-bold text-white">{f.name}</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed">{f.tagline}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-800/70">
                    <span className="text-emerald-400 font-semibold">How to use: </span>
                    {f.how}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'howto' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">The Rescue Workflow</span>
                </div>
                <p className="text-[11.5px] text-slate-400">
                  ResqBite connects four roles — <strong className="text-slate-200">Donor Kitchen</strong> (hotels, IT-park
                  cafeterias, cloud kitchens), <strong className="text-slate-200">Volunteer Driver</strong>,{' '}
                  <strong className="text-slate-200">Food Bank NGO</strong> and{' '}
                  <strong className="text-slate-200">Logistics Admin</strong>. Switch roles from the top-right. Here is
                  how one rescued meal flows end-to-end:
                </p>
              </div>
              <div className="space-y-2.5">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="w-7 h-7 shrink-0 rounded-lg bg-emerald-600/20 border border-emerald-700/50 flex items-center justify-center text-xs font-bold text-emerald-300">
                      {w.step}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{w.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{w.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-slate-400">
                  <strong className="text-slate-200">First time here?</strong> Click the green AI bubble at the bottom-right of any page — ResQ Assist can walk you through every tab live.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TECH_STACK.map((g) => (
                <div key={g.group} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-emerald-400">{g.icon}</span>
                    <span className="text-sm font-bold text-white">{g.group}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((i) => (
                      <li key={i} className="text-[11.5px] text-slate-400 flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-300">Architecture note:</strong> AI API keys are stored server-side only
                (Express proxy) — the browser never touches them. Every AI feature degrades gracefully to deterministic
                engines when providers are unreachable, so the platform stays fully operable offline for demos.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-900/80">
          <span className="text-[10px] font-mono text-slate-500">
            FSSAI Compliant (Surplus Food Regs 2019) · UN SDG 12.3 · MIC Agri-FoodTech
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Got it — explore the platform
          </button>
        </div>
      </div>
    </div>
  );
};
