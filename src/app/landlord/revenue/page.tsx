import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getLandlordRevenue, getLandlordRevenueByTenant, getLandlordRevenueDetailed } from "@/lib/actions/payments"
import { RevenueChart } from "@/components/revenue-chart"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPKR, formatDate } from "@/lib/format"
import { ArrowLeft, TrendingUp, Users, User, MapPin, Calendar } from "lucide-react"
import { format } from "date-fns"

const methodLabels: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  raast: "Raast",
  platform: "Platform",
}

export default async function LandlordRevenuePage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const [revenueData, tenantBreakdown, detailedRows] = await Promise.all([
    getLandlordRevenue(userId),
    getLandlordRevenueByTenant(userId),
    getLandlordRevenueDetailed(userId),
  ])

  const allTimeTotal = revenueData.reduce((s, r) => s + r.amount, 0)
  const allTimeCount = revenueData.reduce((s, r) => s + r.confirmedCount, 0)

  const currentMonth = format(new Date(), "MMM yyyy")
  const thisMonthTotal = revenueData.find((r) => r.month === currentMonth)?.amount ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Monthly cash inflow from confirmed rent payments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-xl font-bold text-blue-600">{formatPKR(thisMonthTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">All-Time Revenue</p>
            <p className="text-xl font-bold">{formatPKR(allTimeTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Confirmed Payments</p>
            <p className="text-xl font-bold">{allTimeCount}</p>
          </CardContent>
        </Card>
      </div>

      {revenueData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No revenue yet"
          description="Confirm tenant payments to start tracking your rental income here."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-5 h-5" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>

          <Tabs defaultValue="detailed">
            <TabsList>
              <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
              <TabsTrigger value="tenant">Per Tenant</TabsTrigger>
            </TabsList>

            <TabsContent value="detailed" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment-by-Payment Breakdown</CardTitle>
                  <p className="text-sm text-muted-foreground">Every confirmed payment — which month, which property, which tenant</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {row.month}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(row.expectedDate)}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{row.tenantName}</p>
                              <p className="text-xs text-gray-400">{row.tenantPhone}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">{row.propertyTitle}</p>
                                  <p className="text-xs text-gray-400 line-clamp-1">{row.propertyAddress}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {methodLabels[row.method] ?? row.method}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-blue-700 text-right">
                              {formatPKR(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...revenueData].reverse().map((row) => (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell>{row.confirmedCount}</TableCell>
                          <TableCell className="font-semibold text-blue-700 text-right">{formatPKR(row.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenant" className="mt-4">
              {tenantBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Per-Tenant Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tenantBreakdown.map((t) => (
                      <div key={t.tenancyId} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-gray-50/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 text-sm">{t.tenantName}</span>
                              <span className="text-xs text-gray-400">{t.tenantPhone}</span>
                              <Badge variant="outline" className={t.status === "active"
                                ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                                : "bg-gray-100 text-gray-500 border-gray-200 text-xs"
                              }>
                                {t.status === "active" ? "Active" : "Ended"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{t.address}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatPKR(t.monthlyRent)}/mo · {t.paymentCount} confirmed payment{t.paymentCount !== 1 ? "s" : ""}
                              {t.lastPayment && ` · Last: ${formatDate(t.lastPayment.expectedDate)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-blue-700">{formatPKR(t.totalPaid)}</p>
                          <p className="text-xs text-gray-400">total received</p>
                          <Button size="sm" variant="outline" className="mt-1 h-6 text-xs px-2" asChild>
                            <Link href={`/landlord/tenants/${t.tenantId}`}>Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
