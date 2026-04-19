import { addDays, differenceInMonths } from "date-fns"
import type { Payment } from "@/generated/prisma/client"

export interface ScoreBreakdown {
  score: number
  onTimeRate: number
  tenureMonths: number
  tenureFactor: number
  amountConsistency: number
  verificationLevel: number
}

export interface ScoreBand {
  label: string
  color: string
  tailwindColor: string
  range: [number, number]
}

export const SCORE_BANDS: ScoreBand[] = [
  { label: "Building", color: "#ef4444", tailwindColor: "text-red-500", range: [300, 579] },
  { label: "Fair", color: "#eab308", tailwindColor: "text-yellow-500", range: [580, 669] },
  { label: "Good", color: "#3b82f6", tailwindColor: "text-blue-500", range: [670, 739] },
  { label: "Excellent", color: "#10b981", tailwindColor: "text-emerald-500", range: [740, 799] },
  { label: "Exceptional", color: "#8b5cf6", tailwindColor: "text-violet-500", range: [800, 850] },
]

export function getScoreBand(score: number): ScoreBand {
  return SCORE_BANDS.find(b => score >= b.range[0] && score <= b.range[1]) ?? SCORE_BANDS[0]
}

export function calculateScore(
  payments: Payment[],
  tenancyStartDate: Date
): ScoreBreakdown | null {
  const confirmed = payments.filter((p) => p.status === "confirmed")
  if (confirmed.length < 3) return null

  const onTimeCount = confirmed.filter((p) => {
    if (!p.paidDate) return false
    return new Date(p.paidDate) <= addDays(new Date(p.expectedDate), 7)
  }).length
  const onTimeRate = onTimeCount / confirmed.length

  const tenureMonths = differenceInMonths(new Date(), new Date(tenancyStartDate))
  const tenureFactor = Math.min(tenureMonths / 36, 1.0)

  const expectedAmount = payments[0].amount
  const amountConsistency =
    confirmed.filter(
      (p) => Math.abs(p.amount - expectedAmount) / expectedAmount < 0.05
    ).length / confirmed.length

  const verificationLevel =
    confirmed.reduce((sum, p) => sum + p.weight, 0) / confirmed.length

  const raw =
    onTimeRate * 0.4 +
    tenureFactor * 0.25 +
    amountConsistency * 0.15 +
    verificationLevel * 0.2

  const score = 300 + Math.round(raw * 550)

  return {
    score,
    onTimeRate,
    tenureMonths,
    tenureFactor,
    amountConsistency,
    verificationLevel,
  }
}
