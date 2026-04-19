"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { propertySchema } from "@/lib/validation"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function createProperty(
  landlordId: string,
  input: {
    title: string
    description?: string
    address: string
    city: string
    rentAmount: number
    bedrooms: number
    bathrooms: number
    area?: number
    imageUrl?: string
    image2Url?: string
    image3Url?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const parsed = propertySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const property = await prisma.property.create({
    data: {
      landlordId,
      title: input.title,
      description: input.description || null,
      address: input.address,
      city: input.city,
      rentAmount: input.rentAmount,
      bedrooms: input.bedrooms || 1,
      bathrooms: input.bathrooms || 1,
      area: input.area || null,
      available: true,
      imageUrl: input.imageUrl || null,
      image2Url: input.image2Url || null,
      image3Url: input.image3Url || null,
    },
  })

  revalidatePath("/landlord/properties")
  revalidatePath("/landlord/dashboard")
  revalidatePath("/tenant/browse")

  return { ok: true, data: { id: property.id } }
}

export async function togglePropertyAvailability(
  propertyId: string,
  landlordId: string
): Promise<ActionResult> {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, landlordId },
  })
  if (!property) return { ok: false, error: "Property not found" }

  await prisma.property.update({
    where: { id: propertyId },
    data: { available: !property.available },
  })

  revalidatePath("/landlord/properties")
  revalidatePath("/tenant/browse")

  return { ok: true }
}

export async function getPropertiesForLandlord(landlordId: string) {
  return prisma.property.findMany({
    where: { landlordId },
    include: { tenancies: { where: { status: "active" }, include: { tenant: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAvailableProperties(filters?: { city?: string; minRent?: number; maxRent?: number }) {
  const where: any = {
    available: true,
    NOT: { tenancies: { some: { status: "active" } } },
  }
  if (filters?.city) where.city = { contains: filters.city }
  if (filters?.minRent) where.rentAmount = { ...where.rentAmount, gte: filters.minRent }
  if (filters?.maxRent) where.rentAmount = { ...where.rentAmount, lte: filters.maxRent }

  return prisma.property.findMany({
    where,
    include: {
      landlord: { select: { id: true, name: true, phone: true } },
      tenancies: { where: { status: "active" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateProperty(
  landlordId: string,
  propertyId: string,
  input: {
    title: string
    description?: string
    address: string
    city: string
    rentAmount: number
    bedrooms: number
    bathrooms: number
    area?: number
    imageUrl?: string
    image2Url?: string
    image3Url?: string
  }
): Promise<ActionResult> {
  const parsed = propertySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const property = await prisma.property.findFirst({ where: { id: propertyId, landlordId } })
  if (!property) return { ok: false, error: "Property not found" }

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      title: input.title,
      description: input.description || null,
      address: input.address,
      city: input.city,
      rentAmount: input.rentAmount,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area || null,
      imageUrl: input.imageUrl || null,
      image2Url: input.image2Url || null,
      image3Url: input.image3Url || null,
    },
  })

  revalidatePath("/landlord/properties")
  revalidatePath("/tenant/browse")
  revalidatePath(`/tenant/browse/${propertyId}`)

  return { ok: true }
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      landlord: {
        select: {
          id: true, name: true, phone: true, bio: true,
          landlordTenancies: { select: { id: true, status: true } },
        },
      },
      tenancies: { where: { status: "active" }, select: { id: true } },
    },
  })
}
