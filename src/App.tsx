import React, { useState } from 'react';
import { 
  UserRole, 
  DonationBatch, 
  FoodBankPartner, 
  VolunteerDriver, 
  NotificationItem,
  ReceiverArea
} from './types';
import { 
  INITIAL_BATCHES, 
  INITIAL_FOOD_BANKS, 
  INITIAL_DRIVERS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_RECEIVER_AREAS
} from './data/mockData';
import { playUrgentAlertChime, playSuccessChime, playRingRingAlert } from './utils/audio';
import { Header } from './components/Header';
import { IndiaMap } from './components/IndiaMap';
import { NearbyDonorsDashboard } from './components/NearbyDonorsDashboard';
import { PartnerManagement } from './components/PartnerManagement';
import { ReceiverAreasDashboard } from './components/ReceiverAreasDashboard';
import { DriverNavigationHUD } from './components/DriverNavigationHUD';
import { DonorSurplusForm } from './components/DonorSurplusForm';
import { ImpactReporting } from './components/ImpactReporting';
import { AdminLogisticsDashboard } from './components/AdminLogisticsDashboard';
import { SurplusDetailModal } from './components/SurplusDetailModal';
import { TaxCertificateModal } from './components/TaxCertificateModal';
import { MICDemandForecaster } from './components/MICDemandForecaster';
import { MICQualityAssessmentLab } from './components/MICQualityAssessmentLab';
import { MICIndustrialAudit } from './components/MICIndustrialAudit';
import { MICSecondaryMarketplace } from './components/MICSecondaryMarketplace';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { AboutModal } from './components/AboutModal';
import { 
  MapPin, 
  Truck, 
  Building2, 
  ChefHat, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Flame, 
  PlusCircle, 
  Users,
  Camera,
  Factory,
  Recycle
} from 'lucide-react';

