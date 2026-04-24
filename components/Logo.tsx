export function Logo({ size = 36 }: { size?: number }) {
  const id = `vsg-${size}`
  // viewBox: 54w × 46h — speech bubble with speed lines
  return (
    <svg
      width={size}
      height={Math.round(size * 46 / 54)}
      viewBox="0 0 54 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="54" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="0.45" stopColor="#EC4899" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>

      {/* Speed lines */}
      <rect x="1" y="14" width="16" height="3.2" rx="1.6" fill={`url(#${id})`} />
      <rect x="1" y="21.4" width="12.5" height="3.2" rx="1.6" fill={`url(#${id})`} />
      <rect x="1" y="28.8" width="16" height="3.2" rx="1.6" fill={`url(#${id})`} />

      {/*
        Speech bubble: circle cx=39 cy=22 r=15
        θ=210°: (31.5, 35)   θ=240°: (26, 29.5)
        Arc (330°, clockwise) + tail to (22, 44)
      */}
      <path
        d="M 31.5 35 A 15 15 0 1 1 26 29.5 L 21 44 Z"
        stroke={`url(#${id})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Checkmark inside circle */}
      <path
        d="M 30 23 L 36 29 L 48 16"
        stroke={`url(#${id})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-white">vote</span>
      <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
        snap
      </span>
    </span>
  )
}
