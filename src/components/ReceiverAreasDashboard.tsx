import React, { useState } from 'react';
import { ReceiverArea, DonationBatch, ReceiverCommunityType } from '../types';
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Phone, 
  HeartHandshake, 
  Plus, 
  Search, 
  Send, 
  Truck, 
  Building2, 
  Utensils, 
  CheckCircle2,
  Filter
} from 'lucide-react';

interface ReceiverAreasDashboardProps {
  receiverAreas: ReceiverArea[];
  batches: DonationBatch[];
  selectedCity: string;
  onAddReceiverArea: (newArea: Omit<ReceiverArea, 'id' | 'mealsReceivedToday'>) => void;
  onDispatchToReceiverArea: (batchId: string, receiverAreaId: string) => void;
  onNavigateToReceiverArea: (receiverArea: ReceiverArea) => void;
}

export const ReceiverAreasDashboard: React.FC<ReceiverAreasDashboardProps> = ({
  receiverAreas,
  batches,
  selectedCity,
  onAddReceiverArea,
  onDispatchToReceiverArea,
  onNavigateToReceiverArea,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allocatingAreaId, setAllocatingAreaId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Form states for adding new receiver area
  const [formName, setFormName] = useState('');
  const [formAreaName, setFormAreaName] = useState('');
  const [formCity, setFormCity] = useState(selectedCity === 'Pan-India' ? 'Delhi NCR' : selectedCity);
  const [formAddress, setFormAddress] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formType, setFormType] = useState<ReceiverCommunityType>('Slum Settlement');
  const [formPopulation, setFormPopulation] = useState('500');
  const [formDailyMeals, setFormDailyMeals] = useState('400');
  const [formCoordinator, setFormCoordinator] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDemographics, setFormDemographics] = useState('50% children, daily wage migrant families');
  const [formNotes, setFormNotes] = useState('');

  // Filtered receiver areas
  const filteredAreas = receiverAreas.filter((area) => {
    if (selectedCity !== 'Pan-India' && area.city !== selectedCity) return false;
    if (onlyCritical && area.urgencyLevel !== 'Critical') return false;
    if (selectedType !== 'All' && area.communityType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        area.name.toLowerCase().includes(q) ||
        area.areaName.toLowerCase().includes(q) ||
        area.city.toLowerCase().includes(q) ||
        area.demographicFocus.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live summary stats
  const totalPopulation = filteredAreas.reduce((sum, a) => sum + a.populationEstimate, 0);
  const totalNeeded = filteredAreas.reduce((sum, a) => sum + a.dailyMealsNeeded, 0);
  const totalReceived = filteredAreas.reduce((sum, a) => sum + a.mealsReceivedToday, 0);
  const totalDeficit = Math.max(0, totalNeeded - totalReceived);

  // Available batches for allocation
  const availableBatches = batches.filter((b) => b.status === 'available');

  const handleSubmitNewArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAddress || !formPhone) return;

    onAddReceiverArea({
      name: formName,
      areaName: formAreaName || formName,
      city: formCity,
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: formAddress,
        city: formCity,
        state: 'India',
        pincode: '110001',
      },
      communityType: formType,
      populationEstimate: Number(formPopulation) || 500,
      dailyMealsNeeded: Number(formDailyMeals) || 400,
      urgencyLevel: 'High',
      preferredDietary: 'Cooked Hot Meals',
      communityCoordinator: formCoordinator,
      phone: formPhone,
      distributionPointLandmark: formLandmark || formAddress,
      demographicFocus: formDemographics,
      notes: formNotes,
    });

    setShowAddModal(false);
    setFormName('');
    setFormAreaName('');
    setFormAddress('');
    setFormLandmark('');
    setFormCoordinator('');
    setFormPhone('');
    setFormNotes('');
  };

  const communityTypes = [
    'All',
    'Slum Settlement',
    'Night Shelter / Destitute Home',
    'Daily Wage Labor Camp',
    'Orphanage / Children Care',
    'Elderly Care Shelter',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Hunger Deficit Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Beneficiary Communities & Receiver Locations (People in Need)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active hunger hotspots, slum resettlement clusters, homeless shelters, and labor camps requiring meal deliveries in{' '}
              <span className="text-amber-400 font-semibold">{selectedCity}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/40 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Community in Need</span>
            </button>
          </div>
        </div>

        {/* Global Deficit Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block">People Monitored</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {totalPopulation.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Daily Meals Required</span>
            <span className="text-xl font-bold font-mono text-slate-200 mt-0.5 block">
              {totalNeeded.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 block">Meals Supplied Today</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {totalReceived.toLocaleString()}
            </span>
          </div>

          <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/60">
            <span className="text-[11px] text-amber-300 font-semibold block">Remaining Hunger Deficit</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
              -{totalDeficit.toLocaleString()} <span className="text-xs font-normal text-amber-200">meals</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search community or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-48 sm:w-60 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setOnlyCritical(!onlyCritical)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyCritical
                ? 'bg-rose-950 border-rose-600 text-rose-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Critical Deficit Only</span>
          </button>
        </div>

        {/* Community Type Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {communityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                selectedType === type
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Receiver Areas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAreas.map((area) => {
          const deficit = Math.max(0, area.dailyMealsNeeded - area.mealsReceivedToday);
          const fulfilledPct = Math.min(
            100,
            Math.round((area.mealsReceivedToday / area.dailyMealsNeeded) * 100)
          );
          const isCritical = area.urgencyLevel === 'Critical';

          return (
            <div
              key={area.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl ${
                isCritical
                  ? 'border-rose-800/80 bg-gradient-to-b from-rose-950/20 to-slate-900'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <span>{area.city}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400/90">{area.communityType}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                      {area.name}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    ● {area.urgencyLevel.toUpperCase()}
                  </span>
                </div>

                {/* Sub-area and Landmark */}
                <div className="text-xs text-slate-300 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{area.distributionPointLandmark}</span>
                </div>

                {/* Demographics Pill Note */}
                <div className="mt-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Demographic Focus:</strong> {area.demographicFocus}
                </div>

                {/* Meal Deficit & Fulfillment Progress */}
                <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Today's Meal Fulfillment</span>
                    <span className="font-mono font-bold text-white">
                      {area.mealsReceivedToday} / {area.dailyMealsNeeded}{' '}
                      <span className="text-slate-500 text-[11px] font-normal">meals</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        fulfilledPct < 40 ? 'bg-rose-500' : fulfilledPct < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${fulfilledPct}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{fulfilledPct}% supplied</span>
                    <span className="text-rose-400 font-bold">
                      Deficit: -{deficit} meals needed
                    </span>
                  </div>
                </div>

                {/* Coordinator & NGO */}
                <div className="mt-3 text-xs flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Community Pradhan / Contact</span>
                    <span className="text-slate-200 font-medium">{area.communityCoordinator}</span>
                  </div>

                  <a
                    href={`tel:${area.phone}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Call</span>
                  </a>
                </div>

                {area.operatingNGO && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-slate-500">Partner:</span>
                    <span className="text-blue-300 truncate">{area.operatingNGO}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
                {allocatingAreaId === area.id ? (
                  <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-amber-900/50">
                    <span className="text-[11px] text-amber-300 font-semibold block">
                      Select Available Surplus to Dispatch Here:
                    </span>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none"
                    >
                      <option value="">-- Choose Food Surplus Batch --</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.foodTitle} ({b.quantityKg}kg · ~{b.estimatedMeals} meals)
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedBatchId) {
                            onDispatchToReceiverArea(selectedBatchId, area.id);
                            setAllocatingAreaId(null);
                            setSelectedBatchId('');
                          }
                        }}
                        disabled={!selectedBatchId}
                        className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold"
                      >
                        Confirm Dispatch
                      </button>
                      <button
                        onClick={() => {
                          setAllocatingAreaId(null);
                          setSelectedBatchId('');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAllocatingAreaId(area.id)}
                      className="py-2.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Surplus</span>
                    </button>

                    <button
                      onClick={() => onNavigateToReceiverArea(area)}
                      className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Route Driver</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Receiver Area Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Register New Community in Need / Receiver Area
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmitNewArea} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Community / Area Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yamuna Khadar Basti Cluster #4"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Community Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ReceiverCommunityType)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Slum Settlement">Slum Settlement</option>
                    <option value="Night Shelter / Destitute Home">Night Shelter / Destitute Home</option>
                    <option value="Daily Wage Labor Camp">Daily Wage Labor Camp</option>
                    <option value="Orphanage / Children Care">Orphanage / Children Care</option>
                    <option value="Elderly Care Shelter">Elderly Care Shelter</option>
                    <option value="Hospital Patient Attendant Center">Hospital Patient Attendant Center</option>
                    <option value="Disaster Relief Camp">Disaster Relief Camp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Distribution Point Landmark & Directions
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opposite Community Handpump, Near DND Loop"
                  value={formLandmark}
                  onChange={(e) => setFormLandmark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Population Estimate
                  </label>
                  <input
                    type="number"
                    min="20"
                    step="10"
                    value={formPopulation}
                    onChange={(e) => setFormPopulation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daily Meals Needed
                  </label>
                  <input
                    type="number"
                    min="20"
                    step="10"
                    value={formDailyMeals}
                    onChange={(e) => setFormDailyMeals(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Coordinator / Pradhan Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kishan Lal"
                    value={formCoordinator}
                    onChange={(e) => setFormCoordinator(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98110 XXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Demographic Breakdown (e.g. children, elderly, migrant families)
                </label>
                <input
                  type="text"
                  value={formDemographics}
                  onChange={(e) => setFormDemographics(e.target.value)}
                  placeholder="e.g. 50% children under 12, daily wage farm hands"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Urgent Notes or Diet Preferences
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Hot cooked dinner preferred between 19:30 - 20:30"
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-950/40"
                >
                  Register Receiver Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
