import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSession()
  if (!userId) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect("/login")

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar roles={user.roles} userId={user.id} />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  )
}
