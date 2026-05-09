"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { Send, Headphones, AlertTriangle, CheckCircle, Bot, User } from "lucide-react";
import CannedResponsePicker from "@/components/CannedResponsePicker";
import { cn, formatDate } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Avatar({ name }: { name: string }) {
  const letter = (name || "V").charAt(0).toUpperCase();
  const gradients = [
    "linear-gradient(135deg,#0B6E6B,#5BC7B6)",
    "linear-gradient(135deg,#F26A4F,#E8B86E)",
    "linear-gradient(135deg,#064F4D,#0B6E6B)",
    "linear-gradient(135deg,#E8B86E,#F26A4F)",
    "linear-gradient(135deg,#5BC7B6,#0B6E6B)",
  ];
  const gradient = gradients[letter.charCodeAt(0) % gradients.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
      style={{ background: gradient }}>
      {letter}
    </div>
  );
}

export default function LiveChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/conversations?status=escalated")
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    api.get(`/conversations/${selectedConv.id}/messages`)
      .then((res) => setMessages(res.data))
      .catch(() => {});
    const token = localStorage.getItem("access_token");
    const wsUrl = `${API_BASE_URL.replace("http", "ws")}/ws/agent?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "visitor_message" && data.conversation_id === selectedConv.id) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: "visitor", content: data.message.content,
          confidence_score: null, emotion: null, sources: [], created_at: new Date().toISOString(),
        }]);
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
    ws.send(JSON.stringify({ type: "message", conversation_id: selectedConv.id, content: input }));
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(), role: "agent", content: input,
      confidence_score: null, emotion: null, sources: [], created_at: new Date().toISOString(),
    }]);
    setInput("");
  };

  const resolveConversation = () => {
    if (!ws || !selectedConv) return;
    ws.send(JSON.stringify({ type: "resolve", conversation_id: selectedConv.id }));
    setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
    setSelectedConv(null);
    setMessages([]);
  };

  const hasFrustration = messages.some((m) => m.role === "visitor" && (m.emotion === "angry" || m.emotion === "frustrated"));
  const hasAngry = messages.some((m) => m.role === "visitor" && m.emotion === "angry");

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 shrink-0" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>Live Chat</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>Handle escalated conversations in real time</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-72 flex flex-col shrink-0" style={{ background: "rgba(255,255,255,0.6)", borderRight: "1px solid #DED2BB" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #DED2BB" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6F8087" }}>
              Escalated · {conversations.length}
            </p>
          </div>
          <div className="flex-1 overflow-auto py-2 px-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "#324047" }}>All clear</p>
                <p className="text-xs" style={{ color: "#6F8087" }}>No escalated conversations</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const name = conv.visitor_name || `Visitor ${conv.visitor_id?.slice(0, 8) || ""}`;
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className="w-full text-left rounded-xl p-3 transition-all flex items-center gap-3 mb-0.5"
                    style={{
                      background: isSelected ? "#E4F1EF" : "transparent",
                      border: isSelected ? "1px solid #0B6E6B33" : "1px solid transparent",
                    }}
                  >
                    <Avatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: isSelected ? "#0B6E6B" : "#0E1B22" }}>
                        {name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6F8087" }}>{formatDate(conv.created_at)}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 flex items-center gap-3 shrink-0" style={{ background: "rgba(255,255,255,0.8)", borderBottom: "1px solid #DED2BB" }}>
                <Avatar name={selectedConv.visitor_name || "V"} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "#0E1B22" }}>
                    {selectedConv.visitor_name || "Anonymous Visitor"}
                  </p>
                  {selectedConv.visitor_email && (
                    <p className="text-xs" style={{ color: "#6F8087" }}>{selectedConv.visitor_email}</p>
                  )}
                </div>
                <button
                  onClick={resolveConversation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </div>

              {/* Frustration alert */}
              {hasFrustration && (
                <div className="mx-4 mt-3 shrink-0 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
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
                  <div key={msg.id} className={cn("flex gap-2.5", msg.role === "visitor" ? "justify-end" : "justify-start")}>
                    {msg.role !== "visitor" && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
                        style={{ background: msg.role === "ai" ? "#E4F1EF" : "#ECFDF5" }}>
                        {msg.role === "ai"
                          ? <Bot className="w-3.5 h-3.5" style={{ color: "#0B6E6B" }} />
                          : <User className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    )}
                    <div className="max-w-[68%]">
                      <div className={cn("px-4 py-3 text-sm rounded-2xl leading-relaxed",
                        msg.role === "visitor" ? "rounded-br-sm text-white" : "rounded-bl-sm")}
                        style={{
                          background: msg.role === "visitor"
                            ? "linear-gradient(135deg,#0B6E6B,#064F4D)"
                            : msg.role === "ai"
                            ? "rgba(255,255,255,0.9)"
                            : "linear-gradient(135deg,#059669,#047857)",
                          border: msg.role !== "visitor" ? "1px solid #DED2BB" : "none",
                          color: msg.role === "visitor" || msg.role === "agent" ? "white" : "#0E1B22",
                        }}>
                        {msg.role !== "visitor" && (
                          <p className="text-[10px] font-semibold mb-1 uppercase tracking-wide opacity-70">
                            {msg.role === "ai" ? "AI Agent" : "You"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === "visitor" && msg.emotion && msg.emotion !== "calm" && (
                        <div className="flex justify-end mt-1">
                          <span className="text-xs">{msg.emotion === "angry" ? "😠" : "😤"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 shrink-0 flex gap-2" style={{ background: "rgba(255,255,255,0.8)", borderTop: "1px solid #DED2BB" }}>
                <CannedResponsePicker onSelect={(content) => setInput(content)} />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={{ background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 text-white"
                  style={{ background: "#0B6E6B" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#ECE2CF" }}>
                  <Headphones className="w-7 h-7" style={{ color: "#DED2BB" }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>Select a conversation</p>
                <p className="text-sm" style={{ color: "#6F8087" }}>Choose from the escalated list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
