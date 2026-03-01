// this is your DATA ACCESS LAYER
// same idea as prisma

// Pokemon data never changes — cache indefinitely at the fetch level
const CACHE: RequestInit = { cache: "force-cache" }

export type PokemonDetail = {
  id: number
  name: string
  sprite: string
  types: string[]
  stats: { name: string; value: number }[]
  moves: string[]
}

// Single function — one API call returns everything
export async function getPokemon(id: number): Promise<PokemonDetail> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, CACHE)
  const poke = await res.json()

  return {
    id: poke.id,
    name: poke.name,
    sprite: poke.sprites.front_default,
    types: poke.types.map((t: any) => t.type.name),
    stats: poke.stats.map((s: any) => ({ name: s.stat.name, value: s.base_stat })),
    moves: poke.moves.slice(0, 15).map((m: any) => m.move.name),
  }
}

export async function getPokemonList(limit = 50) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`, CACHE)
  const data = await res.json()

  // Extract ID from each URL and reuse getPokemon — force-cache means no duplicate network calls
  return Promise.all(
    data.results.map((p: any) => {
      const id = Number(p.url.split("/").filter(Boolean).at(-1))
      return getPokemon(id)
    })
  )
}
