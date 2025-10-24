"use client";

import type React from "react";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";
import PwaRegister from "@/components/pwa/register";


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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/instaaid-logo.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/Logo2.png" />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {/* ThemeProvider needs to be wrapped by AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PwaRegister />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}