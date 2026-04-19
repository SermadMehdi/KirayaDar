"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUserId, getCurrentUser, updateProfile } from "@/lib/actions/user"
import { User, Save } from "lucide-react"

export default function LandlordProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser(u)
      else router.push("/login")
    })
  }, [router])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    const form = new FormData(e.currentTarget)

    startTransition(async () => {
      const userId = await getCurrentUserId()
      if (!userId) return

      const result = await updateProfile(userId, {
        name: form.get("name") as string,
        bio: form.get("bio") as string,
        cnic: form.get("cnic") as string,
      })

      if (!result.ok) {
        setErrors({ form: result.error })
        return
      }

      toast.success("Profile updated!")
    })
  }

  if (!user) return <div className="text-center py-10 text-gray-400">Loading...</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg">{user.name}</p>
              <p className="text-sm font-normal text-gray-500">{user.phone} · {user.roles}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="bio">About You</Label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={user.bio || ""}
                placeholder="Tell tenants about yourself as a landlord..."
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <Label htmlFor="cnic">CNIC (optional)</Label>
              <Input id="cnic" name="cnic" defaultValue={user.cnic || ""} placeholder="35201-1234567-1" className="mt-1" />
            </div>

            {errors.form && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.form}</p>}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
