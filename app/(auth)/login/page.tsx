"use client"
import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function LoginPage() {
  const [user, setUser] = React.useState({
    email: "",
    password: "",
  })

  const router = useRouter()
  const [buttonDisabled, setButtonDisabled] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const onLogin = async () => {
    try {
      setLoading(true)
      const response = await signIn("credentials", {
        email: user.email,
        password: user.password,
        redirect: false,
      })

      if (response?.error) {
        setError("Invalid email or password")
        return
      }

      router.push("/pokemon")
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.email.length > 0 && user.password.length > 0) {
      setButtonDisabled(false)
    } else {
      setButtonDisabled(true)
    }
  }, [user])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-black text-2xl font-bold">
        {loading ? "Logging in..." : "Login"}
      </h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        className="p-2 border border-gray-300 rounded-lg focus:outline-none bg-white text-black"
        type="email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        placeholder="Email"
      />

      <input
        className="p-2 border border-gray-300 rounded-lg focus:outline-none bg-white text-black"
        type="password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        placeholder="Password"
      />

      <button
        className="p-2 rounded-lg bg-red-600 text-white disabled:opacity-50 cursor-pointer"
        onClick={onLogin}
        disabled={buttonDisabled}
      >
        {loading ? "Loading..." : "Login"}
      </button>

      <Link href="/register" className="text-black text-sm text-center">
        Don't have an account? Register
      </Link>
    </div>
  )
}