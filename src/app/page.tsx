import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import {
  BarChart3, CheckCircle2, Shield,
  ArrowRight, Star, Users, TrendingUp, Building2, User,
  Smartphone, Receipt, Search, Lock, Zap
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32 text-center overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
            <BarChart3 className="w-3.5 h-3.5" />
            Pakistan&apos;s First Rental Reputation Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900">
            Build rental trust.{" "}
            <br className="hidden sm:block" />
            <span className="text-emerald-600">On both sides.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tenants build a verified payment record. Landlords screen smarter.
            Kirayadar brings transparency to Pakistan&apos;s rental market — for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup?role=tenant">
                I&apos;m a Tenant
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50"
              asChild
            >
              <Link href="/signup?role=landlord">I&apos;m a Landlord</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </section>

      {/* Two-column benefits */}
      <section className="px-4 py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-12">Who it&apos;s for</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tenant */}
            <div className="bg-white border border-emerald-100 rounded-2xl p-8 shadow-sm">
              <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Tenants</h3>
              <p className="text-slate-500 text-sm mb-6">Your rent payments, finally on the record</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Build a Kirayadar Score (300–850)",
                  "Works with JazzCash, Easypaisa, Bank, Raast",
                  "Share your score to unlock better homes",
                  "Dispute inaccurate payment records",
                  "Always 100% free — no hidden charges",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/signup?role=tenant">Get started free <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>

            {/* Landlord */}
            <div className="bg-white border border-blue-100 rounded-2xl p-8 shadow-sm">
              <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Landlords</h3>
              <p className="text-slate-500 text-sm mb-6">Screen smarter, manage better</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Instantly screen tenants by phone number",
                  "Verify rent payments with one tap",
                  "Get full verified payment history",
                  "Reduce rental risk with data-backed decisions",
                  "Free to list properties",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                <Link href="/signup?role=landlord">List a property free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Three simple steps to build your score and become the tenant every landlord trusts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                icon: Smartphone,
                title: "Record your payment",
                description: "Pay rent through JazzCash, Easypaisa, bank, or Raast as you always do. Log your transaction reference on Kirayadar — takes 30 seconds.",
              },
              {
                step: "02",
                icon: CheckCircle2,
                title: "Landlord confirms",
                description: "Your landlord gets notified and verifies receipt with one tap. Both sides now have a verified, shared record.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Your score grows",
                description: "After 3 confirmed payments, your Kirayadar Score (300–850) is generated. Share it to unlock better rentals.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    Step {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="px-4 py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Everything you need</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-base">Built specifically for Pakistan&apos;s rental market</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Smartphone, color: "emerald", title: "All Payment Methods", desc: "JazzCash, Easypaisa, bank transfer, Raast — record any payment you make." },
              { icon: CheckCircle2, color: "blue", title: "Landlord Verification", desc: "Landlords confirm payments with one tap. Creates a tamper-proof verified record." },
              { icon: BarChart3, color: "violet", title: "300–850 Score", desc: "Standardized Kirayadar Score based on consistency, tenure, and verification." },
              { icon: Search, color: "indigo", title: "Instant Screening", desc: "Landlords look up any registered tenant by phone number in seconds." },
              { icon: Receipt, color: "amber", title: "Full Payment History", desc: "Every confirmed payment builds a transparent, verifiable rental record." },
              { icon: Lock, color: "rose", title: "Privacy First", desc: "Screening results are anonymized. No address or details shared without consent." },
            ].map((f) => {
              const iconClass: Record<string, string> = {
                emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
                blue: "bg-blue-50 border-blue-100 text-blue-600",
                violet: "bg-violet-50 border-violet-100 text-violet-600",
                indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
                amber: "bg-amber-50 border-amber-100 text-amber-600",
                rose: "bg-rose-50 border-rose-100 text-rose-600",
              }
              return (
                <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-sm transition-shadow">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${iconClass[f.color]}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-16 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Users, stat: "15M+", label: "Urban renters in Pakistan" },
              { icon: Shield, stat: "100%", label: "No money held — ever" },
              { icon: Star, stat: "Free", label: "Always free for tenants" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{item.stat}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Score Card / Landlord section */}
      <section className="px-4 py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 mb-4">
                <TrendingUp className="w-3.5 h-3.5" />
                For Landlords
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Know who you&apos;re renting to.
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Screen prospective tenants by phone number in seconds. See their Kirayadar Score,
                payment history length, and on-time rate — all anonymized to protect their privacy.
              </p>
              <Button variant="outline" className="border-slate-300" asChild>
                <Link href="/signup?role=landlord">List a property free</Link>
              </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sample score card</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-700">HK</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Registered Tenant</p>
                  <p className="text-xs text-slate-400">Account verified</p>
                </div>
                <div className="ml-auto bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Excellent
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "782", label: "Kirayadar Score" },
                  { value: "18", label: "Months history" },
                  { value: "94%", label: "On-time rate" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">Results are anonymized to protect tenant privacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Start in under 2 minutes
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Build your rental record today.
          </h2>
          <p className="text-slate-400 mb-8 text-base">
            Free for tenants. Works with every payment method in Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup?role=tenant">
                Create free account
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-slate-600 text-white hover:bg-slate-800" asChild>
              <Link href="/signup?role=landlord">List a property</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-4 py-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <div className="w-5 h-5 bg-emerald-600 rounded-md flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            Kirayadar
          </div>
          <p>© 2025 Kirayadar. Building rental trust in Pakistan.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-700 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-slate-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
