import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected =
        nextUrl.pathname.startsWith("/pokedex") ||
        nextUrl.pathname.startsWith("/favorites") ||
        nextUrl.pathname.startsWith("/teams")

      if (isProtected && !isLoggedIn) {
        return false // NextAuth redirects to pages.signIn
      }
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
