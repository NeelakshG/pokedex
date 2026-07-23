import { getTypeRelations, getEffectiveness, ALL_TYPES } from "./typeChart"

// Raw Pokemon data shape from pokeapi
export type RawPokemon = {
  id: number
  name: string
  types: string[]
  stats: Array<{ name: string; value: number }>
}

// Normalized stats (PokeAPI uses "special-attack", we normalize to spa etc)
export type NormalizedStats = {
  hp: number; atk: number; def: number
  spa: number; spd: number; spe: number
}

function normalizeStats(stats: Array<{ name: string; value: number }>): NormalizedStats {
  const map: Record<string, keyof NormalizedStats> = {
    "hp": "hp", "attack": "atk", "defense": "def",
    "special-attack": "spa", "special-defense": "spd", "speed": "spe",
  }
  const result = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  for (const s of stats) {
    const key = map[s.name]
    if (key) result[key] = s.value
  }
  return result
}

// Role classification — stat-threshold decision tree
function classifyRoles(s: NormalizedStats): string[] {
  const roles: string[] = []
  if (s.atk >= 110 && s.spe >= 90) roles.push("Physical Sweeper")
  if (s.spa >= 110 && s.spe >= 90) roles.push("Special Sweeper")
  if (s.def >= 100 && s.hp >= 80) roles.push("Physical Wall")
  if (s.spd >= 100 && s.hp >= 80) roles.push("Special Wall")
  if ((s.atk >= 100 || s.spa >= 100) && (s.hp >= 90 || s.def >= 90)) roles.push("Bulky Attacker")
  if (s.spe >= 110) roles.push("Speed Control")
  if (roles.length === 0) roles.push("Support / Utility")
  return roles
}

export type PokemonFeatures = {
  id: number
  name: string
  types: string[]
  stats: NormalizedStats
  roles: string[]
  weaknesses: string[]
  resistances: string[]
  immunities: string[]
}

export type TeamFeatures = {
  pokemon: PokemonFeatures[]
  offensiveCoverage: string[]           // types at least one member hits 2x
  uncoveredTypes: string[]              // types no member hits 2x
  weaknessStacks: Record<string, number> // type -> count weak to it
  criticalWeaknesses: string[]          // types where 3+ members weak
  rolesPresent: string[]
  rolesMissing: string[]
  synergyScore: number
  speedProfile: {
    fastest: number
    slowest: number
    hasSpeedControl: boolean
    allSpeeds: number[]
  }
}

const ALL_ROLES = [
  "Physical Sweeper", "Special Sweeper", "Physical Wall",
  "Special Wall", "Bulky Attacker", "Speed Control",
]

export function buildTeamFeatures(rawPokemon: RawPokemon[]): TeamFeatures {
  // Build per-pokemon features
  const pokemon: PokemonFeatures[] = rawPokemon.map(p => {
    const stats = normalizeStats(p.stats)
    const roles = classifyRoles(stats)
    const { weaknesses, resistances, immunities } = getTypeRelations(p.types)
    return { id: p.id, name: p.name, types: p.types, stats, roles, weaknesses, resistances, immunities }
  })

  // Offensive coverage — which types does the team hit super-effectively?
  const offensiveCoverage = new Set<string>()
  for (const p of pokemon) {
    for (const attType of p.types) {
      for (const defType of ALL_TYPES) {
        if (getEffectiveness(attType, [defType]) >= 2) {
          offensiveCoverage.add(defType)
        }
      }
    }
  }
  const uncoveredTypes = ALL_TYPES.filter(t => !offensiveCoverage.has(t))

  // Weakness stacking
  const weaknessStacks: Record<string, number> = {}
  for (const p of pokemon) {
    for (const w of p.weaknesses) {
      weaknessStacks[w] = (weaknessStacks[w] ?? 0) + 1
    }
  }
  const criticalWeaknesses = Object.entries(weaknessStacks)
    .filter(([, count]) => count >= 3)
    .map(([type]) => type)

  // Roles
  const rolesPresentSet = new Set(pokemon.flatMap(p => p.roles))
  const rolesPresent = [...rolesPresentSet]
  const rolesMissing = ALL_ROLES.filter(r => !rolesPresentSet.has(r))

  // Speed profile
  const allSpeeds = pokemon.map(p => p.stats.spe)
  const fastest = Math.max(...allSpeeds)
  const slowest = Math.min(...allSpeeds)
  const hasSpeedControl = fastest >= 110

  // Synergy score
  let score = 50
  const uniqueRoles = new Set(pokemon.flatMap(p => p.roles.filter(r => ALL_ROLES.includes(r))))
  score += uniqueRoles.size * 8                             // up to +48 for full role coverage
  score -= criticalWeaknesses.length * 6                   // -6 per critical weakness
  const commonTypes = ["ground", "water", "fire", "electric", "ice", "rock"]
  const hasKeyImmunity = pokemon.some(p =>
    p.immunities.some(i => commonTypes.includes(i))
  )
  if (hasKeyImmunity) score += 5
  if (uncoveredTypes.length > 5) score -= 8               // poor offensive coverage
  if (!hasSpeedControl) score -= 5
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    pokemon,
    offensiveCoverage: [...offensiveCoverage],
    uncoveredTypes,
    weaknessStacks,
    criticalWeaknesses,
    rolesPresent,
    rolesMissing,
    synergyScore: score,
    speedProfile: { fastest, slowest, hasSpeedControl, allSpeeds },
  }
}
