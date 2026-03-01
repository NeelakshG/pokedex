"use client"

import Link from "next/link"

export default function Header() {

  return (
    <div className="p-4 border-b bg-white flex justify-between items-center">

      {/* branding */}
      <h1 className="text-2xl font-bold">
        Neelaksh&apos;s Pokédex
      </h1>

      {/* nav links */}
      <nav className="flex gap-6 text-sm font-medium">
        <Link href="/profile" className="hover:text-blue-500 transition-colors">Profile</Link>
        <Link href="/favorites" className="hover:text-blue-500 transition-colors">Favourites</Link>
        <Link href="/teams" className="hover:text-blue-500 transition-colors">Teams</Link>
      </nav>

    </div>
  )
}