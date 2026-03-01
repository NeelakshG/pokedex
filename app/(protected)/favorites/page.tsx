import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPokemon } from "@/lib/pokeapi"
import TypeCard from "@/components/pokemon/TypeCard"
import Link from "next/link"

export default async function FavoritesPage() {
  const session = await auth()

  const records = await prisma.favouritePokemon.findMany({
    where: { userId: session!.user!.id! },
  })

  const pokemon = await Promise.all(records.map((r) => getPokemon(r.pokemonId)))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Favourites</h1>
        <Link href="/pokedex" className="text-sm text-blue-500 hover:underline">
          ← Back to Pokédex
        </Link>
      </div>

      {pokemon.length === 0 ? (
        <p className="text-gray-400">
          No favourites yet. Head to the Pokédex and click ♥ on a Pokémon to add one!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pokemon.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-4 flex flex-col items-center bg-white shadow-sm"
            >
              <img src={p.sprite} alt={p.name} className="w-24 h-24" />
              <p className="font-semibold capitalize mt-2">{p.name}</p>
              <div className="flex gap-1 mt-2 flex-wrap justify-center">
                {p.types.map((type) => (
                  <TypeCard key={type} type={type} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
