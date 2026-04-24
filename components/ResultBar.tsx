interface ResultBarProps {
  label: string
  percent: number
  count: number
  isWinner: boolean
  gradient?: boolean
}

export function ResultBar({ label, percent, count, isWinner, gradient }: ResultBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className={`font-semibold ${isWinner ? 'text-white' : 'text-gray-400'}`}>
          {label}
        </span>
        <span className={`font-bold text-lg ${isWinner ? 'text-white' : 'text-gray-400'}`}>
          {percent}%
          <span className="text-xs text-gray-500 font-normal ml-1">({count})</span>
        </span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            gradient
              ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400'
              : 'bg-white/20'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
