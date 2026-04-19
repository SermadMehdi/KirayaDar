"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { requestEndTenancy } from "@/lib/actions/tenancies"
import { LogOut, Clock } from "lucide-react"

interface EndTenancyButtonProps {
  tenancyId: string
  userId: string
  role: "tenant" | "landlord"
  tenantRequested: boolean
  landlordRequested: boolean
}

export function EndTenancyButton({ tenancyId, userId, role, tenantRequested, landlordRequested }: EndTenancyButtonProps) {
  const [requested, setRequested] = useState(role === "tenant" ? tenantRequested : landlordRequested)
  const [isPending, startTransition] = useTransition()

  const otherRequested = role === "tenant" ? landlordRequested : tenantRequested

  if (requested) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
        <Clock className="w-3.5 h-3.5" />
        {otherRequested ? "Both parties agreed — tenancy ending" : `End requested — awaiting ${role === "tenant" ? "landlord" : "tenant"}`}
      </div>
    )
  }

  function handleClick() {
    startTransition(async () => {
      const result = await requestEndTenancy(tenancyId, userId, role)
      if (!result.ok) { toast.error(result.error); return }
      toast.success("End of tenancy requested.")
      setRequested(true)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
      onClick={handleClick}
      disabled={isPending}
    >
      <LogOut className="w-3.5 h-3.5 mr-1" />
      Request End of Tenancy
    </Button>
  )
}
