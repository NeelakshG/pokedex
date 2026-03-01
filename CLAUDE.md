# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma db push           # Push schema changes to the database
npx prisma migrate dev       # Create and apply a new migration
```

No test suite is configured yet.

## Architecture

This is a **Next.js + React 19** Pokédex app using the App Router. The stack is:
- **Tailwind CSS v4** for styling
- **Zustand** for client-side global state
- **Prisma + PostgreSQL** for persistence (via `lib/prisma.ts` singleton)
- **NextAuth v5 (beta)** with Credentials provider and JWT sessions (`lib/auth.ts`)

## Route Structure

| Path | Description |
|------|-------------|
| `/` | Landing/home page (minimal) |
| `/pokedex` | Main Pokédex view — auth-gated, client component |
| `/profile` | Redirects to `/profile/[id]` |
| `/profile/[id]` | User profile dashboard — avatar, stats, top 5 favourites |
| `/(protected)/favorites` | Full favourites grid (server component) |
| `/(protected)/teams` | Team list page (stub) |
| `/(protected)/teams/[teamId]` | Individual team page (stub) |
| `/api/favorites` | GET / POST / DELETE favourites |
| `/api/teams` | API route (stub) |
| `/api/register` | User registration |

## Auth & Middleware

- `middleware.ts` — enforces auth on `/pokedex`, `/profile`, `/favorites`, `/teams`. Redirects to `/login`.
- `auth.config.ts` — lightweight Edge-safe NextAuth config used by middleware (no Prisma/bcrypt imports).
- `lib/auth.ts` — full NextAuth config with PrismaAdapter, CredentialsProvider, bcrypt, JWT callbacks.
- After login, users are redirected to `/pokedex`.

## Data Flow for `/pokedex`

`lib/pokeapi.ts` is the **data access layer**. All fetches use `cache: "force-cache"` since Pokemon data never changes.

- `getPokemon(id)` — fetches a single Pokémon, returns `{ id, name, sprite, types, stats, moves }`. Used by the modal and server pages.
- `getPokemonList(limit)` — fetches the list endpoint, then calls `getPokemon` for each entry. Returns the same shape.

On page load, `app/pokedex/page.tsx` calls `getPokemonList()` and hydrates the Zustand store (`lib/pokedexStore.ts`). All child components read from the store — no prop drilling:

- `SideNav` — search input (`setFiltered()`), clickable list (`setSelected()`)
- `PokemonGrid` → `PokeCard` — renders `filteredList`, clicking calls `setSelected()`
- `Modal` — reads `selectedPokemon` + `isModalOpen`, fetches detail on open, shows stats + moves + heart button

## Zustand Store (`lib/pokedexStore.ts`)

| Field | Purpose |
|-------|---------|
| `pokemonList` | Immutable source list loaded on mount |
| `filteredList` | Current visible list after search |
| `selectedPokemon` | Pokemon currently open in the modal |
| `isModalOpen` | Modal visibility flag |
| `detailCache` | `Record<id, PokemonDetail>` — client-side cache so reopening a modal doesn't re-fetch |

## Favourites

- `app/api/favorites/route.ts` — GET returns `pokemonId[]`, POST adds, DELETE removes. All use `auth()` to scope by user.
- `app/(protected)/favorites/page.tsx` — server component, queries Prisma then fetches each Pokemon via `getPokemon`.
- `components/pokemon/Modal.tsx` — heart button (♥/♡) fetches `/api/favorites` on open, toggles on click.

## Profile

- `app/profile/page.tsx` — redirects to `/profile/[userId]`
- `app/profile/[id]/page.tsx` — server component. Shows avatar (initial), name, email, total favourites count, top 5 favourited Pokémon, nav links. Redirects to own profile if accessing another user's ID.

## Database

`prisma/schema.prisma` defines:
- `User` — id, name, email, hashedPassword, relations to Account, Session, FavouritePokemon
- `Account`, `Session` — standard NextAuth tables
- `FavouritePokemon` — userId + pokemonId, unique together

No `Team` model yet — required for the upcoming team builder feature.

## Utilities

- `utils/pokemon.ts` — `pokemonTypeColors` map, `first151Pokemon` array, `getFullPokedexNumber()` helper
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components/pokemon/TypeCard.jsx` — renders a type badge (note: `.jsx` not `.tsx`)

## Upcoming Feature: AI Team Builder & Strategy Analyzer

Spec doc: `app/team/Pokemon_AI_Team_Analyzer.md`

### Overview
Users build a 6-Pokémon team and receive AI-generated feedback on competitive viability — synergy, type coverage, role distribution, weakness stacking, offensive/defensive balance.

### Planned flow
1. User picks up to 6 Pokémon from the Pokédex (card-based selection)
2. Clicks **Analyze Team**
3. AI evaluates the team and returns:
   - Overall team score
   - Strengths & weaknesses
   - Suggested replacements

### What needs to be built
- `Team` Prisma model (teamId, userId, name, pokemonIds[])
- `app/api/teams/route.ts` — CRUD for teams
- `app/(protected)/teams/page.tsx` — list of saved teams
- `app/(protected)/teams/[teamId]/page.tsx` — team builder UI
- AI integration (Claude API) for team analysis
- Each Pokémon in the team needs: typing, base stats, role classification, resistances/weaknesses

### Data shape per Pokémon (for AI input)
```json
{
  "name": "Garchomp",
  "type1": "Ground",
  "type2": "Dragon",
  "hp": 108, "atk": 130, "def": 95,
  "spa": 80, "spd": 85, "spe": 102,
  "roles": ["Physical Sweeper"]
}
```
`getPokemon(id)` already returns stats and types — role classification will need to be derived or hardcoded.

## Environment Variables

```
DATABASE_URL=        # Postgres connection string (pooled)
DIRECT_URL=          # Postgres direct connection (for Prisma migrations)
NEXTAUTH_SECRET=     # Secret for JWT signing
```
