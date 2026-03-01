"use client"

import { useEffect } from "react"
import { usePokedexStore } from "@/lib/pokedexStore"

import Header from "@/components/pokemon/Header"
import PokemonGrid from "@/components/pokemon/PokemonGrid"
import Modal from "@/components/pokemon/Modal"
import SideNav from "@/components/pokemon/SideNav"
import {getPokemonList} from "@/lib/pokeapi"

export default function PokedexPage() {

  const setPokemon = usePokedexStore(state => state.setPokemon)

  // 🧠 this runs ONCE when page loads
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
      <div className="flex-1">
        <Header />
        <PokemonGrid />
      </div>
      <Modal />
    </div>
  )
}