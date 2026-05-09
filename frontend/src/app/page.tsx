"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Bot, Users, BarChart3, Sparkles,
  HeartPulse, Check, Star, Zap, ShieldCheck, Menu, X,
} from "lucide-react";
import {
  SiInstagram, SiWhatsapp, SiGmail, SiSlack, SiMessenger, SiTelegram, SiGithub,
} from "react-icons/si";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

/* ── Reveal helper ──────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { setTimeout(() => el.classList.add("in-view"), delay); io.unobserve(el); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <div ref={ref} className={`r-reveal ${className}`}>{children}</div>;
}

/* ── Corner dots ────────────────────────────────────────────────────────── */
function CornerDots({ color = "currentColor" }: { color?: string }) {
  return (
    <>
      <span className="r-corner-dot" style={{ top: 8, left: 8, color }} />
      <span className="r-corner-dot" style={{ top: 8, right: 8, color }} />
      <span className="r-corner-dot" style={{ bottom: 8, left: 8, color }} />
      <span className="r-corner-dot" style={{ bottom: 8, right: 8, color }} />
    </>
  );
}

/* ── Eyebrow ────────────────────────────────────────────────────────────── */
function Eyebrow({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "muted" | "dark" }) {
  const cls = tone === "dark" ? "r-eyebrow-dark" : tone === "muted" ? "r-eyebrow-muted" : "";
  return <span className={`r-eyebrow ${cls}`}>{children}</span>;
}

