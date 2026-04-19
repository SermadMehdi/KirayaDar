"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { screenTenant } from "@/lib/actions/tenancies"
import { Search, User, AlertCircle, Phone, Shield } from "lucide-react"

interface ScreenResult {
  found: boolean
  name?: string
  scoreBand?: string
  score?: number
  tenureMonths?: number
  onTimeRate?: number
  color?: string
}

const BAND_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Exceptional: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  Excellent:   { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  Good:        { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700"   },
  Fair:        { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700"  },
  Building:    { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700"    },
}

export default function LandlordScreenPage() {
  const [phone, setPhone] = useState("")
  const [result, setResult] = useState<ScreenResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setResult(null)
    if (!phone) { setErrors({ phone: "Please enter a phone number" }); return }

    startTransition(async () => {
      const res = await screenTenant(phone)
      setResult(res)
    })
  }

  const bandStyle = result?.scoreBand ? BAND_STYLES[result.scoreBand] ?? BAND_STYLES.Building : null

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Screen a Tenant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Look up a prospective tenant&apos;s Kirayadar Score by phone number
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Lookup</CardTitle>
          <CardDescription>
            The tenant must have a Kirayadar account. Results are anonymized to protect their privacy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Tenant Phone Number
              </Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground mt-1.5">
                Ask the tenant to share their registered phone number with you.
              </p>
            </div>
            <Button type="submit" className="w-full h-10" disabled={isPending}>
              <Search className="w-4 h-4" />
              {isPending ? "Searching…" : "Check Kirayadar Score"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardContent className="p-6">
            {!result.found ? (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No record found</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    This number is not registered on Kirayadar, or the tenant does not yet have enough payment history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Registered Tenant</p>
                    <p className="text-xs text-muted-foreground">Account verified</p>
                  </div>
                  {bandStyle && result.scoreBand && (
                    <div className={`ml-auto inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${bandStyle.bg} ${bandStyle.border} ${bandStyle.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: result.color }} />
                      {result.scoreBand}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-3xl font-bold" style={{ color: result.color }}>
                      {result.score}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Kirayadar Score</p>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-3xl font-bold text-foreground">{result.tenureMonths}</p>
                    <p className="text-xs text-muted-foreground mt-1">Months history</p>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-3xl font-bold text-foreground">
                      {Math.round((result.onTimeRate ?? 0) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">On-time rate</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p>
                    Results are anonymized to protect tenant privacy. Only score, tenure, and on-time rate are shown.
                    No name, address, or payment details are disclosed without tenant consent.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
