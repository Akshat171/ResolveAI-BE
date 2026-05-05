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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/live-chat", label: "Live Chat", icon: Headphones },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
];

const settingsItems = [
  { href: "/settings/email", label: "Email Inboxes", icon: Mail },
  { href: "/settings/widget", label: "Widget Settings", icon: Settings },
  { href: "/settings/api-keys", label: "API Keys", icon: Key },
  { href: "/install", label: "Install Widget", icon: Code },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-[#0f172a] h-screen flex flex-col shrink-0 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">ResolvAI</p>
          <p className="text-slate-400 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="text-slate-600 text-[10px] tracking-widest uppercase mt-4 mb-1 px-4">
          Navigation
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all",
              pathname === item.href
                ? "bg-indigo-600 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        <p className="text-slate-600 text-[10px] tracking-widest uppercase mt-6 mb-1 px-4">
          Settings
        </p>
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all",
              pathname === item.href
                ? "bg-indigo-600 text-white font-medium"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="border-t border-slate-800 p-4">
        {user?.email && (
          <p className="text-slate-500 text-xs mb-3 truncate">{user.email}</p>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white w-full transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
