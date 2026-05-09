"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Bot, BarChart3, HeartPulse } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/conversations");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4EDE0" }}>
      {/* Left panel — dark brand */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#06181F" }}>
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        {/* Blobs */}
        <div className="absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(11,110,107,.5),transparent 60%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-[-10%] -right-20 h-[400px] w-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(242,106,79,.3),transparent 65%)", filter: "blur(60px)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)", boxShadow: "0 4px 14px rgba(11,110,107,.4)" }}>R</div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#F4EDE0" }}>ResolvAI</span>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.1em] uppercase mb-4" style={{ color: "#0B6E6B" }}>AI-Powered Support</p>
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight mb-6" style={{ color: "#F4EDE0" }}>
            Support that <span style={{ background: "linear-gradient(110deg,#F26A4F,#E8B86E,#5BC7B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>resolves</span>.
            <br />Not just reads.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Bot, label: "AI answers 85% of tickets instantly" },
              { icon: BarChart3, label: "Full analytics & confidence scoring" },
              { icon: HeartPulse, label: "Emotion detection for angry customers" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(11,110,107,0.2)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#5BC7B6" }} />
                </div>
                <span className="text-sm" style={{ color: "#7AACB0" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <p className="text-sm italic leading-relaxed" style={{ color: "#4A6B72" }}>
            "ResolvAI cut our support load by 80% in the first week."
          </p>
          <p className="text-xs mt-2 font-medium" style={{ color: "#2E5059" }}>— Early customer</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)" }}>R</div>
            <span className="font-bold tracking-tight" style={{ color: "#0E1B22" }}>ResolvAI</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#0E1B22" }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "#6F8087" }}>Sign in to your dashboard</p>

          {error && (
            <div className="text-red-600 text-sm p-3 rounded-xl mb-5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                placeholder="you@company.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 font-medium disabled:opacity-50 transition-all mt-2"
              style={{ background: "linear-gradient(135deg,#0B6E6B,#064F4D)", boxShadow: "0 4px 14px rgba(11,110,107,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#6F8087" }}>
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold transition-colors" style={{ color: "#0B6E6B" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
