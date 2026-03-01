import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getPokemon } from "@/lib/pokeapi"
import TypeCard from "@/components/pokemon/TypeCard"
import Link from "next/link"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  if (session.user.id !== id) redirect(`/profile/${session.user.id}`)

  // Fetch user + all their favourites in one query
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      favorites: true,
    },
  })

  if (!user) redirect("/login")

  // Fetch the first 5 favourited pokemon from PokeAPI
  const top5 = await Promise.all(
    user.favorites.slice(0, 5).map((f) => getPokemon(f.pokemonId))
  )

  const initial = user.name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()
  const totalFavourites = user.favorites.length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-6">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
            <span className="text-3xl font-bold text-white">{initial}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.name ?? "Trainer"}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
          </div>

          {/* Stat */}
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-500">{totalFavourites}</p>
            <p className="text-xs text-gray-400 mt-0.5">Favourites</p>
          </div>
        </div>

        {/* Favourite Pokémon */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Favourite Pokémon</h2>
            <Link href="/favorites" className="text-sm text-blue-500 hover:underline">
              View all →
            </Link>
          </div>

          {top5.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No favourites yet.</p>
              <Link href="/pokedex" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
                Browse the Pokédex to add some ♥
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {top5.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center border rounded-xl p-3 hover:shadow-md transition-shadow"
                >
                  <img src={p.sprite} alt={p.name} className="w-16 h-16" />
                  <p className="text-xs font-semibold capitalize mt-1 text-center">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {p.types.map((type) => (
                      <TypeCard key={type} type={type} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <Link
            href="/pokedex"
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Open Pokédex
          </Link>
          <Link
            href="/favorites"
            className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            All Favourites
          </Link>
        </div>

      </div>
    </div>
  )
}
