"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle, ArrowRight, Sparkles, Code2, BookOpen, Mail } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loadUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  async function handleStep1Next() {
    setCreatingKey(true);
    try {
      const res = await api.post("/api-keys?name=Widget+Key");
      setApiKey(res.data.key);
    } catch {
      // key may already exist
    } finally {
      setCreatingKey(false);
    }
    setStep(2);
  }

  function copyCode() {
    navigator.clipboard.writeText(widgetCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function widgetCode() {
    const key = apiKey || "YOUR_API_KEY";
    return `<script\n  src="http://localhost:5173/resolvai.js"\n  data-api-key="${key}"\n  data-position="bottom-right"\n  async>\n</script>`;
  }

  async function completeOnboarding(destination: string) {
    try {
      await api.patch("/tenants/me", { settings: { onboarding_completed: true } });
    } catch {}
    router.push(destination);
  }

  const steps = [
    { n: 1, label: "Welcome" },
    { n: 2, label: "Install Widget" },
    { n: 3, label: "What's Next" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#06181F" }}>
      {/* Decorative blobs */}
      <div className="absolute top-[-15%] left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(11,110,107,.4),transparent 60%)", filter: "blur(50px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(242,106,79,.25),transparent 65%)", filter: "blur(60px)" }} />
      {/* Grid */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "56px 56px" }} />

      <div className="w-full max-w-2xl relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)" }}>R</div>
          <span className="font-bold tracking-tight" style={{ color: "#F4EDE0" }}>ResolvAI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: step === s.n ? "#0B6E6B" : step > s.n ? "rgba(11,110,107,0.25)" : "rgba(255,255,255,0.05)",
                  color: step === s.n ? "white" : step > s.n ? "#5BC7B6" : "#4A6B72",
                }}>
                {step > s.n ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full border border-current text-[10px]">
                    {s.n}
                  </span>
                )}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-px" style={{ background: step > s.n ? "#0B6E6B" : "rgba(255,255,255,0.1)" }} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg,#0B6E6B,#5BC7B6)", boxShadow: "0 8px 30px rgba(11,110,107,0.4)" }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: "#F4EDE0" }}>
                Welcome, {firstName}!
              </h1>
              <p className="text-lg mb-2" style={{ color: "#7AACB0" }}>
                Your ResolvAI workspace is ready.
              </p>
              <p className="text-sm mb-10" style={{ color: "#4A6B72" }}>
                Let's get your AI support agent running in 2 minutes.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10 text-left">
                {[
                  { icon: Code2, title: "Install Widget", desc: "Embed chat on your site" },
                  { icon: BookOpen, title: "Knowledge Base", desc: "Train AI with your docs" },
                  { icon: Mail, title: "Email Channel", desc: "Auto-reply to support emails" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(11,110,107,0.25)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#5BC7B6" }} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "#F4EDE0" }}>{title}</p>
                    <p className="text-xs" style={{ color: "#4A6B72" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={handleStep1Next} disabled={creatingKey}
                className="inline-flex items-center gap-2 text-white font-medium px-8 py-3.5 rounded-xl transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#0B6E6B,#064F4D)", boxShadow: "0 4px 20px rgba(11,110,107,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {creatingKey ? "Setting up..." : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Install Widget ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(11,110,107,0.25)" }}>
                  <Code2 className="w-5 h-5" style={{ color: "#5BC7B6" }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#F4EDE0" }}>Install the Chat Widget</h2>
                  <p className="text-sm" style={{ color: "#4A6B72" }}>Paste this into your website's HTML</p>
                </div>
              </div>

              {apiKey && (
                <div className="rounded-xl p-4 mb-5 flex items-start gap-3"
                  style={{ background: "rgba(11,110,107,0.15)", border: "1px solid rgba(11,110,107,0.3)" }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#5BC7B6" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#5BC7B6" }}>API key created!</p>
                    <p className="text-xs mt-0.5" style={{ color: "#4A6B72" }}>
                      Key: <code className="font-mono">{apiKey.slice(0, 12)}…</code> — already embedded below.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm mb-3" style={{ color: "#7AACB0" }}>
                Add this just before the closing{" "}
                <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(255,255,255,0.08)", color: "#5BC7B6" }}>&lt;/body&gt;</code>{" "}
                tag:
              </p>

              <div className="relative mb-6">
                <pre className="rounded-xl p-5 font-mono text-sm overflow-x-auto" style={{ background: "#020D10", color: "#5BC7B6", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <code>{widgetCode()}</code>
                </pre>
                <button onClick={copyCode}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#7AACB0" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#F4EDE0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#7AACB0"; }}>
                  {copied ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>

              <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "rgba(232,184,110,0.1)", border: "1px solid rgba(232,184,110,0.25)", color: "#E8B86E" }}>
                <strong>Save your full API key</strong> — it's shown once. You can find the prefix under{" "}
                <span className="font-medium">Settings → API Keys</span>.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-white font-medium px-6 py-3 rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg,#0B6E6B,#064F4D)", boxShadow: "0 4px 14px rgba(11,110,107,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl text-sm transition-colors"
                  style={{ color: "#4A6B72" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#7AACB0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4A6B72")}>
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: What's Next ── */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(11,110,107,0.2)", border: "2px solid rgba(11,110,107,0.4)" }}>
                  <CheckCircle className="w-8 h-8" style={{ color: "#5BC7B6" }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#F4EDE0" }}>You're all set!</h2>
                <p className="text-sm" style={{ color: "#4A6B72" }}>Here's what to do next to get the most out of ResolvAI.</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  {
                    icon: BookOpen,
                    title: "Add Knowledge Base content",
                    desc: "The AI uses your docs to answer questions. Without content, it can't help.",
                    href: "/knowledge-base",
                    badge: "Recommended first",
                  },
                  {
                    icon: Mail,
                    title: "Connect an email inbox",
                    desc: "Auto-reply to customer emails with AI. Set up Gmail or any IMAP inbox.",
                    href: "/settings/email",
                    badge: null,
                  },
                  {
                    icon: Code2,
                    title: "Install the widget on your site",
                    desc: "Embed the chat bubble on your website.",
                    href: "/install",
                    badge: null,
                  },
                ].map(({ icon: Icon, title, desc, href, badge }) => (
                  <button key={href} onClick={() => completeOnboarding(href)}
                    className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all group"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(11,110,107,0.12)"; e.currentTarget.style.borderColor = "rgba(11,110,107,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(11,110,107,0.2)" }}>
                      <Icon className="w-5 h-5" style={{ color: "#5BC7B6" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: "#F4EDE0" }}>{title}</span>
                        {badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(11,110,107,0.25)", color: "#5BC7B6" }}>
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#4A6B72" }}>{desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "#2E5059" }} />
                  </button>
                ))}
              </div>

              <button onClick={() => completeOnboarding("/conversations")}
                className="w-full py-3 rounded-xl text-sm transition-colors"
                style={{ color: "#4A6B72", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#7AACB0"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#4A6B72"; e.currentTarget.style.background = "transparent"; }}>
                Skip to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
