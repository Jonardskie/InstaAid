"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useRedirectToSignin() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribed = false;

    // Immediately block UI until Firebase resolves
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribed) return;

      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace("/auth/signin");
      }

      setCheckingAuth(false);
    });

    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [router]);

  // Return both flags
  return { checkingAuth, isAuthenticated };
}
