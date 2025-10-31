import type React from "react"
import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "next-themes"
import { AuthWrapper } from "@/app/providers/auth-wrapper"

export const metadata: Metadata = {
  title: "InstaAid",
  description: "Created with v0",
  generator: "v0.app",
  icons: { icon: "/images/instaaid-logo.png" },
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* ✅ Protect all routes */}
            <AuthWrapper>{children}</AuthWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
