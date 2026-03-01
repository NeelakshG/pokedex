"use client"

import { usePokedexStore } from "@/lib/pokedexStore"
import PokeCard from "./PokeCard"

export default function PokemonGrid() {
  const filtered = usePokedexStore(state => state.filteredList)

  return (
    <div className="grid grid-cols-4 gap-4 p-4">

      {filtered.map((p)=>(
        <PokeCard key={p.id} poke={p}/>
      ))}

    </div>
  )
}