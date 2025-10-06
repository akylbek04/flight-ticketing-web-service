"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  exact?: boolean
}

export function NavLink({ href, children, className, exact = false }: NavLinkProps) {
  const pathname = usePathname()
  
  const isActive = exact 
    ? pathname === href 
    : pathname?.startsWith(href)
  
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-primary underline underline-offset-4" : "text-muted-foreground",
        className
      )}
    >
      {children}
    </Link>
  )
}
