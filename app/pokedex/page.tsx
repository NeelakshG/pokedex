"use client"

import { useEffect } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"

import Header from "@/components/pokemon/Header"
import PokemonGrid from "@/components/pokemon/PokemonGrid"
import Modal from "@/components/pokemon/Modal"
import SideNav from "@/components/pokemon/SideNav"
import TypeFilterRow from "@/components/pokemon/TypeFilterRow"
import { getPokemonList, getSpeciesCount } from "@/lib/pokeapi"

const INITIAL_BATCH = 151 // Gen 1 -- fast first paint, rest loads in behind it

export default function PokedexPage() {

  const setPokemon = usePokedexStore(state => state.setPokemon)
  const appendPokemon = usePokedexStore(state => state.appendPokemon)

  // Runs once on page load — hydrates the store
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      // Fast first paint: just Gen 1
      const firstBatch = await getPokemonList(INITIAL_BATCH)
      if (cancelled) return
      setPokemon(firstBatch)

      // Rest of the dex streams in behind it, doesn't block interaction
      const total = await getSpeciesCount()
      if (cancelled || total <= INITIAL_BATCH) return
      const rest = await getPokemonList(total - INITIAL_BATCH, INITIAL_BATCH)
      if (cancelled) return
      appendPokemon(rest)
    }
    loadData()

    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex">
      <SideNav />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <TypeFilterRow />
        <PokemonGrid />
      </div>
      <Modal />
    </div>
  )
}
