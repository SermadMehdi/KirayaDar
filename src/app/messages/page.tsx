import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { getConversations } from "@/lib/actions/messages"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { MessageCircle, User } from "lucide-react"
import { formatDate } from "@/lib/format"

export default async function ConversationsPage() {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const conversations = await getConversations(userId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your conversations with landlords and tenants</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="Start a conversation by messaging a landlord from a property listing, or a tenant from their profile."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.partner!.id} href={`/messages/${c.partner!.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{c.partner!.name}</p>
                      {c.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {formatDate(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {c.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {c.lastMessage.senderId === userId ? "You: " : ""}
                        {c.lastMessage.content}
                      </p>
                    )}
                    <span className="text-xs text-gray-400 capitalize">{c.partner!.roles}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
