"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { KnowledgeBase, KnowledgeItem } from "@/types";
import { BookOpen, Plus, Upload, Globe, FileText, Trash2, Loader2 } from "lucide-react";

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
      if (res.data.length > 0 && !selectedKB) {
        setSelectedKB(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch KBs", err);
    } finally {
      setLoading(false);
    }
  }, [selectedKB]);

  const fetchItems = useCallback(async () => {
    if (!selectedKB) return;
    try {
      const res = await api.get(`/knowledge-bases/${selectedKB.id}/items`);
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  }, [selectedKB]);

  useEffect(() => { fetchKBs(); }, [fetchKBs]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createKB = async () => {
    if (!newKBName.trim()) return;
    try {
      const res = await api.post("/knowledge-bases", { name: newKBName });
      setKnowledgeBases((prev) => [res.data, ...prev]);
      setSelectedKB(res.data);
      setNewKBName("");
      setShowCreateKB(false);
    } catch (err) {
      console.error("Failed to create KB", err);
    }
  };

  const addText = async () => {
    if (!selectedKB || !textTitle.trim() || !textContent.trim()) return;
    setUploading(true);
    try {
      await api.post(`/knowledge-bases/${selectedKB.id}/items/text`, {
        title: textTitle,
        content: textContent,
      });
      setTextTitle("");
      setTextContent("");
      setShowAddContent(null);
      fetchItems();
    } catch (err) {
      console.error("Failed to add text", err);
    } finally {
      setUploading(false);
    }
  };

  const crawlUrls = async () => {
    if (!selectedKB || !urls.trim()) return;
    setUploading(true);
    try {
      const urlList = urls.split("\n").map((u) => u.trim()).filter(Boolean);
      await api.post(`/knowledge-bases/${selectedKB.id}/items/crawl`, { urls: urlList });
      setUrls("");
      setShowAddContent(null);
      fetchItems();
    } catch (err) {
      console.error("Failed to crawl", err);
    } finally {
      setUploading(false);
    }
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
    } catch (err) {
      console.error("Failed to upload", err);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!selectedKB) return;
    try {
      await api.delete(`/knowledge-bases/${selectedKB.id}/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-500">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      Loading...
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 text-sm mt-1">Manage the content your AI uses to answer questions</p>
        </div>
        <button
          onClick={() => setShowCreateKB(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Knowledge Base
        </button>
      </div>

      {/* Create KB form */}
      {showCreateKB && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-3 shadow-sm">
          <input
            type="text"
            value={newKBName}
            onChange={(e) => setNewKBName(e.target.value)}
            placeholder="Knowledge base name..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && createKB()}
          />
          <button
            onClick={createKB}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => setShowCreateKB(false)}
            className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {knowledgeBases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No knowledge bases yet</p>
          <p className="text-slate-400 text-sm mt-1">Create one to start adding your docs</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* KB List Sidebar */}
          <div className="w-64 shrink-0 bg-white rounded-xl border border-slate-200 p-2 self-start">
            {knowledgeBases.map((kb) => (
              <button
                key={kb.id}
                onClick={() => setSelectedKB(kb)}
                className={`w-full text-left rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-all ${
                  selectedKB?.id === kb.id
                    ? "bg-indigo-50 text-indigo-900 font-medium border-l-2 border-indigo-600 pl-2.5"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="font-medium truncate">{kb.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatRelativeTime(kb.created_at)}
                </p>
              </button>
            ))}
          </div>

          {/* KB Content */}
          <div className="flex-1 min-w-0">
            {selectedKB && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">{selectedKB.name}</h2>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => setShowAddContent("text")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        showAddContent === "text"
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Text
                    </button>
                    <button
                      onClick={() => setShowAddContent("url")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                        showAddContent === "url"
                          ? "bg-indigo-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> URL
                    </button>
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium cursor-pointer transition-all border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                      <Upload className="w-3.5 h-3.5" /> PDF
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                {showAddContent === "text" && (
                  <div className="border border-slate-200 rounded-xl p-4 mb-6 space-y-3 bg-slate-50">
                    <input
                      type="text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your text or markdown content here..."
                      rows={8}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addText}
                        disabled={uploading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {uploading ? "Processing..." : "Add Content"}
                      </button>
                      <button
                        onClick={() => setShowAddContent(null)}
                        className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showAddContent === "url" && (
                  <div className="border border-slate-200 rounded-xl p-4 mb-6 space-y-3 bg-slate-50">
                    <textarea
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      placeholder="Enter URLs (one per line)"
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={crawlUrls}
                        disabled={uploading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {uploading ? "Crawling..." : "Crawl URLs"}
                      </button>
                      <button
                        onClick={() => setShowAddContent(null)}
                        className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Processing content...
                  </div>
                )}

                {/* Items List */}
                {items.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm">No content yet. Add text, crawl URLs, or upload PDFs.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            {item.source_type === "pdf" ? (
                              <FileText className="w-4 h-4 text-red-500" />
                            ) : item.source_type === "url" ? (
                              <Globe className="w-4 h-4 text-blue-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.title || "Untitled"}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.chunk_count} chunks &middot;{" "}
                              <span className={item.status === "ready" ? "text-emerald-600" : "text-amber-600"}>
                                {item.status}
                              </span>
                              {" "}&middot; {formatRelativeTime(item.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all ml-3 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
