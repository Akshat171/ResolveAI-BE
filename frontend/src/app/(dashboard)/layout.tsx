"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuth();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (!isLoading && isAuthenticated && !onboardingChecked) {
      setOnboardingChecked(true);
      // Check email verification first
      api.get("/auth/me").then((me) => {
        if (!me.data.is_email_verified) {
          router.push("/check-email");
          return;
        }
        // Then check onboarding
        api.get("/tenants/me").then((res) => {
          if (res.data.settings?.onboarding_completed === false) {
            router.push("/onboarding");
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [isLoading, isAuthenticated, router, onboardingChecked]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4EDE0" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0B6E6B", borderTopColor: "transparent" }} />
          <span className="text-slate-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F4EDE0" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
