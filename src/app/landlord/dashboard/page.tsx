import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getTenanciesForLandlord } from "@/lib/actions/tenancies"
import { getPropertiesForLandlord } from "@/lib/actions/properties"
import { getPendingPaymentsForLandlord } from "@/lib/actions/payments"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { formatPKR, formatDate } from "@/lib/format"
import {
  Home, MapPin, Users, CheckCircle2, Clock, Search,
  Plus, Building2, TrendingUp, Receipt, AlertCircle, ArrowRight, MessageSquare
} from "lucide-react"
import { format } from "date-fns"

export default async function LandlordDashboardPage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  const [tenancies, properties, pendingPayments] = await Promise.all([
    getTenanciesForLandlord(userId),
    getPropertiesForLandlord(userId),
    getPendingPaymentsForLandlord(userId),
  ])

  const allPayments = tenancies.flatMap((t) => t.payments)
  const confirmedPayments = allPayments.filter((p) => p.status === "confirmed")
  const pendingTenancies = tenancies.filter((t) => t.status === "pending")
  const activeTenancies = tenancies.filter((t) => t.status === "active")

  const currentMonth = format(new Date(), "MMM yyyy")
  const thisMonthRevenue = confirmedPayments
    .filter((p) => format(new Date(p.expectedDate), "MMM yyyy") === currentMonth)
    .reduce((s, p) => s + p.amount, 0)
  const allTimeRevenue = confirmedPayments.reduce((s, p) => s + p.amount, 0)

  const pendingCount = pendingTenancies.length + pendingPayments.length
  const firstName = user.name.split(" ")[0]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Landlord Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {firstName}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" asChild>
              <Link href="/landlord/confirm">
                <Clock className="w-4 h-4" />
                {pendingCount} Pending
              </Link>
            </Button>
          )}
          <Button variant="outline" className="border-slate-300" asChild>
            <Link href="/landlord/screen">
              <Search className="w-4 h-4" />
              Screen Tenant
            </Link>
          </Button>
          <Button asChild>
            <Link href="/landlord/properties/new">
              <Plus className="w-4 h-4" />
              List Property
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Building2,
            label: "Properties",
            value: properties.length.toString(),
            sub: `${properties.filter((p) => p.available).length} available`,
          },
          {
            icon: Users,
            label: "Active Tenants",
            value: activeTenancies.length.toString(),
            sub: `${tenancies.length} total tenancies`,
          },
          {
            icon: CheckCircle2,
            label: "Confirmed Payments",
            value: confirmedPayments.length.toString(),
            sub: `${pendingPayments.length} pending confirmation`,
          },
          {
            icon: TrendingUp,
            label: "Revenue This Month",
            value: formatPKR(thisMonthRevenue),
            sub: `${formatPKR(allTimeRevenue)} all time`,
            href: "/landlord/revenue",
            highlight: true,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-0">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className={`text-2xl font-bold ${s.highlight ? "text-emerald-600" : "text-slate-900"}`}>
                {s.value}
              </p>
              {s.href ? (
                <Link href={s.href} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mt-0.5 transition-colors">
                  {s.sub} <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending actions callout */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">You have {pendingCount} item{pendingCount !== 1 ? "s" : ""} awaiting action</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {pendingTenancies.length > 0 && `${pendingTenancies.length} tenancy agreement${pendingTenancies.length !== 1 ? "s" : ""}`}
                {pendingTenancies.length > 0 && pendingPayments.length > 0 && " · "}
                {pendingPayments.length > 0 && `${pendingPayments.length} payment${pendingPayments.length !== 1 ? "s" : ""} to verify`}
              </p>
            </div>
          </div>
          <Button size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700" asChild>
            <Link href="/landlord/confirm">Review</Link>
          </Button>
        </div>
      )}

      {/* Active Tenancies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Active Tenancies</h2>
        </div>

        {activeTenancies.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No active tenancies"
            description="When tenants connect with you and agree on terms, their tenancies will appear here."
          />
        ) : (
          <div className="space-y-3">
            {activeTenancies.map((t) => {
              const now = new Date()
              const dueDayOfMonth = new Date(t.startDate).getDate()
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDayOfMonth, daysInMonth))
              const hasPaymentThisMonth = t.payments.some((p: any) => {
                const d = new Date(p.expectedDate)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              })
              const isOverdue = now > dueThisMonth && !hasPaymentThisMonth
              const confirmedCount = t.payments.filter((p: any) => p.status === "confirmed").length

              return (
                <Card key={t.id} className={isOverdue ? "border-red-900" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-600">
                              {t.tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-900">{t.tenant.name}</span>
                            <span className="text-xs text-slate-400 ml-2 font-mono">{t.tenant.phone}</span>
                          </div>
                          {isOverdue && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {t.property.address}, {t.property.city}
                        </div>

                        <div className="flex gap-4 text-sm text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-800">{formatPKR(t.monthlyRent)}/mo</span>
                          <span>Since {formatDate(t.startDate)}</span>
                          <span className="text-emerald-600 font-medium">{confirmedCount} confirmed</span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="border-slate-300" asChild>
                          <Link href={`/messages/${t.tenant.id}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/landlord/tenants/${t.tenant.id}`}>
                            <Receipt className="w-3.5 h-3.5" />
                            History
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
