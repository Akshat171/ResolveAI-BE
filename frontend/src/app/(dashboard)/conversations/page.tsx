"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";

type ConversationWithEmail = Conversation;
import { MessageSquare, Mail } from "lucide-react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithEmail[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const params: Record<string, string> = {};
        if (filter) params.status = filter;
        const res = await api.get("/conversations", { params });
        setConversations(res.data);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [filter]);

  const getInitials = (conv: ConversationWithEmail) => {
    const name = conv.visitor_name || conv.visitor_email || "V";
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = (conv: ConversationWithEmail) => {
    return conv.visitor_name || conv.visitor_email || `Visitor ${conv.visitor_id?.slice(0, 8) || "unknown"}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and review all customer interactions</p>
        </div>
        {!loading && (
          <span className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-lg">
            {conversations.length} total
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6">
        {[
          { value: "", label: "All" },
          { value: "active", label: "Active" },
          { value: "escalated", label: "Escalated" },
          { value: "resolved", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              filter === tab.value
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No conversations yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Install the widget on your site to start receiving conversations
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex items-center"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {getInitials(conv)}
              </div>

              {/* Content */}
              <div className="flex-1 mx-4 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{getDisplayName(conv)}</p>
                  {conv.channel === "email" ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      <Mail className="w-3 h-3" />
                      Email
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      <MessageSquare className="w-3 h-3" />
                      Widget
                    </span>
                  )}
                </div>
                {conv.channel === "email" && conv.email_subject ? (
                  <p className="text-slate-500 text-xs mt-1 truncate">
                    {conv.email_subject}
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs mt-1">{formatRelativeTime(conv.created_at)}</p>
                )}
                {conv.channel === "email" && conv.email_subject && (
                  <p className="text-slate-400 text-xs">{formatRelativeTime(conv.created_at)}</p>
                )}
              </div>

              {/* Right badges */}
              <div className="flex items-center gap-2 shrink-0">
                {conv.confidence_avg && (
                  <span className="text-xs text-slate-400 font-medium">
                    {Math.round(conv.confidence_avg * 100)}% conf
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    conv.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : conv.status === "escalated"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {conv.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
