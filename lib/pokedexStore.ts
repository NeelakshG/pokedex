import { create } from "zustand"
import type { PokemonDetail } from "./pokeapi"

type Pokemon = {
  id: number
  name: string
  types: string[]
  sprite: string
}

type PokedexState = {

  // SOURCE DATASET
  pokemonList: Pokemon[]

  // CURRENT VIEW
  filteredList: Pokemon[]

  // MODAL TARGET
  selectedPokemon: Pokemon | null
  isModalOpen: boolean

  // CLIENT-SIDE DETAIL CACHE — avoids re-fetching the same pokemon
  detailCache: Record<number, PokemonDetail>

  setPokemon: (data: Pokemon[]) => void
  setFiltered: (data: Pokemon[]) => void
  setSelected: (poke: Pokemon) => void
  closeModal: () => void
  cacheDetail: (id: number, detail: PokemonDetail) => void
}

// GLOBAL SHARED MEMORY LAYER
// prevents prop drilling between Header → Grid → Card → Modal
export const usePokedexStore = create<PokedexState>((set) => ({

  pokemonList: [],
  filteredList: [],
  selectedPokemon: null,
  isModalOpen: false,
  detailCache: {},

  // store original dataset AND initialize visible dataset
  setPokemon: (data) =>
    set({
      pokemonList: data,
      filteredList: data
    }),

  // when user clicks a card
  // we open modal + store selected pokemon
  setSelected: (poke) =>
    set({
      selectedPokemon: poke,
      isModalOpen: true
    }),

    setFiltered: (data) => 
      set({
        filteredList: data
      }),

  closeModal: () =>
    set({
      selectedPokemon: null,
      isModalOpen: false
    }),

  cacheDetail: (id, detail) =>
    set((state) => ({
      detailCache: { ...state.detailCache, [id]: detail }
    }))

}))