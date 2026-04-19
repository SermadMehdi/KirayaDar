"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPropertyById } from "@/lib/actions/properties"
import { sendRentalRequest } from "@/lib/actions/rental-requests"
import { getCurrentUserId } from "@/lib/actions/user"
import { formatPKR } from "@/lib/format"
import { ArrowLeft, Home, MapPin, Bed, Bath, Ruler, Send, MessageCircle, User, Users, History } from "lucide-react"

interface PropertyDetail {
  id: string
  title: string
  description: string | null
  address: string
  city: string
  rentAmount: number
  bedrooms: number
  bathrooms: number
  area: number | null
  available: boolean
  imageUrl: string | null
  image2Url: string | null
  image3Url: string | null
  landlord: {
    id: string
    name: string
    phone: string
    bio: string | null
    landlordTenancies: { id: string; status: string }[]
  }
  tenancies: { id: string }[]
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [quotedRent, setQuotedRent] = useState("")
  const [deposit, setDeposit] = useState("")
  const [preferredStart, setPreferredStart] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getCurrentUserId().then((id) => setUserId(id))
    getPropertyById(params.id).then((p) => {
      if (p) {
        setProperty(p as any)
        setQuotedRent(String((p as any).rentAmount))
      } else {
        router.push("/tenant/browse")
      }
    })
  }, [params.id, router])

  function handleRequest() {
    if (!userId || !property) return
    startTransition(async () => {
      const result = await sendRentalRequest(userId, {
        propertyId: property.id,
        quotedRent: parseInt(quotedRent) || property.rentAmount,
        quotedDeposit: parseInt(deposit) || 0,
        preferredStart,
        tenantMessage: message || undefined,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Rental request sent! The landlord will review and respond.")
      setShowForm(false)
    })
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const isOccupied = property.tenancies.length > 0
  const totalTenancies = property.landlord.landlordTenancies.length
  const activeTenancies = property.landlord.landlordTenancies.filter((t) => t.status === "active").length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenant/browse">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Browse
          </Link>
        </Button>
      </div>

      {/* Property images */}
      {property.imageUrl ? (
        <div className="space-y-2">
          <img src={property.imageUrl} alt={property.title}
            className="w-full h-52 object-cover rounded-2xl border border-gray-100" />
          {(property.image2Url || property.image3Url) && (
            <div className="grid grid-cols-2 gap-2">
              {property.image2Url && (
                <img src={property.image2Url} alt={`${property.title} 2`}
                  className="w-full h-28 object-cover rounded-xl border border-gray-100" />
              )}
              {property.image3Url && (
                <img src={property.image3Url} alt={`${property.title} 3`}
                  className="w-full h-28 object-cover rounded-xl border border-gray-100" />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-100">
          <Home className="w-16 h-16 text-emerald-300" />
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          {isOccupied ? (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 shrink-0">Occupied</Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">Available</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 mt-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          {property.address}, {property.city}
        </div>
      </div>

      <div className="flex gap-5 text-gray-600 text-sm">
        <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-gray-400" /> {property.bedrooms} Bedrooms</span>
        <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-gray-400" /> {property.bathrooms} Bathrooms</span>
        {property.area && <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4 text-gray-400" /> {property.area} sqft</span>}
      </div>

      {property.description && (
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">About this property</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-100">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Landlord</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{property.landlord.name}</p>
              {property.landlord.bio && (
                <p className="text-sm text-gray-500 mt-0.5">{property.landlord.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {activeTenancies} active tenant{activeTenancies !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  {totalTenancies} total tenancies
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && !isOccupied && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Send Rental Quotation</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quotedRent" className="text-xs">Monthly Rent (Rs.)</Label>
                <Input
                  id="quotedRent"
                  type="number"
                  value={quotedRent}
                  onChange={(e) => setQuotedRent(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="deposit" className="text-xs">Security Deposit (Rs.)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="0"
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferredStart" className="text-xs">Preferred Move-in Date</Label>
              <Input
                id="preferredStart"
                type="date"
                value={preferredStart}
                onChange={(e) => setPreferredStart(e.target.value)}
                className="mt-1 text-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-xs">Message to Landlord (optional)</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Introduce yourself, mention references, or ask questions..."
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleRequest}
                disabled={isPending || !preferredStart}
              >
                <Send className="w-4 h-4 mr-2" />
                {isPending ? "Sending..." : "Send Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Rent</p>
          <p className="text-3xl font-bold text-emerald-700 mt-0.5">{formatPKR(property.rentAmount)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/messages/${property.landlord.id}`}>
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Message
            </Link>
          </Button>
          {!isOccupied && !showForm && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowForm(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Request to Rent
            </Button>
          )}
          {isOccupied && (
            <Button variant="outline" disabled className="text-gray-400">
              Currently Occupied
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
