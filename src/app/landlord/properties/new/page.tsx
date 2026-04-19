"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createProperty } from "@/lib/actions/properties"
import { getCurrentUserId } from "@/lib/actions/user"
import { ArrowLeft, Home } from "lucide-react"

export default function NewPropertyPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const userId = await getCurrentUserId()
      if (!userId) { router.push("/login"); return }

      const result = await createProperty(userId, {
        title: form.get("title") as string,
        description: form.get("description") as string,
        address: form.get("address") as string,
        city: form.get("city") as string,
        rentAmount: parseInt(form.get("rentAmount") as string),
        bedrooms: parseInt(form.get("bedrooms") as string) || 1,
        bathrooms: parseInt(form.get("bathrooms") as string) || 1,
        area: parseInt(form.get("area") as string) || undefined,
        imageUrl: (form.get("imageUrl") as string) || undefined,
        image2Url: (form.get("image2Url") as string) || undefined,
        image3Url: (form.get("image3Url") as string) || undefined,
      })

      if (!result.ok) {
        setErrors({ form: result.error })
        return
      }

      toast.success("Property listed successfully!")
      router.push("/landlord/properties")
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/properties">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600" />
            List a Property
          </CardTitle>
          <CardDescription>
            Add a new property for tenants to browse and request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input id="title" name="title" placeholder="Spacious 2-bed apartment in DHA" className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Describe the property — amenities, location perks, etc."
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="House 12, Street 5, DHA Phase 2" className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Lahore" className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="rentAmount">Monthly Rent (Rs.)</Label>
              <Input id="rentAmount" name="rentAmount" type="number" placeholder="50000" className="mt-1" required />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" defaultValue={2} min={1} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" defaultValue={1} min={1} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="area">Area (sqft)</Label>
                <Input id="area" name="area" type="number" placeholder="1200" className="mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Property Photos <span className="text-gray-400 font-normal">(optional — paste image URLs)</span></Label>
              <Input name="imageUrl" placeholder="Photo 1 URL (e.g. https://...)" className="mt-1" />
              <Input name="image2Url" placeholder="Photo 2 URL (optional)" />
              <Input name="image3Url" placeholder="Photo 3 URL (optional)" />
            </div>

            {errors.form && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.form}</p>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
              {isPending ? "Listing..." : "List Property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