export default function App() {
  // Application State
  const [currentRole, setCurrentRole] = useState<UserRole>('donor');
  const [selectedCity, setSelectedCity] = useState<string>('Pan-India');
  const [batches, setBatches] = useState<DonationBatch[]>(INITIAL_BATCHES);
  const [foodBanks, setFoodBanks] = useState<FoodBankPartner[]>(INITIAL_FOOD_BANKS);
  const [receiverAreas, setReceiverAreas] = useState<ReceiverArea[]>(INITIAL_RECEIVER_AREAS);
  const [drivers, setDrivers] = useState<VolunteerDriver[]>(INITIAL_DRIVERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    | 'radar'
    | 'receivers'
    | 'demand_ai'
    | 'quality_lab'
    | 'industrial_audit'
    | 'secondary_buyers'
    | 'post_surplus'
    | 'driver_hud'
    | 'partners'
    | 'impact'
    | 'admin'
  >('radar');

  // Modals & Selection State
  const [selectedBatchModal, setSelectedBatchModal] = useState<DonationBatch | null>(null);
  const [selectedBatchForNavigation, setSelectedBatchForNavigation] = useState<DonationBatch | undefined>(undefined);
  const [selectedTaxSlipBatch, setSelectedTaxSlipBatch] = useState<DonationBatch | null>(null);

  // Aggregated Impact Metrics — live counters.
  // Header total = verified HISTORICAL baseline (rescues audited on the
  // network before this live session) + every batch currently in the live
  // ledger, so the number changes the moment a kitchen posts surplus,
  // a driver claims it, or a delivery completes.
  const HISTORICAL_MEALS_BASELINE = 31400;
  const HISTORICAL_KG_BASELINE = 11200;
  const totalMealsRescued =
    batches.reduce((sum, b) => sum + b.estimatedMeals, 0) + HISTORICAL_MEALS_BASELINE;
  const co2SavedKg = Math.round(
    (batches.reduce((sum, b) => sum + b.quantityKg, 0) + HISTORICAL_KG_BASELINE) * 2.45
  );

  // Switch role handler with contextual tab routing
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'donor') setActiveTab('post_surplus');
    else if (role === 'driver') setActiveTab('driver_hud');
    else if (role === 'foodbank') setActiveTab('receivers');
    else if (role === 'admin') setActiveTab('admin');
  };

  // Add new surplus batch
  const handleAddBatch = (newBatchData: Omit<DonationBatch, 'id' | 'createdAt' | 'remainingHours'>) => {
    const id = `batch-${Date.now()}`;
    const newBatch: DonationBatch = {
      ...newBatchData,
      id,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      remainingHours: 2.5,
    };

    setBatches((prev) => [newBatch, ...prev]);

    // Create real-time notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      title: `URGENT FOOD SURPLUS - ${newBatch.city}`,
      message: `${newBatch.donorName} posted ${newBatch.quantityKg}kg ${newBatch.foodTitle}. Rapid pickup courier needed!`,
      urgency: newBatch.urgency.includes('Critical') ? 'critical' : 'high',
      batchId: id,
      city: newBatch.city,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (soundEnabled) {
      if (newBatch.urgency.includes('Critical')) {
        playRingRingAlert(); // critical surplus = telephone ring-ring alert
      } else {
        playUrgentAlertChime();
      }
    }
  };

  // Add new receiver area (people in need community)
  const handleAddReceiverArea = (newAreaData: Omit<ReceiverArea, 'id' | 'mealsReceivedToday'>) => {
    const id = `recv-${Date.now()}`;
    const newArea: ReceiverArea = {
      ...newAreaData,
      id,
      mealsReceivedToday: 0,
    };

    setReceiverAreas((prev) => [newArea, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      title: `New Hunger Need Registered - ${newArea.city}`,
      message: `${newArea.name} (${newArea.populationEstimate} people) registered. Deficit: ${newArea.dailyMealsNeeded} meals.`,
      urgency: 'high',
      city: newArea.city,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Dispatch a surplus batch directly to a receiver area
  const handleDispatchToReceiverArea = (batchId: string, receiverAreaId: string) => {
    const area = receiverAreas.find((a) => a.id === receiverAreaId);
    const batch = batches.find((b) => b.id === batchId);
    if (!area || !batch) return;

    // Update batch
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            targetReceiverAreaId: area.id,
            targetReceiverAreaName: `${area.name} (${area.distributionPointLandmark})`,
            status: 'claimed',
          };
        }
        return b;
      })
    );

    // Credit meals to receiver area
    setReceiverAreas((prev) =>
      prev.map((a) => {
        if (a.id === receiverAreaId) {
          return {
            ...a,
            mealsReceivedToday: a.mealsReceivedToday + batch.estimatedMeals,
          };
        }
        return a;
      })
    );

    const updatedBatch = {
      ...batch,
      targetReceiverAreaId: area.id,
      targetReceiverAreaName: `${area.name} (${area.distributionPointLandmark})`,
      status: 'claimed' as const,
    };

    setSelectedBatchForNavigation(updatedBatch);
    setActiveTab('driver_hud');

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      title: `Surplus Allocated to People in Need`,
      message: `${batch.estimatedMeals} meals dispatched from ${batch.donorName} directly to ${area.name}.`,
      urgency: 'info',
      city: area.city,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Route driver to a receiver area
  const handleNavigateToReceiverArea = (receiverArea: ReceiverArea) => {
    // Find an available batch in the same city or assign first available
    const matchedBatch = batches.find((b) => b.city === receiverArea.city && b.status === 'available') || batches[0];
    if (matchedBatch) {
      const updated = {
        ...matchedBatch,
        targetReceiverAreaId: receiverArea.id,
        targetReceiverAreaName: `${receiverArea.name} (${receiverArea.distributionPointLandmark})`,
        status: 'claimed' as const,
      };
      setSelectedBatchForNavigation(updated);
      setActiveTab('driver_hud');
    }
  };

  // Claim batch for pickup
  const handleClaimBatch = (batchId: string, driverId?: string) => {
    const driver = drivers.find((d) => d.id === (driverId || 'drv-1')) || drivers[0];
    const targetFoodBank = foodBanks.find((fb) => fb.city === selectedCity) || foodBanks[0];
    const targetReceiver = receiverAreas.find((ra) => ra.city === selectedCity) || receiverAreas[0];

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            status: 'claimed',
            assignedDriverId: driver.id,
            assignedDriverName: `${driver.name} (${driver.vehicleType})`,
            driverPhone: driver.phone,
            vehicleType: driver.vehicleType,
            matchedFoodBankId: targetFoodBank.id,
            matchedFoodBankName: targetFoodBank.name,
            matchedFoodBankAddress: targetFoodBank.location.address,
            targetReceiverAreaId: targetReceiver?.id,
            targetReceiverAreaName: targetReceiver ? `${targetReceiver.name} (${targetReceiver.areaName})` : undefined,
          };
        }
        return b;
      })
    );

    const claimedBatch = batches.find((b) => b.id === batchId);
    if (claimedBatch) {
      setSelectedBatchForNavigation({
        ...claimedBatch,
        targetReceiverAreaId: targetReceiver?.id,
        targetReceiverAreaName: targetReceiver ? `${targetReceiver.name} (${targetReceiver.areaName})` : undefined,
      });
      setActiveTab('driver_hud');
    }

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Update batch status (e.g. from in_transit to delivered)
  const handleUpdateBatchStatus = (batchId: string, status: DonationBatch['status'], progress?: number) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            status,
            transitProgress: progress !== undefined ? progress : b.transitProgress,
          };
        }
        return b;
      })
    );

    if (status === 'delivered') {
      const deliveredBatch = batches.find((b) => b.id === batchId);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        timestamp: 'Just now',
        title: `Safe Handover to Beneficiaries Certified`,
        message: `${deliveredBatch?.quantityKg}kg ${deliveredBatch?.foodTitle} delivered and distributed to ${deliveredBatch?.targetReceiverAreaName || deliveredBatch?.matchedFoodBankName || 'Community'}.`,
        urgency: 'success',
        city: deliveredBatch?.city || 'India',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      if (soundEnabled) {
        playSuccessChime();
      }
    }
  };

  // Add new food bank partner
  const handleAddPartner = (partnerData: Omit<FoodBankPartner, 'id' | 'activeDeliveriesCount' | 'rating'>) => {
    const id = `fb-${Date.now()}`;
    const newPartner: FoodBankPartner = {
      ...partnerData,
      id,
      activeDeliveriesCount: 0,
      rating: 4.9,
    };
    setFoodBanks((prev) => [newPartner, ...prev]);

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Assign surplus directly to a partner
  const handleAssignSurplusToPartner = (batchId: string, partnerId: string) => {
    const partner = foodBanks.find((p) => p.id === partnerId);
    if (!partner) return;

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            matchedFoodBankId: partner.id,
            matchedFoodBankName: partner.name,
            matchedFoodBankAddress: partner.location.address,
            status: 'claimed',
          };
        }
        return b;
      })
    );

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        notifications={notifications}
        onMarkNotificationAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        }}
        onSelectNotificationBatch={(batchId) => {
          const b = batches.find((item) => item.id === batchId);
          if (b) setSelectedBatchModal(b);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalMealsRescued={totalMealsRescued}
        co2SavedKg={co2SavedKg}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* About / Platform Guide Modal */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Main Workspace Navigation Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 sticky top-[92px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-2 no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('radar')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'radar'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>India Map & Surplus Radar</span>
              </button>

              <button
                onClick={() => setActiveTab('receivers')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'receivers'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 text-amber-300" />
                <span>People in Need (Receiver Areas)</span>
              </button>

              <button
                onClick={() => setActiveTab('demand_ai')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'demand_ai'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>AI Demand Forecast (Kitchen Sizing)</span>
              </button>

              <button
                onClick={() => setActiveTab('quality_lab')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'quality_lab'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Camera className="w-4 h-4 text-teal-300" />
                <span>Vision & IoT Quality Lab</span>
              </button>

              <button
                onClick={() => setActiveTab('industrial_audit')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'industrial_audit'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Factory className="w-4 h-4 text-purple-300" />
                <span>Processing Plant Inefficiency Audit</span>
              </button>

              <button
                onClick={() => setActiveTab('secondary_buyers')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'secondary_buyers'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Recycle className="w-4 h-4 text-amber-300" />
                <span>Secondary Upcycling Off-Takers</span>
              </button>

              <button
                onClick={() => setActiveTab('post_surplus')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'post_surplus'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Post Kitchen Surplus (AI Pre-Check)</span>
              </button>

              <button
                onClick={() => setActiveTab('driver_hud')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'driver_hud'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Driver Route Navigation HUD</span>
              </button>

              <button
                onClick={() => setActiveTab('partners')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'partners'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Redistribution Partners</span>
              </button>

              <button
                onClick={() => setActiveTab('impact')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'impact'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Impact & ESG Reports</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Logistics Command</span>
              </button>
            </div>

            {/* Persona Indicator Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 pl-4 border-l border-slate-800 shrink-0">
              <span className="text-slate-500">Active Mode:</span>
              <span className="font-bold text-white uppercase tracking-wider">
                {currentRole === 'donor'
                  ? '👨‍🍳 Donor Kitchen'
                  : currentRole === 'driver'
                  ? '🚚 Volunteer Driver'
                  : currentRole === 'foodbank'
                  ? '🏢 Food Bank NGO'
                  : '🛡️ Logistics Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* VIEW 1: Radar View (India Map + Nearby Donors Dashboard) */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            {/* Interactive India Map */}
            <IndiaMap
              batches={batches}
              foodBanks={foodBanks}
              drivers={drivers}
              receiverAreas={receiverAreas}
              selectedCity={selectedCity}
              onSelectBatch={(batch) => setSelectedBatchModal(batch)}
              onSelectFoodBank={(_fb) => {
                setActiveTab('partners');
              }}
              onSelectReceiverArea={(_area) => {
                setActiveTab('receivers');
              }}
              selectedBatchId={selectedBatchModal?.id}
            />

            {/* Nearby Donors List & Claim Hub */}
            <NearbyDonorsDashboard
              batches={batches}
              foodBanks={foodBanks}
              drivers={drivers}
              selectedCity={selectedCity}
              onSelectBatch={(batch) => setSelectedBatchModal(batch)}
              onClaimBatch={handleClaimBatch}
              onNavigateBatch={(batch) => {
                setSelectedBatchForNavigation(batch);
                setActiveTab('driver_hud');
              }}
              onOpenTaxSlip={(batch) => setSelectedTaxSlipBatch(batch)}
            />
          </div>
        )}

        {/* VIEW 2: Receiver Areas (People Who Need Food) */}
        {activeTab === 'receivers' && (
          <ReceiverAreasDashboard
            receiverAreas={receiverAreas}
            batches={batches}
            selectedCity={selectedCity}
            onAddReceiverArea={handleAddReceiverArea}
            onDispatchToReceiverArea={handleDispatchToReceiverArea}
            onNavigateToReceiverArea={handleNavigateToReceiverArea}
          />
        )}

        {/* VIEW 3: AI Demand & Surplus Forecasting (MIC Target 1) */}
        {activeTab === 'demand_ai' && (
          <MICDemandForecaster />
        )}

        {/* VIEW 4: Computer Vision & IoT Quality Lab (MIC Target 2) */}
        {activeTab === 'quality_lab' && (
          <MICQualityAssessmentLab />
        )}

        {/* VIEW 5: Food Processing Plant Inefficiency Audit (MIC Target 5 & 6) */}
        {activeTab === 'industrial_audit' && (
          <MICIndustrialAudit />
        )}

        {/* VIEW 6: Secondary Buyers & Circular Economy Upcyclers (MIC Target 3) */}
        {activeTab === 'secondary_buyers' && (
          <MICSecondaryMarketplace selectedCity={selectedCity} />
        )}

        {/* VIEW 3: Post Surplus (Donor Kitchens) */}
        {activeTab === 'post_surplus' && (
          <div className="space-y-6">
            <DonorSurplusForm
              currentDonorName="ITC Grand Bharat Banquet Kitchens"
              currentCity={selectedCity === 'Pan-India' ? 'Delhi NCR' : selectedCity}
              onSubmitBatch={handleAddBatch}
            />

            {/* Recent Batches from this facility */}
            <NearbyDonorsDashboard
              batches={batches}
              foodBanks={foodBanks}
              drivers={drivers}
              selectedCity={selectedCity}
              onSelectBatch={(batch) => setSelectedBatchModal(batch)}
              onClaimBatch={handleClaimBatch}
              onNavigateBatch={(batch) => {
                setSelectedBatchForNavigation(batch);
                setActiveTab('driver_hud');
              }}
              onOpenTaxSlip={(batch) => setSelectedTaxSlipBatch(batch)}
            />
          </div>
        )}

        {/* VIEW 4: Volunteer Driver Navigation HUD */}
        {activeTab === 'driver_hud' && (
          <DriverNavigationHUD
            batches={batches}
            activeDriver={drivers[0]}
            selectedCity={selectedCity}
            selectedBatch={selectedBatchForNavigation}
            onUpdateBatchStatus={handleUpdateBatchStatus}
          />
        )}

        {/* VIEW 5: Redistribution Partners & Food Banks */}
        {activeTab === 'partners' && (
          <PartnerManagement
            partners={foodBanks}
            batches={batches}
            selectedCity={selectedCity}
            onAddPartner={handleAddPartner}
            onSelectPartner={(_partner) => {
              // Highlight or filter
            }}
            onAssignSurplusToPartner={handleAssignSurplusToPartner}
          />
        )}

        {/* VIEW 6: Impact Reporting & Trend Visualization */}
        {activeTab === 'impact' && (
          <ImpactReporting
            batches={batches}
            selectedCity={selectedCity}
          />
        )}

        {/* VIEW 7: Admin Command & Fleet Logistics */}
        {activeTab === 'admin' && (
          <AdminLogisticsDashboard
            batches={batches}
            partners={foodBanks}
            drivers={drivers}
            selectedCity={selectedCity}
            onUpdateBatchStatus={handleUpdateBatchStatus}
          />
        )}
      </main>

      {/* Detail Modal */}
      <SurplusDetailModal
        batch={selectedBatchModal}
        foodBanks={foodBanks}
        drivers={drivers}
        onClose={() => setSelectedBatchModal(null)}
        onClaimBatch={(id) => {
          handleClaimBatch(id);
          setSelectedBatchModal(null);
        }}
        onNavigateBatch={(batch) => {
          setSelectedBatchForNavigation(batch);
          setActiveTab('driver_hud');
          setSelectedBatchModal(null);
        }}
        onOpenTaxSlip={(batch) => {
          setSelectedTaxSlipBatch(batch);
          setSelectedBatchModal(null);
        }}
      />

      {/* 80G Tax Exemption Certificate Modal */}
      <TaxCertificateModal
        batch={selectedTaxSlipBatch}
        onClose={() => setSelectedTaxSlipBatch(null)}
      />

      {/* Floating AI Site Assistant — guides first-time users through every feature */}
      <AIAssistantWidget
        activeTab={activeTab}
        currentRole={currentRole}
        selectedCity={selectedCity}
      />

      {/* Quiet Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ResqBite</span>
            <span>·</span>
            <span>Every Meal Rescued, Everywhere — National Food Surplus Reduction & Redistribution Network</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>FSSAI Compliant (Surplus Food Regs 2019)</span>
            <span>·</span>
            <span>UN SDG Target 12.3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
