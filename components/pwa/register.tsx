"use client"

import { useEffect } from "react"

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        // service worker is active
        console.log('Service worker active:', reg)
      }).catch(() => {})
    }
  }, [])

  return null
}
