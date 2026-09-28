import React, { useState } from 'react';
import { FoodCategory, DonationBatch, AIAnalysisResult } from '../types';
import { 
  ChefHat, 
  Sparkles, 
  Clock, 
  Thermometer, 
  Flame, 
  Leaf, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Scale
} from 'lucide-react';

interface DonorSurplusFormProps {
  currentDonorName: string;
  currentCity: string;
  onSubmitBatch: (newBatch: Omit<DonationBatch, 'id' | 'createdAt' | 'remainingHours'>) => void;
}

export const DonorSurplusForm: React.FC<DonorSurplusFormProps> = ({
  currentDonorName,
  currentCity,
  onSubmitBatch,
}) => {
  const [foodTitle, setFoodTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked Meals');
  const [quantityKg, setQuantityKg] = useState('85');
  const [prepTime, setPrepTime] = useState('1 hour ago');
  const [storageTemp, setStorageTemp] = useState('68');
  const [packagingType, setPackagingType] = useState<DonationBatch['packagingType']>('Stainless Steel Insulated Urns');
  const [isVeg, setIsVeg] = useState(true);
  const [notes, setNotes] = useState('');

  // Restaurant details state
  const [restaurantPhone, setRestaurantPhone] = useState('+91 124 498 7654');
  const [restaurantManager, setRestaurantManager] = useState('Chef Vikram Oberoi (Executive Sous Chef)');
  const [restaurantFSSAI, setRestaurantFSSAI] = useState('FSSAI #10819003000214');
  const [restaurantPickupBay, setRestaurantPickupBay] = useState('Commercial Loading Bay B, Door 4');

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleRunAiAnalysis = async () => {
    if (!foodTitle) {
      setAiError('Please enter the food title first.');
      return;
    }

    setAiError('');
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/gemini/analyze-surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: foodTitle,
          category,
          quantityKg: Number(quantityKg) || 50,
          prepTime,
          storageTemp: `${storageTemp}°C`,
          notes,
        }),
      });

      const json = await res.json();
      if (json.data) {
        setAiResult(json.data);
      } else {
        setAiError(json.error || 'Failed to complete AI analysis');
      }
    } catch (e: any) {
      setAiError(e.message || 'Error communicating with analysis service');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodTitle || !quantityKg) return;

    const qty = Number(quantityKg) || 50;
    const isCooked = category === 'Cooked Meals';
    const remainingH = aiResult ? aiResult.remainingShelfLifeHours : isCooked ? 2.5 : 24.0;
    const urgency =
      remainingH <= 1.5
        ? 'Critical (<1h)'
        : remainingH <= 3.5
        ? 'Urgent (<3h)'
        : remainingH <= 8
        ? 'Moderate (<6h)'
        : 'Standard (<24h)';

    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    onSubmitBatch({
      donorId: 'current-donor',
      donorName: currentDonorName || 'ITC Grand Bharat Banquet Kitchens',
      donorType: '5-Star Hotel Banquet',
      city: currentCity === 'Pan-India' ? 'Delhi NCR' : currentCity,
      location: {
        lat: 28.3802,
        lng: 76.9856,
        address: 'P.O. Hasanpur, Tauru, Gurugram NCR',
        city: currentCity === 'Pan-India' ? 'Delhi NCR' : currentCity,
        state: 'Haryana',
        pincode: '122105',
      },
      foodTitle,
      category,
      quantityKg: qty,
      // Restaurant Details
      restaurantPhone,
      restaurantManager,
      restaurantFSSAI,
      restaurantPickupBay,

      // Rider Details & Delivery Time Defaults
      assignedDriverName: 'Rameshwar Yadav (EV Fleet #4082)',
      driverPhone: '+91 98118 76543',
      riderRating: 4.9,
      riderVehicleNumber: 'DL 1E AA 4082',
      riderLiveStatus: 'Auto-dispatched to Kitchen',
      vehicleType: 'EV Cargo Van (Insulated)',
      estimatedDeliveryMinutes: 25,
      targetDeliveryTime: 'Within 45 mins',
      deliveryTimeWindow: 'Immediate Dispatch Window',

      estimatedMeals: aiResult ? aiResult.estimatedMealsCount : Math.round(qty * 2.8),
      preparedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      expiresAt: new Date(Date.now() + remainingH * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
      storageTempRequired: Number(storageTemp) > 50 ? 'Maintain above 65°C' : 'Maintain chilled below 5°C',
      currentStorageTemp: Number(storageTemp) || 65,
      isVeg,
      packagingType,
      urgency,
      status: 'available',
      pickupOtp,
      deliveryOtp,
      aiAnalysis: aiResult || undefined,
      notes,
    });

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setFoodTitle('');
      setNotes('');
      setAiResult(null);
    }, 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Post Institutional Surplus Batch
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logging facility: <strong className="text-slate-200">{currentDonorName}</strong> ({currentCity})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FSSAI Compliant · Instant Broadcast</span>
        </div>
      </div>

      {submittedSuccess ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Surplus Batch Successfully Broadcast!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Nearby volunteer couriers and food banks have received automated pickup notifications. You can track progress in real time.
          </p>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Food Name / Banquet Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabadi Paneer Biryani, Dal Makhani & Whole Wheat Phulkas"
                value={foodTitle}
                onChange={(e) => setFoodTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Cooked Meals">Cooked Meals (High Urgency)</option>
                <option value="Bakery & Grains">Bakery & Grains</option>
                <option value="Packaged Foods">Packaged Foods</option>
                <option value="Dairy & Perishables">Dairy & Perishables</option>
                <option value="Raw Produce / Veg">Raw Produce / Veg</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quantity (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="5"
                  step="5"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Core Temp
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={storageTemp}
                  onChange={(e) => setStorageTemp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  °C
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Preparation Time
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 1 hour ago"
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Packaging Type
              </label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Stainless Steel Insulated Urns">Stainless Steel Insulated Urns</option>
                <option value="Tamper-evident Foil Trays">Tamper-evident Foil Trays</option>
                <option value="Crates">Crates</option>
                <option value="Aseptic Boxes">Aseptic Boxes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Handling Instructions, Allergens & Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Contains dairy & cashews. Kept in steam table until packed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-3 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* AI Pre-Check Action Panel */}
          <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Gemini Shelf-Life & Spoilage Pre-Check
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Predict safe consumption window and recipient allocation prior to courier broadcast.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-emerald-900/60 transition-colors flex items-center gap-2 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Thermal Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Safety Diagnostics</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-rose-400 mt-2">{aiError}</p>
            )}

            {/* AI Diagnostics Output Card */}
            {aiResult && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Remaining Shelf-Life</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {aiResult.remainingShelfLifeHours} hours
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Risk Evaluation</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        aiResult.riskLevel === 'Critical'
                          ? 'text-rose-400'
                          : aiResult.riskLevel === 'High'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {aiResult.riskLevel}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">Nutritious Meals</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ~{aiResult.estimatedMealsCount}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">CO₂ Diversion</span>
                    <span className="font-mono font-bold text-teal-400 text-sm">
                      {aiResult.co2AvoidedKg} kg
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-300">
                  <strong className="text-white">Safety Verdict:</strong> {aiResult.safetyVerdictSummary}
                </div>
              </div>
            )}
          </div>

          {/* Form Submit Strip */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Surplus Pickup Alert</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
