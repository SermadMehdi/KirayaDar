import { getScoreBand } from "@/lib/score"

interface ScoreDisplayProps {
  score: number
  size?: "sm" | "lg"
}

export function ScoreDisplay({ score, size = "lg" }: ScoreDisplayProps) {
  const band = getScoreBand(score)
  const isLarge = size === "lg"

  const radius = isLarge ? 72 : 46
  const strokeWidth = isLarge ? 9 : 6
  const circumference = 2 * Math.PI * radius
  const pct = (score - 300) / 550
  const dashOffset = circumference * (1 - pct)
  const svgSize = (radius + strokeWidth + 2) * 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold leading-none tabular-nums ${isLarge ? "text-5xl" : "text-2xl"}`}
            style={{ color: band.color }}
          >
            {score}
          </span>
          <span className={`text-muted-foreground ${isLarge ? "text-sm" : "text-xs"} mt-1`}>
            / 850
          </span>
        </div>
      </div>
      <span
        className={`font-semibold ${isLarge ? "text-lg" : "text-sm"}`}
        style={{ color: band.color }}
      >
        {band.label}
      </span>
    </div>
  )
}
