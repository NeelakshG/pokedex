"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getPokemonList } from "@/lib/pokeapi"
import { pokemonTypeColors } from "@/utils/pokemon"
import type { AnalysisResult } from "@/app/api/teams/analyze/route"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PokemonData = {
  id: number
  name: string
  sprite: string
  types: string[]
  stats: Array<{ name: string; value: number }>
}

type SavedTeam = {
  id: string
  name: string
  pokemonIds: number[]
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function padId(id: number) {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
}

function getTypeStyle(type: string) {
  const colors = pokemonTypeColors[type as keyof typeof pokemonTypeColors]
  return colors ? { background: colors.background, color: colors.color } : {}
}

function getPrimaryTint(types: string[]) {
  const colors = pokemonTypeColors[types[0] as keyof typeof pokemonTypeColors]
  return colors ? `${colors.background}22` : "#f3f4f6"
}

function classifyRole(stats: Array<{ name: string; value: number }>): string {
  const get = (n: string) => stats.find(s => s.name === n)?.value ?? 0
  const atk = get("attack"), spa = get("special-attack"), def = get("defense")
  const spd = get("special-defense"), spe = get("speed"), hp = get("hp")
  if (atk >= 110 && spe >= 90) return "Physical Sweeper"
  if (spa >= 110 && spe >= 90) return "Special Sweeper"
  if (def >= 100 && hp >= 80) return "Physical Wall"
  if (spd >= 100 && hp >= 80) return "Special Wall"
  if ((atk >= 100 || spa >= 100) && (hp >= 90 || def >= 90)) return "Bulky Attacker"
  if (spe >= 110) return "Speed Control"
  return "Support"
}

const GRADE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  S: { bg: "#c8b06e", text: "#fff", label: "Legendary" },
  A: { bg: "#22c55e", text: "#fff", label: "Strong" },
  B: { bg: "#3b82f6", text: "#fff", label: "Solid" },
  C: { bg: "#eab308", text: "#1a1a1a", label: "Decent" },
  D: { bg: "#f97316", text: "#fff", label: "Weak" },
  F: { bg: "#ef4444", text: "#fff", label: "Critical" },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={getTypeStyle(type)}
    >
      {type}
    </span>
  )
}

function FilledSlot({
  poke,
  active,
  onClick,
  onRemove,
}: {
  poke: PokemonData
  active: boolean
  onClick: () => void
  onRemove: () => void
}) {
  return (
    <div
      className="relative rounded-2xl border-2 p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg select-none"
      style={{
        backgroundColor: getPrimaryTint(poke.types),
        borderColor: active ? "#DC0A2D" : "#e5e7eb",
        boxShadow: active ? "0 0 0 3px #DC0A2D" : undefined,
      }}
      onClick={onClick}
    >
      {/* Remove button */}
      <button
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 hover:bg-red-100 text-gray-500 hover:text-[#DC0A2D] flex items-center justify-center text-xs font-bold transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        aria-label={`Remove ${poke.name}`}
      >
        ✕
      </button>
      <span className="text-xs text-gray-400 font-mono font-semibold self-start">
        #{padId(poke.id)}
      </span>
      <img src={poke.sprite} alt={poke.name} className="w-16 h-16 object-contain" loading="lazy" />
      <p className="text-xs font-bold capitalize text-gray-800 text-center leading-tight">{poke.name}</p>
      <div className="flex gap-1 flex-wrap justify-center">
        {poke.types.map(t => <TypeBadge key={t} type={t} />)}
      </div>
      <span className="text-[10px] text-gray-500 font-medium mt-0.5">{classifyRole(poke.stats)}</span>
    </div>
  )
}

function EmptySlot({ active, index, onClick }: { active: boolean; index: number; onClick: () => void }) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 min-h-[160px]"
      style={{
        borderColor: active ? "#DC0A2D" : "#d1d5db",
        backgroundColor: active ? "#DC0A2D0A" : "#f9fafb",
        boxShadow: active ? "0 0 0 3px #DC0A2D" : undefined,
      }}
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
        style={{ backgroundColor: active ? "#DC0A2D" : "#e5e7eb", color: active ? "#fff" : "#9ca3af" }}
      >
        +
      </div>
      <span className="text-xs font-semibold" style={{ color: active ? "#DC0A2D" : "#9ca3af" }}>
        {active ? "Pick a Pokémon" : `Slot ${index + 1}`}
      </span>
    </div>
  )
}

