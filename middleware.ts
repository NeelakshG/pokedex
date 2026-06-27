import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth

  const { pathname } = req.nextUrl

  if (pathname === "/" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/pokedex", req.url))
  }

  const protectedRoutes = [
    "/pokedex",
    "/profile",
    "/favorites",
    "/teams"
  ]

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/",
    "/pokedex/:path*",
    "/profile/:path*",
    "/favorites/:path*",
    "/teams/:path*"
  ]
}
