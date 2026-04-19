"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { recordPayment } from "@/lib/actions/payments"
import { getCurrentUserId } from "@/lib/actions/user"
import { getTenancyForPayment } from "@/lib/actions/tenancies"
import { formatPKR } from "@/lib/format"
import {
  ArrowLeft, Shield, CheckCircle2, Loader2,
  Smartphone, Building2, Zap, CreditCard as RaastIcon
} from "lucide-react"

interface TenancyInfo {
  id: string
  monthlyRent: number
  landlord: { name: string; phone: string }
  property: { address: string; city: string }
}

type Method = "jazzcash" | "easypaisa" | "bank_transfer" | "raast"

const METHODS: { id: Method; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { id: "jazzcash",      label: "JazzCash",      icon: Smartphone,  color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    },
  { id: "easypaisa",     label: "Easypaisa",     icon: Smartphone,  color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2,   color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200"   },
  { id: "raast",         label: "Raast",         icon: Zap,         color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
]

function MethodInstructions({ method, landlord }: { method: Method; landlord: { name: string; phone: string } }) {
  if (method === "jazzcash") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-600">Open your JazzCash app and send the rent amount to:</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-semibold mb-1">JazzCash Number</p>
          <p className="text-xl font-bold font-mono text-red-700">{landlord.phone}</p>
          <p className="text-xs text-red-500 mt-0.5">Landlord: {landlord.name}</p>
        </div>
        <p className="text-xs text-slate-400">After sending, copy the transaction ID from your receipt and paste it below.</p>
      </div>
    )
  }
  if (method === "easypaisa") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-600">Open your Easypaisa app and send the rent amount to:</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-700 font-semibold mb-1">Easypaisa Number</p>
          <p className="text-xl font-bold font-mono text-green-800">{landlord.phone}</p>
          <p className="text-xs text-green-600 mt-0.5">Landlord: {landlord.name}</p>
        </div>
        <p className="text-xs text-slate-400">After sending, copy the transaction ID from your receipt and paste it below.</p>
      </div>
    )
  }
  if (method === "bank_transfer") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-600">Transfer via internet banking, mobile banking, or at a branch.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700 font-semibold mb-1">Payable To</p>
          <p className="text-base font-bold text-blue-800">{landlord.name}</p>
          <p className="text-xs text-blue-500 mt-1">Please confirm bank account details directly with your landlord before transferring.</p>
        </div>
        <p className="text-xs text-slate-400">After transferring, enter the transaction / reference number below.</p>
      </div>
    )
  }
  if (method === "raast") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-slate-600">Send instantly via Raast using your landlord&apos;s phone number:</p>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs text-violet-700 font-semibold mb-1">Raast ID (Phone Number)</p>
          <p className="text-xl font-bold font-mono text-violet-800">{landlord.phone}</p>
          <p className="text-xs text-violet-600 mt-0.5">Landlord: {landlord.name}</p>
        </div>
        <p className="text-xs text-slate-400">After sending, copy the Raast transaction reference and paste it below.</p>
      </div>
    )
  }
  return null
}

export default function PayRentPage() {
  const params = useParams<{ tenancyId: string }>()
  const router = useRouter()
  const [tenancy, setTenancy] = useState<TenancyInfo | null>(null)
  const [step, setStep] = useState<"method" | "reference" | "success">("method")
  const [selectedMethod, setSelectedMethod] = useState<Method>("jazzcash")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getTenancyForPayment(params.tenancyId).then((t) => {
      if (t) setTenancy(t)
      else router.push("/tenant/tenancies")
    })
  }, [params.tenancyId, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    startTransition(async () => {
      const userId = await getCurrentUserId()
      if (!userId || !tenancy) return

      const result = await recordPayment(params.tenancyId, userId, {
        method: selectedMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        amount: tenancy.monthlyRent,
        paidDate,
        notes: notes.trim() || undefined,
      })

      if (!result.ok) {
        setErrors({ form: result.error })
        return
      }

      setStep("success")
      setTimeout(() => {
        router.push(`/tenant/tenancies/${params.tenancyId}`)
      }, 2500)
    })
  }

  if (!tenancy) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Recorded!</h2>
              <p className="text-slate-500 text-sm max-w-xs">
                <span className="font-semibold text-slate-700">{formatPKR(tenancy.monthlyRent)}</span> recorded for {tenancy.landlord.name}.
                Your landlord will confirm the payment — it then counts toward your Kiraya Score.
              </p>
            </div>
            <p className="text-xs text-emerald-600 font-medium">Redirecting to payment history…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedMethodConfig = METHODS.find((m) => m.id === selectedMethod)!

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="text-slate-600 -ml-2" asChild>
          <Link href={`/tenant/tenancies/${params.tenancyId}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </Button>
      </div>

      {/* Payment summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recording payment for</p>
              <p className="font-semibold text-slate-800">{tenancy.property.address}, {tenancy.property.city}</p>
              <p className="text-sm text-slate-500 mt-0.5">Landlord: {tenancy.landlord.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Amount</p>
              <p className="text-2xl font-bold text-emerald-600">{formatPKR(tenancy.monthlyRent)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Choose method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Choose payment method
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => {
            const selected = selectedMethod === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border-2 text-sm font-medium transition-all ${
                  selected
                    ? `${m.bg} ${m.border} ${m.color}`
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <m.icon className={`w-4 h-4 ${selected ? m.color : "text-slate-400"}`} />
                {m.label}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Step 2: Instructions + pay */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Send payment via {selectedMethodConfig.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MethodInstructions method={selectedMethod} landlord={tenancy.landlord} />
        </CardContent>
      </Card>

      {/* Step 3: Record reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Record your payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="referenceNumber" className="text-sm font-medium text-slate-700">
                Transaction / Reference Number
                <span className="text-slate-400 font-normal ml-1">(optional but recommended)</span>
              </Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="e.g. JC-20240115-1234567"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="mt-1.5 font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">
                Found in your payment app receipt or confirmation SMS
              </p>
            </div>

            <div>
              <Label htmlFor="paidDate" className="text-sm font-medium text-slate-700">
                Date of Payment
              </Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Any additional details about this payment…"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1.5 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {errors.form && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{errors.form}</p>
            )}

            <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</>
              ) : (
                <>Record {formatPKR(tenancy.monthlyRent)} Payment</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-700">Pakka records your payment.</strong>{" "}
          You pay directly through your own app. We never hold your money or act as a payment gateway.
        </p>
      </div>
    </div>
  )
}
