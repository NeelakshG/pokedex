import prisma from "@/lib/prisma"
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },

      authorize: async (credentials) => {

        const emailRaw = credentials?.email
        const passwordRaw = credentials?.password

        console.log("RAW CREDS:", credentials)
        console.log("emailRaw:", emailRaw, "type:", typeof emailRaw)
        console.log("passwordRaw:", passwordRaw, "type:", typeof passwordRaw)

        if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
          console.log("Invalid credential types")
          return null
        }

        // show invisible characters (spaces/newlines)
        console.log("passwordRaw JSON:", JSON.stringify(passwordRaw))
        console.log("passwordRaw length:", passwordRaw.length)

        const email = emailRaw.toLowerCase()
        const password = passwordRaw.trim() // keep as-is for now

          if (
            typeof email !== "string" ||
            typeof password !== "string"
          ) {
            console.log("Invalid credential types")
            return null
          }

        const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive"
          }
        }
      })

      console.log("FOUND USER:", user)

      if (!user) {
        console.log("User not found")
        return null
      }

        const passwordMatch = await bcrypt.compare(
          password,
          user.hashedPassword
        )

        console.log("PASSWORD MATCH:", passwordMatch)

        if (!passwordMatch) return null

        // ⚠️ VERY IMPORTANT
        // DO NOT return full prisma user object
        // return only what NextAuth needs

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
})