"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { sendOtpAction, loginAction } from "@/lib/actions/auth"
import { BarChart3, ArrowLeft, Phone, KeyRound } from "lucide-react"

type Step = "phone" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 3) otpRefs[index + 1].current?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await sendOtpAction(phone)
      if (!result.ok) { setErrors({ phone: result.error }); return }
      toast.success("OTP sent — use 0000 for demo.")
      setStep("otp")
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    })
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const code = otp.join("")
    startTransition(async () => {
      const result = await loginAction(phone, code)
      if (!result.ok) { setErrors({ otp: result.error }); return }
      toast.success("Welcome back!")
      router.push(result.data?.roles === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard")
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>

            {step === "phone" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h1>
                  <p className="text-sm text-slate-500">Enter your phone number to log in</p>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                      Phone Number
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="03001234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9"
                        autoComplete="tel"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Demo hint */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-600 mb-1.5">Demo accounts</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span className="text-slate-400">Tenant (Hamza)</span>
                      <span className="font-mono font-medium text-slate-700">03000000001</span>
                      <span className="text-slate-400">Landlord (Ahmad)</span>
                      <span className="font-mono font-medium text-slate-700">03000000002</span>
                      <span className="text-slate-400">OTP for all</span>
                      <span className="font-mono font-medium text-slate-700">0000</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-10" disabled={isPending}>
                    {isPending ? "Sending…" : "Send OTP"}
                  </Button>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="text-center mb-8">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                    onClick={() => setStep("phone")}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">Enter your OTP</h1>
                  <p className="text-sm text-slate-500">
                    Sent to <span className="font-medium text-slate-700">{phone}</span>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div>
                    <div className="flex gap-3 justify-center">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-14 h-14 text-center text-2xl font-bold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="text-red-500 text-xs mt-3 text-center">{errors.otp}</p>
                    )}
                    <p className="text-xs text-center text-slate-400 mt-3">
                      Demo OTP: <span className="font-mono font-semibold text-slate-600">0000</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10"
                    disabled={isPending || otp.join("").length < 4}
                  >
                    {isPending ? "Verifying…" : "Log in"}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-emerald-600 hover:underline font-medium">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
