"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

type ConversationWithEmail = Conversation;
import { Bot, User, ChevronLeft, CheckCircle, Clock, Hash, Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link";

export default function ConversationDetailPage() {
  const params = useParams();
  const [conversation, setConversation] = useState<ConversationWithEmail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailReply, setEmailReply] = useState("");
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
        if (historyRes.data.is_returning) {
          setVisitorHistory(historyRes.data);
        }
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

  const handleEmailReply = async () => {
    if (!emailReply.trim()) return;
    setSendingReply(true);
    try {
      const res = await api.post(`/email/conversations/${params.id}/reply`, {
        content: emailReply,
      });
      setMessages((prev) => [...prev, res.data]);
      setEmailReply("");
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      console.error("Failed to send email reply", err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-500">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      Loading...
    </div>
  );
  if (!conversation) return (
    <div className="p-8 text-slate-500">Conversation not found</div>
  );

  return (
    <div className="p-8 max-w-6xl">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/conversations"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                {conversation.visitor_name || conversation.visitor_email || "Anonymous Visitor"}
              </h1>
              {conversation.channel === "email" ? (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                  <Mail className="w-3 h-3" />
                  Email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                  <MessageSquare className="w-3 h-3" />
                  Widget
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  conversation.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : conversation.status === "escalated"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {conversation.status}
              </span>
            </div>
            {conversation.channel === "email" && conversation.email_subject && (
              <p className="text-sm text-slate-500 mt-1 truncate">
                Subject: <span className="font-medium text-slate-700">{conversation.email_subject}</span>
              </p>
            )}
          </div>
        </div>
        {conversation.status !== "resolved" && (
          <button
            onClick={handleResolve}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Resolve
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No messages yet</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.role === "visitor" ? "self-end items-end" : "self-start items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">
                  {msg.role === "ai" ? "AI Agent" : msg.role === "agent" ? "Human Agent" : "Visitor"}
                </span>
                <span className="text-xs text-slate-400">{formatDate(msg.created_at)}</span>
                {msg.confidence_score !== null && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      msg.confidence_score >= 0.7
                        ? "bg-emerald-50 text-emerald-600"
                        : msg.confidence_score >= 0.4
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                    )}
                  >
                    {Math.round(msg.confidence_score * 100)}%
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "visitor"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-2xl rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "visitor" && msg.emotion && msg.emotion !== "calm" && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium mt-1",
                  msg.emotion === "angry"
                    ? "bg-red-100 text-red-600"
                    : "bg-orange-100 text-orange-600"
                )}>
                  {msg.emotion === "angry" ? "😠 angry" : "😤 frustrated"}
                </span>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {msg.sources.map((source, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500"
                    >
                      {source.title} ({Math.round(source.similarity * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Email Reply Section */}
          {conversation.channel === "email" && conversation.status !== "resolved" && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700">Reply via Email</p>
                {conversation.email_subject && (
                  <span className="text-xs text-slate-400 truncate">
                    Re: {conversation.email_subject}
                  </span>
                )}
              </div>
              <textarea
                value={emailReply}
                onChange={(e) => setEmailReply(e.target.value)}
                placeholder="Type your reply here..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleEmailReply}
                  disabled={sendingReply || !emailReply.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {sendingReply ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
                {replySent && (
                  <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Reply sent!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visitor Profile Sidebar */}
        {visitorHistory && (
          <div className="w-72 shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Visitor Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Total Visits</p>
                  <p className="font-bold text-slate-900">{visitorHistory.visit_count}</p>
                </div>
                {visitorHistory.last_emotion && visitorHistory.last_emotion !== "calm" && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Last Emotion</p>
                    <p className={cn(
                      "font-bold text-sm",
                      visitorHistory.last_emotion === "angry" ? "text-red-600" : "text-orange-600"
                    )}>
                      {visitorHistory.last_emotion === "angry" ? "😠 angry" : "😤 frustrated"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {visitorHistory.past_conversations.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Past Conversations</h3>
                </div>
                <div className="space-y-2">
                  {visitorHistory.past_conversations.map((pc) => (
                    <Link
                      key={pc.id}
                      href={`/conversations/${pc.id}`}
                      className="block p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-xs transition-all"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {pc.last_emotion && pc.last_emotion !== "calm" && (
                          <span className="mr-0.5">
                            {pc.last_emotion === "angry" ? "😠" : "😤"}
                          </span>
                        )}
                        <span className="text-slate-400">
                          {new Date(pc.created_at).toLocaleDateString()}
                        </span>
                        <span className={cn(
                          "ml-auto rounded-full px-1.5 py-0.5 font-medium capitalize",
                          pc.status === "resolved" ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {pc.status}
                        </span>
                      </div>
                      {pc.first_message && (
                        <p className="text-slate-600 line-clamp-2 mt-1">{pc.first_message}</p>
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
