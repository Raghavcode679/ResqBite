import React from 'react';
import {
  Satellite,
  Leaf,
  Droplets,
  Sun,
  CloudRain,
  X,
  Map as MapIcon,
  Wheat,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  RS_ZONES,
  PUNJAB_AGRO_PROFILE,
  classifyVigor,
  zoneNdviHistory,
  RemoteSensingZone,
} from '../data/remoteSensing';

interface RemoteSensingPanelProps {
  open: boolean;
  onClose: () => void;
  /** Optional focus: zone picked on map or the zone around the selected city */
  focusZoneId?: string;
}

const DATA_SOURCES: { name: string; detail: string; color: string }[] = [
  { name: 'Sentinel-2 (ESA)', detail: 'NDVI / EVI greenness · 10 m · 5-day revisit', color: 'text-emerald-400' },
  { name: 'MODIS (NASA)', detail: 'Land Surface Temperature & thermal anomalies', color: 'text-rose-400' },
  { name: 'SMAP L4 (NASA)', detail: 'Root-zone soil moisture · 9 km', color: 'text-blue-400' },
  { name: 'CHIRPS + IMD', detail: 'Merged satellite-gauge rainfall (7-day)', color: 'text-cyan-400' },
  { name: 'Resourcesat (ISRO)', detail: 'Crop type / land-use classification', color: 'text-amber-400' },
];

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.01;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export const RemoteSensingPanel: React.FC<RemoteSensingPanelProps> = ({
  open,
  onClose,
  focusZoneId,
}) => {
  if (!open) return null;

  const focus: RemoteSensingZone =
    RS_ZONES.find((z) => z.id === focusZoneId) || RS_ZONES[0];

  const vigor = classifyVigor(focus.ndvi);
  const history = zoneNdviHistory(focus);

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[340px] max-w-[92vw] bg-slate-950/97 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-950/95 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Remote Sensing Feed
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close remote sensing panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Data sources legend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
            Satellite Data Sources
          </div>
          {DATA_SOURCES.map((s) => (
            <div key={s.name} className="flex items-start gap-2 text-[11px]">
              <span className={`mt-1 h-1.5 w-1.5 rounded-full bg-current ${s.color} shrink-0`} />
              <div>
                <span className="font-semibold text-slate-200">{s.name}</span>
                <span className="text-slate-500"> — {s.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Focus zone card */}
        <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-3.5 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
              <MapIcon className="w-3 h-3" /> Focused Zone
            </div>
            <div className="text-sm font-bold text-white mt-0.5">{focus.name}</div>
            <div className="text-[11px] text-slate-400">{focus.region}</div>
          </div>

          {/* NDVI + vigor */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-mono">NDVI (Crop Health)</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-extrabold" style={{ color: vigor.color }}>
                  {focus.ndvi.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: vigor.color }}>
                  {vigor.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-mono">6-Week Trend</div>
              <Sparkline values={history} color={vigor.color} />
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <div className="flex items-center gap-1 text-slate-500 font-mono">
                <Activity className="w-3 h-3 text-rose-400" /> LST
              </div>
              <div className="font-mono font-bold text-rose-300">{focus.lstC}°C</div>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <div className="flex items-center gap-1 text-slate-500 font-mono">
                <Droplets className="w-3 h-3 text-blue-400" /> Soil Moisture
              </div>
              <div className="font-mono font-bold text-blue-300">{(focus.soilMoisture * 100).toFixed(0)}%</div>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <div className="flex items-center gap-1 text-slate-500 font-mono">
                <CloudRain className="w-3 h-3 text-cyan-400" /> Rain 7d
              </div>
              <div className="font-mono font-bold text-cyan-300">{focus.rainfall7dMm} mm</div>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <div className="flex items-center gap-1 text-slate-500 font-mono">
                <Sun className="w-3 h-3 text-amber-400" /> Solar Rad.
              </div>
              <div className="font-mono font-bold text-amber-300">{focus.solarRadiation} MJ/m²</div>
            </div>
          </div>

          {/* Crops & stress */}
          <div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 uppercase tracking-wider mb-1">
              <Wheat className="w-3 h-3" /> Dominant Crops (Resourcesat LULC)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {focus.dominantCrops.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/60 text-[10px] text-amber-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {focus.stressFlags.length > 0 && (
            <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-mono text-rose-300 uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" /> Stress Alerts
              </div>
              {focus.stressFlags.map((f) => (
                <div key={f} className="text-[11px] text-rose-200">
                  • {f}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <span className="text-slate-500 font-mono">Irrigation</span>
              <div className="font-mono font-bold text-emerald-300">{focus.irrigationCoveragePct}%</div>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-2">
              <span className="text-slate-500 font-mono">Mandi Points</span>
              <div className="font-mono font-bold text-yellow-300">{focus.mandiCount}</div>
            </div>
          </div>
        </div>

        {/* Punjab Agro story block */}
        {focus.id === PUNJAB_AGRO_PROFILE.zoneId && (
          <div className="rounded-xl border border-yellow-800/60 bg-yellow-950/20 p-3.5 space-y-2">
            <div className="text-sm font-bold text-yellow-300">🌾 {PUNJAB_AGRO_PROFILE.title}</div>
            <div className="text-[11px] text-slate-300">{PUNJAB_AGRO_PROFILE.tagline}</div>
            <ul className="space-y-1.5">
              {PUNJAB_AGRO_PROFILE.facts.map((f) => (
                <li key={f} className="text-[11px] text-slate-300 flex gap-1.5">
                  <Leaf className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Crop Calendar (remote-sensing synced)
              </div>
              {PUNJAB_AGRO_PROFILE.cropCalendar.map((c) => (
                <div key={c.season} className="rounded-lg bg-slate-950/70 border border-slate-800 p-2">
                  <div className="text-[11px] font-bold text-white">
                    {c.crop} <span className="text-slate-500 font-mono">· {c.season}</span>
                  </div>
                  <div className="text-[10.5px] text-slate-400">{c.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All zones quick list */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
            All Monitored Foodshed Zones ({RS_ZONES.length})
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {RS_ZONES.map((z) => {
              const v = classifyVigor(z.ndvi);
              return (
                <div
                  key={z.id}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] ${
                    z.id === focus.id ? 'bg-slate-800 border border-cyan-800/60' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-slate-200 truncate">{z.name}</span>
                  <span className="font-mono font-bold shrink-0 ml-2" style={{ color: v.color }}>
                    {z.ndvi.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed px-1 pb-2">
          Demo mode: indices are deterministic simulated values modelled on open satellite
          programmes. In production, this panel subscribes to Google Earth Engine / ISRO Bhuvan
          / Sentinel Hub live tile services using the same data schema.
        </p>
      </div>
    </div>
  );
};
