import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, CreditCard, ArrowRight } from "lucide-react"
import { formatPKR, formatDate } from "@/lib/format"

interface TenancyCardProps {
  id: string
  address: string
  city: string
  monthlyRent: number
  status: string
  startDate: Date | string
  landlordName: string
  showPayButton?: boolean
  paymentDue?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending",  className: "bg-amber-50 text-amber-700 border-amber-200" },
  active:  { label: "Active",   className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ended:   { label: "Ended",    className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function TenancyCard({
  id,
  address,
  city,
  monthlyRent,
  status,
  startDate,
  landlordName,
  showPayButton = false,
  paymentDue = false,
}: TenancyCardProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.className}>
                {config.label}
              </Badge>
              {paymentDue && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Payment Due
                </Badge>
              )}
            </div>

            <div className="flex items-start gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span className="font-semibold text-sm truncate">{address}, {city}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{formatPKR(monthlyRent)}</span>
                <span>/mo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Since {formatDate(startDate)}
              </span>
            </div>

            <p className="text-xs text-slate-400">Landlord: {landlordName}</p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {showPayButton && status === "active" && (
              <Button size="sm" asChild>
                <Link href={`/tenant/pay/${id}`}>Pay Rent</Link>
              </Button>
            )}
            <Button size="sm" variant="outline" className="border-slate-300" asChild>
              <Link href={`/tenant/tenancies/${id}`}>
                View <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
