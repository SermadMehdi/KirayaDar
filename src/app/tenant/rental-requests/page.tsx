"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { getRentalRequestsForTenant, cancelRentalRequest } from "@/lib/actions/rental-requests"
import { getCurrentUserId } from "@/lib/actions/user"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { formatPKR, formatDate } from "@/lib/format"
import { Home, MapPin, Clock, CheckCircle, XCircle, MessageCircle, X } from "lucide-react"

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Declined", className: "bg-red-100 text-red-600 border-red-200" },
}

export default function TenantRentalRequestsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getCurrentUserId().then(async (id) => {
      if (!id) return
      setUserId(id)
      const data = await getRentalRequestsForTenant(id)
      setRequests(data)
    })
  }, [])

  function handleCancel(requestId: string) {
    if (!userId) return
    startTransition(async () => {
      const result = await cancelRentalRequest(requestId, userId)
      if (!result.ok) { toast.error(result.error); return }
      toast.success("Request cancelled.")
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    })
  }

  const pending = requests.filter((r) => r.status === "pending")
  const resolved = requests.filter((r) => r.status !== "pending")

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rental Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pending.length} pending · {resolved.length} resolved
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No rental requests yet"
          description="Browse available properties and send a rental quotation to a landlord."
        >
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/tenant/browse">Browse Properties</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const cfg = statusConfig[r.status as keyof typeof statusConfig] ?? statusConfig.pending
            return (
              <Card key={r.id} className={`border-2 ${r.status === "accepted" ? "border-emerald-200" : r.status === "rejected" ? "border-red-100" : "border-yellow-100"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 truncate">{r.property.title}</p>
                        <Badge variant="outline" className={`${cfg.className} text-xs shrink-0`}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {r.property.address}, {r.property.city}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Quoted: <span className="font-medium text-gray-700">{formatPKR(r.quotedRent)}/mo</span></span>
                        {r.quotedDeposit > 0 && <span>Deposit: <span className="font-medium text-gray-700">{formatPKR(r.quotedDeposit)}</span></span>}
                        <span>Move-in: <span className="font-medium text-gray-700">{formatDate(r.preferredStart)}</span></span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Landlord: {r.landlord.name} · {r.landlord.phone}
                      </div>

                      {r.status === "accepted" && r.agreedRent && r.agreedRent !== r.quotedRent && (
                        <div className="mt-2 text-xs bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 text-emerald-800">
                          Agreed rent: {formatPKR(r.agreedRent)}/mo · Start: {r.agreedStart ? formatDate(r.agreedStart) : "—"}
                        </div>
                      )}

                      {r.landlordMessage && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-600 bg-gray-50 border rounded px-2.5 py-2">
                          <MessageCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                          <span className="italic">{r.landlordMessage}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {r.status === "pending" && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Clock className="w-3.5 h-3.5" /> Awaiting response
                        </div>
                      )}
                      {r.status === "accepted" && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" /> Accepted
                        </div>
                      )}
                      {r.status === "rejected" && (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="w-3.5 h-3.5" /> Declined
                        </div>
                      )}
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50"
                          onClick={() => handleCancel(r.id)}
                          disabled={isPending}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                      {r.status === "accepted" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                          <Link href="/tenant/tenancies">View Tenancy</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
