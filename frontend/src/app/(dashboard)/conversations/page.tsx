"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";
import { MessageSquare, Mail, MessageCircle, Search } from "lucide-react";

type ConversationWithEmail = Conversation;

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  escalated: "bg-red-50 text-red-700 ring-1 ring-red-200",
  resolved: "bg-[#F0EAE0] text-[#6F8087] ring-1 ring-[#DED2BB]",
};

const CHANNEL_BADGES: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  email: { label: "Email", icon: Mail, cls: "bg-blue-50 text-blue-600 ring-1 ring-blue-100" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" },
  widget: { label: "Widget", icon: MessageSquare, cls: "bg-[#F0EAE0] text-[#6F8087] ring-1 ring-[#DED2BB]" },
};

function Avatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#0B6E6B,#5BC7B6)",
    "linear-gradient(135deg,#F26A4F,#E8B86E)",
    "linear-gradient(135deg,#064F4D,#0B6E6B)",
    "linear-gradient(135deg,#E8B86E,#F26A4F)",
    "linear-gradient(135deg,#5BC7B6,#0B6E6B)",
  ];
  const gradient = gradients[letter.charCodeAt(0) % gradients.length];
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm"
      style={{ background: gradient }}>
      {letter}
    </div>
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithEmail[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filter) params.status = filter;
        const res = await api.get("/conversations", { params });
        setConversations(res.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [filter]);

  const filtered = search
    ? conversations.filter((c) => {
        const q = search.toLowerCase();
        return (
          (c.visitor_name || "").toLowerCase().includes(q) ||
          (c.visitor_email || "").toLowerCase().includes(q) ||
          (c.email_subject || "").toLowerCase().includes(q)
        );
      })
    : conversations;

  const getDisplayName = (c: ConversationWithEmail) =>
    c.visitor_name || c.visitor_email || `Visitor ${c.visitor_id?.slice(0, 8) || ""}`;

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-0" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>Conversations</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>All customer interactions in one place</p>
          </div>
          {!loading && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#ECE2CF", color: "#6F8087" }}>
              {filtered.length} {filter || "total"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6F8087" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
              style={{ background: "#ECE2CF", border: "1px solid #DED2BB", color: "#0E1B22" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <div className="flex items-center gap-0.5 ml-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px"
                style={{
                  color: filter === tab.value ? "#0B6E6B" : "#6F8087",
                  borderBottomColor: filter === tab.value ? "#0B6E6B" : "transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-4 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }}>
                <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "#DED2BB" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded-full w-1/4" style={{ background: "#DED2BB" }} />
                  <div className="h-3 rounded-full w-2/5" style={{ background: "#ECE2CF" }} />
                </div>
                <div className="h-6 w-16 rounded-full" style={{ background: "#ECE2CF" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECE2CF" }}>
              <MessageSquare className="w-7 h-7" style={{ color: "#DED2BB" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>
              {search ? "No results found" : "No conversations yet"}
            </p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#6F8087" }}>
              {search
                ? `No conversations match "${search}"`
                : "Install the chat widget or connect an email inbox to start receiving conversations."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => {
              const channelKey = conv.channel in CHANNEL_BADGES ? conv.channel : "widget";
              const channel = CHANNEL_BADGES[channelKey];
              const ChannelIcon = channel.icon;
              const name = getDisplayName(conv);

              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="group flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-all"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #DED2BB" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.95)"; (e.currentTarget as HTMLElement).style.borderColor = "#C8C8BE"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(14,27,34,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.8)"; (e.currentTarget as HTMLElement).style.borderColor = "#DED2BB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <Avatar name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate" style={{ color: "#0E1B22" }}>{name}</p>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0", channel.cls)}>
                        <ChannelIcon className="w-2.5 h-2.5" />
                        {channel.label}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#6F8087" }}>
                      {conv.channel === "email" && conv.email_subject
                        ? conv.email_subject
                        : conv.visitor_email || `Started ${formatRelativeTime(conv.created_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {conv.confidence_avg != null && (
                      <div className="hidden lg:flex items-center gap-1.5">
                        <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "#ECE2CF" }}>
                          <div
                            className={cn("h-full rounded-full", conv.confidence_avg >= 0.7 ? "bg-emerald-400" : conv.confidence_avg >= 0.4 ? "bg-amber-400" : "bg-red-400")}
                            style={{ width: `${Math.round(conv.confidence_avg * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: "#6F8087" }}>
                          {Math.round(conv.confidence_avg * 100)}%
                        </span>
                      </div>
                    )}
                    <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize", STATUS_STYLES[conv.status] || STATUS_STYLES.resolved)}>
                      {conv.status}
                    </span>
                    <span className="text-[11px] w-12 text-right tabular-nums" style={{ color: "#6F8087" }}>
                      {formatRelativeTime(conv.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
