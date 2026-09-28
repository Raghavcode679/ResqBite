import React, { useState } from 'react';
import { 
  Building2, 
  Cpu, 
  Zap, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Factory,
  ArrowUpRight,
  ShieldCheck,
  Recycle
} from 'lucide-react';

export const MICIndustrialAudit: React.FC = () => {
  const [plantName, setPlantName] = useState('Haldiram Snacks & Processing Hub - Line 4');
  const [lineType, setLineType] = useState('Flour Extrusion & Continuous Frying');
  const [inputTons, setInputTons] = useState<number>(24);
  const [yieldPct, setYieldPct] = useState<number>(82);
  const [energyKwh, setEnergyKwh] = useState<number>(340);
  const [downtimeHours, setDowntimeHours] = useState<number>(1.8);
  const [isAuditing, setIsAuditing] = useState(false);

  // No preset data: the audit panel stays empty until a real run completes.
  const [auditResult, setAuditResult] = useState<{
    processEfficiencyScore: number;
    rawMaterialLossTons: number;
    financialLossInr: number;
    overproductionRiskScore: number;
    energyExcessPercentage: number;
    rootCauseDiagnoses: string[];
    leanInterventions: string[];
  } | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditedAt, setAuditedAt] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/gemini/industrial-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName,
          lineType,
          dailyRawInputTons: inputTons,
          yieldPercentage: yieldPct,
          energyKwhPerTon: energyKwh,
          machineDowntimeHours: downtimeHours,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || `Audit service responded with ${res.status}`);
      }
      setAuditResult(json.data);
      setAuditedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Audit failed:', e);
      setAuditResult(null);
      setAuditError(
        e instanceof Error
          ? e.message
          : 'Audit engine unreachable. Check the API server and try again.'
      );
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                MIC HACKATHON · PROBLEM STATEMENT 5 & 6
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                INDUSTRIAL IOT & LEAN AGRI-PROCESSING
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 flex items-center gap-2">
              <Factory className="w-5 h-5 text-purple-400" />
              Food Processing Operational Efficiency & Waste Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring of raw material losses, machine downtime, and energy overconsumption across food processing units.
            </p>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAuditing ? 'Auditing Industrial Telemetry...' : 'Run Processing Efficiency Audit'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Industrial Plant Inputs */}
        <div className="space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Processing Plant & Line Configuration
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Processing Plant Facility
              </label>
              <select
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
              >
                <option value="Haldiram Snacks & Processing Hub - Line 4">Haldiram Snacks & Processing Hub - Line 4</option>
                <option value="Tata Motors Hinjewadi Campus Central Processing Mess">Tata Motors Hinjewadi Campus Central Processing Mess</option>
                <option value="Amity Central Food Processing Kitchen - Noida">Amity Central Food Processing Kitchen - Noida</option>
                <option value="ITC Grand Central Prep & Pre-cook Commissary">ITC Grand Central Prep & Pre-cook Commissary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Processing Line Type
              </label>
              <select
                value={lineType}
                onChange={(e) => setLineType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-purple-500 focus:outline-none"
              >
                <option value="Flour Extrusion & Continuous Frying">Flour Extrusion & Continuous Frying</option>
                <option value="Vegetable Peeling, Slicing & Blast Chilling">Vegetable Peeling, Slicing & Blast Chilling</option>
                <option value="Retort Cooking & Vacuum Pouch Sealing">Retort Cooking & Vacuum Pouch Sealing</option>
                <option value="Bakery Dough Mixing & Tunnel Oven Baking">Bakery Dough Mixing & Tunnel Oven Baking</option>
              </select>
            </div>

            {/* Daily Throughput */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Daily Raw Input Weight</span>
                <span className="font-mono font-bold text-white">{inputTons} Tons</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={inputTons}
                onChange={(e) => setInputTons(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Yield Percentage */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Processing Yield (% of Input)</span>
                <span className="font-mono font-bold text-emerald-400">{yieldPct}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="98"
                step="1"
                value={yieldPct}
                onChange={(e) => setYieldPct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Loss / Trim Rate: {100 - yieldPct}%
              </div>
            </div>

            {/* Machine Downtime */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Unplanned Machine Downtime</span>
                <span className="font-mono font-bold text-rose-400">{downtimeHours} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.2"
                value={downtimeHours}
                onChange={(e) => setDowntimeHours(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Center & Right Columns: Audit Analytics & Interventions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Error banner — surfaced from the API instead of console-only */}
          {auditError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300 block">Efficiency audit failed</span>
                <span className="text-rose-200/90">{auditError}</span>
              </div>
            </div>
          )}

          {/* Idle state — no fake preset telemetry before the first real run */}
          {!auditResult && !auditError && (
            <div className="bg-slate-900/90 border border-dashed border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center py-14 text-center">
              <Factory className="w-8 h-8 text-purple-400/60 mb-3" />
              <span className="text-sm font-semibold text-slate-300">No audit telemetry yet</span>
              <span className="text-xs text-slate-500 mt-1 max-w-xs">
                Configure the plant, line, and daily throughput on the left, then run the audit — root-cause
                diagnoses and lean interventions are computed live for your exact inputs.
              </span>
            </div>
          )}

          {auditResult && (
            <>
              {/* Top Key KPI Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-500 block">Line Efficiency</span>
                  <span className="text-2xl font-bold font-mono text-purple-400 mt-0.5 block">
                    {auditResult.processEfficiencyScore}%
                  </span>
                  <span className="text-[10px] text-slate-400">OEE Performance</span>
                </div>

                <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-2xl text-center">
                  <span className="text-[11px] text-rose-300 font-semibold block">Raw Material Loss</span>
                  <span className="text-2xl font-bold font-mono text-rose-400 mt-0.5 block">
                    {auditResult.rawMaterialLossTons} <span className="text-xs font-normal">Tons</span>
                  </span>
                  <span className="text-[10px] text-rose-300/80">Cull / trim scrap</span>
                </div>

                <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-2xl text-center">
                  <span className="text-[11px] text-amber-300 font-semibold block">Financial Scrap Loss</span>
                  <span className="text-2xl font-bold font-mono text-amber-400 mt-0.5 block">
                    ₹{(auditResult.financialLossInr / 1000).toFixed(1)}k
                  </span>
                  <span className="text-[10px] text-amber-300/80">Daily cost leak</span>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-500 block">Energy Excess</span>
                  <span className="text-2xl font-bold font-mono text-teal-400 mt-0.5 block">
                    +{auditResult.energyExcessPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400">Over ISO 50001</span>
                </div>
              </div>

              {/* Inefficiency Root Causes Diagnostic */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    AI Root-Cause Inefficiency Diagnoses
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Continuous IoT Telemetry Analysis
                  </span>
                </div>

                <div className="space-y-2">
                  {auditResult.rootCauseDiagnoses.map((cause, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lean Interventions & Secondary Byproduct Upcycling */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Recycle className="w-4 h-4" />
                    Lean Interventions & Secondary Byproduct Recovery
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Circular Economy Value Loop
                  </span>
                </div>

                <div className="space-y-2">
                  {auditResult.leanInterventions.map((lean, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{lean}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
