"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { Send, Headphones, AlertTriangle, CheckCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LiveChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEscalated = async () => {
      try {
        const res = await api.get("/conversations?status=escalated");
        setConversations(res.data);
      } catch (err) {
        console.error("Failed to fetch", err);
      }
    };
    fetchEscalated();
  }, []);

  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${selectedConv.id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();

    // Connect WebSocket
    const token = localStorage.getItem("access_token");
    const wsUrl = `${API_BASE_URL.replace("http", "ws")}/ws/agent?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "visitor_message" && data.conversation_id === selectedConv.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "visitor",
            content: data.message.content,
            confidence_score: null,
            emotion: null,
            sources: [],
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };

    setWs(socket);
    return () => { socket.close(); };
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !ws || !selectedConv) return;
    ws.send(
      JSON.stringify({
        type: "message",
        conversation_id: selectedConv.id,
        content: input,
      })
    );
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "agent",
        content: input,
        confidence_score: null,
        emotion: null,
        sources: [],
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  const resolveConversation = () => {
    if (!ws || !selectedConv) return;
    ws.send(JSON.stringify({ type: "resolve", conversation_id: selectedConv.id }));
    setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
    setSelectedConv(null);
    setMessages([]);
  };

  const hasFrustration = messages.some(
    (m) => m.role === "visitor" && (m.emotion === "angry" || m.emotion === "frustrated")
  );
  const hasAngry = messages.some((m) => m.role === "visitor" && m.emotion === "angry");

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Live Chat</h1>
        <p className="text-slate-500 text-sm mt-1">Handle escalated conversations in real time</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Conversation list */}
        <div className="w-72 bg-white rounded-xl border border-slate-200 p-2 flex flex-col shrink-0 overflow-auto">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Escalated ({conversations.length})
            </p>
          </div>
          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-slate-400 text-sm text-center">No escalated conversations</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "w-full text-left rounded-lg p-3 cursor-pointer transition-all",
                  selectedConv?.id === conv.id
                    ? "bg-indigo-50 border border-indigo-100"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-900 text-sm">
                    {conv.visitor_name || `Visitor ${conv.visitor_id?.slice(0, 8) || ""}`}
                  </p>
                  <span className="bg-red-50 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                    escalated
                  </span>
                </div>
                <p className="text-xs text-slate-400">{formatDate(conv.created_at)}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat panel */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-h-0">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {(selectedConv.visitor_name || "V").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {selectedConv.visitor_name || "Anonymous Visitor"}
                  </p>
                </div>
                <button
                  onClick={resolveConversation}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </div>

              {/* Frustration alert */}
              {hasFrustration && (
                <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    {hasAngry
                      ? "Customer is angry — respond with extra empathy and prioritise a fast resolution."
                      : "Customer appears frustrated — acknowledge their concern before answering."}
                  </span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-auto p-6 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "visitor" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-3 text-sm rounded-2xl",
                        msg.role === "visitor"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : msg.role === "ai"
                          ? "bg-slate-100 text-slate-900 rounded-bl-sm"
                          : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-medium opacity-70 capitalize">{msg.role === "agent" ? "You" : msg.role}</p>
                        {msg.role === "visitor" && msg.emotion && msg.emotion !== "calm" && (
                          <span className="text-xs">
                            {msg.emotion === "angry" ? "😠" : "😤"}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-slate-100 p-4 flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Headphones className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-medium">Select a conversation</p>
                <p className="text-slate-400 text-sm mt-1">Choose an escalated conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
