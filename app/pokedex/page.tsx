"use client"

import { useEffect } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"

import Header from "@/components/pokemon/Header"
import PokemonGrid from "@/components/pokemon/PokemonGrid"
import Modal from "@/components/pokemon/Modal"
import SideNav from "@/components/pokemon/SideNav"
import TypeFilterRow from "@/components/pokemon/TypeFilterRow"
import { getPokemonList } from "@/lib/pokeapi"

export default function PokedexPage() {

  const setPokemon = usePokedexStore(state => state.setPokemon)

  // Runs once on page load — hydrates the store
  useEffect(() => {
    async function loadData() {
      const pokemon = await getPokemonList()
      setPokemon(pokemon)
    }
    loadData()
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
