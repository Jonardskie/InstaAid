"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Instantly redirects to /signin when the component mounts.
 * No authentication or checks — purely a fast redirect.
 */
export function useRedirectToSignin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/signin");
  }, [router]);
}
