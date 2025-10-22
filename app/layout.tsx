import type React from "react";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "InstaAid",
  description: "Created with v0",
  generator: "v0.app",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 👇 this tells React not to complain if HTML attributes differ after hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/instaaid-logo.png" />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {/* 👇 ThemeProvider stays inside <body> for proper control */}
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
