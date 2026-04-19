"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { acceptConnection, rejectConnection } from "@/lib/actions/connections"
import { CheckCircle2, XCircle } from "lucide-react"

export function ConnectionActions({ connectionId, landlordId }: { connectionId: string; landlordId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const res = await acceptConnection(connectionId, landlordId)
      if (res.ok) toast.success("Connected with tenant")
      else toast.error(res.error)
    })
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectConnection(connectionId, landlordId)
      if (res.ok) toast.success("Request rejected")
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        onClick={handleAccept}
        disabled={isPending}
      >
        <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleReject}
        disabled={isPending}
      >
        <XCircle className="w-4 h-4 mr-1" /> Reject
      </Button>
    </div>
  )
}
