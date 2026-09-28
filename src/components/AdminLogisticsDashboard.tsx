import React, { useState } from 'react';
import { DonationBatch, FoodBankPartner, VolunteerDriver } from '../types';
import { 
  ShieldCheck, 
  Truck, 
  Building2, 
  Clock, 
  ThermometerSnowflake, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Search,
  Filter,
  Users,
  Phone
} from 'lucide-react';

interface AdminLogisticsDashboardProps {
  batches: DonationBatch[];
  partners: FoodBankPartner[];
  drivers: VolunteerDriver[];
  selectedCity: string;
  onUpdateBatchStatus: (batchId: string, status: DonationBatch['status']) => void;
}

export const AdminLogisticsDashboard: React.FC<AdminLogisticsDashboardProps> = ({
  batches,
  partners,
  drivers,
  selectedCity,
  onUpdateBatchStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    if (selectedCity !== 'Pan-India' && b.city !== selectedCity) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.donorName.toLowerCase().includes(q) ||
        b.foodTitle.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live stats
  const activeTripsCount = batches.filter((b) => b.status === 'in_transit').length;
  const claimedCount = batches.filter((b) => b.status === 'claimed').length;
  const availableCount = batches.filter((b) => b.status === 'available').length;
  const availableDriversCount = drivers.filter((d) => d.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Logistics Command & Fleet Operations Center
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supervising real-time food surplus transit velocity, cold chain integrity, and partner distribution across{' '}
              <span className="text-amber-400 font-semibold">{selectedCity}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Average Pickup Time: 21m
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
              Cold Chain Compliance: 99.4%
            </span>
          </div>
        </div>
      </div>

      {/* Operational Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>In-Transit Active Fleet</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">{activeTripsCount}</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Live vehicle GPS active</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Available Surplus</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{availableCount}</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Awaiting driver claim</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ready Courier Couriers</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {availableDriversCount} <span className="text-xs text-slate-400 font-normal">/ {drivers.length}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Within metro corridors</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Registered Partners</span>
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{partners.length}</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Verified NGOs & pantries</span>
        </div>
      </div>

      {/* Live Dispatches Table & Supervisor Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Dispatches & Cargo Pipeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervise status updates, dispatch re-routes, and emergency cold chain protocols.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dispatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 w-44 sm:w-56 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Restaurant / Kitchen Details</th>
                <th className="p-3">Surplus Food</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Courier Rider & Phone</th>
                <th className="p-3">Delivery Time & Destination</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-medium text-white">
                    <div className="font-semibold text-slate-100">{batch.donorName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{batch.restaurantManager}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <a
                        href={`tel:${batch.restaurantPhone}`}
                        className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{batch.restaurantPhone}</span>
                      </a>
                      <span className="text-slate-600">·</span>
                      <span className="text-[10px] text-slate-400 font-mono">{batch.city}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-200">
                    <div className="font-medium text-emerald-300">{batch.foodTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Temp: {batch.currentStorageTemp}°C · {batch.packagingType}</div>
                    <div className={`text-[10px] font-mono font-bold mt-1 ${
                      batch.urgency === 'Critical (<1h)'
                        ? 'text-rose-400'
                        : batch.urgency === 'Urgent (<3h)'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {batch.urgency}
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">
                    {batch.quantityKg} kg
                    <span className="text-[10px] text-slate-500 font-normal block">
                      ~{batch.estimatedMeals} meals
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {batch.assignedDriverName ? (
                      <div>
                        <div className="flex items-center gap-1 font-semibold text-blue-300">
                          <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{batch.assignedDriverName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <a
                            href={`tel:${batch.driverPhone || '+91 98118 76543'}`}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{batch.driverPhone || '+91 98118 76543'}</span>
                          </a>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Plate: <span className="text-yellow-300 font-medium">{batch.riderVehicleNumber || 'DL 1E AA 4082'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No Rider Assigned</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">
                    <div className="text-blue-300 font-medium line-clamp-1">
                      {batch.targetReceiverAreaName || batch.matchedFoodBankName || `${batch.city} Redistribution`}
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>ETA: {batch.estimatedDeliveryMinutes || 25}m ({batch.targetDeliveryTime || '15:10 IST'})</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Window: {batch.deliveryTimeWindow || '14:45 - 15:30 IST'}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        batch.status === 'in_transit'
                          ? 'bg-blue-950 text-blue-400 border-blue-800'
                          : batch.status === 'delivered'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : batch.status === 'claimed'
                          ? 'bg-purple-950 text-purple-400 border-purple-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {batch.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {batch.status === 'available' && (
                        <button
                          onClick={() => onUpdateBatchStatus(batch.id, 'claimed')}
                          className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 text-[11px] font-semibold"
                        >
                          Auto-Assign
                        </button>
                      )}
                      {batch.status === 'claimed' && (
                        <button
                          onClick={() => onUpdateBatchStatus(batch.id, 'in_transit')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-[11px] font-semibold"
                        >
                          Dispatch
                        </button>
                      )}
                      {batch.status === 'in_transit' && (
                        <button
                          onClick={() => onUpdateBatchStatus(batch.id, 'delivered')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-[11px] font-semibold"
                        >
                          Force Delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pan-India Operational Clusters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Pan-India Metro Redistribution Hubs</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { city: 'Delhi NCR', hubs: 3, capacity: '4,000 meals/day', status: 'Optimal' },
            { city: 'Bengaluru', hubs: 2, capacity: '4,800 meals/day', status: 'Optimal' },
            { city: 'Mumbai', hubs: 3, capacity: '5,500 meals/day', status: 'High Intake' },
            { city: 'Hyderabad', hubs: 2, capacity: '3,500 meals/day', status: 'Optimal' },
            { city: 'Pune', hubs: 1, capacity: '1,800 meals/day', status: 'Optimal' },
            { city: 'Chennai', hubs: 2, capacity: '2,200 meals/day', status: 'Optimal' },
            { city: 'Kolkata', hubs: 1, capacity: '1,600 meals/day', status: 'Optimal' },
            { city: 'Ahmedabad', hubs: 1, capacity: '2,000 meals/day', status: 'Optimal' },
          ].map((hub) => (
            <div key={hub.city} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-bold text-white font-sans text-xs">{hub.city}</div>
              <div className="text-[11px] text-slate-400 mt-1">{hub.capacity}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">● {hub.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
