import type { ScoreBreakdown } from "@/lib/score"

interface BarProps {
  label: string
  weight: string
  value: number
  description: string
}

function FactorBar({ label, weight, value, description }: BarProps) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground ml-2">{weight}</span>
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="space-y-5">
      <FactorBar
        label="On-Time Payments"
        weight="40%"
        value={breakdown.onTimeRate}
        description="Payments made within 7 days of the due date"
      />
      <FactorBar
        label="Tenure Consistency"
        weight="25%"
        value={breakdown.tenureFactor}
        description={`${breakdown.tenureMonths} months of rental history (max 36)`}
      />
      <FactorBar
        label="Amount Consistency"
        weight="15%"
        value={breakdown.amountConsistency}
        description="Payments within 5% of the agreed rent amount"
      />
      <FactorBar
        label="Verification Level"
        weight="20%"
        value={breakdown.verificationLevel}
        description="Proportion of payments confirmed by landlord"
      />
    </div>
  )
}