function PickerCard({
  poke,
  inTeam,
  onClick,
}: {
  poke: PokemonData
  inTeam: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={inTeam ? undefined : onClick}
      className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition-all duration-100 select-none ${
        inTeam
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={{ backgroundColor: getPrimaryTint(poke.types) }}
    >
      <span className="text-[10px] text-gray-400 font-mono self-start">#{padId(poke.id)}</span>
      <img src={poke.sprite} alt={poke.name} className="w-12 h-12 object-contain" loading="lazy" />
      <p className="text-[10px] font-bold capitalize text-center text-gray-800 leading-tight">{poke.name}</p>
      <div className="flex gap-0.5 flex-wrap justify-center">
        {poke.types.map(t => (
          <span
            key={t}
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
            style={getTypeStyle(t)}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function GradeBadge({ grade }: { grade: AnalysisResult["grade"] }) {
  const style = GRADE_STYLES[grade]
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black shadow-lg"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {grade}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: style.bg }}>
        {style.label}
      </span>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22c55e" :
    score >= 65 ? "#3b82f6" :
    score >= 50 ? "#eab308" :
    score >= 35 ? "#f97316" : "#ef4444"
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
        <span>Team Score</span>
        <span style={{ color }}>{score}/100</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function AnalysisPanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 mt-8">
      {/* Header row */}
      <div className="flex items-start gap-6 mb-6">
        <GradeBadge grade={result.grade} />
        <div className="flex-1 flex flex-col gap-3">
          <ScoreBar score={result.overallScore} />
          {/* Summary callout */}
          <div
            className="rounded-xl p-3 text-sm text-gray-700 leading-relaxed"
            style={{ backgroundColor: "#DC0A2D0A", borderLeft: "4px solid #DC0A2D" }}
          >
            {result.summary}
          </div>
        </div>
      </div>

      {/* MVP */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 mb-5"
        style={{ backgroundColor: "#fef9c3", border: "1px solid #fde047" }}
      >
        <span className="text-xl" aria-hidden="true">&#11088;</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-yellow-700">MVP</p>
          <p className="text-sm text-gray-800">{result.mvp}</p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">
            Strengths
          </h4>
          <ul className="flex flex-col gap-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5 shrink-0">&#10003;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 mb-2">
            Weaknesses
          </h4>
          <ul className="flex flex-col gap-1.5">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 font-bold mt-0.5 shrink-0">&#10007;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Critical Threat */}
      <div
        className="rounded-xl p-3 mb-5"
        style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5" }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
          &#9888; Critical Threat
        </p>
        <p className="text-sm text-gray-800">{result.criticalThreat}</p>
      </div>

      {/* Suggested Replacements */}
      {result.suggestedReplacements.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Suggested Replacements
          </h4>
          <div className="flex flex-col gap-2">
            {result.suggestedReplacements.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-3 flex items-start gap-3"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-500 capitalize">{r.remove}</span>
                  <span className="text-gray-400 text-sm" aria-hidden="true">&#8594;</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: "#DC0A2D18", color: "#DC0A2D" }}
                  >
                    {r.addType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.cached && (
        <p className="text-xs text-gray-400 mt-4 text-right">&#128274; Cached result</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function TeamBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params?.teamId as string
  const isNew = teamId === "new"

  const [teamName, setTeamName] = useState("My Team")
  const [teamSlots, setTeamSlots] = useState<(PokemonData | null)[]>(Array(6).fill(null))
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([])
  const [loadingPokemon, setLoadingPokemon] = useState(true)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [existingTeamId, setExistingTeamId] = useState<string | null>(null)

  // Load Pokémon list on mount
  useEffect(() => {
    getPokemonList(151).then((list) => {
      setAllPokemon(list as PokemonData[])
      setLoadingPokemon(false)
    })
  }, [])

  // Load existing team if not new
  useEffect(() => {
    if (isNew) return
    fetch("/api/teams")
      .then(r => r.json())
      .then((teams: SavedTeam[]) => {
        const team = teams.find((t) => t.id === teamId)
        if (!team) return
        setTeamName(team.name)
        setExistingTeamId(team.id)
        // We'll fill slots once pokemon list is ready
        // Store ids for later resolution
        ;(window as Window & { __pendingTeamIds?: number[] }).__pendingTeamIds = team.pokemonIds
      })
  }, [teamId, isNew])

  // Resolve pending team ids once pokemon list loads
  useEffect(() => {
    const w = window as Window & { __pendingTeamIds?: number[] }
    if (!allPokemon.length || !w.__pendingTeamIds) return
    const ids = w.__pendingTeamIds
    delete w.__pendingTeamIds
    const slots: (PokemonData | null)[] = Array(6).fill(null)
    ids.slice(0, 6).forEach((id, i) => {
      const poke = allPokemon.find(p => p.id === id)
      if (poke) slots[i] = poke
    })
    setTeamSlots(slots)
  }, [allPokemon])

  const filledSlots = teamSlots.filter(Boolean) as PokemonData[]

  const handleSlotClick = useCallback((index: number) => {
    if (teamSlots[index]) {
      // Toggle active for the filled slot — clicking active filled slot deselects
      setSelectedSlot(prev => (prev === index ? null : index))
    } else {
      setSelectedSlot(prev => (prev === index ? null : index))
    }
  }, [teamSlots])

  const handleRemove = useCallback((index: number) => {
    setTeamSlots(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
    if (selectedSlot === index) setSelectedSlot(null)
    setAnalysis(null)
  }, [selectedSlot])

  const handlePickPokemon = useCallback((poke: PokemonData) => {
    if (selectedSlot === null) {
      // Find first empty slot
      const first = teamSlots.findIndex(s => s === null)
      if (first === -1) return
      setTeamSlots(prev => {
        const next = [...prev]
        next[first] = poke
        return next
      })
      setSelectedSlot(null)
    } else {
      setTeamSlots(prev => {
        const next = [...prev]
        next[selectedSlot] = poke
        return next
      })
      // Move to next empty slot
      const nextEmpty = teamSlots.findIndex((s, i) => i > selectedSlot && s === null)
      setSelectedSlot(nextEmpty === -1 ? null : nextEmpty)
    }
    setAnalysis(null)
  }, [selectedSlot, teamSlots])

  const handleAnalyze = async () => {
    const ids = filledSlots.map(p => p.id)
    if (ids.length < 2) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch("/api/teams/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemonIds: ids }),
      })
      const data = await res.json()
      if (res.ok) setAnalysis(data)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const ids = teamSlots.map(s => s?.id ?? null).filter((id): id is number => id !== null)
    try {
      const res = await fetch("/api/teams", {
        method: existingTeamId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(existingTeamId ? { teamId: existingTeamId } : {}),
          name: teamName,
          pokemonIds: ids,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!existingTeamId) {
          setExistingTeamId(data.id)
          router.replace(`/teams/${data.id}`)
        }
      } else {
        setSaveError("Failed to save team. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const filteredPokemon = searchQuery
    ? allPokemon.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allPokemon

  const teamIds = new Set(filledSlots.map(p => p.id))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="px-6 py-3 flex justify-between items-center shadow-md shrink-0"
        style={{ backgroundColor: "#DC0A2D" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/teams" className="text-white/70 hover:text-white transition-colors text-sm font-semibold">
            &#8592; Teams
          </Link>
          <span className="text-white/40 text-sm">|</span>
          <input
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            className="bg-transparent text-white font-extrabold text-lg outline-none border-b border-white/30 focus:border-white/80 transition-colors placeholder:text-white/50 w-48"
            style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
            placeholder="Team name"
            maxLength={40}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || filledSlots.length === 0}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-[#DC0A2D] hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {saving ? "Saving…" : "Save Team"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || filledSlots.length < 2}
            className="px-4 py-1.5 rounded-full text-sm font-bold text-white border-2 border-white/70 hover:border-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            {analyzing ? "Analyzing…" : "🤖 Analyze Team"}
          </button>
        </div>
      </header>

      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 font-medium">
          {saveError}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Team slots */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-extrabold text-gray-800"
                style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
              >
                Team ({filledSlots.length}/6)
              </h2>
              {selectedSlot !== null && (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full animate-pulse"
                  style={{ backgroundColor: "#DC0A2D", color: "#fff" }}
                >
                  Slot {selectedSlot + 1} active — pick a Pokémon
                </span>
              )}
            </div>

            {/* 2x3 Slot Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {teamSlots.map((slot, i) =>
                slot ? (
                  <FilledSlot
                    key={i}
                    poke={slot}
                    active={selectedSlot === i}
                    onClick={() => handleSlotClick(i)}
                    onRemove={() => handleRemove(i)}
                  />
                ) : (
                  <EmptySlot
                    key={i}
                    index={i}
                    active={selectedSlot === i}
                    onClick={() => handleSlotClick(i)}
                  />
                )
              )}
            </div>

            {/* Analyze button (inline, for mobile) */}
            <div className="flex gap-3 lg:hidden">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || filledSlots.length < 2}
                className="flex-1 py-3 rounded-full text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "#DC0A2D" }}
              >
                {analyzing ? "Analyzing…" : "Analyze Team"}
              </button>
            </div>

            {/* Analysis result */}
            {analyzing && (
              <div className="mt-8 flex flex-col items-center gap-3 py-12">
                <div
                  className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: "#DC0A2D #DC0A2D30 #DC0A2D30 #DC0A2D30" }}
                />
                <p className="text-sm font-semibold text-gray-500">Consulting Professor Oak…</p>
              </div>
            )}
            {analysis && !analyzing && <AnalysisPanel result={analysis} />}
          </div>
        </div>

        {/* RIGHT: Picker panel */}
        <aside
          className="w-72 shrink-0 flex flex-col border-l border-gray-200 bg-white"
          style={{ maxHeight: "calc(100vh - 56px)" }}
        >
          {/* Sticky search header */}
          <div
            className="px-4 py-3 shrink-0"
            style={{ backgroundColor: "#DC0A2D" }}
          >
            <p
              className="text-white text-xs font-bold uppercase tracking-wider mb-2"
              style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
            >
              {selectedSlot !== null ? `Adding to Slot ${selectedSlot + 1}` : "Pokémon"}
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Pokémon…"
              className="w-full rounded-lg px-3 py-2 text-sm bg-white/20 text-white placeholder:text-white/60 outline-none focus:bg-white/30 transition-colors"
            />
          </div>

          {/* Scrollable picker grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingPokemon ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: "#DC0A2D #DC0A2D30 #DC0A2D30 #DC0A2D30" }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredPokemon.map(poke => (
                  <PickerCard
                    key={poke.id}
                    poke={poke}
                    inTeam={teamIds.has(poke.id)}
                    onClick={() => handlePickPokemon(poke)}
                  />
                ))}
              </div>
            )}
            {!loadingPokemon && filteredPokemon.length === 0 && (
              <p className="text-center text-gray-400 text-xs mt-8">No Pokémon found</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
