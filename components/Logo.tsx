export function Logo({ size = 36 }: { size?: number }) {
  const id = `grad-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="0.5" stopColor="#EC4899" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${id})`} />
      {/* Chat bubble */}
      <path
        d="M7 10h26a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H22l-5 4v-4H7a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Checkmark */}
      <path
        d="M13 19l4 4 10-9"
        stroke={`url(#${id})`}
        strokeWidth="2.5"
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
      <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
        snap
      </span>
    </span>
  )
}
