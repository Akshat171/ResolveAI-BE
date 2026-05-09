"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { KnowledgeBase, KnowledgeItem } from "@/types";
import { BookOpen, Plus, Upload, Globe, FileText, Trash2, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateKB, setShowCreateKB] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [showAddContent, setShowAddContent] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [urls, setUrls] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchKBs = useCallback(async () => {
    try {
      const res = await api.get("/knowledge-bases");
      setKnowledgeBases(res.data);
      if (res.data.length > 0 && !selectedKB) setSelectedKB(res.data[0]);
    } catch {}
    finally { setLoading(false); }
  }, [selectedKB]);

  const fetchItems = useCallback(async () => {
    if (!selectedKB) return;
    try {
      const res = await api.get(`/knowledge-bases/${selectedKB.id}/items`);
      setItems(res.data);
    } catch {}
  }, [selectedKB]);

  useEffect(() => { fetchKBs(); }, [fetchKBs]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createKB = async () => {
    if (!newKBName.trim()) return;
    try {
      const res = await api.post("/knowledge-bases", { name: newKBName });
      setKnowledgeBases((prev) => [res.data, ...prev]);
      setSelectedKB(res.data);
      setNewKBName(""); setShowCreateKB(false);
    } catch {}
  };

  const addText = async () => {
    if (!selectedKB || !textTitle.trim() || !textContent.trim()) return;
    setUploading(true);
    try {
      await api.post(`/knowledge-bases/${selectedKB.id}/items/text`, { title: textTitle, content: textContent });
      setTextTitle(""); setTextContent(""); setShowAddContent(null);
      fetchItems();
    } catch {}
    finally { setUploading(false); }
  };

  const crawlUrls = async () => {
    if (!selectedKB || !urls.trim()) return;
    setUploading(true);
    try {
      const urlList = urls.split("\n").map((u) => u.trim()).filter(Boolean);
      await api.post(`/knowledge-bases/${selectedKB.id}/items/crawl`, { urls: urlList });
      setUrls(""); setShowAddContent(null); fetchItems();
    } catch {}
    finally { setUploading(false); }
  };

  const uploadFile = async (file: File) => {
    if (!selectedKB) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/knowledge-bases/${selectedKB.id}/items/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchItems();
    } catch {}
    finally { setUploading(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (!selectedKB) return;
    try {
      await api.delete(`/knowledge-bases/${selectedKB.id}/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {}
  };

  const inputStyle = {
    background: "#F4EDE0",
    border: "1px solid #DED2BB",
    color: "#0E1B22",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#0B6E6B";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#DED2BB";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 shrink-0" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>Knowledge Base</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>Manage the content your AI uses to answer questions</p>
          </div>
          {!showCreateKB && (
            <button
              onClick={() => setShowCreateKB(true)}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}
            >
              <Plus className="w-4 h-4" />
              New Knowledge Base
            </button>
          )}
        </div>
        {showCreateKB && (
          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={newKBName}
              onChange={(e) => setNewKBName(e.target.value)}
              placeholder="Knowledge base name..."
              autoFocus
              className="flex-1 max-w-xs rounded-xl px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
              onKeyDown={(e) => e.key === "Enter" && createKB()}
            />
            <button onClick={createKB} className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
              <Check className="w-3.5 h-3.5" /> Create
            </button>
            <button onClick={() => { setShowCreateKB(false); setNewKBName(""); }}
              className="p-2 rounded-lg transition-colors" style={{ color: "#6F8087" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3" style={{ color: "#6F8087" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#0B6E6B" }} />
              <span className="text-sm">Loading knowledge bases...</span>
            </div>
          </div>
        ) : knowledgeBases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECE2CF" }}>
              <BookOpen className="w-7 h-7" style={{ color: "#DED2BB" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>No knowledge bases yet</p>
            <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: "#6F8087" }}>
              Create a knowledge base to start adding your docs, URLs, and text content.
            </p>
            <button
              onClick={() => setShowCreateKB(true)}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}
            >
              <Plus className="w-4 h-4" /> Create first knowledge base
            </button>
          </div>
        ) : (
          <>
            {/* KB Sidebar */}
            <div className="w-64 flex flex-col shrink-0 overflow-auto" style={{ background: "rgba(255,255,255,0.5)", borderRight: "1px solid #DED2BB" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #DED2BB" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6F8087" }}>
                  Bases · {knowledgeBases.length}
                </p>
              </div>
              <div className="flex-1 p-2">
                {knowledgeBases.map((kb) => {
                  const isActive = selectedKB?.id === kb.id;
                  return (
                    <button
                      key={kb.id}
                      onClick={() => setSelectedKB(kb)}
                      className="w-full text-left rounded-xl px-3 py-2.5 transition-all flex flex-col gap-0.5 relative mb-0.5"
                      style={{
                        background: isActive ? "#E4F1EF" : "transparent",
                        border: isActive ? "1px solid #0B6E6B33" : "1px solid transparent",
                      }}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#F26A4F" }} />
                      )}
                      <p className="font-semibold text-sm truncate" style={{ color: isActive ? "#0B6E6B" : "#0E1B22" }}>
                        {kb.name}
                      </p>
                      <p className="text-xs" style={{ color: "#6F8087" }}>{formatRelativeTime(kb.created_at)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto p-8">
              {selectedKB && (
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-lg font-bold flex-1" style={{ color: "#0E1B22" }}>{selectedKB.name}</h2>
                    <div className="flex items-center gap-2">
                      {[
                        { key: "text", icon: FileText, label: "Text" },
                        { key: "url", icon: Globe, label: "URL" },
                      ].map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          onClick={() => setShowAddContent(showAddContent === key ? null : key)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl font-medium transition-all"
                          style={{
                            background: showAddContent === key ? "#0B6E6B" : "rgba(255,255,255,0.8)",
                            color: showAddContent === key ? "white" : "#324047",
                            border: showAddContent === key ? "1px solid #0B6E6B" : "1px solid #DED2BB",
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                      ))}
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl font-medium cursor-pointer transition-all"
                        style={{ background: "rgba(255,255,255,0.8)", color: "#324047", border: "1px solid #DED2BB" }}>
                        <Upload className="w-3.5 h-3.5" /> PDF
                        <input type="file" accept=".pdf" className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>

                  {showAddContent === "text" && (
                    <div className="rounded-2xl p-5 mb-5 space-y-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                      <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)}
                        placeholder="Title" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Paste your text or markdown content here..."
                        rows={8} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      <div className="flex gap-2">
                        <button onClick={addText} disabled={uploading}
                          className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                          style={{ background: "#0B6E6B" }}>
                          <Check className="w-3.5 h-3.5" />
                          {uploading ? "Processing..." : "Add Content"}
                        </button>
                        <button onClick={() => setShowAddContent(null)}
                          className="px-4 py-2 text-sm rounded-xl transition-colors" style={{ color: "#6F8087" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {showAddContent === "url" && (
                    <div className="rounded-2xl p-5 mb-5 space-y-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                      <p className="text-xs" style={{ color: "#6F8087" }}>Enter URLs to crawl (one per line)</p>
                      <textarea value={urls} onChange={(e) => setUrls(e.target.value)}
                        placeholder={"https://example.com/docs\nhttps://example.com/faq"}
                        rows={4} className="w-full rounded-xl px-3 py-2.5 text-sm font-mono outline-none transition-all resize-none"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      <div className="flex gap-2">
                        <button onClick={crawlUrls} disabled={uploading}
                          className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                          style={{ background: "#0B6E6B" }}>
                          <Globe className="w-3.5 h-3.5" />
                          {uploading ? "Crawling..." : "Crawl URLs"}
                        </button>
                        <button onClick={() => setShowAddContent(null)}
                          className="px-4 py-2 text-sm rounded-xl transition-colors" style={{ color: "#6F8087" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {uploading && !showAddContent && (
                    <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6F8087" }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#0B6E6B" }} />
                      Processing content...
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl" style={{ background: "rgba(255,255,255,0.5)", border: "2px dashed #DED2BB" }}>
                      <BookOpen className="w-8 h-8 mb-3" style={{ color: "#DED2BB" }} />
                      <p className="text-sm font-medium mb-1" style={{ color: "#6F8087" }}>No content yet</p>
                      <p className="text-xs" style={{ color: "#6F8087" }}>Add text, crawl URLs, or upload PDFs above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id}
                          className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group"
                          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#C8C8BE"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(14,27,34,0.06)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#DED2BB"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: item.source_type === "pdf" ? "#FEF2F2" : item.source_type === "url" ? "#EFF6FF" : "#ECE2CF" }}>
                            {item.source_type === "pdf"
                              ? <FileText className="w-4 h-4 text-red-500" />
                              : item.source_type === "url"
                              ? <Globe className="w-4 h-4 text-blue-500" />
                              : <FileText className="w-4 h-4" style={{ color: "#6F8087" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#0E1B22" }}>{item.title || "Untitled"}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#6F8087" }}>
                              {item.chunk_count} chunks ·{" "}
                              <span className={item.status === "ready" ? "text-emerald-500" : "text-amber-500"}>
                                {item.status}
                              </span>
                              {" "}· {formatRelativeTime(item.created_at)}
                            </p>
                          </div>
                          <button onClick={() => deleteItem(item.id)}
                            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0 hover:bg-red-50 hover:text-red-500"
                            style={{ color: "#DED2BB" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
