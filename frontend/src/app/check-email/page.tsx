"use client";

import { useState } from "react";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function CheckEmailPage() {
  const { user } = useAuth();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resend() {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/resend-verification");
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F4EDE0" }}>
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)", boxShadow: "0 4px 14px rgba(11,110,107,.3)" }}>R</div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#0E1B22" }}>ResolvAI</span>
        </div>

        <div className="rounded-2xl p-10" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
          {/* Icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#E4F1EF" }}>
            <Mail className="w-10 h-10" style={{ color: "#0B6E6B" }} />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: "#0E1B22" }}>Check your inbox</h1>
          <p className="text-sm mb-2" style={{ color: "#6F8087" }}>We sent a verification link to</p>
          <p className="font-semibold text-sm mb-6" style={{ color: "#0E1B22" }}>
            {user?.email || "your email address"}
          </p>

          <div className="rounded-xl p-4 mb-6 text-left space-y-3" style={{ background: "#F4EDE0" }}>
            {[
              "Open the email from ResolvAI",
              'Click "Verify Email Address"',
              "You'll be taken to your onboarding",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "#E4F1EF", color: "#0B6E6B" }}>
                  {i + 1}
                </div>
                <span className="text-sm" style={{ color: "#324047" }}>{step}</span>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: "#059669" }}>
              <CheckCircle className="w-4 h-4" />
              Verification email resent!
            </div>
          ) : (
            <button onClick={resend} disabled={loading}
              className="inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ color: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.color = "#0B6E6B")}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Sending..." : "Resend verification email"}
            </button>
          )}

          <p className="text-xs mt-6" style={{ color: "#6F8087" }}>
            Wrong email?{" "}
            <a href="/signup" className="font-medium transition-colors" style={{ color: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.color = "#0B6E6B")}>
              Sign up again
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
