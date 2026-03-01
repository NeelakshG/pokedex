"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { SignInResponse } from "next-auth/react"

export default function LoginPage() {
  const router = useRouter()

  const [user, setUser] = useState({
    email: "",
    password: "",
  })

  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const onLogin = async () => {
    try {
      setLoading(true)

      const result = await signIn("credentials", {
        email: user.email,
        password: user.password,
        redirect: false, // we control redirect manually
      }) as SignInResponse | undefined

      if (!result || result.error) {
        toast.error(result?.error ?? "Invalid credentials")
      } else {
        toast.success("Login successful")
        router.push("/pokedex")
      }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password))
  }, [user])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>{loading ? "Processing..." : "Login"}</h1>
      <hr />

      <label htmlFor="email">Email</label>
      <input
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 bg-white text-black"
        type="text"
        id="email"
        value={user.email}
        onChange={(e) =>
          setUser({ ...user, email: e.target.value })
        }
        placeholder="email"
      />

      <label htmlFor="password">Password</label>
      <input
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 bg-white text-black"
        type="password"
        id="password"
        value={user.password}
        onChange={(e) =>
          setUser({ ...user, password: e.target.value })
        }
        placeholder="password"
      />

      <button
        disabled={buttonDisabled || loading}
        className="p-2 border border-gray-300 rounded-md mb-4 bg-black text-white disabled:opacity-50"
        onClick={onLogin}
      >
        {loading ? "Processing..." : "Login"}
      </button>

      <Link href="/register">Visit Sign up</Link>
    </div>
  )
}