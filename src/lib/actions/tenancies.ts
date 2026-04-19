"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { tenancySchema } from "@/lib/validation"
import { calculateScore, getScoreBand } from "@/lib/score"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function createTenancy(
  tenantId: string,
  input: {
    landlordPhone: string
    monthlyRent: number
    deposit: number
    address: string
    city: string
    startDate: string
  }
): Promise<ActionResult<{ id: string }>> {
  const parsed = tenancySchema.safeParse({
    ...input,
    monthlyRent: input.monthlyRent,
    deposit: input.deposit,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const normalizedPhone = input.landlordPhone.replace(/-/g, "")

  const landlord = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  if (!landlord) {
    return { ok: false, error: "Landlord not found" }
  }

  // Verify they have an accepted connection
  const connection = await prisma.connection.findUnique({
    where: {
      tenantId_landlordId: {
        tenantId,
        landlordId: landlord.id,
      }
    }
  })

  if (!connection || connection.status !== "accepted") {
    return { ok: false, error: "You must have an accepted connection with this landlord" }
  }

  const property = await prisma.property.create({
    data: {
      landlordId: landlord.id,
      title: `${input.address}`,
      address: input.address,
      city: input.city,
      rentAmount: input.monthlyRent,
    },
  })

  const tenancy = await prisma.tenancy.create({
    data: {
      propertyId: property.id,
      tenantId,
      landlordId: landlord.id,
      monthlyRent: input.monthlyRent,
      deposit: input.deposit,
      startDate: new Date(input.startDate),
      status: "pending",
    },
  })

  revalidatePath("/tenant/tenancies")
  revalidatePath("/tenant/dashboard")
  revalidatePath("/landlord/confirm")

  return { ok: true, data: { id: tenancy.id } }
}

export async function confirmTenancy(
  tenancyId: string,
  landlordId: string
): Promise<ActionResult> {
  const tenancy = await prisma.tenancy.findUnique({ where: { id: tenancyId } })
  if (!tenancy) return { ok: false, error: "Tenancy not found" }
  if (tenancy.landlordId !== landlordId) return { ok: false, error: "Unauthorized" }

  await prisma.tenancy.update({
    where: { id: tenancyId },
    data: { status: "active", landlordConfirmedAt: new Date() },
  })

  await prisma.property.update({
    where: { id: tenancy.propertyId },
    data: { available: false },
  })

  revalidatePath("/landlord/confirm")
  revalidatePath("/landlord/dashboard")
  revalidatePath("/tenant/dashboard")
  revalidatePath("/tenant/browse")
  revalidatePath("/landlord/properties")

  return { ok: true }
}

export async function requestEndTenancy(
  tenancyId: string,
  userId: string,
  role: "tenant" | "landlord"
): Promise<ActionResult> {
  const tenancy = await prisma.tenancy.findUnique({ where: { id: tenancyId } })
  if (!tenancy) return { ok: false, error: "Tenancy not found" }
  if (tenancy.status !== "active") return { ok: false, error: "Tenancy is not active" }

  if (role === "tenant" && tenancy.tenantId !== userId) return { ok: false, error: "Unauthorized" }
  if (role === "landlord" && tenancy.landlordId !== userId) return { ok: false, error: "Unauthorized" }

  const updateData: any = role === "tenant"
    ? { tenantEndRequestedAt: new Date() }
    : { landlordEndRequestedAt: new Date() }

  const updated = await prisma.tenancy.update({
    where: { id: tenancyId },
    data: updateData,
  })

  const bothAgreed = updated.tenantEndRequestedAt && updated.landlordEndRequestedAt
  if (bothAgreed) {
    await prisma.tenancy.update({
      where: { id: tenancyId },
      data: { status: "ended", endDate: new Date() },
    })
    await prisma.property.update({
      where: { id: tenancy.propertyId },
      data: { available: true },
    })
  }

  revalidatePath("/landlord/dashboard")
  revalidatePath("/tenant/dashboard")
  revalidatePath(`/tenant/tenancies/${tenancyId}`)
  revalidatePath("/tenant/tenancies")
  revalidatePath("/landlord/properties")
  revalidatePath("/tenant/browse")

  return { ok: true }
}

export async function getTenanciesForTenant(tenantId: string) {
  return prisma.tenancy.findMany({
    where: { tenantId },
    include: {
      property: true,
      landlord: true,
      payments: { orderBy: { expectedDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getTenancyById(id: string, tenantId: string) {
  return prisma.tenancy.findFirst({
    where: { id, tenantId },
    include: {
      property: true,
      landlord: true,
      payments: { orderBy: { expectedDate: "desc" } },
    },
  })
}

export async function getTenanciesForLandlord(landlordId: string) {
  return prisma.tenancy.findMany({
    where: { landlordId },
    include: {
      property: true,
      tenant: true,
      payments: { orderBy: { expectedDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPendingTenanciesForLandlord(landlordId: string) {
  return prisma.tenancy.findMany({
    where: { landlordId, status: "pending" },
    include: { property: true, tenant: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getTenancyForPayment(tenancyId: string) {
  const t = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: { property: true, landlord: true },
  })
  if (!t) return null
  return {
    id: t.id,
    monthlyRent: t.monthlyRent,
    landlord: { name: t.landlord.name, phone: t.landlord.phone },
    property: { address: t.property.address, city: t.property.city },
  }
}

export async function screenTenant(phone: string): Promise<{
  found: boolean
  score?: number
  scoreBand?: string
  tenureMonths?: number
  onTimeRate?: number
  color?: string
}> {
  const normalizedPhone = phone.replace(/-/g, "")
  const user = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    include: {
      tenantTenancies: {
        include: { payments: true },
      },
    },
  })

  if (!user) return { found: false }

  const allPayments = user.tenantTenancies.flatMap((t) => t.payments)
  const earliestStart = user.tenantTenancies.length > 0
    ? user.tenantTenancies.reduce((min, t) =>
        new Date(t.startDate) < new Date(min.startDate) ? t : min
      ).startDate
    : null

  if (!earliestStart) return { found: false }

  const breakdown = calculateScore(allPayments, new Date(earliestStart))
  if (!breakdown) return { found: false }

  const band = getScoreBand(breakdown.score)

  return {
    found: true,
    score: breakdown.score,
    scoreBand: band.label,
    tenureMonths: breakdown.tenureMonths,
    onTimeRate: breakdown.onTimeRate,
    color: band.color,
  }
}
