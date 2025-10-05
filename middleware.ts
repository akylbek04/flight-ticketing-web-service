import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Add any middleware logic here for protected routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/company/:path*", "/admin/:path*"],
}
