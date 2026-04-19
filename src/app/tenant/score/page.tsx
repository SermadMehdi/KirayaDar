import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getTenanciesForTenant } from "@/lib/actions/tenancies"
import { calculateScore } from "@/lib/score"
import { ScoreDisplay } from "@/components/score-display"
import { ScoreBreakdownCard } from "@/components/score-breakdown"
import { ScoreChart } from "@/components/score-chart"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Info, BookOpen } from "lucide-react"

const BANDS = [
  { range: "800–850", label: "Exceptional", color: "#8b5cf6", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  { range: "740–799", label: "Excellent",   color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { range: "670–739", label: "Good",        color: "#3b82f6", bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700" },
  { range: "580–669", label: "Fair",        color: "#eab308", bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700" },
  { range: "300–579", label: "Building",    color: "#ef4444", bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700" },
]

export default async function TenantScorePage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const tenancies = await getTenanciesForTenant(userId)
  const allPayments = tenancies.flatMap((t) => t.payments)
  const confirmedPayments = allPayments.filter((p) => p.status === "confirmed")

  const earliestStart = tenancies.length > 0
    ? tenancies.reduce((min, t) => new Date(t.startDate) < new Date(min.startDate) ? t : min).startDate
    : null

  const breakdown = earliestStart ? calculateScore(allPayments, new Date(earliestStart)) : null

  if (breakdown) {
    const latestScore = await prisma.kirayaScore.findFirst({
      where: { userId },
      orderBy: { generatedAt: "desc" },
    })
    if (!latestScore || latestScore.score !== breakdown.score) {
      await prisma.kirayaScore.create({
        data: {
          userId,
          score: breakdown.score,
          onTimeRate: breakdown.onTimeRate,
          tenureMonths: breakdown.tenureMonths,
          amountConsistency: breakdown.amountConsistency,
          verificationLevel: breakdown.verificationLevel,
        },
      })
    }
  }

  const scoreHistory = await prisma.kirayaScore.findMany({
    where: { userId },
    orderBy: { generatedAt: "asc" },
    take: 24,
  })

  const currentBand = breakdown
    ? BANDS.find((b) => {
        const [lo, hi] = b.range.split("–").map(Number)
        return breakdown.score >= lo && breakdown.score <= hi
      })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Kirayadar Score</h1>
        <p className="text-muted-foreground text-sm mt-1">Rental Reliability Report</p>
      </div>

      {!breakdown ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough history yet"
          description={`You need at least 3 confirmed payments to generate your Kirayadar Score. You currently have ${confirmedPayments.length}.`}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">Progress: {confirmedPayments.length} / 3 confirmed payments</p>
            <div className="h-2 bg-secondary rounded-full w-52 mx-auto overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((confirmedPayments.length / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
        </EmptyState>
      ) : (
        <>
          {/* Score hero */}
          <Card>
            <CardContent className="p-8 flex flex-col items-center">
              <ScoreDisplay score={breakdown.score} size="lg" />
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
                Based on <span className="font-semibold text-foreground">{confirmedPayments.length} confirmed payments</span> across{" "}
                {tenancies.length} tenancy{tenancies.length !== 1 ? "ies" : "y"}
              </p>
              {currentBand && (
                <div className={`mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${currentBand.bg} ${currentBand.border} ${currentBand.text}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentBand.color }} />
                  {currentBand.label} — {currentBand.range}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdownCard breakdown={breakdown} />
            </CardContent>
          </Card>

          {/* Score history chart */}
          {scoreHistory.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  Score History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreChart
                  data={scoreHistory.map((s) => ({
                    generatedAt: s.generatedAt,
                    score: s.score,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {/* Score bands guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Score Bands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {BANDS.map((band) => (
                  <div
                    key={band.label}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                      currentBand?.label === band.label ? `${band.bg} ${band.border}` : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: band.color }} />
                      <span className={`text-sm font-semibold ${currentBand?.label === band.label ? band.text : "text-slate-700"}`}>
                        {band.label}
                      </span>
                      {currentBand?.label === band.label && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${band.bg} ${band.text} border ${band.border}`}>
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">{band.range}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
