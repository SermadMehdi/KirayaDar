"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { connectionSchema } from "@/lib/validation"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function requestConnection(
  tenantId: string,
  input: { landlordPhone: string }
): Promise<ActionResult<{ id: string }>> {
  const parsed = connectionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const normalizedPhone = input.landlordPhone.replace(/-/g, "")

  const tenant = await prisma.user.findUnique({ where: { id: tenantId } })
  if (!tenant) return { ok: false, error: "Tenant not found" }
  if (tenant.phone === normalizedPhone) return { ok: false, error: "Cannot connect with yourself" }

  let landlord = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  
  if (!landlord) {
    // Auto-create a stub landlord if they are not on platform yet
    landlord = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        name: `Landlord (${normalizedPhone})`,
        roles: "landlord",
      },
    })
  }

  // Check if connection already exists
  const existing = await prisma.connection.findUnique({
    where: {
      tenantId_landlordId: {
        tenantId,
        landlordId: landlord.id,
      }
    }
  })

  if (existing) {
    if (existing.status === "pending") return { ok: false, error: "Connection request already pending" }
    if (existing.status === "accepted") return { ok: false, error: "You are already connected to this landlord" }
    // If rejected, we perhaps allow re-request or just say rejected. 
    return { ok: false, error: "Connection was previously rejected" }
  }

  const connection = await prisma.connection.create({
    data: {
      tenantId,
      landlordId: landlord.id,
      status: "pending"
    }
  })

  revalidatePath("/tenant/connections")
  revalidatePath("/tenant/tenancies/new")

  return { ok: true, data: { id: connection.id } }
}

export async function acceptConnection(
  connectionId: string,
  landlordId: string
): Promise<ActionResult> {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } })
  if (!connection) return { ok: false, error: "Connection request not found" }
  if (connection.landlordId !== landlordId) return { ok: false, error: "Unauthorized" }

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "accepted" }
  })

  revalidatePath("/landlord/connections")
  revalidatePath("/tenant/connections")
  revalidatePath("/tenant/tenancies/new")

  return { ok: true }
}

export async function rejectConnection(
  connectionId: string,
  landlordId: string
): Promise<ActionResult> {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } })
  if (!connection) return { ok: false, error: "Connection request not found" }
  if (connection.landlordId !== landlordId) return { ok: false, error: "Unauthorized" }

  await prisma.connection.update({
    where: { id: connectionId },
    data: { status: "rejected" }
  })

  revalidatePath("/landlord/connections")
  revalidatePath("/tenant/connections")

  return { ok: true }
}

export async function getTenantConnections(tenantId: string) {
  return prisma.connection.findMany({
    where: { tenantId },
    include: { landlord: true },
    orderBy: { createdAt: "desc" }
  })
}

export async function getLandlordConnections(landlordId: string) {
  return prisma.connection.findMany({
    where: { landlordId },
    include: { tenant: true },
    orderBy: { createdAt: "desc" }
  })
}

export async function getAcceptedConnectionsByTenant(tenantId: string) {
  return prisma.connection.findMany({
    where: { tenantId, status: "accepted" },
    include: { landlord: true }
  })
}
