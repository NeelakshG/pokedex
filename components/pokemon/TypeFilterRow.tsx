"use client"

import { usePokedexStore } from "@/lib/pokedexStore"
import { POKEMON_TYPES } from "@/utils/pokemon"
import TypeCard from "./TypeCard"

export default function TypeFilterRow() {
  const activeTypeFilter = usePokedexStore(state => state.activeTypeFilter)
  const setTypeFilter    = usePokedexStore(state => state.setTypeFilter)

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2 items-center">
      {/* "All" pill */}
      <button
        onClick={() => setTypeFilter(null)}
        className={`px-3 py-0.5 rounded-full text-xs font-bold capitalize
                    border transition-all duration-150
                    ${activeTypeFilter === null
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                    }`}
      >
        All
      </button>

      {/* One pill per type */}
      {POKEMON_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => setTypeFilter(activeTypeFilter === type ? null : type)}
          className="transition-all duration-150 hover:opacity-90"
          title={`Filter by ${type}`}
        >
          <TypeCard
            type={type}
            size="sm"
            active={activeTypeFilter === type}
          />
        </button>
      ))}
    </div>
  )
}
