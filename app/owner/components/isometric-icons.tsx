import React from 'react';

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * 3D Isometric Solid Concrete Block
 */
export function IsometricSolidBlock({ className = 'w-24 h-16', width = 100, height = 70 }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="solidTop" x1="20" y1="12" x2="80" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="solidLeft" x1="12" y1="28" x2="50" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="solidRight" x1="50" y1="42" x2="88" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <filter id="blockShadow" x="4" y="20" width="92" height="50" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.1 0 0 0 0 0.15 0 0 0 0.25 0" />
        </filter>
      </defs>

      {/* Cast Shadow */}
      <path
        d="M 50 64 L 88 45 L 86 54 L 50 67 L 14 51 L 12 45 Z"
        fill="#0f172a"
        opacity="0.2"
        filter="url(#blockShadow)"
      />

      {/* Left Face */}
      <path
        d="M 14 26 L 50 44 L 50 66 L 14 48 Z"
        fill="url(#solidLeft)"
        stroke="#475569"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Right Face */}
      <path
        d="M 50 44 L 86 26 L 86 48 L 50 66 Z"
        fill="url(#solidRight)"
        stroke="#334155"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Top Face */}
      <path
        d="M 50 8 L 86 26 L 50 44 L 14 26 Z"
        fill="url(#solidTop)"
        stroke="#64748b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Top bevel highlight lines */}
      <path d="M 15 26 L 50 9 L 85 26" stroke="#f8fafc" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

/**
 * 3D Isometric Hollow Concrete Block (with dual core cavities)
 */
export function IsometricHollowBlock({ className = 'w-24 h-16', width = 100, height = 70 }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hollowTop" x1="20" y1="12" x2="80" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="hollowLeft" x1="12" y1="28" x2="50" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="hollowRight" x1="50" y1="42" x2="88" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <filter id="hollowShadow" x="4" y="20" width="92" height="50" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.1 0 0 0 0 0.15 0 0 0 0.25 0" />
        </filter>
      </defs>

      {/* Cast Shadow */}
      <path
        d="M 50 64 L 88 45 L 86 54 L 50 67 L 14 51 L 12 45 Z"
        fill="#0f172a"
        opacity="0.2"
        filter="url(#hollowShadow)"
      />

      {/* Outer Left Face */}
      <path
        d="M 14 26 L 50 44 L 50 66 L 14 48 Z"
        fill="url(#hollowLeft)"
        stroke="#475569"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Outer Right Face */}
      <path
        d="M 50 44 L 86 26 L 86 48 L 50 66 Z"
        fill="url(#hollowRight)"
        stroke="#334155"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Top Face */}
      <path
        d="M 50 8 L 86 26 L 50 44 L 14 26 Z"
        fill="url(#hollowTop)"
        stroke="#64748b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Left Hollow Core Interior */}
      {/* Hole 1 background/deep shadow */}
      <path d="M 33 21 L 45 15 L 45 31 L 33 37 Z" fill="#1e293b" />
      {/* Hole 1 inner back-wall light reflection */}
      <path d="M 45 15 L 45 28 L 33 34" stroke="#475569" strokeWidth="0.8" opacity="0.6" />
      {/* Hole 1 Top Opening Outline */}
      <path
        d="M 33 21 L 45 15 L 45 23 L 33 29 Z"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Right Hollow Core Interior */}
      {/* Hole 2 background/deep shadow */}
      <path d="M 55 32 L 67 26 L 67 42 L 55 48 Z" fill="#1e293b" />
      {/* Hole 2 inner back-wall light reflection */}
      <path d="M 67 26 L 67 39 L 55 45" stroke="#475569" strokeWidth="0.8" opacity="0.6" />
      {/* Hole 2 Top Opening Outline */}
      <path
        d="M 55 32 L 67 26 L 67 34 L 55 40 Z"
        fill="#0f172a"
        stroke="#475569"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Top edge highlights */}
      <path d="M 15 26 L 50 9 L 85 26" stroke="#f8fafc" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

/**
 * 3D Isometric Paving Blocks / Terrace Paving Stones (Paired interlocking tiles)
 */
export function IsometricPavingBlocks({ className = 'w-24 h-16', width = 100, height = 70 }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="paveTop1" x1="10" y1="18" x2="50" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="paveLeft1" x1="12" y1="32" x2="36" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="paveRight1" x1="36" y1="44" x2="60" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="paveTop2" x1="42" y1="8" x2="82" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="paveLeft2" x1="44" y1="22" x2="68" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="paveRight2" x1="68" y1="34" x2="92" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Paver 2 (Back Right) */}
      <g transform="translate(14, -8)">
        <path d="M 28 22 L 56 36 L 56 47 L 28 33 Z" fill="url(#paveLeft2)" stroke="#475569" strokeWidth="1" />
        <path d="M 56 36 L 84 22 L 84 33 L 56 47 Z" fill="url(#paveRight2)" stroke="#334155" strokeWidth="1" />
        <path d="M 56 8 L 84 22 L 56 36 L 28 22 Z" fill="url(#paveTop2)" stroke="#64748b" strokeWidth="1" />
      </g>

      {/* Paver 1 (Front Left) */}
      <g transform="translate(-4, 10)">
        <path d="M 22 22 L 50 36 L 50 47 L 22 33 Z" fill="url(#paveLeft1)" stroke="#475569" strokeWidth="1" />
        <path d="M 50 36 L 78 22 L 78 33 L 50 47 Z" fill="url(#paveRight1)" stroke="#334155" strokeWidth="1" />
        <path d="M 50 8 L 78 22 L 50 36 L 22 22 Z" fill="url(#paveTop1)" stroke="#64748b" strokeWidth="1" />
      </g>
    </svg>
  );
}

/**
 * 3D Isometric Cement Bag (50kg sack)
 */
export function IsometricCementBag({ className = 'w-24 h-16', width = 100, height = 70 }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 70"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bagTop" x1="26" y1="12" x2="74" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="bagLeft" x1="18" y1="28" x2="50" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="bagRight" x1="50" y1="40" x2="82" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Cast Shadow */}
      <ellipse cx="50" cy="62" rx="36" ry="6" fill="#0f172a" opacity="0.18" />

      {/* Bag Main Body Left Face */}
      <path
        d="M 22 24 C 20 36 22 46 22 54 C 28 58 44 64 50 64 L 50 40 C 44 38 32 30 22 24 Z"
        fill="url(#bagLeft)"
        stroke="#64748b"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Bag Main Body Right Face */}
      <path
        d="M 50 40 L 50 64 C 56 64 72 58 78 54 C 78 46 80 36 78 24 C 68 30 56 38 50 40 Z"
        fill="url(#bagRight)"
        stroke="#475569"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Bag Rounded Top Valve */}
      <path
        d="M 50 14 C 64 14 78 20 78 24 C 68 30 56 38 50 40 C 44 38 32 30 22 24 C 22 20 36 14 50 14 Z"
        fill="url(#bagTop)"
        stroke="#94a3b8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Cement Bag Seal Stitch / Tie Top */}
      <path d="M 44 14 L 56 14 M 42 16 L 58 16" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />

      {/* Blue Brand Label Stripe on Left Face */}
      <path d="M 25 36 L 47 48 L 47 54 L 25 42 Z" fill="#0284c7" opacity="0.85" />
      <text x="35" y="47" fill="#ffffff" fontSize="5" fontWeight="bold" transform="rotate(22, 35, 47)" fontFamily="monospace">
        50 KG
      </text>
    </svg>
  );
}
