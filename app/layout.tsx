import type React from "react" // 🔷 TypeScript: importing React types
import type { Metadata } from "next" // 🔷 TypeScript: Next.js metadata type
import { GeistSans } from "geist/font/sans" // 🔤 Font: Modern sans-serif font
import { GeistMono } from "geist/font/mono" // 🔤 Font: Monospace font (for code)
import "./globals.css" // 🎨 Global CSS styles (Tailwind + custom styles)
import { AuthProvider } from "@/hooks/use-auth" // 🔐 Authentication context provider
import { ThemeProvider } from "next-themes" // 🌙 Dark/light theme provider

// 📄 SEO METADATA - appears in browser tab and search results
export const metadata: Metadata = {
  title: "InstaAid", // 📝 Browser tab title
  description: "Created with v0", // 📝 Search engine description
  generator: "v0.app", // 🏷️ Indicates this was built with v0
}

// 🏗️ ROOT LAYOUT COMPONENT
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* 🎨 INLINE FONT STYLES */}
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>

        {/* 🖼️ FAVICON */}
        <link rel="icon" href="/images/instaaid-logo.png" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
