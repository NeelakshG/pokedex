"use client"

import { usePokedexStore } from "@/lib/pokedexStore"

function padPokedexNumber(id: number): string {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
}

export default function SideNav() {
  const pokemonList    = usePokedexStore(state => state.pokemonList)
  const filteredList   = usePokedexStore(state => state.filteredList)
  const searchQuery    = usePokedexStore(state => state.searchQuery)
  const setSelected    = usePokedexStore(state => state.setSelected)
  const setSearchQuery = usePokedexStore(state => state.setSearchQuery)

  return (
    <div
      className="w-64 h-screen sticky top-0 overflow-y-auto flex flex-col"
      style={{ backgroundColor: "#DC0A2D" }}
    >
      <div className="px-4 pt-5 pb-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
          Pokedex
        </p>
        <input
          type="text"
          placeholder="Search Pokemon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder:text-white/50 border border-white/20 outline-none focus:bg-white/20 focus:border-white/40 transition-colors"
        />
        <p className="text-white/40 text-xs mt-2 text-right">
          {filteredList.length} / {pokemonList.length}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        {filteredList.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-white/10 transition-colors duration-100"
          >
            <span className="text-white/40 font-mono text-xs shrink-0 w-9">
              #{padPokedexNumber(p.id)}
            </span>
            <span className="text-sm font-medium capitalize truncate">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
