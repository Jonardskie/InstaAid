// 📚 EDUCATIONAL NOTES:
// This is a Next.js PAGE COMPONENT - it automatically becomes a route at "/"
// Next.js uses file-based routing: files in the "app" folder become URL routes

import Link from "next/link" // 🔗 Next.js Link component for client-side navigation (faster than <a> tags)
import Image from "next/image" // 🖼️ Next.js optimized Image component (automatic optimization, lazy loading)
import { Button } from "@/components/ui/button" // 🎨 Custom UI component (@ symbol means "from project root")

// 📝 This is a REACT FUNCTIONAL COMPONENT
// "export default" makes this the main component exported from this file
export default function HomePage() {
  return (
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
      </div>
    </div>
  )
}

/* 
              🎨 BUTTON STYLING BREAKDOWN:
              - bg-blue-700 = background color (blue, darkness level 700)
              - hover:bg-blue-800 = darker blue on hover (interactive feedback)
              - text-white = white text color
              - px-12 = horizontal padding of 3rem (48px)
              - py-3 = vertical padding of 0.75rem (12px)
              - rounded-full = fully rounded corners (pill shape)
              - text-lg = large text size (1.125rem)
              - font-semibold = semi-bold font weight (600)
              - w-64 = fixed width of 16rem (256px)
              */
/* 
🏗️ COMPONENT STRUCTURE SUMMARY:
1. This is the homepage (/) of your Next.js app
2. Uses JSX (JavaScript + HTML-like syntax)
3. Tailwind CSS for styling (utility-first CSS framework)
4. Next.js components (Link, Image) for optimization
5. Responsive design with flexbox layout
6. Semantic HTML structure (h1, h2, proper heading hierarchy)
*/
