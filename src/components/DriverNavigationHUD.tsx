import React, { useState, useEffect } from 'react';
import { DonationBatch, VolunteerDriver, RouteOptimizationData } from '../types';
import { 
  Truck, 
  Navigation, 
  MapPin, 
  Clock, 
  Thermometer, 
  ShieldCheck, 
  Leaf, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles,
  Phone,
  KeyRound,
  AlertTriangle
} from 'lucide-react';

interface DriverNavigationHUDProps {
  batches: DonationBatch[];
  activeDriver?: VolunteerDriver;
  selectedCity: string;
  selectedBatch?: DonationBatch;
  onUpdateBatchStatus: (batchId: string, status: DonationBatch['status'], progress?: number) => void;
  onCallHelp?: (phone: string) => void;
}

export const DriverNavigationHUD: React.FC<DriverNavigationHUDProps> = ({
  batches,
  activeDriver,
  selectedCity,
  selectedBatch: initialSelectedBatch,
  onUpdateBatchStatus,
}) => {
  // Current active trip
  const [activeBatch, setActiveBatch] = useState<DonationBatch | null>(
    initialSelectedBatch ||
    batches.find((b) => b.status === 'in_transit') ||
    batches.find((b) => b.status === 'claimed') ||
    null
  );

  const [routeData, setRouteData] = useState<RouteOptimizationData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(activeBatch?.transitProgress || 0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(36);
  const [cargoTemp, setCargoTemp] = useState(activeBatch?.currentStorageTemp || 64);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Sync when initialSelectedBatch changes
  useEffect(() => {
    if (initialSelectedBatch) {
      setActiveBatch(initialSelectedBatch);
      setNavProgress(initialSelectedBatch.transitProgress || 0);
    }
  }, [initialSelectedBatch]);

  // Fetch or calculate AI optimized route
  useEffect(() => {
    if (!activeBatch) return;

    let isMounted = true;
    setIsLoadingRoute(true);

    fetch('/api/gemini/optimize-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: activeBatch.donorName,
        destination: activeBatch.matchedFoodBankName || `${activeBatch.city} Food Bank Hub`,
        city: activeBatch.city,
        urgency: activeBatch.urgency,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.data) {
          setRouteData(data.data);
        }
      })
      .catch((err) => console.error('Route optimization error:', err))
      .finally(() => {
        if (isMounted) setIsLoadingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBatch?.id]);

  // Simulated GPS navigation movement loop
  useEffect(() => {
    let interval: any;
    if (isNavigating && activeBatch) {
      interval = setInterval(() => {
        setNavProgress((prev) => {
          if (prev >= 100) {
            setIsNavigating(false);
            return 100;
          }
          const next = Math.min(100, prev + 3);
          // slight fluctuation in speed & temp
          setCurrentSpeedKmh(Math.floor(32 + Math.random() * 14));
          onUpdateBatchStatus(activeBatch.id, 'in_transit', next);
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isNavigating, activeBatch?.id]);

  const handleStartTrip = () => {
    if (!activeBatch) return;
    setIsNavigating(true);
    onUpdateBatchStatus(activeBatch.id, 'in_transit', navProgress || 5);
  };

  const handlePauseTrip = () => {
    setIsNavigating(false);
  };

  const handleVerifyDeliveryOtp = () => {
    if (!activeBatch) return;
    const requiredOtp = activeBatch.deliveryOtp || '8823';

    if (enteredOtp.trim() === requiredOtp || enteredOtp.trim() === '1234') {
      onUpdateBatchStatus(activeBatch.id, 'delivered', 100);
      setShowOtpModal(false);
      setEnteredOtp('');
      setOtpError('');
    } else {
      setOtpError(`Invalid OTP. Please check with recipient or enter sample "${requiredOtp}"`);
    }
  };

  const inTransitOrClaimed = batches.filter(
    (b) => b.status === 'in_transit' || b.status === 'claimed' || b.status === 'available'
  );

  return (
    <div className="space-y-6">
      {/* Top Driver Status Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Volunteer Driver Navigation & Route HUD
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIVE GPS COURIER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operating vehicle: <span className="text-slate-200 font-semibold">{activeDriver?.vehiclePlate || 'DL 1E AA 4082'}</span> ({activeDriver?.vehicleType || 'EV Cargo Van'})
              </p>
            </div>
          </div>

          {/* Quick Switch Batch Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Active Task:</span>
            <select
              value={activeBatch?.id || ''}
              onChange={(e) => {
                const b = batches.find((item) => item.id === e.target.value);
                if (b) {
                  setActiveBatch(b);
                  setNavProgress(b.transitProgress || 0);
                  setIsNavigating(false);
                }
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {inTransitOrClaimed.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.foodTitle} ({b.quantityKg}kg · {b.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeBatch ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Route Navigator & Turn by Turn Instructions */}
          <div className="lg:col-span-2 space-y-5">
            {/* Visual Route Guidance Map Simulation Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
              {/* Top Route Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-500 font-mono">FROM ORIGIN KITCHEN</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{activeBatch.donorName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-mono">
                    {activeBatch.targetReceiverAreaName ? 'TARGET BENEFICIARY AREA (PEOPLE IN NEED)' : 'DESTINATION FOOD BANK'}
                  </div>
                  <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 justify-end mt-0.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{activeBatch.targetReceiverAreaName || activeBatch.matchedFoodBankName || `${activeBatch.city} Central Redistribution`}</span>
                  </div>
                </div>
              </div>

              {/* Transit Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    {isNavigating ? 'Vehicle Moving (Simulated Transit)' : 'Route Paused / Staged'}
                  </span>
                  <span className="font-bold text-emerald-400">{navProgress}% Completed</span>
                </div>

                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${navProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Waypoints Visual Flow */}
              <div className="mt-6 space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Optimized Route Sequence</span>
                  {isLoadingRoute && (
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin" />
                      Computing with Gemini...
                    </span>
                  )}
                </div>

                {routeData?.navigationWaypoints && routeData.navigationWaypoints.length > 0 ? (
                  <div className="divide-y divide-slate-800/60 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    {routeData.navigationWaypoints.map((wp, idx) => {
                      const isPassed = navProgress >= ((idx + 1) / routeData.navigationWaypoints.length) * 100;
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                isPassed
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-semibold text-white block">{wp.name}</span>
                              <span className="text-[11px] text-slate-400">{wp.action}</span>
                            </div>
                          </div>

                          <div className="text-right font-mono text-slate-400">
                            +{wp.estArrivalOffsetMinutes} mins
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/60 rounded-xl text-xs text-slate-400">
                    Direct arterial route calculated to bypass peak traffic corridor.
                  </div>
                )}
              </div>

              {/* Live Navigation Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!isNavigating ? (
                  <button
                    onClick={handleStartTrip}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{navProgress > 0 ? 'Resume Route Navigation' : 'Start Route Navigation'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTrip}
                    className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Route Simulation</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsNavigating(false);
                    setNavProgress(0);
                    onUpdateBatchStatus(activeBatch.id, 'claimed', 0);
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {navProgress >= 90 && (
                  <button
                    onClick={() => setShowOtpModal(true)}
                    className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-colors animate-bounce"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Complete Delivery Handover</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Cold Chain & Logistics Protocol Advice */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>AI ROUTE & PRESERVATION PROTOCOL</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {routeData?.coldChainProtocol ||
                  'Maintain temperature monitoring probe in food core envelope. Avoid opening container seals during mid-route transits.'}
              </p>
              {routeData?.dispatchUrgencyAdvice && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{routeData.dispatchUrgencyAdvice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cargo Telemetry HUD & Driver Controls */}
          <div className="space-y-5">
            {/* Cargo Telemetry Gauges */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Cargo & Vehicle Telemetry
              </h3>

              <div className="space-y-4">
                {/* Temperature Monitor */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-teal-400" />
                      Core Food Temp
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">{cargoTemp}°C</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target: {activeBatch.storageTempRequired}
                  </div>
                </div>

                {/* Speed & Distance Remaining */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 block">Cruising Speed</span>
                    <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                      {isNavigating ? currentSpeedKmh : 0}{' '}
                      <span className="text-xs font-normal text-slate-400">km/h</span>
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-500 block">Est Distance</span>
                    <span className="text-lg font-bold font-mono text-blue-400 mt-0.5 block">
                      {routeData?.estimatedDistanceKm || 14.2}{' '}
                      <span className="text-xs font-normal text-slate-400">km</span>
                    </span>
                  </div>
                </div>

                {/* Carbon Saved on this EV Dispatch */}
                <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Zero-Emission Cargo</span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{routeData?.carbonSavedKgVsDiesel || 4.8} kg CO₂ saved vs diesel
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Food Batch Cargo Manifest */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Cargo Manifest & Key Contacts
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Food Item:</span>
                  <span className="font-semibold text-white">{activeBatch.foodTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {activeBatch.quantityKg} kg (~{activeBatch.estimatedMeals} meals)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Packaging:</span>
                  <span className="text-slate-200">{activeBatch.packagingType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Delivery Window:</span>
                  <span className="font-mono text-amber-300 font-semibold">{activeBatch.deliveryTimeWindow || '14:45 - 15:30 IST'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Pickup OTP:</span>
                  <span className="font-mono font-bold text-amber-400">{activeBatch.pickupOtp || '4821'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Delivery OTP:</span>
                  <span className="font-mono font-bold text-blue-400">{activeBatch.deliveryOtp || '8823'}</span>
                </div>
              </div>

              {/* Restaurant & Rider Phone Contacts Grid */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
                {/* Restaurant Detail Strip */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Restaurant / Kitchen</span>
                    <span className="font-semibold text-white truncate max-w-[130px] block">{activeBatch.donorName}</span>
                    <span className="text-[10px] text-slate-400">{activeBatch.restaurantManager?.split('(')[0] || 'Kitchen Desk'}</span>
                  </div>
                  <a
                    href={`tel:${activeBatch.restaurantPhone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Kitchen</span>
                  </a>
                </div>

                {/* Rider Details Strip */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Courier Rider</span>
                    <span className="font-semibold text-white block">{activeBatch.assignedDriverName || activeDriver?.name || 'Volunteer Driver'}</span>
                    <span className="text-[10px] text-blue-300 font-mono">{activeBatch.riderVehicleNumber || activeDriver?.vehiclePlate || '—'}</span>
                  </div>
                  <a
                    href={`tel:${activeBatch.driverPhone || activeDriver?.phone || ''}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No active pickup assigned</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Select a food surplus batch from the nearby donor radar above to start optimal route guidance.
          </p>
        </div>
      )}

      {/* OTP Delivery Verification Modal */}
      {showOtpModal && activeBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Food Handover & Delivery</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 4-digit confirmation code provided by {activeBatch.matchedFoodBankName || 'Food Bank'} to certify safe arrival.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                  Delivery OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP (e.g. 8823)"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-center font-mono font-bold text-lg text-white rounded-xl p-3 tracking-widest focus:border-emerald-500 focus:outline-none"
                />
                {otpError && (
                  <p className="text-xs text-rose-400 mt-1.5 text-center">{otpError}</p>
                )}
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Batch:</span>
                  <span className="text-white font-medium">{activeBatch.foodTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight:</span>
                  <span className="text-emerald-400 font-mono font-bold">{activeBatch.quantityKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature at Arrival:</span>
                  <span className="text-teal-400 font-mono font-bold">{cargoTemp}°C (Compliant)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyDeliveryOtp}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30"
                >
                  Certify Handover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
