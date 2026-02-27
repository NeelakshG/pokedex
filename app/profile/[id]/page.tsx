import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params   // 👈 THIS IS THE NEW PART

  if (session.user.id !== id) {
    redirect(`/profile/${session.user.id}`)
  }

  return (
    <div>
      Welcome to your profile {session.user.name}
    </div>
  )
}