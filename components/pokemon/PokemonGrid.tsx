"use client"

import { usePokedexStore } from "@/lib/pokedexStore"
import PokeCard from "./PokeCard"

export default function PokemonGrid() {
  const filtered = usePokedexStore(state => state.filteredList)

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-semibold">No Pokemon found</p>
        <p className="text-sm mt-1">Try a different search or type filter</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 pt-2">
      {filtered.map((p) => (
        <PokeCard key={p.id} poke={p} />
      ))}
    </div>
  )
}
