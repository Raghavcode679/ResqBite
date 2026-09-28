import React, { useState } from 'react';
import { UserRole, NotificationItem } from '../types';
import { CITIES } from '../data/mockData';
import { LogoLockup } from './Logo';
import { 
  Leaf, 
  Bell, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Building2, 
  ChefHat, 
  LayoutDashboard,
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationAsRead: (id: string) => void;
  onSelectNotificationBatch: (batchId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalMealsRescued: number;
  co2SavedKg: number;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  selectedCity,
  onSelectCity,
  notifications,
  onMarkNotificationAsRead,
  onSelectNotificationBatch,
  soundEnabled,
  onToggleSound,
  totalMealsRescued,
  co2SavedKg,
  onOpenAbout,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Banner Ticker */}
      <div className="bg-emerald-950/60 border-b border-emerald-900/40 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-emerald-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">MIC INNOVATION CELL · AGRI-FOODTECH</span>
            <span className="text-emerald-500/60 hidden sm:inline">|</span>
            <span className="text-emerald-400/90 hidden sm:inline">AI-Powered Institutional Food Waste Management & Circular Redistribution</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div
              className="flex items-center gap-1.5 text-slate-300"
              title="Live counter = 31,400 meals from verified historical rescues + meals from every batch in the live ledger. It updates the moment a kitchen posts surplus, a driver claims it, or a delivery completes."
            >
              <span className="text-slate-500">Rescued:</span>
              <span className="font-bold text-emerald-400">{totalMealsRescued.toLocaleString()}</span>
              <span className="text-slate-400">meals</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-slate-300"
              title="CO₂e avoided = 2.45 kg per kg of food rescued (live batch ledger + 11,200 kg verified historical baseline)."
            >
              <span className="text-slate-500">CO₂ Avoided:</span>
              <span className="font-bold text-teal-400">{(co2SavedKg / 1000).toFixed(1)}k</span>
              <span className="text-slate-400">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center justify-between">
            <LogoLockup />

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenAbout}
                className="p-2 text-emerald-300 hover:text-white rounded-lg bg-slate-900 border border-emerald-800/60"
                title="About OmniResQ"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleSound}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
                title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Alert Chimes'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Center/Right Controls: City Filter & Role Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* City Regional Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c === 'Pan-India' ? '🇮🇳 Pan-India (All Cities)' : `📍 ${c}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => onChangeRole('donor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentRole === 'donor'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Institutional Kitchens, Hotels, Tech Park Cafeterias"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Donor Kitchen</span>
              </button>

              <button
                onClick={() => onChangeRole('driver')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentRole === 'driver'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Volunteer Logistics & Fleet Navigation"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Volunteer Driver</span>
              </button>

              <button
                onClick={() => onChangeRole('foodbank')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentRole === 'foodbank'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="NGO Food Banks & Community Shelters"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Food Bank</span>
              </button>

              <button
                onClick={() => onChangeRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  currentRole === 'admin'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pan-India Logistics & Impact Metrics"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </button>
            </div>

            {/* Audio Chime & Notifications (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {/* About / Platform Guide Button */}
              <button
                onClick={onOpenAbout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-800/60 text-emerald-300 hover:text-white hover:bg-emerald-900/40 transition-colors"
                title="What is OmniResQ? Features, usage guide & tech stack"
              >
                <Info className="w-4 h-4" />
                <span className="text-xs font-semibold">About</span>
              </button>

              <button
                onClick={onToggleSound}
                className={`p-2 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'bg-slate-900 border-emerald-500/50 text-emerald-400 hover:bg-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={soundEnabled ? 'Urgent Alert Chimes Active' : 'Sound Muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Surplus Alerts Feed
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Close
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No alerts right now. Food redistribution flows are on schedule.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 text-xs transition-colors hover:bg-slate-800/50 ${
                              !notif.read ? 'bg-slate-800/20' : 'opacity-70'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {notif.urgency === 'critical' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              ) : notif.urgency === 'high' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              ) : notif.urgency === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              )}

                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-white">{notif.title}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {notif.timestamp}
                                  </span>
                                </div>
                                <p className="text-slate-300 mt-1 leading-relaxed">{notif.message}</p>

                                <div className="flex items-center gap-2 mt-2">
                                  {notif.batchId && (
                                    <button
                                      onClick={() => {
                                        onSelectNotificationBatch(notif.batchId!);
                                        onMarkNotificationAsRead(notif.id);
                                        setShowNotifDropdown(false);
                                      }}
                                      className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-medium"
                                    >
                                      View Surplus Details
                                    </button>
                                  )}
                                  {!notif.read && (
                                    <button
                                      onClick={() => onMarkNotificationAsRead(notif.id)}
                                      className="text-[11px] text-slate-400 hover:text-white"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
