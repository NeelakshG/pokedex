"use client"

import { useEffect, useState } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"
import { getPokemon, type PokemonDetail } from "@/lib/pokeapi"
import TypeCard from "@/components/pokemon/TypeCard"
import { pokemonTypeColors } from "@/utils/pokemon"

const statLabels: Record<string, string> = {
  "hp":               "HP",
  "attack":           "ATK",
  "defense":          "DEF",
  "special-attack":   "SpA",
  "special-defense":  "SpD",
  "speed":            "SPD",
}

function padPokedexNumber(id: number): string {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
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

  const primaryType = selected.types[0]
  const typeColor = pokemonTypeColors[primaryType as keyof typeof pokemonTypeColors]
  const bannerBg = typeColor?.background ?? "#A8A77A"
  const totalHP = detail?.stats.find(s => s.name === "hp")?.value ?? null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <div
        className="relative flex flex-col w-[340px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl select-none"
        style={{
          background: "#f5f0e8",
          border: "3px solid #c8b06e",
          boxShadow: "0 0 0 6px #8a6e3a, 0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Card Header */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-1"
          style={{ background: `${bannerBg}22` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 font-semibold">
              #{padPokedexNumber(selected.id)}
            </span>
            <h2
              className="text-base font-extrabold capitalize text-gray-900"
              style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
            >
              {selected.name}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {totalHP !== null && (
              <span className="text-sm font-bold text-gray-700">
                <span className="text-xs font-semibold text-gray-400 mr-0.5">HP</span>
                {totalHP}
              </span>
            )}
          </div>
        </div>

        {/* Illustration Banner */}
        <div
          className="relative mx-3 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${bannerBg}cc 0%, ${bannerBg}88 100%)`,
            minHeight: "160px",
            border: "2px solid #c8b06e",
          }}
        >
          <div
            className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-10"
            style={{ background: "#ffffff" }}
          />
          <div
            className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-10"
            style={{ background: "#ffffff" }}
          />
          <img
            src={selected.sprite}
            alt={selected.name}
            className="relative z-10 w-36 h-36 object-contain drop-shadow-lg"
          />
        </div>

        {/* Type Badges + Controls */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex gap-1.5 flex-wrap">
            {selected.types.map((type) => (
              <TypeCard key={type} type={type} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="text-xl disabled:opacity-40 hover:scale-110 transition-all duration-150"
              style={{ color: favorited ? "#DC0A2D" : "#aaa" }}
              title={favorited ? "Remove from favourites" : "Add to favourites"}
            >
              {favorited ? "♥" : "♡"}
            </button>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 text-base font-bold leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t-2" style={{ borderColor: "#c8b06e" }} />

        {/* Card Body */}
        <div className="px-4 py-3 flex flex-col gap-4">

          {loading && (
            <p className="text-center text-gray-400 py-6 text-sm">Loading...</p>
          )}

          {detail && (
            <>
              {/* Base Stats */}
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-widest mb-2"
                  style={{ color: bannerBg }}
                >
                  Base Stats
                </p>
                <div className="space-y-1.5">
                  {detail.stats.map((stat) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 w-8 shrink-0">
                        {statLabels[stat.name] ?? stat.name}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((stat.value / 255) * 100, 100)}%`,
                            background: bannerBg,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold w-7 text-right text-gray-700">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: "#c8b06e99" }} />

              {/* Moves */}
              <div>
                <p
                  className="text-xs font-extrabold uppercase tracking-widest mb-2"
                  style={{ color: bannerBg }}
                >
                  Moves
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.moves.map((move) => (
                    <span
                      key={move}
                      className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                      style={{
                        background: `${bannerBg}22`,
                        color: "#444",
                        border: `1px solid ${bannerBg}55`,
                      }}
                    >
                      {move.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Card Footer */}
        <div
          className="mx-3 mb-3 mt-1 py-1 px-3 rounded-lg text-center"
          style={{ background: `${bannerBg}22`, border: `1px solid ${bannerBg}44` }}
        >
          <p className="text-xs text-gray-400 font-semibold">
            Pokedex No. {padPokedexNumber(selected.id)}
          </p>
        </div>

      </div>
    </div>
  )
}
