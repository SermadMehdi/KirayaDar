"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { profileSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, roles: true },
  })
}

export async function getCurrentUserId(): Promise<string | null> {
  return getSession()
}

export async function getCurrentUser() {
  const userId = await getSession()
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      propertiesOwned: { where: { available: true } },
      tenantTenancies: {
        include: { payments: true, property: true, landlord: true },
      },
      landlordTenancies: {
        include: { payments: true, property: true, tenant: true },
      },
      scores: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
  })
}

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function updateProfile(
  userId: string,
  input: { name: string; bio?: string; cnic?: string }
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      bio: input.bio || null,
      cnic: input.cnic || null,
    },
  })

  revalidatePath("/tenant/profile")
  revalidatePath("/landlord/profile")

  return { ok: true }
}
