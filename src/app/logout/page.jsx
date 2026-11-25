
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } finally {
        router.replace("/login");
        router.refresh();
      }
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1026] text-[#E9C99B]">
      Logging out...
    </main>
  );
}
