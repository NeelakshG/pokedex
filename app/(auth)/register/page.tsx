"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function SignupPage() {

  const router = useRouter()

  // User input state
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  })

  // UI state
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)

  // Signup handler
  const onSignup = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.username,
          email: user.email,
          password: user.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? "Signup failed")
        return
      }

      toast.success("Account created successfully")
      router.push("/login")

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  // Disable button if any field is empty
  useEffect(() => {
    setButtonDisabled(
      !(user.email.length > 0 &&
        user.password.length > 0 &&
        user.username.length > 0)
    )
  }, [user])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1>{loading ? "Processing..." : "Signup"}</h1>
      <hr />

      <label htmlFor="username">Username</label>
      <input
        className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600 bg-white text-black"
        type="text"
        id="username"
        value={user.username}
        onChange={(e) =>
          setUser({ ...user, username: e.target.value })
        }
        placeholder="username"
      />

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
        onClick={onSignup}
      >
        {loading ? "Processing..." : "Sign up"}
      </button>

      <Link href="/login">Visit login</Link>
    </div>
  )
}