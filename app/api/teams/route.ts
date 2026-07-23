import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET — list user's teams
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const teams = await prisma.team.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(teams)
}

// POST — create a new team
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, pokemonIds } = await req.json()
  if (!Array.isArray(pokemonIds) || pokemonIds.length > 6) {
    return NextResponse.json({ error: "Invalid team data" }, { status: 400 })
  }

  const team = await prisma.team.create({
    data: { userId: session.user.id, name: name ?? "My Team", pokemonIds },
  })
  return NextResponse.json(team, { status: 201 })
}

// PATCH — update team name or pokemon
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { teamId, name, pokemonIds } = await req.json()
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!team || team.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { ...(name && { name }), ...(pokemonIds && { pokemonIds }) },
  })
  return NextResponse.json(updated)
}

// DELETE — remove a team
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { teamId } = await req.json()
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!team || team.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.team.delete({ where: { id: teamId } })
  return NextResponse.json({ success: true })
}
