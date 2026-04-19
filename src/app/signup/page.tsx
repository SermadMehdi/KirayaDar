"use client"

import { useState, useTransition, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { sendOtpAction, checkUserExists, signupAction } from "@/lib/actions/auth"
import {
  BarChart3, ArrowLeft, Phone, KeyRound,
  User, Building2, ShieldCheck, CheckCircle2
} from "lucide-react"

type Step = "phone" | "otp" | "details" | "verification"

const STEPS: Step[] = ["phone", "otp", "details", "verification"]
const STEP_LABELS = ["Phone", "Verify", "Profile", "ID & Finance"]

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < currentIdx
                ? "bg-emerald-600 text-white"
                : i === currentIdx
                ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                : "bg-slate-100 text-slate-400"
            }`}>
              {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] hidden sm:block font-medium ${i === currentIdx ? "text-emerald-700" : "text-slate-400"}`}>
              {STEP_LABELS[i]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 rounded-full transition-colors ${i < currentIdx ? "bg-emerald-500" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") as "tenant" | "landlord" | null

  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [name, setName] = useState("")
  const [roles, setRoles] = useState<"tenant" | "landlord">(defaultRole ?? "tenant")
  const [cnic, setCnic] = useState("")
  const [employmentProof, setEmploymentProof] = useState("")
  const [bankStatement, setBankStatement] = useState("")
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
      const exists = await checkUserExists(phone)
      if (exists.ok && exists.data?.exists) {
        toast.error("Phone already registered — please log in.")
        router.push("/login")
        return
      }
      toast.success("OTP sent — use 0000 for demo.")
      setStep("otp")
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    })
  }

  function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    const code = otp.join("")
    if (code.length !== 4) { setErrors({ otp: "Enter all 4 digits" }); return }
    setStep("details")
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    if (!name.trim()) { setErrors({ name: "Full name is required" }); return }
    setStep("verification")
  }

  function handleVerificationSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    startTransition(async () => {
      const result = await signupAction(phone, otp.join(""), name, roles, {
        cnic: cnic || undefined,
        employmentProof: employmentProof || undefined,
        bankStatement: bankStatement || undefined,
      })
      if (!result.ok) { setErrors({ form: result.error }); return }
      toast.success("Account created! Welcome to Kiraya Score.")
      router.push(result.data?.roles === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard")
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
              <p className="text-sm text-slate-500">
                {step === "phone" && "Enter your phone number to get started"}
                {step === "otp" && "Enter the OTP sent to your phone"}
                {step === "details" && "Set up your profile"}
                {step === "verification" && "Add ID and financial details"}
              </p>
            </div>

            <StepIndicator current={step} />

            {/* Step: Phone */}
            {step === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="phone" type="tel" placeholder="03001234567"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="pl-9" autoComplete="tel" />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
                </div>
                <Button type="submit" className="w-full h-10" disabled={isPending}>
                  {isPending ? "Sending…" : "Send OTP"}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-emerald-600 hover:underline font-medium">Log in</Link>
                </p>
              </form>
            )}

            {/* Step: OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center mt-4">
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
                  {errors.otp && <p className="text-red-500 text-xs mt-3">{errors.otp}</p>}
                  <p className="text-xs text-slate-400 mt-3">
                    Demo OTP: <span className="font-mono font-semibold text-slate-600">0000</span>
                  </p>
                </div>
                <Button type="submit" className="w-full h-10" disabled={otp.join("").length < 4}>
                  Verify OTP
                </Button>
                <button type="button" onClick={() => setStep("phone")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </form>
            )}

            {/* Step: Details */}
            {step === "details" && (
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="name" type="text" placeholder="Ahmed Ali"
                      value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">I am joining as</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { role: "tenant" as const, icon: User, title: "Tenant", sub: "I rent a property" },
                      { role: "landlord" as const, icon: Building2, title: "Landlord", sub: "I own property" },
                    ].map(({ role, icon: Icon, title, sub }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoles(role)}
                        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          roles === role
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${roles === role ? "text-emerald-600" : "text-slate-400"}`} />
                        <span>{title}</span>
                        <span className="text-xs font-normal text-slate-400">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-10" disabled={!name.trim()}>Continue</Button>
                <button type="button" onClick={() => setStep("otp")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </form>
            )}

            {/* Step: Verification */}
            {step === "verification" && (
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-600 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    Adding your details makes you a <strong className="text-slate-800">Verified</strong> account
                    and increases trust with {roles === "tenant" ? "landlords" : "tenants"}. All fields optional.
                  </p>
                </div>

                {[
                  {
                    id: "cnic", label: "CNIC Number", placeholder: "35202-1234567-1",
                    hint: "Format: XXXXX-XXXXXXX-X", value: cnic, setter: setCnic,
                  },
                  {
                    id: "employment",
                    label: roles === "tenant" ? "Employment / Income Proof" : "Property Ownership Proof",
                    placeholder: roles === "tenant" ? "e.g. Employed at Systems Ltd" : "e.g. Registry No. 1234",
                    hint: undefined, value: employmentProof, setter: setEmploymentProof,
                  },
                  {
                    id: "bank",
                    label: roles === "tenant" ? "Active Bank Account" : "Business / Rental Account",
                    placeholder: "e.g. HBL account ending 4521",
                    hint: undefined, value: bankStatement, setter: setBankStatement,
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                      {field.label}{" "}
                      <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      id={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="mt-1.5"
                    />
                    {field.hint && <p className="text-xs text-slate-400 mt-1">{field.hint}</p>}
                  </div>
                ))}

                {errors.form && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{errors.form}</p>
                )}

                <Button type="submit" className="w-full h-10" disabled={isPending}>
                  {isPending ? "Creating account…" : "Create Account"}
                </Button>
                <button type="button" onClick={() => setStep("details")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
