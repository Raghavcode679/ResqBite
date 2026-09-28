import React, { useState } from 'react';
import { DonationBatch, FoodBankPartner, VolunteerDriver } from '../types';
import { 
  MapPin, 
  Clock, 
  Flame, 
  Thermometer, 
  ShieldCheck, 
  Truck, 
  Building2, 
  Sparkles, 
  FileText, 
  ChevronRight,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Phone
} from 'lucide-react';

interface NearbyDonorsDashboardProps {
  batches: DonationBatch[];
  foodBanks: FoodBankPartner[];
  drivers: VolunteerDriver[];
  selectedCity: string;
  onSelectBatch: (batch: DonationBatch) => void;
  onClaimBatch: (batchId: string, driverId?: string) => void;
  onNavigateBatch: (batch: DonationBatch) => void;
  onOpenTaxSlip: (batch: DonationBatch) => void;
}

export const NearbyDonorsDashboard: React.FC<NearbyDonorsDashboardProps> = ({
  batches,
  foodBanks,
  drivers,
  selectedCity,
  onSelectBatch,
  onClaimBatch,
  onNavigateBatch,
  onOpenTaxSlip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRadius, setSelectedRadius] = useState<string>('15km');
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  // Filter batches
  const availableBatches = batches.filter((b) => {
    if (selectedCity !== 'Pan-India' && b.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.donorName.toLowerCase().includes(q) ||
        b.foodTitle.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== 'All' && b.category !== selectedCategory) return false;
    if (onlyUrgent && !(b.urgency === 'Critical (<1h)' || b.urgency === 'Urgent (<3h)')) return false;
    return true;
  });

  const categories = ['All', 'Cooked Meals', 'Bakery & Grains', 'Packaged Foods', 'Raw Produce / Veg'];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Control Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Nearby Institutional Donors Ready for Pickup
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time surplus inventory from hotels, cafeterias, and food processing plants across{' '}
              <span className="text-emerald-400 font-semibold">{selectedCity}</span>.
            </p>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search donor or dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-48 sm:w-56 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Radius Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <span className="text-slate-500 mr-2 text-[11px]">Radius:</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="5km" className="bg-slate-900">Within 5 km</option>
                <option value="15km" className="bg-slate-900">Within 15 km</option>
                <option value="30km" className="bg-slate-900">Within 30 km</option>
                <option value="city" className="bg-slate-900">Whole City</option>
              </select>
            </div>

            {/* Urgent Perishable Toggle */}
            <button
              onClick={() => setOnlyUrgent(!onlyUrgent)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                onlyUrgent
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-md shadow-rose-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Urgent Only (&lt;3h)</span>
            </button>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Food Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Cards Grid */}
      {availableBatches.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No surplus donations matching filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, changing the city filter, or broadening the distance radius.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableBatches.map((batch) => {
            const isCritical = batch.urgency === 'Critical (<1h)';
            const isUrgent = batch.urgency === 'Urgent (<3h)';
            const isInTransit = batch.status === 'in_transit';
            const isClaimed = batch.status === 'claimed';

            return (
              <div
                key={batch.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:border-slate-700 ${
                  isCritical
                    ? 'border-rose-800/70 bg-gradient-to-b from-rose-950/20 to-slate-900'
                    : isUrgent
                    ? 'border-amber-800/60 bg-gradient-to-b from-amber-950/15 to-slate-900'
                    : isInTransit
                    ? 'border-blue-800/60 bg-gradient-to-b from-blue-950/15 to-slate-900'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Donor & Urgency Line */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <span>{batch.city}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500">{batch.donorType}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                        {batch.donorName}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 font-mono px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800/80 animate-pulse">
                          <Flame className="w-3 h-3" />
                          EXPIRING SOON
                        </span>
                      ) : isUrgent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/80">
                          <Clock className="w-3 h-3" />
                          URGENT
                        </span>
                      ) : isInTransit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800/80">
                          <Truck className="w-3 h-3" />
                          IN TRANSIT ({batch.transitProgress || 50}%)
                        </span>
                      ) : isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 font-mono px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/80">
                          <CheckCircle className="w-3 h-3" />
                          CLAIMED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/80">
                          READY FOR PICKUP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Food Item Title & Key Metrics */}
                  <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-emerald-300 line-clamp-1">
                        {batch.foodTitle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Surplus Weight</span>
                        <span className="font-bold font-mono text-white text-base">
                          {batch.quantityKg} <span className="text-xs text-slate-400 font-normal">kg</span>
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="text-[11px] text-slate-500 block">Meals Rescued</span>
                        <span className="font-bold font-mono text-emerald-400 text-base">
                          ~{batch.estimatedMeals}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Safe Window</span>
                        <span className={`font-bold font-mono text-xs ${isCritical ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-slate-300'}`}>
                          {batch.remainingHours > 24 
                            ? `${Math.round(batch.remainingHours / 24)} days` 
                            : `${batch.remainingHours} hrs left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature & Packaging Spec */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Current: <strong className="text-slate-200">{batch.currentStorageTemp}°C</strong></span>
                    </div>
                    <span className="truncate max-w-[170px] text-slate-400">{batch.packagingType}</span>
                  </div>

                  {/* Restaurant & Rider Quick Details Bar */}
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-[11px]">
                    {/* Restaurant Contact */}
                    <div className="flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-slate-500">Kitchen: </span>
                        <span className="text-slate-200 font-medium">{batch.restaurantManager?.split('(')[0] || 'Chef In-Charge'}</span>
                      </div>
                      <a
                        href={`tel:${batch.restaurantPhone}`}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{batch.restaurantPhone}</span>
                      </a>
                    </div>

                    {/* Rider & Delivery Time */}
                    <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-300 font-medium truncate">
                          <Truck className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate">{batch.assignedDriverName || 'Rider Assigned'}</span>
                        </div>
                        <a
                          href={`tel:${batch.driverPhone || '+91 98118 76543'}`}
                          className="text-blue-400 hover:text-blue-300 font-mono text-[10.5px] flex items-center gap-1 shrink-0"
                          title="Call Assigned Rider"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{batch.driverPhone || '+91 98118 76543'}</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-400 font-mono">
                          Plate: <strong className="text-yellow-300 font-normal">{batch.riderVehicleNumber || 'DL 1E AA 4082'}</strong>
                        </span>
                        <div className="flex items-center gap-1 text-amber-300 font-mono font-bold shrink-0">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>ETA {batch.estimatedDeliveryMinutes || 24}m ({batch.targetDeliveryTime || '15:10'})</span>
                        </div>
                      </div>

                      {batch.deliveryTimeWindow && (
                        <div className="text-[10px] text-slate-500 font-mono text-right">
                          Window: <span className="text-slate-300">{batch.deliveryTimeWindow}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matched Partner (if any) */}
                  {batch.matchedFoodBankName && (
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="text-slate-500">Target Hub:</span>
                      <span className="text-blue-300 font-medium truncate">{batch.matchedFoodBankName}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectBatch(batch)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      AI Analysis
                    </button>

                    <button
                      onClick={() => onNavigateBatch(batch)}
                      className="px-3 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Route Map
                    </button>
                  </div>

                  {batch.status === 'available' ? (
                    <button
                      onClick={() => onClaimBatch(batch.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
                    >
                      <span>Claim & Dispatch Pickup Courier</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : batch.status === 'in_transit' ? (
                    <button
                      onClick={() => onNavigateBatch(batch)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-colors"
                    >
                      <span>Live GPS Route Tracker</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenTaxSlip(batch)}
                      className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>View 80G Tax Exemption Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
