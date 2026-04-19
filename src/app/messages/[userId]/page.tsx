"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { sendMessage, getMessages } from "@/lib/actions/messages"
import { getCurrentUserId, getUserById } from "@/lib/actions/user"
import { ArrowLeft, Send, User } from "lucide-react"
import { format } from "date-fns"

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string | Date
  sender: { id: string; name: string }
}

export default function ChatPage() {
  const params = useParams<{ userId: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState("")
  const [text, setText] = useState("")
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const uid = await getCurrentUserId()
      if (!uid) return
      setCurrentUserId(uid)

      const [msgs, partner] = await Promise.all([
        getMessages(uid, params.userId),
        getUserById(params.userId),
      ])
      setMessages(msgs as any)
      if (partner) setPartnerName(partner.name)
    }
    load()
  }, [params.userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!currentUserId) return
    const interval = setInterval(async () => {
      const msgs = await getMessages(currentUserId, params.userId)
      setMessages(msgs as any)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentUserId, params.userId])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !currentUserId) return

    const content = text.trim()
    setText("")

    startTransition(async () => {
      const result = await sendMessage(currentUserId!, {
        receiverId: params.userId,
        content,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      const msgs = await getMessages(currentUserId!, params.userId)
      setMessages(msgs as any)
    })
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/messages">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="font-semibold text-gray-900">{partnerName || "Loading..."}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isMe
                  ? "bg-emerald-600 text-white rounded-br-md"
                  : "bg-white border text-gray-900 rounded-bl-md"
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-emerald-200" : "text-gray-400"}`}>
                  {format(new Date(msg.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          autoFocus
        />
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={isPending || !text.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
