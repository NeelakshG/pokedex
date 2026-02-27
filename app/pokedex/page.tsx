import { getPokemon } from "@/lib/pokeapi"

export default async function PokedexPage() {

  const pokemon = await getPokemon()

  return (
    <div>
      {pokemon.map((p: any) => (
        <p key={p.name}>{p.name}</p>
      ))}
    </div>
  )
}