import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getTenanciesForTenant } from "@/lib/actions/tenancies"
import { calculateScore } from "@/lib/score"
import { TenancyCard } from "@/components/tenancy-card"
import { ScoreDisplay } from "@/components/score-display"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Plus, BarChart3, Receipt, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import { formatPKR } from "@/lib/format"

export default async function TenantDashboardPage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const tenancies = await getTenanciesForTenant(userId)
  const activeTenancies = tenancies.filter((t) => t.status === "active")

  const allPayments = tenancies.flatMap((t) => t.payments)
  const confirmedPayments = allPayments.filter((p) => p.status === "confirmed")
  const earliestStart = tenancies.length > 0
    ? tenancies.reduce((min, t) => new Date(t.startDate) < new Date(min.startDate) ? t : min).startDate
    : null

  const scoreBreakdown = earliestStart ? calculateScore(allPayments, new Date(earliestStart)) : null

  const now = new Date()
  const thisYearTotal = allPayments
    .filter((p) => {
      const d = new Date(p.expectedDate)
      return p.status === "confirmed" && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, p) => s + p.amount, 0)

  const onTimeCount = confirmedPayments.filter((p: any) => {
    const due = new Date(p.expectedDate)
    const paid = p.paidDate ? new Date(p.paidDate) : null
    return paid && (paid.getTime() - due.getTime()) <= 7 * 24 * 60 * 60 * 1000
  }).length

  const firstName = user.name.split(" ")[0]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s your rental overview</p>
        </div>
        <Button asChild>
          <Link href="/tenant/tenancies/new">
            <Plus className="w-4 h-4" />
            Add Tenancy
          </Link>
        </Button>
      </div>

      {/* Score + stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kirayadar Score card */}
        <Card className="sm:col-span-1 relative overflow-visible">
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Kirayadar Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-5 pt-4">
            {scoreBreakdown ? (
              <>
                <ScoreDisplay score={scoreBreakdown.score} />
                <Link
                  href="/tenant/score"
                  className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  Full report <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full border-4 border-border flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {3 - confirmedPayments.length > 0
                    ? `${3 - confirmedPayments.length} more payment${3 - confirmedPayments.length === 1 ? "" : "s"} needed`
                    : "No tenancy yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {confirmedPayments.length}/3 confirmed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Active Tenancies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-4xl font-bold text-foreground">{activeTenancies.length}</p>
            <p className="text-sm text-muted-foreground mt-0.5">of {tenancies.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Paid This Year
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-3xl font-bold text-primary">{formatPKR(thisYearTotal)}</p>
            <Link
              href="/tenant/history"
              className="text-xs text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1 transition-colors"
            >
              View history <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats row */}
      {confirmedPayments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total payments", value: allPayments.length.toString(), icon: Receipt },
            { label: "Confirmed", value: confirmedPayments.length.toString(), icon: CheckCircle2 },
            { label: "On-time payments", value: onTimeCount.toString(), icon: TrendingUp },
            {
              label: "On-time rate",
              value: confirmedPayments.length > 0
                ? `${Math.round((onTimeCount / confirmedPayments.length) * 100)}%`
                : "—",
              icon: BarChart3,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active tenancies section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Active Tenancies</h2>
          {activeTenancies.length > 0 && (
            <Link href="/tenant/tenancies" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {activeTenancies.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No active tenancies"
            description="Add your current rental to start recording payments and building your Kirayadar Score."
          >
            <Button asChild>
              <Link href="/tenant/tenancies/new">
                <Plus className="w-4 h-4" />
                Add Tenancy
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {activeTenancies.map((t) => {
              const dueDayOfMonth = new Date(t.startDate).getDate()
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDayOfMonth, daysInMonth))
              const hasPaymentThisMonth = t.payments.some((p: any) => {
                const d = new Date(p.expectedDate)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              })
              const paymentDue = now >= dueThisMonth && !hasPaymentThisMonth

              return (
                <TenancyCard
                  key={t.id}
                  id={t.id}
                  address={t.property.address}
                  city={t.property.city}
                  monthlyRent={t.monthlyRent}
                  status={t.status}
                  startDate={t.startDate}
                  landlordName={t.landlord.name}
                  showPayButton={true}
                  paymentDue={paymentDue}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
