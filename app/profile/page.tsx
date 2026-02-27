import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfileRedirect() {

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  redirect(`/profile/${session.user.id}`)
}