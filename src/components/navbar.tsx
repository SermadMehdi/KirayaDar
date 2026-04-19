"use client"

import Link from "next/link"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/actions/auth"
import {
  Home, LogOut, BarChart3, MessageCircle, Search,
  User, Building2, Receipt, TrendingUp, CheckSquare
} from "lucide-react"

interface NavbarProps {
  roles?: string
  userId?: string
}

export function Navbar({ roles, userId }: NavbarProps) {
  const [isPending, startTransition] = useTransition()

  const isLandlord = roles === "landlord"
  const isTenant = roles === "tenant"
  const dashboardHref = !userId ? "/" : isLandlord ? "/landlord/dashboard" : "/tenant/dashboard"

  function handleLogout() {
    startTransition(async () => { await logoutAction() })
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href={dashboardHref}
          className="flex items-center gap-2 font-bold text-slate-900 shrink-0"
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isLandlord ? "bg-blue-500" : "bg-emerald-500"}`}>
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base">Kirayadar</span>
          {isLandlord && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded-md">
              Landlord
            </span>
          )}
          {isTenant && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-md">
              Tenant
            </span>
          )}
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {userId && (
            <>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                <Link href={dashboardHref}>
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>

              {isTenant && (
                <>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                    <Link href="/tenant/browse">
                      <Search className="w-4 h-4" />
                      <span className="hidden md:inline">Browse</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                    <Link href="/tenant/history">
                      <Receipt className="w-4 h-4" />
                      <span className="hidden md:inline">History</span>
                    </Link>
                  </Button>
                </>
              )}

              {isLandlord && (
                <>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                    <Link href="/landlord/properties">
                      <Building2 className="w-4 h-4" />
                      <span className="hidden md:inline">Properties</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                    <Link href="/landlord/confirm">
                      <CheckSquare className="w-4 h-4" />
                      <span className="hidden md:inline">Approvals</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                    <Link href="/landlord/revenue">
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden md:inline">Revenue</span>
                    </Link>
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                <Link href="/messages">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Messages</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0" asChild>
                <Link href={isLandlord ? "/landlord/profile" : "/tenant/profile"}>
                  <User className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 shrink-0"
                onClick={handleLogout}
                disabled={isPending}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}

          {!userId && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
