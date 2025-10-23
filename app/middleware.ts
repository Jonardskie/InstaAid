import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  const { pathname } = req.nextUrl

  const publicPaths = ["/auth/signin", "/auth/signup", "/"]
  const isPublic = publicPaths.some((path) => pathname.startsWith(path))

  // Block access if not authenticated
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  // Redirect logged-in users away from auth pages
  if (token && ["/auth/signin", "/auth/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|images|favicon.ico).*)"],
}
