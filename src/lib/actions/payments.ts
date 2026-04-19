"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { prisma } from "@/lib/db"
import { paymentSchema } from "@/lib/validation"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

function generateTransactionId(): string {
  const prefix = "KS"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

function buildTransactionMeta(method: string, amount: number) {
  return JSON.stringify({
    gateway: "Kiraya Platform (Mock)",
    transactionId: generateTransactionId(),
    method,
    amount,
    currency: "PKR",
    status: "SUCCESS",
    processedAt: new Date().toISOString(),
    gatewayResponse: {
      code: "00",
      message: "Transaction approved",
      authCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
  })
}

export async function recordPayment(
  tenancyId: string,
  tenantId: string,
  input: {
    method: string
    referenceNumber?: string
    amount: number
    paidDate: string
    notes?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const tenancy = await prisma.tenancy.findFirst({
    where: { id: tenancyId, tenantId },
  })
  if (!tenancy) return { ok: false, error: "Tenancy not found" }

  const paidDateObj = new Date(input.paidDate)
  const dueDayOfMonth = new Date(tenancy.startDate).getDate()
  const daysInMonth = new Date(paidDateObj.getFullYear(), paidDateObj.getMonth() + 1, 0).getDate()
  const expectedDate = new Date(paidDateObj.getFullYear(), paidDateObj.getMonth(), Math.min(dueDayOfMonth, daysInMonth))

  const txnMeta = buildTransactionMeta(input.method, input.amount)

  const payment = await prisma.payment.create({
    data: {
      tenancyId,
      expectedDate,
      amount: input.amount,
      paidDate: new Date(input.paidDate),
      method: input.method,
      referenceNumber: input.referenceNumber || null,
      transactionMeta: txnMeta,
      status: "pending",
      weight: 0.5,
      notes: input.notes || null,
    },
  })

  revalidatePath(`/tenant/tenancies/${tenancyId}`)
  revalidatePath("/tenant/dashboard")
  revalidatePath("/landlord/dashboard")
  revalidatePath("/landlord/confirm")
  revalidatePath("/tenant/score")

  return { ok: true, data: { id: payment.id } }
}

export async function confirmPayment(
  paymentId: string,
  landlordId: string
): Promise<ActionResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { tenancy: true },
  })
  if (!payment) return { ok: false, error: "Payment not found" }
  if (payment.tenancy.landlordId !== landlordId) return { ok: false, error: "Unauthorized" }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "confirmed",
      landlordConfirmedAt: new Date(),
      weight: 1.0,
    },
  })

  revalidatePath("/landlord/confirm")
  revalidatePath(`/tenant/tenancies/${payment.tenancyId}`)
  revalidatePath("/tenant/score")

  return { ok: true }
}

export async function getPaymentsForTenancy(tenancyId: string) {
  return prisma.payment.findMany({
    where: { tenancyId },
    orderBy: { expectedDate: "desc" },
  })
}

export async function getPendingPaymentsForLandlord(landlordId: string) {
  return prisma.payment.findMany({
    where: {
      status: "pending",
      tenancy: { landlordId },
    },
    include: {
      tenancy: {
        include: { property: true, tenant: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getLandlordRevenue(landlordId: string): Promise<
  { month: string; amount: number; confirmedCount: number }[]
> {
  const payments = await prisma.payment.findMany({
    where: { status: "confirmed", tenancy: { landlordId } },
    select: { expectedDate: true, amount: true },
    orderBy: { expectedDate: "asc" },
  })

  const grouped = new Map<string, { amount: number; confirmedCount: number }>()
  for (const p of payments) {
    const key = format(new Date(p.expectedDate), "MMM yyyy")
    const existing = grouped.get(key) ?? { amount: 0, confirmedCount: 0 }
    grouped.set(key, { amount: existing.amount + p.amount, confirmedCount: existing.confirmedCount + 1 })
  }

  return Array.from(grouped.entries()).map(([month, data]) => ({ month, ...data }))
}

export async function getLandlordRevenueDetailed(landlordId: string) {
  const payments = await prisma.payment.findMany({
    where: { status: "confirmed", tenancy: { landlordId } },
    select: {
      id: true,
      expectedDate: true,
      amount: true,
      method: true,
      tenancy: {
        select: {
          tenant: { select: { name: true, phone: true } },
          property: { select: { address: true, city: true, title: true } },
        },
      },
    },
    orderBy: { expectedDate: "desc" },
  })

  return payments.map((p) => ({
    id: p.id,
    month: format(new Date(p.expectedDate), "MMM yyyy"),
    expectedDate: p.expectedDate,
    amount: p.amount,
    method: p.method,
    tenantName: p.tenancy.tenant.name,
    tenantPhone: p.tenancy.tenant.phone,
    propertyTitle: p.tenancy.property.title,
    propertyAddress: `${p.tenancy.property.address}, ${p.tenancy.property.city}`,
  }))
}

export async function getTenantPaymentHistory(tenantId: string) {
  return prisma.payment.findMany({
    where: { tenancy: { tenantId } },
    include: {
      tenancy: {
        include: {
          property: { select: { address: true, city: true } },
          landlord: { select: { name: true } },
        },
      },
    },
    orderBy: { expectedDate: "desc" },
  })
}

export async function getLandlordRevenueByTenant(landlordId: string) {
  const tenancies = await prisma.tenancy.findMany({
    where: { landlordId },
    include: {
      tenant: { select: { id: true, name: true, phone: true } },
      property: { select: { address: true, city: true } },
      payments: {
        where: { status: "confirmed" },
        orderBy: { expectedDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return tenancies.map((t) => ({
    tenancyId: t.id,
    tenantName: t.tenant.name,
    tenantPhone: t.tenant.phone,
    tenantId: t.tenant.id,
    address: `${t.property.address}, ${t.property.city}`,
    monthlyRent: t.monthlyRent,
    status: t.status,
    totalPaid: t.payments.reduce((s, p) => s + p.amount, 0),
    paymentCount: t.payments.length,
    lastPayment: t.payments[0] ?? null,
  }))
}

export async function getLandlordTenantPayments(landlordId: string, tenantId: string) {
  return prisma.payment.findMany({
    where: { tenancy: { landlordId, tenantId } },
    include: {
      tenancy: {
        include: { property: { select: { address: true, city: true } } },
      },
    },
    orderBy: { expectedDate: "desc" },
  })
}
