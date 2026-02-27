// lib/pokemon.ts

export async function getPokemon() {

  const res = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=151",
    {
      next: { revalidate: 86400 } // cache for 24h
    }
  )

  if (!res.ok) {
    throw new Error("Failed to fetch Pokémon")
  }

  const data = await res.json()

  return data.results
}