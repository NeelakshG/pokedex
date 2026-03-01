"use client"

import { useState } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"

export default function SideNav() {

  // 🧠 full list (never changes)
  const pokemonList = usePokedexStore(state => state.pokemonList)

  // 🧠 what the grid shows
  const setFiltered = usePokedexStore(state => state.setFiltered)

  // 🧠 clicking a name opens modal
  const setSelected = usePokedexStore(state => state.setSelected)

  const [search, setSearch] = useState("")

  const handleSearch = (value:string) => {

    setSearch(value)

    const filtered = pokemonList.filter(p =>
      p.name.toLowerCase().includes(value.toLowerCase())
    )

    setFiltered(filtered)
  }

  return (
    <div className="w-64 h-screen sticky top-0 border-r p-4 overflow-y-scroll bg-gray-100">

      {/* 🔍 search */}
      <input
        type="text"
        placeholder="Search Pokémon..."
        value={search}
        onChange={(e)=>handleSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      {/* 📋 list */}
      {pokemonList.map((p)=>(
        <div
          key={p.id}
          onClick={()=>setSelected(p)}
          className="cursor-pointer p-2 hover:bg-gray-200 rounded"
        >
          {p.name}
        </div>
      ))}

    </div>
  )
}