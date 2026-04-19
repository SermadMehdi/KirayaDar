import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getTenanciesForTenant } from "@/lib/actions/tenancies"
import { TenancyCard } from "@/components/tenancy-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Home, Plus } from "lucide-react"

export default async function TenanciesPage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const tenancies = await getTenanciesForTenant(userId)

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tenancies</h1>
          <p className="text-slate-500 text-sm mt-1">All your rental records and active agreements</p>
        </div>
        <Button asChild>
          <Link href="/tenant/tenancies/new">
            <Plus className="w-4 h-4" />
            New Tenancy
          </Link>
        </Button>
      </div>

      {tenancies.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No tenancies yet"
          description="Add your current rental to start recording payments and building your Kiraya Score."
        >
          <Button asChild>
            <Link href="/tenant/tenancies/new">
              <Plus className="w-4 h-4" />
              Add your first tenancy
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {tenancies.map((t) => {
            const dueDayOfMonth = new Date(t.startDate).getDate()
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDayOfMonth, daysInMonth))
            const hasPaymentThisMonth = t.payments.some((p: any) => {
              const d = new Date(p.expectedDate)
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
            const paymentDue = t.status === "active" && now >= dueThisMonth && !hasPaymentThisMonth

            return (
              <TenancyCard
                key={t.id}
                id={t.id}
                address={t.property.address}
                city={t.property.city}
                monthlyRent={t.monthlyRent}
                status={t.status}
                startDate={t.startDate}
                landlordName={t.landlord.name}
                showPayButton={true}
                paymentDue={paymentDue}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
