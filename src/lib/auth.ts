import { createHmac } from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "kiraya_session"
const SECRET = process.env.SESSION_SECRET ?? "kiraya-dev-secret"

function sign(value: string): string {
  const hmac = createHmac("sha256", SECRET)
  hmac.update(value)
  return `${value}.${hmac.digest("hex")}`
}

function unsign(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  return expected === signed ? value : null
}

export function signSession(userId: string): string {
  return sign(userId)
}

export function verifySession(cookie: string): string | null {
  return unsign(cookie)
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return null
  return verifySession(cookie.value)
}

export async function setSession(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// MOCK: replace with real OTP in production
export function verifyOtp(otp: string): boolean {
  return otp === "0000"
}
