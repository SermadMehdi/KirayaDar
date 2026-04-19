"use client"

import { useState, useTransition, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EmptyState } from "@/components/empty-state"
import { confirmTenancy } from "@/lib/actions/tenancies"
import { confirmPayment, getPendingPaymentsForLandlord } from "@/lib/actions/payments"
import { getCurrentUserId } from "@/lib/actions/user"
import { getPendingTenanciesForLandlord } from "@/lib/actions/tenancies"
import { getRentalRequestsForLandlord, respondToRentalRequest } from "@/lib/actions/rental-requests"
import { formatPKR, formatDate } from "@/lib/format"
import { CheckCircle2, MapPin, Clock, ShieldCheck, Home, X, MessageSquare } from "lucide-react"
import { Label } from "@/components/ui/label"

export default function LandlordConfirmPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [pendingTenancies, setPendingTenancies] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [rentalRequests, setRentalRequests] = useState<any[]>([])
  const [responseMsg, setResponseMsg] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getCurrentUserId().then(async (id) => {
      if (!id) return
      setUserId(id)
      const [tenancies, payments, requests] = await Promise.all([
        getPendingTenanciesForLandlord(id),
        getPendingPaymentsForLandlord(id),
        getRentalRequestsForLandlord(id),
      ])
      setPendingTenancies(tenancies)
      setPendingPayments(payments)
      setRentalRequests(requests)
    })
  }, [])

  function handleConfirmTenancy(tenancyId: string) {
    if (!userId) return
    startTransition(async () => {
      const result = await confirmTenancy(tenancyId, userId)
      if (!result.ok) { toast.error(result.error); return }
      toast.success("Tenancy confirmed! Kirayadar Score tracking has started.")
      setPendingTenancies((prev) => prev.filter((t) => t.id !== tenancyId))
    })
  }

  function handleRespondToRequest(requestId: string, accept: boolean) {
    if (!userId) return
    startTransition(async () => {
      const result = await respondToRentalRequest(requestId, userId, {
        accept,
        landlordMessage: responseMsg[requestId] || undefined,
      })
      if (!result.ok) { toast.error(result.error); return }
      toast.success(accept ? "Rental request accepted! Tenancy created." : "Request declined.")
      setRentalRequests((prev) => prev.filter((r) => r.id !== requestId))
      setResponseMsg((prev) => { const n = { ...prev }; delete n[requestId]; return n })
    })
  }

  function handleConfirmPayment(paymentId: string) {
    if (!userId) return
    startTransition(async () => {
      const result = await confirmPayment(paymentId, userId)
      if (!result.ok) { toast.error(result.error); return }
      toast.success("Payment confirmed and verified.")
      setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId))
    })
  }

  const totalPending = rentalRequests.length + pendingTenancies.length + pendingPayments.length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">Confirm tenancies and verify tenant payments</p>
      </div>

      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800">
          <p className="font-semibold mb-0.5">Two-step confirmation process</p>
          <p className="text-emerald-700 text-xs">
            First confirm the tenancy agreement, then verify each payment your tenant records.
            Confirmed payments count toward their Kirayadar Score.
          </p>
        </div>
      </div>

      {totalPending === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="No pending requests, tenancies, or payments waiting for your action."
        />
      )}

      {totalPending > 0 && (
        <Tabs defaultValue={rentalRequests.length > 0 ? "requests" : pendingTenancies.length > 0 ? "tenancies" : "payments"}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="requests" className="flex-1 sm:flex-none gap-2">
              Rental Requests
              {rentalRequests.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {rentalRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tenancies" className="flex-1 sm:flex-none gap-2">
              Tenancies
              {pendingTenancies.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingTenancies.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 sm:flex-none gap-2">
              Payments
              {pendingPayments.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Rental requests tab */}
          <TabsContent value="requests" className="mt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" />
              Incoming Rental Requests
            </h2>
            {rentalRequests.length === 0 ? (
              <EmptyState icon={Home} title="No rental requests" description="Tenant requests to rent your properties will appear here." />
            ) : (
              <div className="space-y-4">
                {rentalRequests.map((r: any) => (
                  <Card key={r.id} className="border-blue-200">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-700">
                                {r.tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{r.tenant.name}</p>
                              <p className="text-xs text-slate-400">{r.tenant.phone}{r.tenant.cnic ? ` · ${r.tenant.cnic}` : ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {r.property.address}, {r.property.city}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-blue-700">{formatPKR(r.quotedRent)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                          {r.quotedDeposit > 0 && <p className="text-xs text-slate-400">Deposit: {formatPKR(r.quotedDeposit)}</p>}
                          <p className="text-xs text-slate-400">From {formatDate(r.preferredStart)}</p>
                        </div>
                      </div>

                      {r.tenantMessage && (
                        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <p className="italic text-xs">{r.tenantMessage}</p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor={`msg-${r.id}`} className="text-xs text-slate-500">Reply to tenant (optional)</Label>
                        <input
                          id={`msg-${r.id}`}
                          type="text"
                          value={responseMsg[r.id] || ""}
                          onChange={(e) => setResponseMsg((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Add a message…"
                          className="mt-1.5 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 h-9"
                          onClick={() => handleRespondToRequest(r.id, true)}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept & Create Tenancy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRespondToRequest(r.id, false)}
                          disabled={isPending}
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending tenancies tab */}
          <TabsContent value="tenancies" className="mt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Proposed Tenancies
            </h2>
            {pendingTenancies.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No pending tenancies" description="When connected tenants propose tenancy terms, they'll appear here." />
            ) : (
              <div className="space-y-3">
                {pendingTenancies.map((t: any) => (
                  <Card key={t.id} className="border-amber-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-amber-700">
                                {t.tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{t.tenant.name}</p>
                              <p className="text-xs text-slate-400">{t.tenant.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {t.property.address}, {t.property.city}
                          </div>
                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{formatPKR(t.monthlyRent)}/mo</span>
                            <span className="text-slate-300">·</span>
                            <span>Deposit {formatPKR(t.deposit)}</span>
                            <span className="text-slate-300">·</span>
                            <span>From {formatDate(t.startDate)}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-9 shrink-0"
                          onClick={() => handleConfirmTenancy(t.id)}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Terms
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending payments tab */}
          <TabsContent value="payments" className="mt-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Payments Awaiting Verification
            </h2>
            {pendingPayments.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No pending payments" description="Tenant payments awaiting your confirmation will appear here." />
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((p: any) => (
                  <Card key={p.id} className="border-orange-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-orange-50 border border-orange-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-orange-700">
                                {p.tenancy.tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{p.tenancy.tenant.name}</p>
                              <p className="text-xs text-slate-400">{p.tenancy.tenant.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {p.tenancy.property.address}, {p.tenancy.property.city}
                          </div>
                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{formatPKR(p.amount)}</span>
                            <span className="text-slate-300">·</span>
                            <span>Due {formatDate(p.expectedDate)}</span>
                            {p.paidDate && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>Paid {formatDate(p.paidDate)}</span>
                              </>
                            )}
                          </div>
                          {p.notes && (
                            <p className="text-xs text-slate-400 mt-1.5 italic">Note: {p.notes}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="h-9 shrink-0"
                          onClick={() => handleConfirmPayment(p.id)}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
