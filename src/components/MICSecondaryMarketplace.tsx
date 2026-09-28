import React, { useState } from 'react';
import { 
  Recycle, 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Leaf, 
  ArrowUpRight,
  Search,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface SecondaryBuyer {
  id: string;
  name: string;
  category: 'Livestock / Animal Feed' | 'Bio-CNG & Methanation' | 'Secondary Food Processing' | 'Organic Compost & Fertilizer';
  city: string;
  address: string;
  intakeCapacityTonsPerMonth: number;
  acceptedMaterials: string[];
  purchaseRateInrPerKg: number;
  contactPerson: string;
  phone: string;
  certifiedEcoBadge: boolean;
}

const INITIAL_BUYERS: SecondaryBuyer[] = [
  {
    id: 'buy-1',
    name: 'Godrej Agrovet Livestock Nutrition Hub',
    category: 'Livestock / Animal Feed',
    city: 'Delhi NCR',
    address: 'Industrial Focal Point, GT Karnal Road, Kundli',
    intakeCapacityTonsPerMonth: 450,
    acceptedMaterials: ['Bakery scraps', 'Grain hull', 'Broken rice', 'Spent pulses'],
    purchaseRateInrPerKg: 14.5,
    contactPerson: 'Dr. Ramesh Choudhary',
    phone: '+91 98112 88776',
    certifiedEcoBadge: true,
  },
  {
    id: 'buy-2',
    name: 'Indore Bio-CNG & Organic Methanation Unit',
    category: 'Bio-CNG & Methanation',
    city: 'Delhi NCR',
    address: 'Waste-to-Energy Eco Park, Ghazipur / Okhla',
    intakeCapacityTonsPerMonth: 800,
    acceptedMaterials: ['Mixed cooked food scrap', 'Vegetable peels', 'Spoiled perishables'],
    purchaseRateInrPerKg: 4.2,
    contactPerson: 'Anil Saxena (Plant Head)',
    phone: '+91 98710 33441',
    certifiedEcoBadge: true,
  },
  {
    id: 'buy-3',
    name: 'Karnataka Feed Mills & Dairy Co-op',
    category: 'Livestock / Animal Feed',
    city: 'Bengaluru',
    address: 'Hosakote Industrial Area, Bengaluru Rural',
    intakeCapacityTonsPerMonth: 320,
    acceptedMaterials: ['Brewery spent grain', 'Overrun bread dough', 'Soy pulp'],
    purchaseRateInrPerKg: 16.0,
    contactPerson: 'S. K. Murthy',
    phone: '+91 98450 66554',
    certifiedEcoBadge: true,
  },
  {
    id: 'buy-4',
    name: 'MahaBio Energy & Upcycled Compost Ltd',
    category: 'Organic Compost & Fertilizer',
    city: 'Mumbai',
    address: 'MIDC Rabale, Navi Mumbai',
    intakeCapacityTonsPerMonth: 600,
    acceptedMaterials: ['Kitchen banquet trim', 'Citrus peels', 'Food sludge'],
    purchaseRateInrPerKg: 5.5,
    contactPerson: 'Pravin Jadhav',
    phone: '+91 98204 11992',
    certifiedEcoBadge: true,
  },
  {
    id: 'buy-5',
    name: 'Hyderabad Agro Biomass Recovery',
    category: 'Bio-CNG & Methanation',
    city: 'Hyderabad',
    address: 'Jeedimetla Industrial Substation',
    intakeCapacityTonsPerMonth: 500,
    acceptedMaterials: ['Hostel mess leftovers', 'Bulk starch slurry'],
    purchaseRateInrPerKg: 4.8,
    contactPerson: 'K. Venkataramaiah',
    phone: '+91 98481 22339',
    certifiedEcoBadge: true,
  },
];

export const MICSecondaryMarketplace: React.FC<{ selectedCity: string }> = ({ selectedCity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [successMessage, setSuccessMessage] = useState('');

  const filteredBuyers = INITIAL_BUYERS.filter((b) => {
    if (selectedCity !== 'Pan-India' && b.city !== selectedCity) return false;
    if (selectedCategory !== 'All' && b.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.acceptedMaterials.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleContractOfftake = (buyer: SecondaryBuyer) => {
    setSuccessMessage(`Automated off-take agreement initiated with ${buyer.name} at ₹${buyer.purchaseRateInrPerKg}/kg.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                MIC HACKATHON · CIRCULAR ECONOMY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                SECONDARY BUYERS NETWORK
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 flex items-center gap-2">
              <Recycle className="w-5 h-5 text-amber-400" />
              Secondary Buyers & Value-Added Upcycling Network
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Monetize non-human edible surplus and processing trim through verified industrial livestock feed, bio-CNG methanation, and organic compost off-takers.
            </p>
          </div>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by material (e.g. bakery scraps, peels)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-64 sm:w-80 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Livestock / Animal Feed', 'Bio-CNG & Methanation', 'Organic Compost & Fertilizer'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Buyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBuyers.map((buyer) => (
          <div
            key={buyer.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    {buyer.city} · {buyer.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{buyer.name}</h3>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  VERIFIED OFF-TAKER
                </span>
              </div>

              <div className="text-xs text-slate-400 mt-2 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{buyer.address}</span>
              </div>

              {/* Purchase Pricing & Capacity */}
              <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Off-take Rate</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    ₹{buyer.purchaseRateInrPerKg} <span className="text-xs text-slate-400 font-normal">/ kg</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Monthly Intake</span>
                  <span className="font-mono font-bold text-white text-base">
                    {buyer.intakeCapacityTonsPerMonth} <span className="text-xs text-slate-400 font-normal">Tons</span>
                  </span>
                </div>
              </div>

              {/* Accepted Byproduct Materials */}
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-semibold">
                  Accepted Surplus & Byproducts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {buyer.acceptedMaterials.map((mat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <a
                href={`tel:${buyer.phone}`}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Plant</span>
              </a>

              <button
                onClick={() => handleContractOfftake(buyer)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-colors"
              >
                <span>Initiate Off-take</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
