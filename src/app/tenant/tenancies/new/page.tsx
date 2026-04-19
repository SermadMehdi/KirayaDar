import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/actions/user"
import { getAcceptedConnectionsByTenant } from "@/lib/actions/connections"
import NewTenancyForm from "./NewTenancyForm"

export default async function NewTenancyPage() {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect("/login")
  }

  const connections = await getAcceptedConnectionsByTenant(userId)

  return <NewTenancyForm connections={connections} />
}
