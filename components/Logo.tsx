import Image from 'next/image'

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="VoteSnap"
      width={size}
      height={size}
      className="object-contain mix-blend-screen"
    />
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
