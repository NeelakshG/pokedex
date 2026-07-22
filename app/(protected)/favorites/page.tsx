import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPokemon } from "@/lib/pokeapi"
import TypeCard from "@/components/pokemon/TypeCard"
import Link from "next/link"
import { pokemonTypeColors } from "@/utils/pokemon"

function padPokedexNumber(id: number): string {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
}

export default async function FavoritesPage() {
  const session = await auth()

  const records = await prisma.favouritePokemon.findMany({
    where: { userId: session!.user!.id! },
  })

  const pokemon = await Promise.all(records.map((r) => getPokemon(r.pokemonId)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div
        className="px-8 py-4 flex items-center justify-between shadow-md"
        style={{ backgroundColor: "#DC0A2D" }}
      >
        <h1
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
        >
          ● My Favourites
        </h1>
        <Link
          href="/pokedex"
          className="text-sm font-semibold text-white/80 hover:text-white
                     border border-white/30 hover:border-white/60 px-3 py-1.5
                     rounded-lg transition-colors duration-150"
        >
          ← Back to Pokédex
        </Link>
      </div>

      <div className="p-8">
        {pokemon.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-6xl mb-4 text-gray-300">●</span>
            <p className="text-xl font-bold text-gray-500">No favourites yet</p>
            <p className="text-sm mt-2 text-gray-400 text-center max-w-xs">
              Head to the Pokédex and click ♥ on a Pokémon card to add it here
            </p>
            <Link
              href="/pokedex"
              className="mt-6 px-5 py-2 rounded-lg text-sm font-bold text-white
                         transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#DC0A2D" }}
            >
              Go to Pokédex
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pokemon.map((p) => {
              const primaryType = p.types[0]
              const typeColor = pokemonTypeColors[primaryType as keyof typeof pokemonTypeColors]
              const tintStyle = typeColor
                ? { backgroundColor: `${typeColor.background}18` }
                : {}

              return (
                <div
                  key={p.id}
                  className="border rounded-xl p-3 flex flex-col items-center gap-1
                             bg-white shadow-sm"
                  style={tintStyle}
                >
                  {/* Pokédex number */}
                  <span className="self-start text-xs text-gray-400 font-mono font-semibold">
                    #{padPokedexNumber(p.id)}
                  </span>

                  {/* Sprite */}
                  <img
                    src={p.sprite}
                    alt={p.name}
                    className="w-20 h-20 object-contain"
                  />

                  {/* Name */}
                  <p className="text-sm font-bold capitalize text-center text-gray-800 mt-1">
                    {p.name}
                  </p>

                  {/* Type badges */}
                  <div className="flex gap-1 mt-1 flex-wrap justify-center">
                    {p.types.map((type) => (
                      <TypeCard key={type} type={type} size="sm" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
