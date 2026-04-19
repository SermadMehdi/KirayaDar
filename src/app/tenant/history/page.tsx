import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getTenantPaymentHistory } from "@/lib/actions/payments"
import { PaymentRow } from "@/components/payment-row"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatPKR, formatDate } from "@/lib/format"
import { ArrowLeft, Receipt, TrendingDown } from "lucide-react"

export default async function TenantHistoryPage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const payments = await getTenantPaymentHistory(userId)

  const totalConfirmed = payments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingCount = payments.filter((p) => p.status === "pending").length

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
          <Link href="/tenant/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-muted-foreground text-sm mt-1">All rent payments across your tenancies</p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Your payment history will appear here once you record your first rent payment."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Paid (Confirmed)</p>
                <p className="text-xl font-bold text-emerald-600">{formatPKR(totalConfirmed)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
                <p className="text-xl font-bold">{payments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Pending Confirmation</p>
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          {Array.from(grouped.entries()).map(([, tenancyPayments]) => {
            const first = tenancyPayments[0]
            const { property, landlord } = first.tenancy
            return (
              <Card key={first.tenancyId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    {property.address}, {property.city}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      · {landlord.name}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatPKR(
                      tenancyPayments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0)
                    )}{" "}
                    confirmed ·{" "}
                    {formatDate(tenancyPayments[tenancyPayments.length - 1].expectedDate)} –{" "}
                    {formatDate(tenancyPayments[0].expectedDate)}
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
