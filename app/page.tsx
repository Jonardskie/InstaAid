"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1B3E] via-[#102B6A] to-[#1E40AF] overflow-hidden relative text-white">
      {/* Background animated blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-700/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Foreground content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center space-y-10 px-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Logo inside styled background zone */}
        <motion.div
          className="relative bg-white/10 border border-white/20 rounded-3xl p-8 shadow-xl backdrop-blur-md flex flex-col items-center justify-center space-y-4 w-[260px] h-[260px] hover:scale-105 transition-transform"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-indigo-800/30 rounded-3xl" />
          <Image
            src="/images/instaaid-logo.png"
            alt="InstaAid Logo"
            width={140}
            height={140}
            className="object-contain drop-shadow-lg relative z-10"
            priority
          />
          <span className="text-blue-200 text-lg font-semibold relative z-10 tracking-wide">
            InstaAid
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Welcome to <span className="text-blue-300">InstaAid</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl font-medium text-blue-100 max-w-2xl leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Intelligent Road Accident Detection and Response System.
          <br />
          <span className="text-blue-200">Because every second counts.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Link href="/auth/signin">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-indigo-500 hover:to-blue-600 text-white px-12 py-5 rounded-full text-lg font-semibold shadow-lg hover:shadow-indigo-500/40 transition-all duration-300">
              Proceed
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 text-sm text-white/60 tracking-wide">
        © {new Date().getFullYear()} InstaAid • All Rights Reserved
      </div>
    </main>
  )
}
