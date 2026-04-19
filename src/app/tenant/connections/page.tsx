import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTenantConnections } from "@/lib/actions/connections"
import { getCurrentUserId } from "@/lib/actions/user"
import { UserPlus, Clock, CheckCircle2, XCircle } from "lucide-react"

export default async function TenantConnectionsList() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const connections = await getTenantConnections(userId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Landlords</h1>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/tenant/connections/new">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Landlord
          </Link>
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">You haven't connected with any landlords yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{conn.landlord.name}</p>
                  <p className="text-sm text-gray-500">{conn.landlord.phone}</p>
                </div>
                <div>
                  {conn.status === "pending" && (
                    <span className="flex items-center gap-1 text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                  )}
                  {conn.status === "accepted" && (
                    <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-4 h-4" /> Connected
                    </span>
                  )}
                  {conn.status === "rejected" && (
                    <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                      <XCircle className="w-4 h-4" /> Rejected
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