/* ── Animated BG blobs ──────────────────────────────────────────────────── */
function AnimatedBG({ variant = "dark" }: { variant?: "dark" | "warm" }) {
  if (variant === "warm") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 r-bg-grid-warm opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <motion.div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(242,106,79,.28),transparent 65%)" }}
          animate={{ x: [0,40,0], y: [0,25,0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-32 -right-16 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(11,110,107,.22),transparent 65%)" }}
          animate={{ x: [0,-30,0], y: [0,-20,0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 r-bg-grid-dark opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />
      <div className="absolute inset-0 r-bg-dot-dark opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
      <motion.div className="absolute top-[-20%] left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(11,110,107,.55),transparent 60%)", filter: "blur(40px)" }}
        animate={{ scale: [1,1.15,1], opacity: [0.55,0.75,0.55] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute top-[10%] -left-32 h-[480px] w-[480px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(242,106,79,.45),transparent 65%)", filter: "blur(60px)" }}
        animate={{ x: [0,60,0], y: [0,40,0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-[-10%] right-[-10%] h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(232,184,110,.3),transparent 65%)", filter: "blur(70px)" }}
        animate={{ x: [0,-40,0], y: [0,-30,0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      {/* frame corners */}
      <span className="absolute top-6 left-6 h-10 w-10 border-l-2 border-t-2 border-[rgba(242,106,79,0.4)]" />
      <span className="absolute top-6 right-6 h-10 w-10 border-r-2 border-t-2 border-[rgba(242,106,79,0.4)]" />
      <span className="absolute bottom-6 left-6 h-10 w-10 border-l-2 border-b-2 border-[rgba(242,106,79,0.4)]" />
      <span className="absolute bottom-6 right-6 h-10 w-10 border-r-2 border-b-2 border-[rgba(242,106,79,0.4)]" />
    </div>
  );
}

/* ── Nav ────────────────────────────────────────────────────────────────── */
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn(); window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
  ];
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${scrolled ? "border-b" : "border-b border-transparent"}`}
      style={{ background: scrolled ? "rgba(244,237,224,0.88)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderColor: scrolled ? "var(--r-border)" : "transparent" }}>
      <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-lg r-gradient-brand grid place-items-center text-white font-bold text-[15px] r-shadow-brand">R</span>
          <span className="font-bold tracking-tight text-[17px]" style={{ color: "var(--r-ink)" }}>ResolvAI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-[14px] font-medium transition-colors duration-150"
              style={{ color: "var(--r-ink-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--r-ink)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--r-ink-muted)")}>{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-5">
          <Link href="/login" className="text-[14px] font-medium transition-colors" style={{ color: "var(--r-ink-muted)" }}>Sign in</Link>
          <Link href="/signup" className="inline-flex items-center text-[14px] font-semibold text-white rounded-xl px-4 py-2.5 r-shadow-brand hover:-translate-y-px transition-all duration-150"
            style={{ background: "var(--r-brand)" }}>Get started free</Link>
        </div>
        <button onClick={() => setOpen(v => !v)} className="md:hidden h-10 w-10 grid place-items-center rounded-lg" style={{ color: "var(--r-ink)" }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t" style={{ background: "var(--r-bg)", borderColor: "var(--r-border)" }}>
          <div className="px-6 py-8 flex flex-col gap-6">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[22px] font-semibold" style={{ color: "var(--r-ink)" }}>{l.label}</a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: "var(--r-border)" }}>
              <Link href="/login" className="text-[16px] font-medium" style={{ color: "var(--r-ink-muted)" }}>Sign in</Link>
              <Link href="/signup" className="inline-flex items-center justify-center text-[15px] font-semibold text-white rounded-xl px-5 py-3" style={{ background: "var(--r-brand)" }}>Get started free</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32" style={{ background: "var(--r-dark-hero)", color: "var(--r-on-dark)" }}>
      <AnimatedBG variant="dark" />
      <div className="relative max-w-[1200px] mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border"
          style={{ background: "rgba(242,106,79,.12)", borderColor: "rgba(242,106,79,.35)" }}>
          <Sparkles size={12} style={{ color: "var(--r-coral)" }} />
          <span className="text-[11px] font-semibold tracking-[0.06em]" style={{ color: "var(--r-coral)" }}>POWERED BY GPT-4O · RAG ARCHITECTURE</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
          className="r-display mx-auto mt-7 max-w-[820px] text-[44px] sm:text-[58px] md:text-[72px]" style={{ color: "var(--r-on-dark)" }}>
          AI support that <span className="r-text-gradient r-shimmer">resolves</span>.
          <br className="hidden sm:block" /> Not just reads.
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
          className="mx-auto mt-7 max-w-[560px] text-[17px] md:text-[18px] leading-[1.7]" style={{ color: "var(--r-on-dark-muted)" }}>
          Train ResolvAI on your docs in minutes. Embed a widget on WhatsApp, Gmail and your site — let AI handle 85% of tickets and hand off the rest with full context.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.a whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/signup"
            className="r-arrow-link inline-flex items-center gap-2 text-white font-semibold text-[15px] rounded-xl px-6 py-3.5 r-gradient-warm r-shadow-coral">
            Start for free <ArrowRight size={16} />
          </motion.a>
          <motion.a whileHover={{ y: -2 }} href="#how-it-works"
            className="inline-flex items-center gap-2 text-[15px] font-medium rounded-xl px-6 py-3.5 border backdrop-blur-md"
            style={{ background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.18)", color: "var(--r-on-dark)" }}>
            See how it works
          </motion.a>
        </motion.div>

        {/* Channel icons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 flex items-center justify-center gap-5" style={{ color: "var(--r-on-dark-muted)" }}>
          <span className="text-[11px] font-mono tracking-widest uppercase">Works with</span>
          {[
            { Icon: SiWhatsapp, color: "#25D366" },
            { Icon: SiInstagram, color: "#E4405F" },
            { Icon: SiGmail, color: "#EA4335" },
            { Icon: SiMessenger, color: "#00B2FF" },
            { Icon: SiTelegram, color: "#26A5E4" },
            { Icon: SiSlack, color: "#E01E5A" },
          ].map(({ Icon, color }, i) => (
            <motion.span key={i} whileHover={{ y: -3, scale: 1.15 }} transition={{ type: "spring", stiffness: 300 }}>
              <Icon size={20} color={color} style={{ opacity: 0.9 }} />
            </motion.span>
          ))}
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px]" style={{ color: "rgba(122,172,176,.8)" }}>
          {["No credit card", "5 min setup", "Free forever on Starter"].map(t => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check size={12} style={{ color: "var(--r-gold)" }} />{t}
            </span>
          ))}
        </div>

        {/* Product screenshot */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }} className="mt-20">
          <div className="mx-auto max-w-[1040px] rounded-[14px] overflow-hidden border"
            style={{ borderColor: "rgba(255,255,255,.08)", boxShadow: "0 32px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06),0 0 100px rgba(242,106,79,.18)", transform: "perspective(1800px) rotateX(2deg)" }}>
            <div className="h-8 flex items-center gap-2 px-4 border-b" style={{ background: "#0F1014", borderColor: "rgba(255,255,255,.05)" }}>
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[10px] font-mono" style={{ color: "var(--r-ink-soft)" }}>app.resolvai.com/inbox</span>
            </div>
            <img src="/conversation.png" alt="ResolvAI dashboard" className="w-full block" width={1600} height={1024} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Stats ──────────────────────────────────────────────────────────────── */
function Stats() {
  const items = [
    { v: "< 1s", l: "Average AI response time" },
    { v: "85%", l: "Average resolution rate" },
    { v: "24/7", l: "Always available" },
    { v: "3×",  l: "Faster than traditional support" },
  ];
  return (
    <section style={{ background: "var(--r-dark-section)", borderTop: "1px solid var(--r-dark-border)", borderBottom: "1px solid var(--r-dark-border)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "rgba(30,54,64,.7)" }}>
          {items.map(s => (
            <div key={s.l} className="px-6 py-6 text-center">
              <div className="text-[34px] md:text-[36px] font-semibold tracking-tight" style={{ color: "var(--r-on-dark)" }}>{s.v}</div>
              <div className="mt-1.5 text-[13px]" style={{ color: "var(--r-on-dark-muted)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Logo strip ─────────────────────────────────────────────────────────── */
function Logos() {
  const names = ["NORTHWIND", "OBELISK", "CLEARBIT", "LUMEN", "FORMICA", "ATLASCO", "RIVERLY"];
  const row = [...names, ...names];
  return (
    <section className="py-16" style={{ background: "var(--r-surface-warm)" }}>
      <div className="text-center"><Eyebrow tone="muted">Trusted by teams at</Eyebrow></div>
      <div className="relative mx-auto mt-8 max-w-[900px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max gap-14 r-marquee">
          {row.map((n, i) => (
            <span key={i} className="text-[15px] font-semibold tracking-[0.18em]" style={{ color: "rgba(176,176,168,.7)" }}>{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: BookOpen, title: "Knowledge Base",    body: "Upload PDFs, crawl URLs, paste text. ResolvAI indexes everything in minutes.", bg: "var(--r-brand-light)", fg: "var(--r-brand)" },
  { icon: Bot,      title: "AI Chat Agent",     body: "GPT-4o + RAG with confidence scoring. Answers grounded in your docs.",          bg: "#FFE9E2",             fg: "var(--r-coral)" },
  { icon: Users,    title: "Human Handoff",     body: "When the AI isn't confident, escalate seamlessly with full conversation context.", bg: "#E8F5FF",           fg: "#0284C7" },
  { icon: SiGmail,  title: "Gmail & Email",     body: "Auto-triage incoming email, draft replies, and escalate edge cases automatically.", bg: "#FDECEA",          fg: "#EA4335" },
  { icon: SiWhatsapp, title: "WhatsApp Channel", body: "Meet customers where they already are — a unified inbox across every channel.",  bg: "#E6F8EE",           fg: "#1FAD56" },
  { icon: SiInstagram, title: "Instagram DMs",  body: "Reply to story mentions and DMs without leaving your inbox.",                     bg: "#FCE6EC",           fg: "#E4405F" },
  { icon: BarChart3, title: "Analytics",        body: "Resolution rate, confidence trends, channel breakdown — all in one dashboard.",   bg: "var(--r-warning-light)", fg: "var(--r-warning)" },
  { icon: Sparkles,  title: "AI Insights",      body: "Weekly gap analysis flags top topics and recommends new knowledge to add.",       bg: "#FFF7ED",           fg: "#EA580C" },
  { icon: HeartPulse, title: "Emotion Detection", body: "Spot frustrated or angry customers in real time and route to a human first.",  bg: "#FFF1F2",           fg: "#E11D48" },
];

function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden" style={{ background: "var(--r-surface-warm)" }}>
      <AnimatedBG variant="warm" />
      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="max-w-[640px]">
          <Eyebrow>Features</Eyebrow>
          <h2 className="r-section-h mt-4 text-[34px] md:text-[44px] text-balance" style={{ color: "var(--r-ink)" }}>
            Everything your support team needs,{" "}
            <span className="r-text-gradient">in one place</span>.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] max-w-[520px]" style={{ color: "var(--r-ink-soft)" }}>
            From first AI response to deep analytics — one platform, no duct tape, no per-seat surprise.
          </p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon as React.ElementType;
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.16,1,0.3,1] }}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl p-7 border r-shadow-resting hover:r-shadow-hover transition-shadow duration-200 h-full"
                style={{ background: "rgba(255,255,255,.8)", borderColor: "var(--r-border)" }}>
                {i < 3 && <CornerDots color="#F26A4F" />}
                <div className="h-11 w-11 rounded-xl grid place-items-center" style={{ background: f.bg }}>
                  <Icon size={20} style={{ color: f.fg }} />
                </div>
                <h3 className="mt-5 text-[16px] font-semibold" style={{ color: "var(--r-ink)" }}>{f.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: "var(--r-ink-soft)" }}>{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ───────────────────────────────────────────────────────── */
/* ── Product Showcase ───────────────────────────────────────────────────── */
function ProductShowcase() {
  const [active, setActive] = useState(0);
  const tabs = [
    {
      label: "Conversations",
      tag: "Inbox",
      headline: "Every customer conversation, in one place.",
      body: "See all channels — widget, email, WhatsApp — in a single unified inbox. Confidence scores and live statuses at a glance.",
      img: "/conversation.png",
      alt: "ResolvAI conversations inbox showing customer list with AI confidence scores",
    },
    {
      label: "AI Chat",
      tag: "Live Chat",
      headline: "Watch the AI resolve tickets in real time.",
      body: "The AI reads your knowledge base, crafts a helpful reply, and scores its own confidence. Emotion detection flags frustrated customers automatically.",
      img: "/conversation_id.png",
      alt: "ResolvAI conversation detail showing AI responses with 92% confidence score",
    },
    {
      label: "Analytics",
      tag: "Analytics",
      headline: "Know exactly how your support is performing.",
      body: "70% resolution rate, 82% avg confidence, channel breakdown — all in one view. Switch between 7, 14, or 30 day windows instantly.",
      img: "/analytics.png",
      alt: "ResolvAI analytics dashboard showing resolution rate, confidence score and channel breakdown",
    },
  ];

  return (
    <section className="py-24 md:py-32 overflow-hidden" style={{ background: "var(--r-surface-warmer)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <Eyebrow>Product</Eyebrow>
          <h2 className="r-section-h mt-4 text-[34px] md:text-[44px] text-balance" style={{ color: "var(--r-ink)" }}>
            See it in action.
          </h2>
          <p className="r-section-sub mx-auto mt-4 max-w-xl">
            A real dashboard — not a mockup. This is exactly what you get on day one.
          </p>
        </Reveal>

        {/* Tab switcher */}
        <Reveal delay={100} className="flex justify-center mb-8">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(14,27,34,0.08)" }}>
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActive(i)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active === i ? "white" : "transparent",
                  color: active === i ? "#0E1B22" : "#6F8087",
                  boxShadow: active === i ? "0 1px 4px rgba(14,27,34,0.12)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Screenshot card */}
        <Reveal delay={150}>
          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 80px rgba(14,27,34,0.18), 0 4px 16px rgba(14,27,34,0.08)", border: "1px solid #DED2BB" }}>
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#ECE2CF", borderBottom: "1px solid #DED2BB" }}>
              <span className="w-3 h-3 rounded-full" style={{ background: "#F26A4F" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#E8B86E" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#5BC7B6" }} />
              <div className="flex-1 mx-4">
                <div className="mx-auto max-w-xs rounded-md px-3 py-1 text-xs text-center" style={{ background: "rgba(255,255,255,0.7)", color: "#6F8087" }}>
                  app.resolvai.com
                </div>
              </div>
            </div>
            {/* Screenshot */}
            <div className="relative" style={{ background: "#F4EDE0" }}>
              <img
                key={active}
                src={tabs[active].img}
                alt={tabs[active].alt}
                className="w-full block"
                style={{ display: "block", maxHeight: 560, objectFit: "cover", objectPosition: "top" }}
              />
              {/* Gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, var(--r-surface-warmer))" }} />
            </div>
          </div>
        </Reveal>

        {/* Caption */}
        <Reveal delay={200} className="mt-8 max-w-lg mx-auto text-center">
          <span className="inline-block text-xs font-bold tracking-widest uppercase mb-2 px-3 py-1 rounded-full"
            style={{ background: "#E4F1EF", color: "#0B6E6B" }}>
            {tabs[active].tag}
          </span>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "#0E1B22" }}>{tabs[active].headline}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#6F8087" }}>{tabs[active].body}</p>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload your docs",        b: "Drop in PDFs, point at help center URLs, paste raw text. We chunk and embed it for you." },
    { n: "02", t: "Embed one line of code",  b: "Copy a script tag into your site. Customize the widget colors and tone in seconds." },
    { n: "03", t: "AI handles support 24/7", b: "Instant, accurate, source-cited answers. Humans only step in for the hard stuff." },
  ];
  return (
    <section id="how-it-works" className="py-24 md:py-32" style={{ background: "var(--r-surface-warmer)" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[640px] mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="r-section-h mt-4 text-[34px] md:text-[44px] text-balance" style={{ color: "var(--r-ink)" }}>Live in under 10 minutes.</h2>
          <p className="mt-5 text-[17px] leading-[1.7]" style={{ color: "var(--r-ink-soft)" }}>No ML expertise. No configuration hell. If you can paste a script tag, you're ready.</p>
        </div>
        <div className="relative mt-20 grid md:grid-cols-3 gap-12 md:gap-8">
          <div aria-hidden className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px"
            style={{ backgroundImage: "repeating-linear-gradient(to right,#C8C8BE 0 6px,transparent 6px 12px)" }} />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="relative text-center md:text-left">
              <div className="mx-auto md:mx-0 h-14 w-14 rounded-2xl bg-white border-[1.5px] grid place-items-center r-shadow-resting" style={{ borderColor: "var(--r-border)" }}>
                <span className="font-mono font-bold text-[19px]" style={{ color: "var(--r-brand)" }}>{s.n}</span>
              </div>
              <h3 className="mt-6 text-[18px] font-semibold" style={{ color: "var(--r-ink)" }}>{s.t}</h3>
              <p className="mt-2 text-[14px] leading-[1.65] max-w-[300px] mx-auto md:mx-0" style={{ color: "var(--r-ink-soft)" }}>{s.b}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Value block ────────────────────────────────────────────────────────── */
function ValueBlock() {
  const points = [
    "Cut ticket volume by 60–85% in the first month",
    "Source-cited answers — no hallucinated nonsense",
    "Real-time emotion detection routes angry customers to humans first",
    "One inbox for web, email, and WhatsApp",
    "Weekly AI insights flag the docs you're missing",
  ];
  return (
    <section className="py-20 md:py-28" style={{ background: "var(--r-surface-warmer)" }}>
      <div className="max-w-[1248px] mx-auto px-6">
        <div className="relative rounded-[28px] overflow-hidden r-gradient-jewel r-shimmer px-8 md:px-16 py-16 md:py-20">
          <div className="absolute inset-0 r-bg-grid-dark opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <motion.div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full"
            style={{ background: "rgba(232,184,110,.25)", filter: "blur(70px)" }}
            animate={{ x:[0,30,0], y:[0,20,0] }} transition={{ duration:14, repeat:Infinity, ease:"easeInOut" }} />
          <motion.div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full"
            style={{ background: "rgba(91,199,182,.22)", filter: "blur(90px)" }}
            animate={{ x:[0,-25,0], y:[0,-15,0] }} transition={{ duration:16, repeat:Infinity, ease:"easeInOut" }} />

          <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-white">
              <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance">
                Built for teams who can't afford bad support.
              </h2>
              <p className="mt-5 text-[17px] leading-[1.7] max-w-[460px]" style={{ color: "rgba(255,255,255,.75)" }}>
                Every escalation comes with full context. Every answer is grounded in your docs. Every metric is visible.
              </p>
              <ul className="mt-8 space-y-3.5">
                {points.map(p => (
                  <li key={p} className="flex gap-3 items-start">
                    <Check size={18} className="mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,.7)" }} />
                    <span className="text-[14px] leading-[1.6]" style={{ color: "rgba(255,255,255,.9)" }}>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-9">
                <Link href="/signup" className="r-arrow-link inline-flex items-center gap-2 bg-white font-semibold text-[15px] rounded-xl px-6 py-3.5 hover:-translate-y-px transition-transform duration-150"
                  style={{ color: "var(--r-brand-dark)", boxShadow: "0 12px 30px rgba(0,0,0,.18)" }}>
                  Start free trial <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Mock chat card */}
            <div className="relative">
              <motion.div animate={{ rotate: [-6,-4,-6] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
                className="absolute -top-6 -left-4 h-[260px] w-[260px] rounded-3xl hidden md:block"
                style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.15)" }} />
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                transition={{ duration:0.7 }}
                className="relative bg-white rounded-2xl p-5 r-shadow-elevated max-w-[440px] ml-auto r-float">
                <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--r-border)" }}>
                  <div className="h-9 w-9 rounded-lg r-gradient-brand grid place-items-center text-white text-[13px] font-bold">R</div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: "var(--r-ink)" }}>ResolvAI Agent</div>
                    <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--r-ink-soft)" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--r-success)" }} />
                      Online · responds instantly
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <SiWhatsapp size={14} color="#25D366" />
                    <SiInstagram size={14} color="#E4405F" />
                    <SiGmail size={14} color="#EA4335" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="ml-auto max-w-[80%] text-white text-[13px] leading-[1.55] px-4 py-2.5 rounded-2xl rounded-br-md" style={{ background: "var(--r-brand)" }}>
                    How do I export my customer data as CSV?
                  </div>
                  <div className="max-w-[88%] text-[13px] leading-[1.55] px-4 py-3 rounded-2xl rounded-bl-md border" style={{ background: "var(--r-secondary)", color: "var(--r-ink)", borderColor: "var(--r-border)" }}>
                    Go to <span className="font-semibold">Settings → Data → Export</span>, pick the date range, then click <span className="font-semibold">Download CSV</span>.
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(222,210,187,.7)" }}>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5" style={{ color: "var(--r-ink-soft)" }}>
                        <span>CONFIDENCE</span>
                        <span style={{ color: "var(--r-success)" }}>94%</span>
                      </div>
                      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--r-success-light)" }}>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "94%" }} viewport={{ once:true }}
                          transition={{ duration:1.2, delay:0.4, ease:"easeOut" }}
                          className="h-full rounded-full" style={{ background: "var(--r-success)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────────────────────────── */
function Testimonials() {
  const items = [
    { quote: "We deflected 78% of tier-1 tickets in our first month. The handoff to our team is so clean it feels like the AI is just another teammate.", name: "Maya Chen", role: "Head of Support, Northwind" },
    { quote: "Confidence scores are the killer feature. We trust the AI when it's sure, and we know exactly when to step in when it isn't.", name: "Daniel Okafor", role: "CX Lead, Obelisk" },
    { quote: "Setup took an afternoon. The weekly insights have completely changed how we write our docs. This is what support should feel like.", name: "Priya Rangan", role: "COO, Lumen" },
  ];
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[640px]">
          <Eyebrow>Loved by support teams</Eyebrow>
          <h2 className="r-section-h mt-4 text-[34px] md:text-[44px] text-balance" style={{ color: "var(--r-ink)" }}>The kind of feedback we screenshot.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="relative border rounded-2xl p-7 h-full" style={{ background: "var(--r-surface-warm)", borderColor: "var(--r-border)" }}>
                {i === 1 && <CornerDots color="var(--r-ink)" />}
                <div className="flex gap-0.5 text-[#F59E0B] mb-4">
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} fill="#F59E0B" strokeWidth={0} />)}
                </div>
                <p className="text-[15px] leading-[1.7] italic" style={{ color: "var(--r-ink-muted)" }}>"{t.quote}"</p>
                <div className="mt-6 pt-5 border-t" style={{ borderColor: "rgba(222,210,187,.7)" }}>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--r-ink)" }}>{t.name}</div>
                  <div className="text-[12px]" style={{ color: "var(--r-ink-soft)" }}>{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────────────────────────── */
function Pricing() {
  const tiers = [
    {
      name: "Starter", price: "Free", sub: "For teams just getting started", cta: "Start for free", featured: false,
      features: [
        { t: "1 AI agent", on: true }, { t: "100 AI resolutions / month", on: true }, { t: "Web chat widget", on: true },
        { t: "Knowledge base (up to 50 docs)", on: true }, { t: "Email channel", on: false },
        { t: "WhatsApp channel", on: false }, { t: "Advanced analytics", on: false }, { t: "AI Insights & gap analysis", on: false },
      ],
    },
    {
      name: "Pro", price: "$89", sub: "Per month, billed annually", cta: "Start 14-day trial", featured: true,
      features: [
        { t: "Unlimited AI agents", on: true }, { t: "10,000 AI resolutions / month", on: true },
        { t: "Web, email & WhatsApp channels", on: true }, { t: "Unlimited knowledge base", on: true },
        { t: "Human handoff with context", on: true }, { t: "Advanced analytics", on: true },
        { t: "AI Insights & gap analysis", on: true }, { t: "Emotion detection", on: true },
      ],
    },
    {
      name: "Enterprise", price: "Custom", sub: "For high-volume teams", cta: "Talk to sales", featured: false,
      features: [
        { t: "Everything in Pro", on: true }, { t: "Unlimited resolutions", on: true },
        { t: "SSO, SCIM, audit logs", on: true }, { t: "Custom data residency", on: true },
        { t: "Dedicated success manager", on: true }, { t: "99.99% SLA", on: true },
        { t: "Custom model fine-tuning", on: true }, { t: "White-glove onboarding", on: true },
      ],
    },
  ];
  return (
    <section id="pricing" className="py-24 md:py-32" style={{ background: "var(--r-surface-warm)" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[640px] mx-auto">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="r-section-h mt-4 text-[34px] md:text-[44px] text-balance" style={{ color: "var(--r-ink)" }}>Honest pricing. No per-seat tax.</h2>
          <p className="mt-5 text-[17px] leading-[1.7]" style={{ color: "var(--r-ink-soft)" }}>Start free. Upgrade when AI is paying for itself — usually about a week.</p>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          {tiers.map(tier => (
            <div key={tier.name} className={`relative rounded-2xl p-8 ${tier.featured ? "md:scale-[1.03] z-10" : "border"}`}
              style={tier.featured
                ? { background: "#0F0F14", color: "var(--r-on-dark)", boxShadow: "0 24px 64px rgba(15,15,20,.2)" }
                : { background: "white", color: "var(--r-ink)", borderColor: "var(--r-border)" }}>
              {tier.featured && <CornerDots color="#ffffff" />}
              {tier.featured && (
                <div className="absolute -top-3 right-6 text-[10px] font-bold tracking-[0.1em] uppercase text-white px-2.5 py-1 rounded-full r-shadow-brand"
                  style={{ background: "var(--r-brand)" }}>Most popular</div>
              )}
              <div className="text-[14px] font-semibold" style={{ color: tier.featured ? "var(--r-on-dark)" : "var(--r-ink)" }}>{tier.name}</div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[44px] font-semibold tracking-tight" style={{ color: tier.featured ? "white" : "var(--r-ink)" }}>{tier.price}</span>
                {tier.price !== "Free" && tier.price !== "Custom" && (
                  <span className="text-[13px]" style={{ color: tier.featured ? "var(--r-on-dark-muted)" : "var(--r-ink-soft)" }}>/ month</span>
                )}
              </div>
              <div className="text-[13px] mt-1" style={{ color: tier.featured ? "var(--r-on-dark-muted)" : "var(--r-ink-soft)" }}>{tier.sub}</div>
              <Link href="/signup" className={`mt-7 inline-flex w-full items-center justify-center text-[14px] font-semibold rounded-xl px-5 py-3 transition-all duration-150 hover:-translate-y-px ${tier.featured ? "text-white r-shadow-brand" : "border"}`}
                style={tier.featured
                  ? { background: "var(--r-brand)" }
                  : { background: "white", color: "var(--r-ink)", borderColor: "var(--r-border)" }}>
                {tier.cta}
              </Link>
              <ul className="mt-8 space-y-3">
                {tier.features.map((f, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: f.on ? "var(--r-brand)" : "#C8C8BE", opacity: f.on ? 1 : 0.6 }} />
                    <span className="text-[13px]" style={{ color: !f.on ? "#C8C8BE" : tier.featured ? "var(--r-on-dark)" : "var(--r-ink-muted)", textDecoration: !f.on ? "line-through" : "none" }}>{f.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36" style={{ background: "var(--r-dark-hero)", color: "var(--r-on-dark)" }}>
      <AnimatedBG variant="dark" />
      <div className="relative max-w-[680px] mx-auto px-6 text-center">
        <motion.div initial={{ scale:0.6, opacity:0, rotate:-10 }} whileInView={{ scale:1, opacity:1, rotate:0 }} viewport={{ once:true }}
          transition={{ type:"spring", stiffness:180, damping:14 }}
          className="mx-auto h-14 w-14 rounded-2xl r-gradient-warm grid place-items-center r-shadow-coral">
          <Zap size={22} className="text-white" />
        </motion.div>
        <h2 className="mt-7 text-[40px] md:text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] text-balance" style={{ color: "var(--r-on-dark)" }}>
          Ready to let AI handle your support?
        </h2>
        <p className="mt-5 text-[17px] leading-[1.7]" style={{ color: "var(--r-on-dark-muted)" }}>
          Spin up your AI agent, paste a script tag, and watch your inbox quiet down — without losing the human touch.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="r-arrow-link inline-flex items-center gap-2 text-white font-semibold text-[15px] rounded-xl px-6 py-3.5 r-shadow-brand hover:-translate-y-px transition-all duration-150"
            style={{ background: "var(--r-brand)" }}>
            Start for free <ArrowRight size={16} />
          </Link>
          <a href="mailto:hello@resolvai.com" className="inline-flex items-center gap-2 text-[15px] font-medium rounded-xl px-6 py-3.5 border transition-colors duration-150"
            style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.15)", color: "var(--r-on-dark)" }}>
            Talk to us
          </a>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]" style={{ color: "var(--r-ink-soft)" }}>
          {([["No credit card", ShieldCheck], ["Setup in 10 minutes", Zap], ["Cancel anytime", Check]] as const).map(([t, Icon]) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Icon size={12} style={{ color: "var(--r-on-dark-muted)" }} />{t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Product",   links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "Resources", links: ["Docs", "API Reference", "Blog", "Status"] },
    { title: "Company",   links: ["About", "Careers", "Privacy", "Terms"] },
  ];
  return (
    <footer className="border-t" style={{ background: "var(--r-dark-footer)", color: "var(--r-on-dark)", borderColor: "rgba(30,54,64,.6)" }}>
      <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg r-gradient-brand grid place-items-center text-white font-bold text-[15px]">R</span>
              <span className="font-bold tracking-tight text-[17px]" style={{ color: "var(--r-on-dark)" }}>ResolvAI</span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed max-w-[240px]" style={{ color: "var(--r-on-dark-muted)" }}>
              AI customer support that resolves tickets, not just reads them.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[FaXTwitter, SiGithub, FaLinkedin].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 grid place-items-center rounded-lg border transition-colors"
                  style={{ borderColor: "var(--r-dark-border)", color: "var(--r-on-dark-muted)" }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="r-eyebrow mb-5" style={{ color: "rgba(122,172,176,.8)" }}>{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-[13px] transition-colors duration-150" style={{ color: "var(--r-on-dark-muted)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderColor: "rgba(30,54,64,.6)" }}>
          <p className="text-[12px]" style={{ color: "rgba(50,64,71,.7)" }}>© 2025 ResolvAI. All rights reserved.</p>
          <p className="text-[12px]" style={{ color: "rgba(50,64,71,.7)" }}>Made with care for support teams.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen antialiased" style={{ background: "var(--r-bg)", color: "var(--r-ink)", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Logos />
        <Features />
        <ProductShowcase />
        <HowItWorks />
        <ValueBlock />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
