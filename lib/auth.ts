import prisma from "@/lib/prisma"// ...existing code...
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

//we will export the result of calling NextAuth()
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
        credentials: {
            email: {},
            password: {},
        },
        authorize: async (credentials) => {

            //find user in DB by email
            const user = await prisma.user.findUnique({
                where: {
                    // Replace 'email' with the correct unique field if needed
                    email: credentials.email as string
                }
            })

            if (!user) {
                return null
            }

            const passwordMatch = await bcrypt.compare(
                credentials.password as string,
                user.hashedPassword as string
            )

            // if passwords don't match return null
            if (!passwordMatch) {
                return null
            }
 
            return user
        }
    })
  ]
})
// ...existing code...