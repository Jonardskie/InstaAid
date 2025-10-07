"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
<<<<<<< HEAD
    // 🎨 TAILWIND CSS CLASSES EXPLANATION:
    // - "min-h-screen" = minimum height of 100% viewport height
    // - "bg-gradient-to-b" = background gradient from top to bottom
    // - "from-blue-900 via-blue-800 to-blue-600" = gradient color stops (dark to light blue)
    // - "flex flex-col" = flexbox layout, vertical direction
    // - "items-center justify-center" = center content horizontally and vertically
    // - "px-6" = padding left and right of 1.5rem (24px)
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-200">
      {/* 📱 PHONE FRAME CONTAINER */}
      <div className="border-[12px] border-black rounded-[36px] w-[375px] h-[812px] shadow-2xl overflow-y-scroll relative bg-[#182F66] flex flex-col items-center justify-center">
        {/* 🔘 NOTCH (Optional aesthetic detail) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl w-40 h-6 z-10"></div>

        {/* 📦 CONTAINER DIV - groups related content */}
        <div className="text-center space-y-8 z-0">
          {" "}
          {/* space-y-8 = 2rem (32px) vertical spacing between child elements */}
          {/* 📝 HEADING ELEMENT */}
          <h1 className="text-white text-4xl font-bold">
            {" "}
            {/* text-4xl = 2.25rem font size, font-bold = 700 weight */}
            WELCOME!
          </h1>
          {/* 🖼️ LOGO CONTAINER */}
          <div className="bg-white rounded-full p-8 w-48 h-48 flex items-center justify-center mx-auto">
            {/* 
            📸 NEXT.JS IMAGE COMPONENT BENEFITS:
            - Automatic image optimization
            - Lazy loading (loads when visible)
            - Responsive images
            - WebP format when supported
            */}
            <Image
              src="/images/instaaid-logo.png" // 📁 Path relative to "public" folder
              alt="InstaAid Logo" // ♿ Accessibility: describes image for screen readers
              width={120} // 📏 Required: image width in pixels
              height={120} // 📏 Required: image height in pixels
              className="object-contain" // 🖼️ CSS: keeps aspect ratio, fits within container
            />
          </div>
          {/* 📝 DESCRIPTION TEXT SECTION */}
          <div className="text-white text-center space-y-2">
            {" "}
            {/* space-y-2 = 0.5rem (8px) spacing */}
            {/* 
            💡 SEMANTIC HTML: Using h2 for subheadings
            These could be combined into one h2 with <br> tags, but separate h2s are better for SEO
            */}
            <h2 className="text-xl font-semibold">INTELLIGENT ROAD ACCIDENT</h2>{" "}
            {/* text-xl = 1.25rem, font-semibold = 600 weight */}
            <h2 className="text-xl font-semibold">DETECTION AND</h2>
            <h2 className="text-xl font-semibold">RESPONSE SYSTEM</h2>
          </div>
          {/* 🔗 NAVIGATION SECTION */}
          <div className="pt-8">
            {" "}
            {/* pt-8 = padding-top of 2rem (32px) */}
            {/* 
            🚀 NEXT.JS LINK COMPONENT:
            - Provides client-side navigation (no page refresh)
            - Prefetches linked pages for faster navigation
            - Better performance than regular <a> tags
            */}
            <Link href="/auth/signin">
              {" "}
              {/* 📍 Navigate to sign-in page */}
              <Button className="bg-[#1A44A7] hover:bg-[#1E4ABF] text-white px-14 py-5 rounded-full text-lg font-bold w-50 h-15">
                Proceed
              </Button>
            </Link>
          </div>
        </div>
=======
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
>>>>>>> e226332f79580297b37f9563155c72978199668f
      </div>
    </main>
  )
}
