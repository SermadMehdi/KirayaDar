"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { getPropertiesForLandlord, togglePropertyAvailability } from "@/lib/actions/properties"
import { getCurrentUserId } from "@/lib/actions/user"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { formatPKR, formatDate } from "@/lib/format"
import { Plus, Home, MapPin, Bed, Bath, Ruler, Users, Pencil, Eye, EyeOff, User } from "lucide-react"

export default function LandlordPropertiesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getCurrentUserId().then(async (id) => {
      if (!id) return
      setUserId(id)
      const props = await getPropertiesForLandlord(id)
      setProperties(props)
    })
  }, [])

  function handleToggle(propertyId: string) {
    if (!userId) return
    startTransition(async () => {
      const result = await togglePropertyAvailability(propertyId, userId)
      if (!result.ok) { toast.error(result.error); return }
      const props = await getPropertiesForLandlord(userId)
      setProperties(props)
      toast.success("Availability updated")
    })
  }

  const occupied = properties.filter((p) => p.tenancies.length > 0)
  const available = properties.filter((p) => p.tenancies.length === 0 && p.available)
  const unlisted = properties.filter((p) => p.tenancies.length === 0 && !p.available)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {occupied.length} occupied · {available.length} available · {unlisted.length} unlisted
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/landlord/properties/new">
            <Plus className="w-4 h-4 mr-2" />
            List Property
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties listed"
          description="List your first property so tenants can find and request to rent it."
        >
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/landlord/properties/new">
              <Plus className="w-4 h-4 mr-2" />List First Property
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => {
            const isOccupied = p.tenancies.length > 0
            const activeTenants = p.tenancies

            return (
              <Card key={p.id} className={`border-2 transition-shadow hover:shadow-md ${
                isOccupied
                  ? "border-blue-200 bg-blue-50/30"
                  : p.available
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-gray-200 bg-gray-50/30"
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{p.title}</h3>
                    <Badge
                      variant="outline"
                      className={
                        isOccupied
                          ? "bg-blue-100 text-blue-700 border-blue-200 shrink-0"
                          : p.available
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0"
                          : "bg-gray-100 text-gray-500 border-gray-200 shrink-0"
                      }
                    >
                      {isOccupied ? "Occupied" : p.available ? "Available" : "Unlisted"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.address}, {p.city}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {p.bedrooms} bed</span>
                    <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms} bath</span>
                    {p.area && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {p.area} sqft</span>}
                  </div>

                  {isOccupied && activeTenants.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 space-y-1">
                      {activeTenants.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-700" />
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">{t.tenant.name}</span>
                              <span className="text-blue-600 text-xs ml-1">{t.tenant.phone}</span>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600">Since {formatDate(t.startDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="font-bold text-emerald-700 text-base">
                      {formatPKR(p.rentAmount)}<span className="text-xs font-normal text-gray-400">/mo</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-500"
                        onClick={() => handleToggle(p.id)}
                        disabled={isPending || isOccupied}
                        title={isOccupied ? "Cannot change availability while occupied" : "Toggle availability"}
                      >
                        {p.available ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        {p.available ? "Unlist" : "List"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                        <Link href={`/landlord/properties/${p.id}/edit`}>
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      {isOccupied && (
                        <Button size="sm" className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700" asChild>
                          <Link href={`/landlord/tenants/${activeTenants[0]?.tenant.id}`}>
                            <Users className="w-3.5 h-3.5 mr-1" />
                            History
                          </Link>
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
