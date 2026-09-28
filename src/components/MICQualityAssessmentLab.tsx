import React, { useState } from 'react';
import {
  Camera,
  Thermometer,
  Activity,
  Droplets,
  Clock,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Satellite,
  Leaf,
  Radar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  LocateFixed,
  MapPin,
  X,
} from 'lucide-react';
import { RS_ZONES, classifyVigor, getZoneForLocation } from '../data/remoteSensing';

interface FoodSamplePreset {
  id: string;
  name: string;
  category: string;
  initialTemp: number;
  initialTvoc: number;
  initialHumidity: number;
  storageAge: number;
  visualNotes: string;
  previewColor: string;
}

const SAMPLE_PRESETS: FoodSamplePreset[] = [
  {
    id: 'sample-1',
    name: 'Steamed Basmati Rice & Dal Makhani',
    category: 'Cooked Meals',
    initialTemp: 66,
    initialTvoc: 85,
    initialHumidity: 68,
    storageAge: 1.5,
    visualNotes: 'Steam actively venting, no crusting, homogeneous dal consistency, rich aroma.',
    previewColor: 'from-amber-600 to-yellow-700',
  },
  {
    id: 'sample-2',
    name: 'Cut Vegetable Medley (Carrots, Beans, Capsicum)',
    category: 'Raw Produce / Veg',
    initialTemp: 8,
    initialTvoc: 45,
    initialHumidity: 82,
    storageAge: 3.0,
    visualNotes: 'Crisp cell wall integrity, minimal enzymatic browning on cut surfaces, no slime.',
    previewColor: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'sample-3',
    name: 'Fresh Cow Milk Paneer Blocks',
    category: 'Dairy & Perishables',
    initialTemp: 4,
    initialTvoc: 60,
    initialHumidity: 75,
    storageAge: 4.0,
    visualNotes: 'Pristine white block, firm elastic texture, fresh milky scent, no sour odor.',
    previewColor: 'from-slate-200 to-slate-400',
  },
  {
    id: 'sample-4',
    name: 'Artisan Whole Wheat Pav & Sourdough',
    category: 'Bakery & Grains',
    initialTemp: 24,
    initialTvoc: 30,
    initialHumidity: 45,
    storageAge: 8.0,
    visualNotes: 'Dry crumb, no fungal hyphae/mold growth, pleasant yeasty aroma.',
    previewColor: 'from-amber-700 to-orange-900',
  },
];

interface FusionVerdict {
  freshnessScore: number;
  qualityGrade: string;
  microbialRiskLevel: string;
  sensoryAnalysisNotes: string;
  remainingSafeHours: number;
  recommendedAction: string;
  fssaiComplianceStatus: string;
  factors: {
    thermal: number;
    gasDecay: number;
    humidity: number;
    timeElapsed: number;
    ambientPenalty: number;
  };
}

interface RSZoneSummary {
  id: string;
  name: string;
  region: string;
  ndvi: number;
  evi: number;
  lstC: number;
  soilMoisture: number;
  rainfall7dMm: number;
  solarRadiation: number;
  irrigationCoveragePct: number;
  stressFlags: string[];
  mandiCount: number;
  dominantCrops: string[];
  dataSources: string[];
}

interface DiagnosticResponse {
  zone: RSZoneSummary;
  verdict: FusionVerdict;
  narrative: string | null;
  poweredBy: string;
}

/** Verdict → display metadata (color, icon, tone) */
function verdictMeta(grade: string) {
  if (grade.startsWith('Grade A'))
    return { color: 'text-emerald-400', ring: 'border-emerald-500/60 bg-emerald-950/30', label: 'SAFE FOR HUMAN REDISTRIBUTION', Icon: CheckCircle2 };
  if (grade.startsWith('Grade B'))
    return { color: 'text-lime-400', ring: 'border-lime-500/60 bg-lime-950/30', label: 'SAFE — RAPID INTAKE REQUIRED', Icon: CheckCircle2 };
  if (grade.startsWith('Grade C'))
    return { color: 'text-amber-400', ring: 'border-amber-500/60 bg-amber-950/30', label: 'NOT FOR DIRECT DONATION', Icon: MinusCircle };
  return { color: 'text-rose-400', ring: 'border-rose-500/60 bg-rose-950/30', label: 'UNSAFE — DO NOT DISTRIBUTE', Icon: XCircle };
}

function FactorBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-lime-500' : value >= 45 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px] mb-1">
        <span className="flex items-center gap-1 text-slate-400 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono font-bold text-slate-200">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export const MICQualityAssessmentLab: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<FoodSamplePreset>(SAMPLE_PRESETS[0]);
  const [tempC, setTempC] = useState<number>(SAMPLE_PRESETS[0].initialTemp);
  const [tvocPpm, setTvocPpm] = useState<number>(SAMPLE_PRESETS[0].initialTvoc);
  const [humidityPct, setHumidityPct] = useState<number>(SAMPLE_PRESETS[0].initialHumidity);
  const [storageHours, setStorageHours] = useState<number>(SAMPLE_PRESETS[0].storageAge);
  const [visualNotes, setVisualNotes] = useState<string>(SAMPLE_PRESETS[0].visualNotes);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('rs-punjab');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [result, setResult] = useState<DiagnosticResponse | null>(null);

  // ---- Live GPS location state ---------------------------------------------
  const [liveFix, setLiveFix] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const activeZoneName =
    liveFix
      ? getZoneForLocation(liveFix.lat, liveFix.lng).name
      : RS_ZONES.find((z) => z.id === selectedZoneId)?.name || '—';

  const handleUseLiveLocation = () => {
    setLocError('');
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation is not supported by this browser — pick a zone manually.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLiveFix({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy || 0) });
        // Auto-match the covering agro zone so the select stays in sync
        setSelectedZoneId(getZoneForLocation(latitude, longitude).id);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — allow location access or pick a zone manually.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Live position unavailable right now — pick a zone manually.'
            : 'Location request timed out — try again or pick a zone manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const clearLiveLocation = () => {
    setLiveFix(null);
    setLocError('');
  };

  const handleSelectPreset = (preset: FoodSamplePreset) => {
    setSelectedPreset(preset);
    setTempC(preset.initialTemp);
    setTvocPpm(preset.initialTvoc);
    setHumidityPct(preset.initialHumidity);
    setStorageHours(preset.storageAge);
    setVisualNotes(preset.visualNotes);
    setResult(null);
    setScanError('');
  };

  const handleRunQualityScan = async () => {
    setIsScanning(true);
    setScanError('');
    try {
      const res = await fetch('/api/gemini/remote-sensing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Live GPS fix takes priority — server resolves the covering agro zone
          ...(liveFix
            ? { lat: liveFix.lat, lng: liveFix.lng }
            : { zoneId: selectedZoneId }),
          foodName: selectedPreset.name,
          category: selectedPreset.category,
          visualNotes,
          temperatureC: tempC,
          tvocPpm,
          humidityPct,
          storageAgeHours: storageHours,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data?.verdict) {
        setResult(json.data);
      } else {
        setScanError(json.error || 'Diagnostic failed — please retry.');
      }
    } catch (e: any) {
      setScanError(e?.message || 'Network error during diagnostic scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const verdict = result?.verdict;
  const zone = result?.zone;
  const meta = verdict ? verdictMeta(verdict.qualityGrade) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                MIC HACKATHON · PROBLEM STATEMENT 2
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                COMPUTER VISION & IOT FUSION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                + SATELLITE REMOTE SENSING
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-400" />
              CV + IoT + Remote-Sensing Quality Diagnostic Lab
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Triple-fusion verdict: on-site IoT telemetry (thermal probe, TVOC gas, humidity) fused with satellite
              remote-sensing context (NDVI crop vigor, land-surface temperature, rainfall) and computer-vision notes —
              graded against FSSAI hot/cold-chain thresholds.
            </p>
          </div>

          <button
            onClick={handleRunQualityScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/40 transition-colors shrink-0"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Fusing Sensors + Satellite Data…</span>
              </>
            ) : (
              <>
                <Radar className="w-4 h-4" />
                <span>Run Fusion Diagnostic</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sample Presets, Zone & CV Notes */}
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Batch for Quality Inspection
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPreset.id === preset.id
                      ? 'bg-slate-800 border-teal-500/80 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-full h-12 rounded-lg bg-gradient-to-br ${preset.previewColor} mb-2 flex items-center justify-center opacity-85`}
                  >
                    <Camera className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{preset.category}</div>
                </button>
              ))}
            </div>

            {/* Live GPS location access */}
            <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
                  Live Location Fusion
                </label>
                {liveFix ? (
                  <button
                    onClick={clearLiveLocation}
                    className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={handleUseLiveLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[11px] font-bold transition-colors shadow-sm"
                  >
                    {isLocating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Acquiring GPS…
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-3.5 h-3.5" />
                        Access Location
                      </>
                    )}
                  </button>
                )}
              </div>

              {liveFix && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-mono font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    GPS LOCKED
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300 font-mono">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {liveFix.lat.toFixed(4)}°N, {liveFix.lng.toFixed(4)}°E · ±{liveFix.accuracy}m
                  </span>
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {liveFix
                  ? `Fusing verdict with the agro zone covering your live position: ${activeZoneName}.`
                  : 'Grant location access and the fusion engine automatically uses the satellite zone covering your live position — no manual zone picking.'}
              </p>

              {locError && (
                <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-2.5 py-1.5 text-[10.5px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {locError}
                </div>
              )}
            </div>

            {/* Remote-sensing zone selector */}
            <div className={liveFix ? 'opacity-50 pointer-events-none' : ''}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                Remote-Sensing Zone {liveFix ? '(auto-matched by GPS)' : '(satellite context)'}
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                {RS_ZONES.map((z) => (
                  <option key={z.id} value={z.id} className="bg-slate-900">
                    {z.name} — NDVI {z.ndvi.toFixed(2)}, LST {z.lstC}°C
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Ambient satellite conditions of the pickup zone modulate spoilage risk during transit.
              </p>
            </div>

            {/* Visual Inspection Observations Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Computer Vision Camera Observations / Optical Notes
              </label>
              <textarea
                rows={3}
                value={visualNotes}
                onChange={(e) => setVisualNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Center Column: Live IoT Telemetry Sliders / Gauges */}
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              IoT Sensor Stream Telemetry
            </h3>

            {/* Core Temp Sensor */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Thermometer className="w-4 h-4 text-teal-400" />
                  Core Temperature Probe
                </span>
                <span className="font-mono font-bold text-teal-400 text-sm">{tempC}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0°C (Frozen)</span>
                <span>5°C (Chilled Limit)</span>
                <span>65°C (Hot Safe)</span>
              </div>
            </div>

            {/* TVOC / Ethylene Gas Sensor */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Volatile Organic Compounds (TVOC / Ethylene)
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">{tvocPpm} ppm</span>
              </div>
              <input
                type="range"
                min="10"
                max="400"
                step="5"
                value={tvocPpm}
                onChange={(e) => setTvocPpm(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>&lt;100 (Fresh)</span>
                <span>200 (Ripening)</span>
                <span>&gt;350 (Decay)</span>
              </div>
            </div>

            {/* Humidity Sensor */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Relative Humidity Sensor
                </span>
                <span className="font-mono font-bold text-blue-400 text-sm">{humidityPct}% RH</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={humidityPct}
                onChange={(e) => setHumidityPct(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>≤65% (Mould-safe)</span>
                <span>85%+ (Condensation risk)</span>
              </div>
            </div>

            {/* Storage Elapsed Time */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Elapsed Storage Window
                </span>
                <span className="font-mono font-bold text-purple-400 text-sm">{storageHours} hours</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="24"
                step="0.5"
                value={storageHours}
                onChange={(e) => setStorageHours(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Fused Diagnostic Verdict */}
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fusion Quality Verdict
            </h3>

            {scanError && (
              <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {scanError}
              </div>
            )}

            {!verdict && !scanError && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center">
                <Radar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Set the IoT sliders & satellite zone, then run the fusion diagnostic to get a
                  deterministic, FSSAI-aligned verdict.
                </p>
              </div>
            )}

            {verdict && meta && zone && (
              <>
                {/* Verdict headline */}
                <div className={`p-4 rounded-xl border text-center ${meta.ring}`}>
                  <div className="flex items-center justify-center gap-2">
                    <meta.Icon className={`w-5 h-5 ${meta.color}`} />
                    <span className={`text-[11px] font-mono font-bold tracking-wider ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-mono font-extrabold ${meta.color}`}>
                      {verdict.freshnessScore}
                    </span>
                    <span className="text-lg text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">{verdict.qualityGrade}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 border border-slate-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    FSSAI: <strong className={meta.color}>{verdict.fssaiComplianceStatus}</strong>
                  </div>
                </div>

                {/* Per-factor transparency bars */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Why this verdict — weighted sensor factors
                  </div>
                  <FactorBar label="Thermal Envelope (40%)" value={verdict.factors.thermal} icon={<Thermometer className="w-3 h-3 text-teal-400" />} />
                  <FactorBar label="Gas Decay / TVOC (30%)" value={verdict.factors.gasDecay} icon={<Activity className="w-3 h-3 text-amber-400" />} />
                  <FactorBar label="Humidity / Mould Risk (15%)" value={verdict.factors.humidity} icon={<Droplets className="w-3 h-3 text-blue-400" />} />
                  <FactorBar label="Time Elapsed (15%)" value={verdict.factors.timeElapsed} icon={<Clock className="w-3 h-3 text-purple-400" />} />
                  {verdict.factors.ambientPenalty > 0 && (
                    <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1 text-cyan-400 font-medium">
                        <Satellite className="w-3 h-3" /> Satellite ambient penalty
                      </span>
                      <span className="font-mono font-bold text-rose-300">−{verdict.factors.ambientPenalty} pts</span>
                    </div>
                  )}
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Microbial Risk</span>
                    <span className={`font-mono font-bold block mt-0.5 ${meta.color}`}>
                      {verdict.microbialRiskLevel}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Safe Window</span>
                    <span className="font-mono font-bold text-amber-400 block mt-0.5">
                      {verdict.remainingSafeHours} hrs left
                    </span>
                  </div>
                </div>                  {/* Remote-sensing zone snapshot */}
                <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 uppercase tracking-wider">
                    <Satellite className="w-3 h-3" />
                    Satellite Context · {zone.name}
                    {liveFix && (
                      <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
                        <LocateFixed className="w-2.5 h-2.5" /> LIVE GPS
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'NDVI', value: zone.ndvi.toFixed(2), color: classifyVigor(zone.ndvi).color },
                      { label: 'LST', value: `${zone.lstC}°C`, color: 'text-rose-300' },
                      { label: 'Soil', value: `${(zone.soilMoisture * 100).toFixed(0)}%`, color: 'text-blue-300' },
                      { label: 'Rain 7d', value: `${zone.rainfall7dMm}mm`, color: 'text-cyan-300' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-slate-950/70 border border-slate-800 py-1.5">
                        <div className="text-[9px] font-mono text-slate-500">{m.label}</div>
                        <div className={`text-[11px] font-mono font-bold ${m.color}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {zone.stressFlags.length > 0 && (
                    <div className="text-[10px] text-amber-300/90 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      {zone.stressFlags[0]}
                    </div>
                  )}
                </div>

                {/* Sensory notes */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-1">Sensor-Fusion Evaluation:</strong>
                  {verdict.sensoryAnalysisNotes}
                  {result?.narrative && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-start gap-1.5 text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{result.narrative}</span>
                    </div>
                  )}
                </div>

                {/* Recommended channel */}
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-mono block">
                      Recommended Redistribution Channel:
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {verdict.recommendedAction}
                    </span>
                  </div>
                  <Leaf className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="text-[10px] text-slate-600 font-mono text-right">
                  {result?.poweredBy}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
