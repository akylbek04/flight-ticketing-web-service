"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plane, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NavLink } from "@/components/ui/nav-link"

export function Header() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "admin"
      case "company":
        return "manager"
      default:
        return null
    }
  }

  const handleUserClick = () => {
    router.push("/dashboard")
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SkyBook</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/" exact>
              Home
            </NavLink>
            <NavLink href="/flights">
              Flights
            </NavLink>
            <NavLink href="/deals">
              Deals
            </NavLink>
            <NavLink href="/about">
              About
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <NavLink href="/dashboard">
                <button
                  onClick={handleUserClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer group"
                >
                  <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      {getRoleLabel(role) && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {getRoleLabel(role)}
                        </Badge>
                      )}
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {user.displayName || user.email?.split("@")[0] || "User"}
                      </span>
                    </div>
                  </div>
                </button>
            </NavLink>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
