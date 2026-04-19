import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getLandlordTenantPayments } from "@/lib/actions/payments"
import { prisma } from "@/lib/db"
import { calculateScore, getScoreBand } from "@/lib/score"
import { ScoreDisplay } from "@/components/score-display"
import { PaymentRow } from "@/components/payment-row"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPKR, formatDate } from "@/lib/format"
import { ArrowLeft, Receipt, User, Phone, CreditCard } from "lucide-react"
import { EndTenancyButton } from "@/components/end-tenancy-button"

interface PageProps {
  params: Promise<{ tenantId: string }>
}

export default async function LandlordTenantDetailPage({ params }: PageProps) {
  const { tenantId } = await params
  const landlordId = await getSession()
  if (!landlordId) redirect("/login")

  const sharedTenancy = await prisma.tenancy.findFirst({
    where: { tenantId, landlordId },
    orderBy: { createdAt: "desc" },
  })
  if (!sharedTenancy) notFound()

  const [tenant, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenantTenancies: {
          where: { landlordId },
          include: { payments: { orderBy: { expectedDate: "asc" } }, property: true },
        },
      },
    }),
    getLandlordTenantPayments(landlordId, tenantId),
  ])

  if (!tenant) notFound()

  const allPayments = tenant.tenantTenancies.flatMap((t) => t.payments)
  const earliestStart = tenant.tenantTenancies.length > 0
    ? tenant.tenantTenancies.reduce((min, t) =>
        new Date(t.startDate) < new Date(min.startDate) ? t : min
      ).startDate
    : null

  const breakdown = earliestStart ? calculateScore(allPayments, new Date(earliestStart)) : null
  const band = breakdown ? getScoreBand(breakdown.score) : null

  const confirmed = payments.filter((p) => p.status === "confirmed")
  const totalPaid = confirmed.reduce((s, p) => s + p.amount, 0)
  const onTimeCount = allPayments.filter((p) => {
    if (!p.paidDate) return false
    const diff = (new Date(p.paidDate).getTime() - new Date(p.expectedDate).getTime()) / 86400000
    return diff <= 7
  }).length

  const grouped = new Map<string, typeof payments>()
  for (const p of payments) {
    const key = p.tenancyId
    const existing = grouped.get(key) ?? []
    existing.push(p)
    grouped.set(key, existing)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-xl font-bold">{tenant.name}</h1>
                {!breakdown && (
                  <Badge variant="outline" className="text-xs text-gray-500">New Tenant</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Phone className="w-4 h-4" />
                {tenant.phone}
              </div>
              {tenant.cnic && (
                <p className="text-sm text-muted-foreground">CNIC: {tenant.cnic}</p>
              )}
              {tenant.bio && (
                <p className="text-sm text-gray-600 mt-2">{tenant.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="font-semibold text-sm mt-0.5">{formatPKR(totalPaid)}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Payments</p>
                  <p className="font-semibold text-sm mt-0.5">{confirmed.length} confirmed</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">On Time</p>
                  <p className="font-semibold text-sm mt-0.5">
                    {allPayments.length > 0
                      ? Math.round((onTimeCount / allPayments.length) * 100) + "%"
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              {breakdown && (
                <>
                  <ScoreDisplay score={breakdown.score} size="sm" />
                  <p className="text-xs text-muted-foreground">Kiraya Score</p>
                </>
              )}
              {sharedTenancy.status === "active" && (
                <EndTenancyButton
                  tenancyId={sharedTenancy.id}
                  userId={landlordId}
                  role="landlord"
                  tenantRequested={!!sharedTenancy.tenantEndRequestedAt}
                  landlordRequested={!!sharedTenancy.landlordEndRequestedAt}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments recorded"
          description="Payments this tenant makes for your properties will appear here."
        />
      ) : (
        <>
          {Array.from(grouped.entries()).map(([, tenancyPayments]) => {
            const first = tenancyPayments[0]
            const { property } = first.tenancy
            return (
              <Card key={first.tenancyId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    {property.address}, {property.city}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatPKR(
                      tenancyPayments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0)
                    )}{" "}
                    confirmed · {tenancyPayments.length} total payments
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid On</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenancyPayments.map((p) => (
                          <PaymentRow
                            key={p.id}
                            expectedDate={p.expectedDate}
                            paidDate={p.paidDate}
                            amount={p.amount}
                            method={p.method}
                            referenceNumber={p.referenceNumber}
                            status={p.status}
                            notes={p.notes}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
