import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPokemon } from "@/lib/pokeapi"

function padId(id: number) {
  if (id >= 100) return `${id}`
  if (id >= 10) return `0${id}`
  return `00${id}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function TeamsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const teams = await prisma.team.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  // Pre-fetch sprites for all teams (up to 6 per team)
  const teamData = await Promise.all(
    teams.map(async (team) => {
      const sprites = await Promise.all(
        team.pokemonIds.slice(0, 6).map((id) => getPokemon(id))
      )
      return { ...team, sprites }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="px-6 py-4 flex justify-between items-center shadow-md"
        style={{ backgroundColor: "#DC0A2D" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white text-2xl leading-none" aria-hidden="true">&#9679;</span>
          <h1
            className="text-white text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
          >
            My Teams
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-5 text-sm font-semibold">
            <Link href="/pokedex" className="text-white/80 hover:text-white transition-colors duration-150">
              Pokédex
            </Link>
            <Link href="/favorites" className="text-white/80 hover:text-white transition-colors duration-150">
              Favourites
            </Link>
            <Link href="/profile" className="text-white/80 hover:text-white transition-colors duration-150">
              Profile
            </Link>
          </nav>
          <Link
            href="/teams/new"
            className="bg-white text-[#DC0A2D] font-bold text-sm px-4 py-2 rounded-full hover:bg-red-50 transition-colors duration-150 shadow-sm"
          >
            + New Team
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {teamData.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center shadow-inner"
              style={{ backgroundColor: "#DC0A2D18", border: "3px dashed #DC0A2D40" }}
            >
              <span className="text-5xl select-none" aria-hidden="true">&#9651;</span>
            </div>
            <div className="text-center">
              <h2
                className="text-2xl font-extrabold text-gray-800 mb-2"
                style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
              >
                No teams yet
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                Build your first competitive team and let AI analyze its strengths and weaknesses.
              </p>
              <Link
                href="/teams/new"
                className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
                style={{ backgroundColor: "#DC0A2D" }}
              >
                Build your first team
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-extrabold text-gray-800"
                style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
              >
                {teamData.length} {teamData.length === 1 ? "Team" : "Teams"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teamData.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-150 cursor-pointer"
                >
                  {/* Team header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className="font-extrabold text-gray-900 text-lg leading-tight capitalize group-hover:text-[#DC0A2D] transition-colors"
                        style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
                      >
                        {team.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Updated {formatDate(team.updatedAt)}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "#DC0A2D18", color: "#DC0A2D" }}
                    >
                      {team.pokemonIds.length} / 6
                    </span>
                  </div>

                  {/* Sprite row */}
                  <div className="flex items-center gap-1 flex-wrap min-h-[56px]">
                    {team.sprites.map((poke) => (
                      <div
                        key={poke.id}
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "#f3f4f6" }}
                        title={poke.name}
                      >
                        <img
                          src={poke.sprite}
                          alt={poke.name}
                          className="w-10 h-10 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: 6 - team.sprites.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"
                      >
                        <span className="text-gray-300 text-lg font-bold">+</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer CTA */}
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-[#DC0A2D] transition-colors mt-auto">
                    <span>Edit team</span>
                    <span aria-hidden="true">&#8594;</span>
                  </div>
                </Link>
              ))}

              {/* New team card */}
              <Link
                href="/teams/new"
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-3 hover:border-[#DC0A2D] hover:shadow-md transition-all duration-150 min-h-[200px] group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform duration-150"
                  style={{ backgroundColor: "#DC0A2D18", color: "#DC0A2D" }}
                >
                  +
                </div>
                <span
                  className="text-sm font-bold text-gray-400 group-hover:text-[#DC0A2D] transition-colors"
                  style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
                >
                  New Team
                </span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
