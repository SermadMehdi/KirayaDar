"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { setSession, clearSession, verifyOtp } from "@/lib/auth"
import { phoneSchema, signupSchema } from "@/lib/validation"

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function sendOtpAction(phone: string): Promise<ActionResult> {
  const result = phoneSchema.safeParse(phone)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0].message }
  }
  // MOCK: replace with real OTP in production
  return { ok: true }
}

export async function checkUserExists(phone: string): Promise<ActionResult<{ exists: boolean }>> {
  const normalizedPhone = phone.replace(/-/g, "")
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  return { ok: true, data: { exists: !!user } }
}

export async function signupAction(
  phone: string,
  otp: string,
  name: string,
  roles: "tenant" | "landlord",
  extra?: { cnic?: string; employmentProof?: string; bankStatement?: string }
): Promise<ActionResult<{ roles: string }>> {
  if (!verifyOtp(otp)) {
    return { ok: false, error: "Invalid OTP. Use 0000 for demo." }
  }

  const parsed = signupSchema.safeParse({ phone, name, roles, ...extra })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const normalizedPhone = phone.replace(/-/g, "")

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  if (existing) {
    return { ok: false, error: "An account with this phone number already exists. Please log in." }
  }

  const user = await prisma.user.create({
    data: {
      phone: normalizedPhone,
      name,
      roles,
      cnic: extra?.cnic || null,
      employmentProof: extra?.employmentProof || null,
      bankStatement: extra?.bankStatement || null,
    },
  })

  await setSession(user.id)
  return { ok: true, data: { roles: user.roles } }
}

export async function loginAction(
  phone: string,
  otp: string
): Promise<ActionResult<{ roles: string; id: string }>> {
  if (!verifyOtp(otp)) {
    return { ok: false, error: "Invalid OTP. Use 0000 for demo." }
  }

  const normalizedPhone = phone.replace(/-/g, "")
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

  if (!user) {
    return { ok: false, error: "No account found with this phone number. Please sign up first." }
  }

  await setSession(user.id)
  return { ok: true, data: { roles: user.roles, id: user.id } }
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect("/")
}
