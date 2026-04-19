"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { messageSchema } from "@/lib/validation"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function sendMessage(
  senderId: string,
  input: { receiverId: string; content: string }
): Promise<ActionResult<{ id: string }>> {
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  if (senderId === input.receiverId) {
    return { ok: false, error: "Cannot message yourself" }
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId: input.receiverId,
      content: input.content,
    },
  })

  revalidatePath("/messages")
  revalidatePath(`/messages/${input.receiverId}`)

  return { ok: true, data: { id: message.id } }
}

export async function getConversations(userId: string) {
  // Get all unique users this user has exchanged messages with
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    select: { receiverId: true },
    distinct: ["receiverId"],
  })
  const received = await prisma.message.findMany({
    where: { receiverId: userId },
    select: { senderId: true },
    distinct: ["senderId"],
  })

  const partnerIds = new Set([
    ...sent.map((m) => m.receiverId),
    ...received.map((m) => m.senderId),
  ])

  const conversations = await Promise.all(
    Array.from(partnerIds).map(async (partnerId) => {
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, phone: true, roles: true },
      })

      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      })

      const unreadCount = await prisma.message.count({
        where: {
          senderId: partnerId,
          receiverId: userId,
          // In a real app we'd track read status. For now this is simplified.
        },
      })

      return {
        partner,
        lastMessage,
        unreadCount,
      }
    })
  )

  return conversations
    .filter((c) => c.partner !== null)
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() ?? 0
      const bTime = b.lastMessage?.createdAt?.getTime() ?? 0
      return bTime - aTime
    })
}

export async function getMessages(userId: string, partnerId: string) {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}
