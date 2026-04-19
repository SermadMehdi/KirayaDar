import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getAvailableProperties } from "@/lib/actions/properties"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { formatPKR } from "@/lib/format"
import { Home, MapPin, Bed, Bath, Ruler, MessageCircle } from "lucide-react"

export default async function TenantBrowsePage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const properties = await getAvailableProperties()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Properties</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Find your next home — send a rental quotation to the landlord
        </p>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties available"
          description="No landlords have listed properties yet. Check back later!"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="hover:shadow-lg transition-all duration-200 overflow-hidden group">
              {(p as any).imageUrl ? (
                <img src={(p as any).imageUrl} alt={p.title}
                  className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-200" />
              ) : (
                <div className="h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                  <Home className="w-12 h-12 text-emerald-300 group-hover:scale-110 transition-transform" />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{p.title}</h3>

                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{p.address}, {p.city}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {p.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms}</span>
                  {p.area && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {p.area} sqft</span>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="font-bold text-emerald-700">{formatPKR(p.rentAmount)}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                  <span className="text-xs text-gray-500">by {p.landlord.name}</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" asChild>
                    <Link href={`/tenant/browse/${p.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/messages/${p.landlord.id}`}>
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
