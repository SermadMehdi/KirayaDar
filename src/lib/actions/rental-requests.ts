"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function sendRentalRequest(
  tenantId: string,
  input: {
    propertyId: string
    quotedRent: number
    quotedDeposit: number
    preferredStart: string
    tenantMessage?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    include: { tenancies: { where: { status: "active" } } },
  })
  if (!property) return { ok: false, error: "Property not found" }
  if (property.tenancies.length > 0) return { ok: false, error: "This property is currently occupied" }

  const existing = await prisma.rentalRequest.findFirst({
    where: { tenantId, propertyId: input.propertyId, status: "pending" },
  })
  if (existing) return { ok: false, error: "You already have a pending request for this property" }

  if (tenantId === property.landlordId) return { ok: false, error: "You cannot request your own property" }

  const req = await prisma.rentalRequest.create({
    data: {
      tenantId,
      landlordId: property.landlordId,
      propertyId: input.propertyId,
      quotedRent: input.quotedRent,
      quotedDeposit: input.quotedDeposit,
      preferredStart: new Date(input.preferredStart),
      tenantMessage: input.tenantMessage || null,
      status: "pending",
    },
  })

  revalidatePath("/tenant/rental-requests")
  revalidatePath("/landlord/confirm")

  return { ok: true, data: { id: req.id } }
}

export async function respondToRentalRequest(
  requestId: string,
  landlordId: string,
  input: {
    accept: boolean
    landlordMessage?: string
    agreedRent?: number
    agreedDeposit?: number
    agreedStart?: string
  }
): Promise<ActionResult> {
  const req = await prisma.rentalRequest.findUnique({
    where: { id: requestId },
    include: { property: true },
  })
  if (!req) return { ok: false, error: "Request not found" }
  if (req.landlordId !== landlordId) return { ok: false, error: "Unauthorized" }
  if (req.status !== "pending") return { ok: false, error: "Request already processed" }

  if (!input.accept) {
    await prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status: "rejected", landlordMessage: input.landlordMessage || null },
    })
    revalidatePath("/landlord/confirm")
    revalidatePath("/tenant/rental-requests")
    return { ok: true }
  }

  const agreedRent = input.agreedRent ?? req.quotedRent
  const agreedDeposit = input.agreedDeposit ?? req.quotedDeposit
  const agreedStart = input.agreedStart ? new Date(input.agreedStart) : new Date(req.preferredStart)

  const tenancy = await prisma.tenancy.create({
    data: {
      propertyId: req.propertyId,
      tenantId: req.tenantId,
      landlordId: req.landlordId,
      monthlyRent: agreedRent,
      deposit: agreedDeposit,
      startDate: agreedStart,
      status: "active",
      landlordConfirmedAt: new Date(),
      tenantConfirmedAt: new Date(),
    },
  })

  await prisma.property.update({
    where: { id: req.propertyId },
    data: { available: false },
  })

  await prisma.rentalRequest.update({
    where: { id: requestId },
    data: {
      status: "accepted",
      landlordMessage: input.landlordMessage || null,
      agreedRent,
      agreedDeposit,
      agreedStart,
      tenancyId: tenancy.id,
    },
  })

  revalidatePath("/landlord/confirm")
  revalidatePath("/landlord/dashboard")
  revalidatePath("/tenant/rental-requests")
  revalidatePath("/tenant/dashboard")
  revalidatePath("/tenant/browse")
  revalidatePath("/landlord/properties")

  return { ok: true }
}

export async function getRentalRequestsForTenant(tenantId: string) {
  return prisma.rentalRequest.findMany({
    where: { tenantId },
    include: {
      property: { select: { title: true, address: true, city: true, rentAmount: true } },
      landlord: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getRentalRequestsForLandlord(landlordId: string) {
  return prisma.rentalRequest.findMany({
    where: { landlordId, status: "pending" },
    include: {
      property: { select: { title: true, address: true, city: true } },
      tenant: { select: { id: true, name: true, phone: true, cnic: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function cancelRentalRequest(requestId: string, tenantId: string): Promise<ActionResult> {
  const req = await prisma.rentalRequest.findUnique({ where: { id: requestId } })
  if (!req) return { ok: false, error: "Request not found" }
  if (req.tenantId !== tenantId) return { ok: false, error: "Unauthorized" }
  if (req.status !== "pending") return { ok: false, error: "Cannot cancel a processed request" }

  await prisma.rentalRequest.update({ where: { id: requestId }, data: { status: "rejected", landlordMessage: "Cancelled by tenant" } })

  revalidatePath("/tenant/rental-requests")
  revalidatePath("/landlord/confirm")
  return { ok: true }
}
