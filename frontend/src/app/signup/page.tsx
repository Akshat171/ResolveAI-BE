"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Users, Zap, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, fullName, companyName);
      router.push("/check-email");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
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
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(242,106,79,.35),transparent 60%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-[-15%] left-[-5%] h-[450px] w-[450px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(11,110,107,.45),transparent 60%)", filter: "blur(45px)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)", boxShadow: "0 4px 14px rgba(11,110,107,.4)" }}>R</div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#F4EDE0" }}>ResolvAI</span>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.1em] uppercase mb-4" style={{ color: "#F26A4F" }}>Free forever on Starter</p>
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight mb-6" style={{ color: "#F4EDE0" }}>
            Your AI agent,<br />
            <span style={{ background: "linear-gradient(110deg,#5BC7B6,#E8B86E,#F26A4F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ready in minutes</span>.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Zap, label: "Live in under 2 minutes — just paste a script tag" },
              { icon: Users, label: "Built for solo founders and growing teams alike" },
              { icon: ShieldCheck, label: "Your data stays yours — no third-party training" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(242,106,79,0.18)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#F26A4F" }} />
                </div>
                <span className="text-sm" style={{ color: "#7AACB0" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <p className="text-sm italic leading-relaxed" style={{ color: "#4A6B72" }}>
            "Set up in 10 minutes. Our support load dropped 70% that same week."
          </p>
          <p className="text-xs mt-2 font-medium" style={{ color: "#2E5059" }}>— Beta customer</p>
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

          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#0E1B22" }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: "#6F8087" }}>Start automating support with AI</p>

          {error && (
            <div className="text-red-600 text-sm p-3 rounded-xl mb-5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Company</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  placeholder="Acme Inc." required />
              </div>
            </div>
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
                placeholder="••••••••" minLength={8} required />
              <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Minimum 8 characters</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 font-medium disabled:opacity-50 transition-all mt-2"
              style={{ background: "linear-gradient(135deg,#0B6E6B,#064F4D)", boxShadow: "0 4px 14px rgba(11,110,107,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#6F8087" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: "#0B6E6B" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
