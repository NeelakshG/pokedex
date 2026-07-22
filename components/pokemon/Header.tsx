"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header
      className="px-6 py-3 flex justify-between items-center shadow-md"
      style={{ backgroundColor: "#DC0A2D" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-white text-xl leading-none" aria-hidden="true">&#9679;</span>
        <h1
          className="text-white text-xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
        >
          Neelaksh&apos;s Pokédex
        </h1>
      </div>
      <nav className="flex gap-5 text-sm font-semibold">
        <Link href="/profile" className="text-white/80 hover:text-white transition-colors duration-150">
          Profile
        </Link>
        <Link href="/favorites" className="text-white/80 hover:text-white transition-colors duration-150">
          Favourites
        </Link>
        <Link href="/teams" className="text-white/80 hover:text-white transition-colors duration-150">
          Teams
        </Link>
      </nav>
    </header>
  )
}
