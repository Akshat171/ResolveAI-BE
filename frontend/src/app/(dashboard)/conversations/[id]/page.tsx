"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

type ConversationWithEmail = Conversation;
import { Bot, User, ChevronLeft, CheckCircle, Clock, Hash, Mail, MessageSquare, MessageCircle, Send } from "lucide-react";
import CannedResponsePicker from "@/components/CannedResponsePicker";
import Link from "next/link";

export default function ConversationDetailPage() {
  const params = useParams();
  const [conversation, setConversation] = useState<ConversationWithEmail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);

  const [visitorHistory, setVisitorHistory] = useState<{
    is_returning: boolean;
    visit_count?: number;
    last_emotion?: string;
    past_conversations: Array<{
      id: string;
      status: string;
      created_at: string;
      first_message: string | null;
      last_emotion: string;
    }>;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, msgRes, historyRes] = await Promise.all([
          api.get(`/conversations/${params.id}`),
          api.get(`/conversations/${params.id}/messages`),
          api.get(`/conversations/${params.id}/visitor-history`),
        ]);
        setConversation(convRes.data);
        setMessages(msgRes.data);
        if (historyRes.data.is_returning) setVisitorHistory(historyRes.data);
      } catch (err) {
        console.error("Failed to fetch conversation", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleResolve = async () => {
    try {
      await api.patch(`/conversations/${params.id}?status=resolved`);
      setConversation((prev) => prev ? { ...prev, status: "resolved" } : null);
    } catch (err) {
      console.error("Failed to resolve", err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !conversation) return;
    setSendingReply(true);
    try {
      const endpoint = conversation.channel === "email"
        ? `/email/conversations/${params.id}/reply`
        : `/whatsapp/conversations/${params.id}/reply`;
      const res = await api.post(endpoint, { content: replyText });
      setMessages((prev) => [...prev, res.data]);
      setReplyText("");
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-3" style={{ color: "#6F8087" }}>
      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0B6E6B", borderTopColor: "transparent" }} />
      Loading...
    </div>
  );
  if (!conversation) return (
    <div className="p-8" style={{ color: "#6F8087" }}>Conversation not found</div>
  );

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#ECFDF5", text: "#059669" },
    escalated: { bg: "#FEF2F2", text: "#DC2626" },
    resolved: { bg: "#ECE2CF", text: "#6F8087" },
  };
  const statusStyle = statusColors[conversation.status] || statusColors.resolved;

  return (
    <div className="p-8 max-w-6xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/conversations" className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: "#6F8087" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#0E1B22")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6F8087")}>
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: "#0E1B22" }}>
                {conversation.visitor_name || conversation.visitor_email || "Anonymous Visitor"}
              </h1>
              {conversation.channel === "email" ? (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                  <Mail className="w-3 h-3" /> Email
                </span>
              ) : conversation.channel === "whatsapp" ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#E4F1EF", color: "#0B6E6B" }}>
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#ECE2CF", color: "#6F8087" }}>
                  <MessageSquare className="w-3 h-3" /> Widget
                </span>
              )}
              <span className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                style={{ background: statusStyle.bg, color: statusStyle.text }}>
                {conversation.status}
              </span>
            </div>
            {conversation.channel === "email" && conversation.email_subject && (
              <p className="text-sm mt-1 truncate" style={{ color: "#6F8087" }}>
                Subject: <span className="font-medium" style={{ color: "#324047" }}>{conversation.email_subject}</span>
              </p>
            )}
          </div>
        </div>
        {conversation.status !== "resolved" && (
          <button onClick={handleResolve}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
            <CheckCircle className="w-4 h-4" />
            Resolve
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Messages */}
        <div className="flex-1 rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
          {messages.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "#DED2BB" }}>No messages yet</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id}
              className={cn("flex flex-col max-w-[80%]", msg.role === "visitor" ? "self-end items-end" : "self-start items-start")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs" style={{ color: "#6F8087" }}>
                  {msg.role === "ai" ? "AI Agent" : msg.role === "agent" ? "Human Agent" : "Visitor"}
                </span>
                <span className="text-xs" style={{ color: "#6F8087" }}>{formatDate(msg.created_at)}</span>
                {msg.confidence_score !== null && (
                  <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium",
                    msg.confidence_score >= 0.7 ? "bg-emerald-50 text-emerald-600"
                    : msg.confidence_score >= 0.4 ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-600")}>
                    {Math.round(msg.confidence_score * 100)}%
                  </span>
                )}
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl"
                style={msg.role === "visitor"
                  ? { background: "linear-gradient(135deg,#0B6E6B,#064F4D)", color: "white", borderBottomRightRadius: "4px" }
                  : { background: "#F4EDE0", color: "#0E1B22", border: "1px solid #DED2BB", borderBottomLeftRadius: "4px" }}>
                {msg.content}
              </div>
              {msg.role === "visitor" && msg.emotion && msg.emotion !== "calm" && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium mt-1",
                  msg.emotion === "angry" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                  {msg.emotion === "angry" ? "😠 angry" : "😤 frustrated"}
                </span>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {msg.sources.map((source, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ECE2CF", color: "#6F8087" }}>
                      {source.title} ({Math.round(source.similarity * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Reply section */}
          {(conversation.channel === "email" || conversation.channel === "whatsapp") && conversation.status !== "resolved" && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #ECE2CF" }}>
              <div className="flex items-center gap-2 mb-3">
                {conversation.channel === "email"
                  ? <Mail className="w-4 h-4 text-blue-500" />
                  : <MessageCircle className="w-4 h-4" style={{ color: "#0B6E6B" }} />}
                <p className="text-sm font-semibold" style={{ color: "#324047" }}>
                  {conversation.channel === "email" ? "Reply via Email" : "Reply via WhatsApp"}
                </p>
                {conversation.channel === "email" && conversation.email_subject && (
                  <span className="text-xs truncate" style={{ color: "#6F8087" }}>Re: {conversation.email_subject}</span>
                )}
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={conversation.channel === "whatsapp" ? "Type your WhatsApp reply..." : "Type your email reply..."}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none transition-all"
                style={{ background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <div className="flex items-center gap-3 mt-2">
                <CannedResponsePicker onSelect={(content) => setReplyText((prev) => prev ? prev + "\n" + content : content)} />
                <button
                  onClick={handleReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                  style={{ background: conversation.channel === "whatsapp" ? "#059669" : "#2563EB" }}
                >
                  {sendingReply
                    ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
                {replySent && (
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Reply sent!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visitor Profile Sidebar */}
        {visitorHistory && (
          <div className="w-72 shrink-0 space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB" }}>
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                <h3 className="font-semibold" style={{ color: "#0E1B22" }}>Visitor Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: "#F4EDE0" }}>
                  <p className="text-xs mb-1" style={{ color: "#6F8087" }}>Total Visits</p>
                  <p className="font-bold" style={{ color: "#0E1B22" }}>{visitorHistory.visit_count}</p>
                </div>
                {visitorHistory.last_emotion && visitorHistory.last_emotion !== "calm" && (
                  <div className="rounded-lg p-3" style={{ background: "#F4EDE0" }}>
                    <p className="text-xs mb-1" style={{ color: "#6F8087" }}>Last Emotion</p>
                    <p className={cn("font-bold text-sm",
                      visitorHistory.last_emotion === "angry" ? "text-red-600" : "text-orange-600")}>
                      {visitorHistory.last_emotion === "angry" ? "😠 angry" : "😤 frustrated"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {visitorHistory.past_conversations.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  <h3 className="font-semibold" style={{ color: "#0E1B22" }}>Past Conversations</h3>
                </div>
                <div className="space-y-2">
                  {visitorHistory.past_conversations.map((pc) => (
                    <Link key={pc.id} href={`/conversations/${pc.id}`}
                      className="block p-3 rounded-xl text-xs transition-all"
                      style={{ border: "1px solid #ECE2CF" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DED2BB"; (e.currentTarget as HTMLElement).style.background = "#F4EDE0"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ECE2CF"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <div className="flex items-center gap-1 mb-1">
                        {pc.last_emotion && pc.last_emotion !== "calm" && (
                          <span className="mr-0.5">{pc.last_emotion === "angry" ? "😠" : "😤"}</span>
                        )}
                        <span style={{ color: "#6F8087" }}>{new Date(pc.created_at).toLocaleDateString()}</span>
                        <span className={cn("ml-auto rounded-full px-1.5 py-0.5 font-medium capitalize",
                          pc.status === "resolved"
                            ? "bg-[#ECE2CF] text-[#6F8087]"
                            : "bg-[#E4F1EF] text-[#0B6E6B]")}>
                          {pc.status}
                        </span>
                      </div>
                      {pc.first_message && (
                        <p className="line-clamp-2 mt-1" style={{ color: "#324047" }}>{pc.first_message}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
