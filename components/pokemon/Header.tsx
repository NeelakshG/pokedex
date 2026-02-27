"use client"

import { useState } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"

export default function Header() {

    //grabing lists from the global store
    const pokemonList = usePokedexStore(state => state.pokemonList)
    const setFiltered = usePokedexStore(state => state.setFiltered)

    const [searchItem, setSearchItem] = useState("")
    const handleSearch = (value:string) => {

        //update the input box text
        setSearchItem(value)

        //filter from the real deal
        const filtered = pokemonList.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))

        setFiltered(filtered)
    }
    return (
    <div className="w-full p-4 shadow-md bg-white">

      <input
        type="text"
        value={searchItem}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search Pokémon..."
        className="border p-2 rounded w-full"
      />

    </div>
  )

}