"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { isAuthenticated } from "@/lib/auth";
import { getProfile } from "@/lib/profileStorage";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    const profile = getProfile();
    const isOnboarding = pathname?.startsWith("/onboarding");
    if (!profile && !isOnboarding) {
      router.replace("/onboarding");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  return <AppShell>{children}</AppShell>;
}
