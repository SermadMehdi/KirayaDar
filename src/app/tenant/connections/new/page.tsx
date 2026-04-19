"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requestConnection } from "@/lib/actions/connections"
import { getCurrentUserId } from "@/lib/actions/user"
import { ArrowLeft, UserPlus, CheckCircle2, Clock, XCircle } from "lucide-react"

export default function TenantConnectionsPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [connections, setConnections] = useState<any[]>([])

  useEffect(() => {
    // Note: Since this is a client component, we'd ideally fetch via an action or use SWR.
    // For simplicity, we just fetch via a server action wrapper in a real app, 
    // but here we can just use router.refresh to trigger server components, or 
    // fetch initial data if this was a server component.
    // To mix them properly, I'll convert this page to a Server Component in the layout or fetch data via action.
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    const form = new FormData(e.currentTarget)
    const phone = form.get("landlordPhone") as string

    startTransition(async () => {
      const userId = await getCurrentUserId()
      if (!userId) {
        router.push("/login")
        return
      }

      const result = await requestConnection(userId, { landlordPhone: phone })

      if (!result.ok) {
        setErrors({ form: result.error })
        return
      }

      toast.success("Connection request sent!")
      // Full refresh to get new connections if we make this a server-rendered component
      router.refresh()
    })
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenant/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className=" flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Connect with Landlord
          </CardTitle>
          <CardDescription>
            Enter your landlord's phone number to send a connection request. 
            Once accepted, you can add a tenancy with them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="landlordPhone">Landlord Phone Number</Label>
              <Input
                id="landlordPhone"
                name="landlordPhone"
                type="tel"
                placeholder="03001234567"
                className="mt-1"
                required
              />
            </div>
            
            {errors.form && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.form}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending}
            >
              {isPending ? "Sending..." : "Send Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
