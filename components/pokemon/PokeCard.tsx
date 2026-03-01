"use client"

import { usePokedexStore } from "@/lib/pokedexStore"

export default function PokeCard({ poke }: any) {

  const setSelected = usePokedexStore(state => state.setSelected)

  return (
    <div
      onClick={()=>setSelected(poke)}
      className="cursor-pointer border p-4 rounded shadow"
    >
      <img src={poke.sprite}/>
      <p>{poke.name}</p>
    </div>
  )
}