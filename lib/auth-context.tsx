"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

type UserRole = "user" | "company" | "admin"

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            // Check if user is blocked
            if (userData.blocked === true) {
              // User is blocked, sign them out
              await signOut(auth)
              setUser(null)
              setRole(null)
              setLoading(false)
              return
            }
            
            setRole((userData.role as UserRole) || "user")
          } else {
            // Fallback to custom claims if Firestore document doesn't exist
            const idTokenResult = await user.getIdTokenResult()
            setRole((idTokenResult.claims.role as UserRole) || "user")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // Fallback to custom claims on error
          const idTokenResult = await user.getIdTokenResult()
          setRole((idTokenResult.claims.role as UserRole) || "user")
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, role, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
