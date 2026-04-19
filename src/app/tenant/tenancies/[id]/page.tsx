"use client"

import { useState, useEffect, useTransition, Fragment } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { getCurrentUserId } from "@/lib/actions/user"
import { getTenancyById, requestEndTenancy } from "@/lib/actions/tenancies"
import { PaymentRow } from "@/components/payment-row"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPKR, formatDate } from "@/lib/format"
import {
  ArrowLeft, MapPin, Calendar, CreditCard, Receipt, LogOut,
  Clock, FileText, ShieldAlert, Banknote, Home, Loader2, User
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending Confirmation", className: "bg-amber-50 text-amber-700 border-amber-200" },
  active:  { label: "Active",              className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ended:   { label: "Ended",               className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export default function TenancyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [tenancy, setTenancy] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [showAgreement, setShowAgreement] = useState(false)
  const [showEndWarning, setShowEndWarning] = useState(false)

  useEffect(() => {
    getCurrentUserId().then(async (id) => {
      if (!id) { router.push("/login"); return }
      setUserId(id)
      const t = await getTenancyById(params.id, id)
      if (!t) { router.push("/tenant/tenancies"); return }
      setTenancy(t)
    })
  }, [params.id, router])

  function handleRequestEnd() {
    if (!userId || !tenancy) return
    setShowEndWarning(false)
    startTransition(async () => {
      const result = await requestEndTenancy(tenancy.id, userId, "tenant")
      if (!result.ok) { toast.error(result.error); return }
      toast.success("End of tenancy requested. Waiting for landlord confirmation.")
      const updated = await getTenancyById(tenancy.id, userId)
      if (updated) setTenancy(updated)
    })
  }

  if (!tenancy) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const config = STATUS_CONFIG[tenancy.status] ?? STATUS_CONFIG.pending
  const tenantRequested = !!tenancy.tenantEndRequestedAt
  const landlordRequested = !!tenancy.landlordEndRequestedAt
  const confirmedPayments = tenancy.payments.filter((p: any) => p.status === "confirmed").length
  const totalPaid = tenancy.payments
    .filter((p: any) => p.status === "confirmed")
    .reduce((s: number, p: any) => s + p.amount, 0)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" className="text-slate-600 -ml-2" asChild>
          <Link href="/tenant/tenancies">
            <ArrowLeft className="w-4 h-4" /> Back to Tenancies
          </Link>
        </Button>
      </div>

      {/* Tenancy summary card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 min-w-0">
              <Badge variant="outline" className={config.className}>{config.label}</Badge>

              <div>
                <div className="flex items-start gap-2 text-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="font-semibold text-base">{tenancy.property.address}, {tenancy.property.city}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Landlord: <span className="font-medium text-slate-700">{tenancy.landlord.name}</span></span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono text-xs">{tenancy.landlord.phone}</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{formatPKR(tenancy.monthlyRent)}</span>/mo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Since {formatDate(tenancy.startDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end shrink-0">
              {tenancy.status === "active" && (
                <Button asChild>
                  <Link href={`/tenant/pay/${tenancy.id}`}>Pay Rent</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowAgreement(true)}>
                <FileText className="w-3.5 h-3.5" />
                Agreement
              </Button>
              {tenancy.status === "active" && !tenantRequested && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowEndWarning(true)}
                  disabled={isPending}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  End Tenancy
                </Button>
              )}
              {tenancy.status === "active" && tenantRequested && !landlordRequested && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  End requested — awaiting landlord
                </div>
              )}
            </div>
          </div>

          {/* Financials grid */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
                <Banknote className="w-3.5 h-3.5" />
                Security Deposit Held
              </div>
              <p className="text-2xl font-bold text-emerald-800">{formatPKR(tenancy.deposit)}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Refundable on tenancy end</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
                <Receipt className="w-3.5 h-3.5" />
                Total Confirmed Paid
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPKR(totalPaid)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{confirmedPayments} confirmed payment{confirmedPayments !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenancy.payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payments recorded"
              description="Record your first rent payment to start building your Kiraya Score."
            >
              {tenancy.status === "active" && (
                <Button asChild>
                  <Link href={`/tenant/pay/${tenancy.id}`}>Record First Payment</Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto -mx-1">
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
                  {tenancy.payments.map((p: any) => (
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
          )}
        </CardContent>
      </Card>

      {/* Agreement modal */}
      <Dialog open={showAgreement} onOpenChange={setShowAgreement}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Tenancy Agreement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 space-y-0 border border-slate-200">
              <p className="font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-3">Agreement Terms</p>
              <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                {[
                  ["Tenant", tenancy.tenant?.name ?? "—"],
                  ["Landlord", tenancy.landlord.name],
                  ["Property", `${tenancy.property.address}, ${tenancy.property.city}`],
                  ["Monthly Rent", `${formatPKR(tenancy.monthlyRent)}/mo`],
                  ["Security Deposit", formatPKR(tenancy.deposit)],
                  ["Start Date", formatDate(tenancy.startDate)],
                  ["Status", tenancy.status],
                ].map(([k, v]) => (
                  <Fragment key={String(k)}>
                    <span className="text-slate-400">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </Fragment>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-700 mb-2">Standard Terms</p>
              {[
                `Rent is due on the ${new Date(tenancy.startDate).getDate()}th of each month.`,
                "Security deposit is refundable upon vacancy with no outstanding rent or damages.",
                "Both parties must agree to end the tenancy — a mutual end request is required.",
                "All payments recorded on this platform count toward the tenant's Kiraya Score.",
              ].map((t, i) => (
                <p key={i} className="flex gap-2"><span className="text-slate-300">·</span>{t}</p>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <Home className="w-3.5 h-3.5 shrink-0" />
              This agreement is digitally recorded on the Kiraya Score platform.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End tenancy warning */}
      <Dialog open={showEndWarning} onOpenChange={setShowEndWarning}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Request End of Tenancy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-slate-700">Are you sure you want to request the end of this tenancy?</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-amber-800 mb-2">Before you proceed</p>
              <p className="text-amber-700">· Security deposit of <strong>{formatPKR(tenancy.deposit)}</strong> will be returned after tenancy ends.</p>
              <p className="text-amber-700">· Any unpaid rent may be deducted from your deposit.</p>
              <p className="text-amber-700">· The landlord must also confirm for it to take effect.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndWarning(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleRequestEnd}
                disabled={isPending}
              >
                {isPending ? "Requesting…" : "Confirm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
