"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";
import { AlertTriangle, MessageSquare, Clock, User, ArrowRight, CheckCircle } from "lucide-react";

function Avatar({ name }: { name: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#F26A4F,#E8B86E)",
    "linear-gradient(135deg,#0B6E6B,#5BC7B6)",
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

export default function EscalationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/conversations?status=escalated");
        setConversations(res.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleResolve = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    try {
      await api.patch(`/conversations/${id}?status=resolved`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      <div className="px-8 pt-8 pb-6" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>Escalations</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>Conversations that need immediate human attention</p>
          </div>
          {!loading && conversations.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {conversations.length} requiring attention
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-center gap-4 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }}>
                <div className="w-10 h-10 rounded-full shrink-0" style={{ background: "#DED2BB" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded-full w-1/4" style={{ background: "#DED2BB" }} />
                  <div className="h-3 rounded-full w-2/5" style={{ background: "#ECE2CF" }} />
                </div>
                <div className="h-8 w-24 rounded-xl" style={{ background: "#ECE2CF" }} />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>All clear</p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#6F8087" }}>
              No escalated conversations right now. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const name = conv.visitor_name || conv.visitor_email || `Visitor ${conv.visitor_id?.slice(0, 8) || ""}`;
              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all"
                  style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F26A4F"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(242,106,79,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DED2BB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <Avatar name={name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-sm truncate" style={{ color: "#0E1B22" }}>{name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-600 ring-1 ring-red-200 px-2 py-0.5 rounded-full shrink-0">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Escalated
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#6F8087" }}>
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(conv.created_at)}
                      </span>
                      {conv.visitor_email && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#6F8087" }}>
                          <User className="w-3 h-3" />
                          {conv.visitor_email}
                        </span>
                      )}
                      {conv.confidence_avg != null && (
                        <span className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded",
                          conv.confidence_avg < 0.4 ? "bg-red-50 text-red-500"
                            : conv.confidence_avg < 0.7 ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                        )}>
                          {Math.round(conv.confidence_avg * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleResolve(e, conv.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                    <Link
                      href="/live-chat"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
                      style={{ color: "#0B6E6B", background: "#E4F1EF", borderColor: "#0B6E6B33" }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Link>
                    <ArrowRight className="w-4 h-4 transition-colors" style={{ color: "#DED2BB" }} />
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
