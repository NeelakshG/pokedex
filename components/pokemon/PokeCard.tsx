"use client"

import { usePokedexStore } from "@/lib/pokedexStore"
import TypeCard from "./TypeCard"
import { pokemonTypeColors } from "@/utils/pokemon"

type Pokemon = {
  id: number
  name: string
  types: string[]
  sprite: string
}

function padPokedexNumber(id: number): string {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
}

export default function PokeCard({ poke }: { poke: Pokemon }) {
  const setSelected = usePokedexStore(state => state.setSelected)

  const primaryType = poke.types[0]
  const typeColor = pokemonTypeColors[primaryType as keyof typeof pokemonTypeColors]

  const tintStyle = typeColor
    ? { backgroundColor: `${typeColor.background}18` }
    : {}

  return (
    <div
      onClick={() => setSelected(poke)}
      className="cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-1 bg-white hover:shadow-lg transition-all duration-150 hover:-translate-y-1 hover:opacity-95 select-none"
      style={tintStyle}
    >
      <span className="self-start text-xs text-gray-400 font-mono font-semibold">
        #{padPokedexNumber(poke.id)}
      </span>
      <img
        src={poke.sprite}
        alt={poke.name}
        className="w-20 h-20 object-contain"
        loading="lazy"
      />
      <p className="text-sm font-bold capitalize text-center text-gray-800 mt-1">
        {poke.name}
      </p>
      <div className="flex gap-1 flex-wrap justify-center mt-1">
        {poke.types.map((type) => (
          <TypeCard key={type} type={type} size="sm" />
        ))}
      </div>
    </div>
  )
}
