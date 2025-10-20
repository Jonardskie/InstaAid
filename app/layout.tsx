import type React from "react"; // 🔷 TypeScript: importing React types
import type { Metadata } from "next"; // 🔷 TypeScript: Next.js metadata type
import { Inter, Roboto_Mono } from "next/font/google"; // ✅ Replaced Geist fonts with Google Fonts
import "./globals.css"; // 🎨 Global CSS styles (Tailwind + custom styles)
import { AuthProvider } from "@/hooks/use-auth"; // 🔐 Authentication context provider
import { ThemeProvider } from "next-themes"; // 🌙 Dark/light theme provider

// 📄 SEO METADATA - appears in browser tab and search results
export const metadata: Metadata = {
  title: "InstaAid", // 📝 Browser tab title
  description: "Created with v0", // 📝 Search engine description
  generator: "v0.app", // 🏷️ Indicates this was built with v0
};

// ✅ Google Fonts setup (Inter = Sans, Roboto_Mono = Monospace)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

// 🏗️ ROOT LAYOUT COMPONENT
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* 🖼️ FAVICON */}
        <link rel="icon" href="/images/instaaid-logo.png" />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
