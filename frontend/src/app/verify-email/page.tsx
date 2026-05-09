"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.detail || "Email verified!");
        setTimeout(() => router.push("/onboarding"), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.detail || "Verification failed. The link may have expired."
        );
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F4EDE0" }}>
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)", boxShadow: "0 4px 14px rgba(11,110,107,.3)" }}>R</div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#0E1B22" }}>ResolvAI</span>
        </div>

        <div className="rounded-2xl p-10" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "#E4F1EF" }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0B6E6B" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "#0E1B22" }}>Verifying your email…</h1>
              <p className="text-sm" style={{ color: "#6F8087" }}>Just a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "#DCFCE7" }}>
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "#0E1B22" }}>Email verified!</h1>
              <p className="text-sm mb-4" style={{ color: "#6F8087" }}>{message}</p>
              <p className="text-xs" style={{ color: "#6F8087" }}>Redirecting to your workspace…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "#FEF2F2" }}>
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "#0E1B22" }}>Verification failed</h1>
              <p className="text-sm mb-6" style={{ color: "#6F8087" }}>{message}</p>
              <a href="/check-email"
                className="inline-block text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: "linear-gradient(135deg,#0B6E6B,#064F4D)", boxShadow: "0 4px 14px rgba(11,110,107,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                Resend verification email
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4EDE0" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0B6E6B" }} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
