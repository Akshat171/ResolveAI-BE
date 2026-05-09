"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Headphones,
  BarChart3,
  Lightbulb,
  Settings,
  Code,
  Key,
  Mail,
  MessageCircle,
  Zap,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/escalations", label: "Escalations", icon: AlertTriangle, alert: true },
  { href: "/live-chat", label: "Live Chat", icon: Headphones },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
];

const settingsItems = [
  { href: "/settings/email", label: "Email Inboxes", icon: Mail },
  { href: "/settings/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/settings/canned-responses", label: "Canned Responses", icon: Zap },
  { href: "/settings/widget", label: "Widget", icon: Settings },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
  { href: "/install", label: "Install Widget", icon: Code },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <aside className="w-64 h-screen flex flex-col shrink-0 sticky top-0" style={{ background: "#06181F", borderRight: "1px solid #1E3640" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0" style={{ borderBottom: "1px solid #1E3640" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: "linear-gradient(135deg,#0B6E6B,#F26A4F)", boxShadow: "0 4px 14px rgba(11,110,107,.4)" }}>
          <span className="text-white font-bold text-sm tracking-tight">R</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight tracking-tight" style={{ color: "#F4EDE0" }}>ResolvAI</p>
          <p className="text-[10px] leading-tight mt-0.5 truncate" style={{ color: "#4A6B72" }}>
            {user?.full_name || user?.email || "Workspace"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "#2E5059" }}>
          Main
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group")}
                style={{
                  background: active ? "rgba(11,110,107,0.18)" : "transparent",
                  color: active ? "#F4EDE0" : "#7AACB0",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#F26A4F" }} />
                )}
                <item.icon className="w-4 h-4 shrink-0" style={{ color: active ? "#5BC7B6" : "#4A6B72" }} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 mt-6" style={{ color: "#2E5059" }}>
          Settings
        </p>
        <div className="space-y-0.5">
          {settingsItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative"
                style={{
                  background: active ? "rgba(11,110,107,0.18)" : "transparent",
                  color: active ? "#F4EDE0" : "#4A6B72",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "#F26A4F" }} />
                )}
                <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? "#5BC7B6" : "#2E5059" }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom user area */}
      <div className="shrink-0 p-3" style={{ borderTop: "1px solid #1E3640" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group"
          style={{ cursor: "default" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg,#0B6E6B,#5BC7B6)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight" style={{ color: "#7AACB0" }}>
              {user?.full_name || "User"}
            </p>
            <p className="text-[10px] truncate leading-tight" style={{ color: "#2E5059" }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1 rounded transition-colors"
            style={{ color: "#2E5059" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#7AACB0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2E5059")}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
