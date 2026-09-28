import React, { useState } from 'react';
import { FoodBankPartner, DonationBatch } from '../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  ThermometerSnowflake, 
  Plus, 
  CheckCircle2, 
  Search, 
  Users,
  ShieldCheck,
  Send
} from 'lucide-react';

interface PartnerManagementProps {
  partners: FoodBankPartner[];
  batches: DonationBatch[];
  selectedCity: string;
  onAddPartner: (partner: Omit<FoodBankPartner, 'id' | 'activeDeliveriesCount' | 'rating'>) => void;
  onSelectPartner: (partner: FoodBankPartner) => void;
  onAssignSurplusToPartner: (batchId: string, partnerId: string) => void;
}

export const PartnerManagement: React.FC<PartnerManagementProps> = ({
  partners,
  batches,
  selectedCity,
  onAddPartner,
  onSelectPartner,
  onAssignSurplusToPartner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBatchToAssign, setSelectedBatchToAssign] = useState<string>('');
  const [assigningPartnerId, setAssigningPartnerId] = useState<string | null>(null);

  // Form states for adding a partner
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<FoodBankPartner['type']>('NGO Food Bank');
  const [formCity, setFormCity] = useState(selectedCity === 'Pan-India' ? 'Delhi NCR' : selectedCity);
  const [formAddress, setFormAddress] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCapacity, setFormCapacity] = useState('2000');
  const [formHasColdStorage, setFormHasColdStorage] = useState(true);
  const [formHours, setFormHours] = useState('24/7 Operations');

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    if (selectedCity !== 'Pan-India' && p.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.contactPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableBatches = batches.filter((b) => b.status === 'available');

  const handleSubmitNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAddress || !formPhone) return;

    onAddPartner({
      name: formName,
      type: formType,
      city: formCity,
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: formAddress,
        city: formCity,
        state: 'India',
        pincode: '110001',
      },
      contactPerson: formContactPerson,
      phone: formPhone,
      dailyCapacityMeals: Number(formCapacity) || 1500,
      currentAvailableCapacity: Number(formCapacity) || 1500,
      hasColdStorage: formHasColdStorage,
      operatingHours: formHours,
    });

    setShowAddModal(false);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormContactPerson('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Local Redistribution Partners & Food Banks
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active verified NGOs, community pantries, and night shelters serving {selectedCity}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food banks or contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register Partner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPartners.map((partner) => {
          const occupancy = Math.round(
            ((partner.dailyCapacityMeals - partner.currentAvailableCapacity) / partner.dailyCapacityMeals) * 100
          );

          return (
            <div
              key={partner.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">
                      {partner.city} · {partner.type}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                      {partner.name}
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/70">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    VERIFIED
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-2 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{partner.location.address}</span>
                </div>

                {/* Capacity Meter */}
                <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Intake Capacity</span>
                    <span className="font-mono font-bold text-white">
                      {partner.currentAvailableCapacity} / {partner.dailyCapacityMeals}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">meals</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        occupancy > 85 ? 'bg-rose-500' : occupancy > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancy}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>{occupancy}% Occupancy</span>
                    <span>{partner.activeDeliveriesCount} in-flight deliveries</span>
                  </div>
                </div>

                {/* Facilities & Operating Hours */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/40 p-2 rounded-lg flex items-center gap-2">
                    <ThermometerSnowflake
                      className={`w-4 h-4 ${
                        partner.hasColdStorage ? 'text-teal-400' : 'text-slate-600'
                      }`}
                    />
                    <span className="text-[11px] text-slate-300">
                      {partner.hasColdStorage ? 'Cold Storage Active' : 'Ambient Only'}
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] text-slate-300 truncate">
                      {partner.operatingHours}
                    </span>
                  </div>
                </div>

                {/* Coordinator Info */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Coordinator</span>
                    <span className="text-slate-200 font-medium">{partner.contactPerson}</span>
                  </div>

                  <a
                    href={`tel:${partner.phone}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Action: Quick Match Surplus */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {assigningPartnerId === partner.id ? (
                  <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-blue-900/50">
                    <span className="text-[11px] text-slate-300 font-semibold block">
                      Select Available Food Batch:
                    </span>
                    <select
                      value={selectedBatchToAssign}
                      onChange={(e) => setSelectedBatchToAssign(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2 focus:outline-none"
                    >
                      <option value="">-- Choose a Surplus Batch --</option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.foodTitle} ({b.quantityKg}kg · {b.city})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (selectedBatchToAssign) {
                            onAssignSurplusToPartner(selectedBatchToAssign, partner.id);
                            setAssigningPartnerId(null);
                            setSelectedBatchToAssign('');
                          }
                        }}
                        disabled={!selectedBatchToAssign}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold"
                      >
                        Confirm Match
                      </button>
                      <button
                        onClick={() => {
                          setAssigningPartnerId(null);
                          setSelectedBatchToAssign('');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAssigningPartnerId(partner.id);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Direct Surplus Allocation</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Register Redistribution Partner
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSubmitNewPartner} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization / Food Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robin Hood Army - Indiranagar Base"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Partner Category
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="NGO Food Bank">NGO Food Bank</option>
                    <option value="Community Kitchen">Community Kitchen</option>
                    <option value="Shelter Home">Shelter Home</option>
                    <option value="Child Nutrition Center">Child Nutrition Center</option>
                    <option value="Mid-day Meal Trust">Mid-day Meal Trust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
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
                  Full Street Address & Landmarks
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14, 100 Feet Road, HAL 2nd Stage, Indiranagar"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sundaram"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Hotline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98450 XXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daily Capacity (Meals)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hasColdStorage"
                  checked={formHasColdStorage}
                  onChange={(e) => setFormHasColdStorage(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="hasColdStorage" className="text-xs text-slate-300 cursor-pointer">
                  Equipped with walk-in cold room / commercial refrigeration (4°C)
                </label>
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
