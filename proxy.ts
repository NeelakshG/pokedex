import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {

  const isLoggedIn = !!req.auth

  const protectedRoutes = [
    "/profile",
    "/favorites",
    "/teams"
  ]

  const isProtected = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/profile/:path*",
    "/favorites/:path*",
    "/teams/:path*"
  ]
}