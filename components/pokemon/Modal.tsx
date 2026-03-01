"use client"

import { useEffect, useState } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"
import { getPokemon, type PokemonDetail } from "@/lib/pokeapi"
import TypeCard from "@/components/pokemon/TypeCard"

const statLabels: Record<string, string> = {
  "hp":               "HP",
  "attack":           "Attack",
  "defense":          "Defense",
  "special-attack":   "Sp. Atk",
  "special-defense":  "Sp. Def",
  "speed":            "Speed",
}

export default function Modal() {

  const selected    = usePokedexStore(state => state.selectedPokemon)
  const isModalOpen = usePokedexStore(state => state.isModalOpen)
  const closeModal  = usePokedexStore(state => state.closeModal)
  const detailCache = usePokedexStore(state => state.detailCache)
  const cacheDetail = usePokedexStore(state => state.cacheDetail)

  const [detail, setDetail]         = useState<PokemonDetail | null>(null)
  const [loading, setLoading]       = useState(false)
  const [favorited, setFavorited]   = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    if (!isModalOpen || !selected) return

    setFavorited(false)

    // Check store cache first — skip fetch if already loaded
    const cached = detailCache[selected.id]
    if (cached) {
      setDetail(cached)
    } else {
      setDetail(null)
      setLoading(true)
      getPokemon(selected.id).then((data) => {
        cacheDetail(selected.id, data)
        setDetail(data)
        setLoading(false)
      })
    }

    fetch("/api/favorites")
      .then((r) => r.json())
      .then((ids: number[]) => setFavorited(ids.includes(selected.id)))
  }, [selected, isModalOpen])

  async function toggleFavorite() {
    if (!selected || favLoading) return
    setFavLoading(true)

    const method = favorited ? "DELETE" : "POST"
    await fetch("/api/favorites", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pokemonId: selected.id }),
    })

    setFavorited((prev) => !prev)
    setFavLoading(false)
  }

  if (!isModalOpen || !selected) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl p-6 w-[500px] max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold capitalize">{selected.name}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="text-2xl disabled:opacity-50"
              title={favorited ? "Remove from favourites" : "Add to favourites"}
            >
              {favorited ? "♥" : "♡"}
            </button>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sprite + Types */}
        <div className="flex flex-col items-center mb-6">
          <img src={selected.sprite} alt={selected.name} className="w-36 h-36" />
          <div className="flex gap-2 mt-2">
            {selected.types.map((type) => (
              <TypeCard key={type} type={type} />
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-gray-400 py-4">Loading...</p>}

        {detail && (
          <>
            {/* Base Stats */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Base Stats</h3>
              <div className="space-y-2">
                {detail.stats.map((stat) => (
                  <div key={stat.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16 shrink-0">
                      {statLabels[stat.name] ?? stat.name}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(stat.value / 255) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-8 text-right">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Moves */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Moves</h3>
              <div className="flex flex-wrap gap-2">
                {detail.moves.map((move) => (
                  <span
                    key={move}
                    className="px-2 py-1 bg-gray-100 rounded text-xs capitalize"
                  >
                    {move.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
