"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProperty, getPropertyById } from "@/lib/actions/properties"
import { getCurrentUserId } from "@/lib/actions/user"
import { ArrowLeft, Pencil } from "lucide-react"

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getCurrentUserId().then(async (id) => {
      if (!id) { router.push("/login"); return }
      setUserId(id)
      const prop = await getPropertyById(propertyId)
      if (!prop || prop.landlordId !== id) { router.push("/landlord/properties"); return }
      setProperty(prop)
      setLoading(false)
    })
  }, [propertyId, router])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) return
    setErrors({})
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateProperty(userId, propertyId, {
        title: form.get("title") as string,
        description: form.get("description") as string,
        address: form.get("address") as string,
        city: form.get("city") as string,
        rentAmount: parseInt(form.get("rentAmount") as string),
        bedrooms: parseInt(form.get("bedrooms") as string) || 1,
        bathrooms: parseInt(form.get("bathrooms") as string) || 1,
        area: parseInt(form.get("area") as string) || undefined,
      })

      if (!result.ok) {
        setErrors({ form: result.error })
        return
      }

      toast.success("Property updated successfully!")
      router.push("/landlord/properties")
    })
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/landlord/properties"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-gray-500 text-sm">Loading property details...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landlord/properties">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Properties
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-600" />
            Edit Property
          </CardTitle>
          <CardDescription>
            Update the details for <span className="font-medium text-gray-700">{property?.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input id="title" name="title" defaultValue={property?.title} className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={property?.description ?? ""}
                placeholder="Describe the property — amenities, location perks, etc."
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={property?.address} className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={property?.city} className="mt-1" required />
            </div>

            <div>
              <Label htmlFor="rentAmount">Monthly Rent (Rs.)</Label>
              <Input id="rentAmount" name="rentAmount" type="number" defaultValue={property?.rentAmount} className="mt-1" required />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms ?? 1} min={1} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" name="bathrooms" type="number" defaultValue={property?.bathrooms ?? 1} min={1} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="area">Area (sqft)</Label>
                <Input id="area" name="area" type="number" defaultValue={property?.area ?? ""} placeholder="1200" className="mt-1" />
              </div>
            </div>

            {errors.form && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.form}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/landlord/properties">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
