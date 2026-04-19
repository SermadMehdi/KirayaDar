"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createTenancy } from "@/lib/actions/tenancies"
import { getCurrentUserId } from "@/lib/actions/user"
import { ArrowLeft, UserPlus, Building2 } from "lucide-react"

export default function NewTenancyForm({ connections }: { connections: any[] }) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    const form = new FormData(e.currentTarget)
    const landlordPhone = form.get("landlordPhone") as string

    if (!landlordPhone) {
      setErrors({ form: "Please select a landlord" })
      return
    }

    startTransition(async () => {
      const userId = await getCurrentUserId()
      if (!userId) { router.push("/login"); return }

      const result = await createTenancy(userId, {
        landlordPhone,
        monthlyRent: parseInt(form.get("monthlyRent") as string),
        deposit: parseInt(form.get("deposit") as string),
        address: form.get("address") as string,
        city: form.get("city") as string,
        startDate: form.get("startDate") as string,
      })

      if (!result.ok) { setErrors({ form: result.error }); return }

      toast.success("Tenancy added! Your landlord will confirm the terms.")
      router.push("/tenant/tenancies")
    })
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="text-slate-600 -ml-2" asChild>
          <Link href="/tenant/tenancies">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Tenancy</CardTitle>
          <CardDescription>
            Enter your rental details. Your landlord will review and confirm the terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">No Landlord Connections</p>
                <p className="text-sm text-slate-500 max-w-xs">
                  You must connect with a landlord before adding a tenancy.
                </p>
              </div>
              <Button asChild>
                <Link href="/tenant/connections">
                  <Building2 className="w-4 h-4" />
                  Find Landlord
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="landlordPhone" className="text-sm font-medium text-slate-700">
                  Select Landlord
                </Label>
                <select
                  id="landlordPhone"
                  name="landlordPhone"
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">— Choose a connected landlord —</option>
                  {connections.map((c) => (
                    <option key={c.id} value={c.landlord.phone}>
                      {c.landlord.name} ({c.landlord.phone})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Only landlords who accepted your connection request are shown.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="monthlyRent" className="text-sm font-medium text-slate-700">Monthly Rent (Rs.)</Label>
                  <Input id="monthlyRent" name="monthlyRent" type="number" placeholder="50000" className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="deposit" className="text-sm font-medium text-slate-700">Deposit (Rs.)</Label>
                  <Input id="deposit" name="deposit" type="number" placeholder="100000" className="mt-1.5" required />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">Property Address</Label>
                <Input
                  id="address" name="address" type="text"
                  placeholder="House 12, Street 5, DHA Phase 2"
                  className="mt-1.5" required
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-medium text-slate-700">City</Label>
                <Input id="city" name="city" type="text" placeholder="Lahore" className="mt-1.5" required />
              </div>

              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">Tenancy Start Date</Label>
                <Input id="startDate" name="startDate" type="date" className="mt-1.5" required />
              </div>

              {errors.form && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{errors.form}</p>
              )}

              <Button type="submit" className="w-full h-10" disabled={isPending}>
                {isPending ? "Adding…" : "Add Tenancy"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
