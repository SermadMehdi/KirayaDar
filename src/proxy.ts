import { NextRequest, NextResponse } from "next/server"
import { verifySessionEdge } from "@/lib/auth-edge"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    pathname.startsWith("/tenant") || pathname.startsWith("/landlord") || pathname.startsWith("/messages")

  if (!isProtected) return NextResponse.next()

  const cookie = request.cookies.get("kiraya_session")
  const userId = cookie ? await verifySessionEdge(cookie.value) : null

  if (!userId) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/tenant/:path*", "/landlord/:path*", "/messages/:path*"],
}
