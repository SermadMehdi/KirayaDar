import { getCurrentUserId } from "@/lib/actions/user"
import { getLandlordConnections } from "@/lib/actions/connections"
import { Card, CardContent } from "@/components/ui/card"
import { Users, CheckCircle2, XCircle } from "lucide-react"
import { ConnectionActions } from "./ConnectionActions"

export default async function LandlordConnectionsPage() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const connections = await getLandlordConnections(userId)
  const pendingRequests = connections.filter((c) => c.status === "pending")
  const otherConnections = connections.filter((c) => c.status !== "pending")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tenant Requests</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <Users className="w-8 h-8 text-gray-400" />
              <p className="text-gray-500">No new connection requests from tenants.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((conn) => (
              <Card key={conn.id} className="border-emerald-100 bg-emerald-50/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conn.tenant.name}</p>
                    <p className="text-sm text-gray-500">{conn.tenant.phone}</p>
                  </div>
                  <ConnectionActions connectionId={conn.id} landlordId={userId} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold text-gray-700">Past Connections</h2>
        {otherConnections.length === 0 ? (
          <p className="text-gray-500 text-sm">No other connections.</p>
        ) : (
          <div className="space-y-3">
            {otherConnections.map((conn) => (
              <Card key={conn.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conn.tenant.name}</p>
                    <p className="text-sm text-gray-500">{conn.tenant.phone}</p>
                  </div>
                  <div>
                    {conn.status === "accepted" ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="w-4 h-4" /> Accepted
                      </span>
                    ) : (
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
    </div>
  )
}
