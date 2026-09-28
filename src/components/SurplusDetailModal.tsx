import React from 'react';
import { DonationBatch, FoodBankPartner, VolunteerDriver } from '../types';
import { 
  X, 
  MapPin, 
  Clock, 
  Thermometer, 
  ShieldCheck, 
  Truck, 
  Building2, 
  Sparkles, 
  Flame, 
  Phone, 
  KeyRound, 
  Leaf,
  FileText
} from 'lucide-react';

interface SurplusDetailModalProps {
  batch: DonationBatch | null;
  foodBanks: FoodBankPartner[];
  drivers: VolunteerDriver[];
  onClose: () => void;
  onClaimBatch: (batchId: string) => void;
  onNavigateBatch: (batch: DonationBatch) => void;
  onOpenTaxSlip: (batch: DonationBatch) => void;
}

export const SurplusDetailModal: React.FC<SurplusDetailModalProps> = ({
  batch,
  foodBanks: _foodBanks,
  drivers: _drivers,
  onClose,
  onClaimBatch,
  onNavigateBatch,
  onOpenTaxSlip,
}) => {
  if (!batch) return null;

  const isCritical = batch.urgency === 'Critical (<1h)';
  const isUrgent = batch.urgency === 'Urgent (<3h)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{batch.city}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">{batch.donorType}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{batch.foodTitle}</h2>
            <div className="text-xs text-slate-300 mt-0.5">Facility: {batch.donorName}</div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 block">Quantity</span>
              <span className="text-lg font-mono font-bold text-white block mt-0.5">
                {batch.quantityKg} <span className="text-xs text-slate-400 font-normal">kg</span>
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 block">Nutritious Meals</span>
              <span className="text-lg font-mono font-bold text-emerald-400 block mt-0.5">
                ~{batch.estimatedMeals}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 block">Core Temp</span>
              <span className="text-lg font-mono font-bold text-teal-400 block mt-0.5">
                {batch.currentStorageTemp}°C
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 block">Safe Window</span>
              <span
                className={`text-lg font-mono font-bold block mt-0.5 ${
                  isCritical ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-slate-200'
                }`}
              >
                {batch.remainingHours > 24
                  ? `${Math.round(batch.remainingHours / 24)}d`
                  : `${batch.remainingHours}h`}
              </span>
            </div>
          </div>

          {/* AI Freshness Diagnostics */}
          {batch.aiAnalysis && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>AI SAFETY EVALUATION & VERDICT</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {batch.aiAnalysis.safetyVerdictSummary}
              </p>

              <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-1.5">
                <span className="font-semibold text-slate-300 block">Handling Requirements:</span>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  {batch.aiAnalysis.foodSafetyGuidelines.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Optimal Recipient: <strong className="text-slate-200">{batch.aiAnalysis.optimalRecipientType}</strong></span>
                <span className="text-emerald-400 font-mono">+{batch.aiAnalysis.co2AvoidedKg} kg CO₂ saved</span>
              </div>
            </div>
          )}

          {/* Restaurant Details, Rider Details & Delivery Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant Details Card */}
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  RESTAURANT / KITCHEN DETAILS
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  {batch.restaurantFSSAI}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Facility Name:</span>
                  <span className="text-white font-semibold">{batch.donorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Chef / Kitchen Manager:</span>
                  <span className="text-slate-200">{batch.restaurantManager}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Loading Bay / Pickup Dock:</span>
                  <span className="text-amber-300 font-mono text-[11px]">
                    {batch.restaurantPickupBay || 'Commercial Loading Bay B'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Phone: <strong className="text-white">{batch.restaurantPhone}</strong>
                </span>
                <a
                  href={`tel:${batch.restaurantPhone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Kitchen</span>
                </a>
              </div>
            </div>

            {/* Rider & Delivery Time Card */}
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" />
                  RIDER DETAILS & DELIVERY TIME
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  ★ {batch.riderRating || 4.9} RIDER
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Assigned Rider:</span>
                    <span className="text-white font-semibold">{batch.assignedDriverName || 'Rameshwar Yadav'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Vehicle:</span>
                    <span className="text-blue-300 font-mono text-[11px]">
                      {batch.riderVehicleNumber || 'DL 1E AA 4082'}
                    </span>
                  </div>
                </div>

                {/* Delivery Time Highlight */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Delivery</span>
                      <span className="text-xs font-bold text-white">
                        {batch.estimatedDeliveryMinutes || 24} mins ({batch.targetDeliveryTime || '15:10 IST'})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {batch.deliveryTimeWindow || '14:45 - 15:30 IST'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Status: <strong className="text-slate-200">{batch.riderLiveStatus || 'En Route to Destination'}</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Rider: <strong className="text-white">{batch.driverPhone || '+91 98118 76543'}</strong>
                </span>
                <a
                  href={`tel:${batch.driverPhone || '+91 98118 76543'}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
              </div>
            </div>
          </div>

          {/* Location & Logistical Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Origin Kitchen Address</span>
              <p className="text-slate-300 leading-relaxed">{batch.location.address}</p>
              <div className="text-slate-400 pt-1">
                Packaging: <strong className="text-slate-200">{batch.packagingType}</strong>
              </div>
              <div className="text-slate-400">
                Dietary: <strong className="text-emerald-400">{batch.isVeg ? '100% Vegetarian' : 'Non-Veg'}</strong>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white block">Redistribution Logistics</span>
              {batch.matchedFoodBankName ? (
                <div>
                  <span className="text-slate-500 block">Matched Food Bank:</span>
                  <span className="text-blue-300 font-medium">{batch.matchedFoodBankName}</span>
                </div>
              ) : (
                <div className="text-slate-400">
                  Ready to auto-match with the closest community kitchen in {batch.city}.
                </div>
              )}

              {batch.targetReceiverAreaName && (
                <div className="pt-1 text-amber-300 font-medium flex items-center gap-1.5">
                  <span className="text-slate-500 block">People in Need:</span>
                  <span>{batch.targetReceiverAreaName}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 text-[11px] font-mono">
                <span>Pickup OTP: <strong className="text-amber-400">{batch.pickupOtp || '4821'}</strong></span>
                <span>Delivery OTP: <strong className="text-blue-400">{batch.deliveryOtp || '8823'}</strong></span>
              </div>
            </div>
          </div>

          {batch.notes && (
            <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <strong className="text-slate-300">Kitchen Notes:</strong> {batch.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onOpenTaxSlip(batch);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>80G CSR Certificate</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNavigateBatch(batch);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Route Guidance</span>
            </button>

            {batch.status === 'available' && (
              <button
                onClick={() => {
                  onClaimBatch(batch.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-colors"
              >
                Claim & Dispatch Courier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
