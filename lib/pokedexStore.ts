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

  // FILTER STATE
  searchQuery: string
  activeTypeFilter: string | null

  setPokemon: (data: Pokemon[]) => void
  setFiltered: (data: Pokemon[]) => void
  setSelected: (poke: Pokemon) => void
  closeModal: () => void
  cacheDetail: (id: number, detail: PokemonDetail) => void
  setSearchQuery: (query: string) => void
  setTypeFilter: (type: string | null) => void
}

// Helper: apply both search and type filter together
function applyFilters(
  list: Pokemon[],
  query: string,
  typeFilter: string | null
): Pokemon[] {
  return list.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase())
    const matchesType = typeFilter === null || p.types.includes(typeFilter)
    return matchesSearch && matchesType
  })
}

// GLOBAL SHARED MEMORY LAYER
// prevents prop drilling between Header → Grid → Card → Modal
export const usePokedexStore = create<PokedexState>((set, get) => ({

  pokemonList: [],
  filteredList: [],
  selectedPokemon: null,
  isModalOpen: false,
  detailCache: {},
  searchQuery: "",
  activeTypeFilter: null,

  // store original dataset AND initialize visible dataset
  setPokemon: (data) =>
    set({
      pokemonList: data,
      filteredList: data,
      searchQuery: "",
      activeTypeFilter: null,
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
    })),

  // Update search query and re-filter
  setSearchQuery: (query) =>
    set((state) => ({
      searchQuery: query,
      filteredList: applyFilters(state.pokemonList, query, state.activeTypeFilter),
    })),

  // Update active type filter and re-filter
  setTypeFilter: (type) =>
    set((state) => ({
      activeTypeFilter: type,
      filteredList: applyFilters(state.pokemonList, state.searchQuery, type),
    })),

}))
