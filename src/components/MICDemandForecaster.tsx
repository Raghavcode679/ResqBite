import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  Scale, 
  TrendingDown, 
  IndianRupee, 
  ChefHat, 
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const MICDemandForecaster: React.FC = () => {
  const [facilityType, setFacilityType] = useState('Corporate IT Park Cafeteria');
  const [attendance, setAttendance] = useState<number>(1400);
  const [dayOfWeek, setDayOfWeek] = useState('Wednesday');
  const [mealSlot, setMealSlot] = useState('Lunch (12:30 - 15:00)');
  const [menuType, setMenuType] = useState('North & South Indian Balanced Combo');
  const [pastWasteRate, setPastWasteRate] = useState('14%');
  const [isGenerating, setIsGenerating] = useState(false);

  // No preset data: results render only after a real AI / heuristic run,
  // so the panel can never show stale numbers.
  const [forecastResult, setForecastResult] = useState<{
    predictedDiners: number;
    recommendedTotalKg: number;
    componentBreakdown: { name: string; recommendedKg: number; portionPerPersonGrams: number }[];
    overproductionRiskPct: number;
    preventedSurplusKg: number;
    costSavingsInr: number;
    operationalAdvice: string[];
  } | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleRunForecast = async () => {
    setIsGenerating(true);
    setForecastError(null);
    try {
      const res = await fetch('/api/gemini/forecast-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityType,
          expectedAttendance: attendance,
          dayOfWeek,
          mealSlot,
          menuType,
          pastWasteRate,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || `Forecast service responded with ${res.status}`);
      }
      setForecastResult(json.data);
      setGeneratedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Demand forecasting failed:', e);
      setForecastResult(null);
      setForecastError(
        e instanceof Error
          ? e.message
          : 'Forecast engine unreachable. Check the API server and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top MIC Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                MIC HACKATHON · AGRI-FOODTECH
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                SDG 12.3 SOURCE REDUCTION
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              AI Food Demand Forecasting & Production Sizing Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Predictive kitchen analytics using historical consumption patterns to eliminate overproduction waste before food is cooked.
            </p>
          </div>

          <button
            onClick={handleRunForecast}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Running Gemini Forecast Model...' : 'Calculate Optimal Batch Sizing'}</span>
          </button>
        </div>
      </div>

      {/* Input Parameters Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Institutional Facility Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Type</label>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Corporate IT Park Cafeteria">Corporate IT Park Cafeteria</option>
              <option value="University Central Mess & Hostel">University Central Mess & Hostel</option>
              <option value="5-Star Hotel Banquet & Dining">5-Star Hotel Banquet & Dining</option>
              <option value="Food Processing Staff Canteen">Food Processing Staff Canteen</option>
              <option value="Hospital Inpatient & Attendant Mess">Hospital Inpatient & Attendant Mess</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
              <span>Expected Headcount / Footfall</span>
              <span className="font-mono text-emerald-400 font-bold">{attendance} diners</span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="50"
              value={attendance}
              onChange={(e) => setAttendance(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>200</span>
              <span>2,500</span>
              <span>5,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2 focus:outline-none"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday (Hybrid)</option>
                <option value="Saturday">Saturday (Banquet)</option>
                <option value="Sunday">Sunday (Events)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meal Service Slot</label>
              <select
                value={mealSlot}
                onChange={(e) => setMealSlot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2 focus:outline-none"
              >
                <option value="Lunch (12:30 - 15:00)">Lunch (12:30 - 15:00)</option>
                <option value="Dinner (19:30 - 22:30)">Dinner (19:30 - 22:30)</option>
                <option value="Breakfast (07:30 - 10:00)">Breakfast (07:30 - 10:00)</option>
                <option value="Midnight Shift (00:00 - 03:00)">Midnight Shift (00:00 - 03:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prediction Results Center Column */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. AI Predicted Consumption & Waste Mitigation
              </h3>
              <span className="text-xs text-slate-300 font-semibold">
                Optimization Profile: {facilityType} ({dayOfWeek}, {mealSlot})
                {generatedAt && (
                  <span className="text-slate-500 font-mono"> · computed {generatedAt}</span>
                )}
              </span>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Overproduction Risk: {forecastResult ? `${forecastResult.overproductionRiskPct}%` : '—'}
            </span>
          </div>

          {/* Error banner — surfaced from the API instead of console-only */}
          {forecastError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300 block">Forecast run failed</span>
                <span className="text-rose-200/90">{forecastError}</span>
              </div>
            </div>
          )}

          {/* Idle state — no fake preset numbers before the first real run */}
          {!forecastResult && !forecastError && (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
              <Sparkles className="w-8 h-8 text-emerald-500/60 mb-3" />
              <span className="text-sm font-semibold text-slate-300">No forecast generated yet</span>
              <span className="text-xs text-slate-500 mt-1 max-w-xs">
                Set the facility parameters on the left, then run the engine — the Gemini model computes live
                batch sizing for your exact inputs (deterministic fallback if the API is offline).
              </span>
            </div>
          )}

          {forecastResult && (
            <>
              {/* Key Impact Forecast Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 block">Diners Expected</span>
                  <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                    {forecastResult.predictedDiners}
                  </span>
                  <span className="text-[10px] text-slate-400">88% turnstile yield</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 block">Total Prep Weight</span>
                  <span className="text-lg font-mono font-bold text-blue-400 mt-0.5 block">
                    {forecastResult.recommendedTotalKg} <span className="text-xs font-normal">kg</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Net cooked output</span>
                </div>

                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-center">
                  <span className="text-[11px] text-emerald-300 font-semibold block">Prevented Surplus</span>
                  <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                    -{forecastResult.preventedSurplusKg} <span className="text-xs font-normal">kg</span>
                  </span>
                  <span className="text-[10px] text-emerald-300/80">Saved at source</span>
                </div>

                <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 text-center">
                  <span className="text-[11px] text-amber-300 font-semibold block">Procurement Savings</span>
                  <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">
                    ₹{forecastResult.costSavingsInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-amber-300/80">Per service session</span>
                </div>
              </div>

              {/* Exact Component Batch Weights Table */}
              <div>
                <span className="text-xs font-bold text-white block mb-2">
                  Precision Dish Batch Sizing (Avoid Buffer Overcook)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Menu Component</th>
                        <th className="p-2.5">Recommended Prep Weight</th>
                        <th className="p-2.5">Portion / Diner</th>
                        <th className="p-2.5 text-right">Production Phase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {forecastResult.componentBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-sans font-medium text-white">{item.name}</td>
                          <td className="p-2.5 font-bold text-emerald-400">{item.recommendedKg} kg</td>
                          <td className="p-2.5 text-slate-300">{item.portionPerPersonGrams} g</td>
                          <td className="p-2.5 text-right text-slate-400 font-sans">
                            {idx < 2 ? 'Phase 1 (65% at 12:00)' : 'Phase 2 (35% at 13:30)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Operational Guidance */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" />
                  AI Production Planning Recommendations
                </span>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {forecastResult.operationalAdvice.map((advice, i) => (
                    <li key={i}>{advice}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
