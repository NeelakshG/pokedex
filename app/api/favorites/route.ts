import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const favorites = await prisma.favouritePokemon.findMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json(favorites.map((f) => f.pokemonId))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { pokemonId } = await req.json()

  await prisma.favouritePokemon.upsert({
    where: { userId_pokemonId: { userId: session.user.id, pokemonId } },
    create: { userId: session.user.id, pokemonId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { pokemonId } = await req.json()

  await prisma.favouritePokemon.deleteMany({
    where: { userId: session.user.id, pokemonId },
  })

  return NextResponse.json({ ok: true })
}
