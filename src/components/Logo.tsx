import React from 'react';

/**
 * OmniResQ brand mark — "nourishment emblem" (matched to the user's reference):
 *  • Apple-shaped green ring with stem + twin leaves = fresh, wholesome food
 *  • Blue bowl holding a small apple = served meals
 *  • Two green cupping hands meeting below = the community giving & receiving
 *  • Blue crescents behind the hands = the rescue cycle completing
 * Rendered on the dark-emerald brand tile; legible down to 36 px.
 */
export const LogoMark: React.FC<{ className?: string; rounded?: string }> = ({
  className = 'w-10 h-10',
  rounded = 'rounded-xl',
}) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} ${rounded} shadow-lg shadow-emerald-900/30`}
    role="img"
    aria-label="OmniResQ logo"
  >
    <defs>
      <linearGradient id="omniresq-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0b1220" />
        <stop offset="55%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>

    <rect width="100" height="100" rx="26" fill="url(#omniresq-gradient)" />

    {/* Blue crescents peeking from behind the hands (rescue cycle) */}
    <path
      d="M 16.5 65.5 A 38 38 0 0 0 37 84.5"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M 83.5 65.5 A 38 38 0 0 1 63 84.5"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="6"
      strokeLinecap="round"
    />

    {/* Apple-shaped ring (dimple at top where the stem enters) */}
    <path
      d="M 43 18.3 A 33 33 0 1 0 57 18.3 C 55 21.5 45 21.5 43 18.3 Z"
      fill="none"
      stroke="#4ade80"
      strokeWidth="5"
      strokeLinejoin="round"
    />

    {/* Stem + twin leaves */}
    <path
      d="M 50 19.5 C 50 16.5 49.7 14.2 48.7 12.2"
      fill="none"
      stroke="#4ade80"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
    <path
      d="M 49.2 13.8 C 44 7.8 35.8 6.6 30.6 10.2 C 33.4 16.4 42.2 18.4 49.2 13.8 Z"
      fill="#4ade80"
    />
    <path
      d="M 50.8 13.8 C 56 7.8 64.2 6.6 69.4 10.2 C 66.6 16.4 57.8 18.4 50.8 13.8 Z"
      fill="#86efac"
    />

    {/* Left cupping hand (fingertips reach toward the bowl, wrists meet below) */}
    <path
      d="M 49.7 89.5
         C 36.5 88.5 25.5 80 22.3 67
         C 21.3 63.2 23.2 60.6 26.6 61.2
         C 24.8 55.8 29.2 53.4 31.4 56.6
         C 32.4 52.6 37 51.8 38.4 55.4
         C 40 52.2 44.4 52.2 45.4 55.8
         C 44.6 66 44.4 78 49.7 89.5
         Z"
      fill="#4ade80"
    />
    {/* Right cupping hand (mirror) */}
    <path
      d="M 50.3 89.5
         C 63.5 88.5 74.5 80 77.7 67
         C 78.7 63.2 76.8 60.6 73.4 61.2
         C 75.2 55.8 70.8 53.4 68.6 56.6
         C 67.6 52.6 63 51.8 61.6 55.4
         C 60 52.2 55.6 52.2 54.6 55.8
         C 55.4 66 55.6 78 50.3 89.5
         Z"
      fill="#4ade80"
    />

    {/* Blue bowl (drawn over the hands so the hands cradle it) */}
    <path
      d="M 36 47.5 C 37 56 42 62 50 62 C 58 62 63 56 64 47.5 Z"
      fill="#38bdf8"
    />
    <path d="M 46 62 L 54 62 L 55.2 66.4 L 44.8 66.4 Z" fill="#38bdf8" />

    {/* Small apple sitting in the bowl */}
    <path
      d="M 50 37.8 C 48.2 35.4 44.6 35.7 43.4 38.3 C 42.3 40.7 43 43.9 45.1 45.8 C 46.6 47.1 48.4 47.6 50 47.6 C 51.6 47.6 53.4 47.1 54.9 45.8 C 57 43.9 57.7 40.7 56.6 38.3 C 55.4 35.7 51.8 35.4 50 37.8 Z"
      fill="#86efac"
    />
    <path
      d="M 50 36.6 C 50 35.2 50.4 34.2 51.2 33.4"
      fill="none"
      stroke="#4ade80"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M 51.8 34.3 C 53.2 31.6 56.2 30.6 58.4 31.8 C 57.4 34.5 54.4 35.7 51.8 34.3 Z"
      fill="#4ade80"
    />
    <path
      d="M 45.6 39 C 45.3 40.4 45.5 41.8 46.2 43"
      fill="none"
      stroke="#f0fdf4"
      strokeWidth="1.4"
      strokeLinecap="round"
    />

    {/* Bowl rim over the apple base so it sits inside */}
    <path
      d="M 36 47.5 L 64 47.5"
      stroke="#7dd3fc"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Light sweep on the bowl */}
    <path
      d="M 40.5 50.5 C 41 54 43 56.8 45.8 58.4"
      fill="none"
      stroke="#e0f2fe"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

/** Full horizontal lockup: mark + "Omni**ResQ**" wordmark + optional tagline */
export const LogoLockup: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <LogoMark className={compact ? 'w-9 h-9' : 'w-10 h-10'} />
    <div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-white font-sans">
          Omni<span className="text-emerald-400">ResQ</span>
        </span>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
          AI Logistics
        </span>
      </div>
      {!compact && (
        <p className="text-xs text-slate-400">
          Every Meal Rescued, Everywhere — Surplus Redistribution Network
        </p>
      )}
    </div>
  </div>
);
