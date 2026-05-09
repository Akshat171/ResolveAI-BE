"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Search } from "lucide-react";
import api from "@/lib/api";

interface CannedResponse {
  id: string;
  title: string;
  shortcut: string | null;
  content: string;
}

interface Props {
  onSelect: (content: string) => void;
}

export default function CannedResponsePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/canned-responses").then((r) => setResponses(r.data)).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = responses.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()) ||
      (r.shortcut || "").toLowerCase().includes(search.toLowerCase())
  );

  function pick(content: string) {
    onSelect(content);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Canned responses"
        className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
      >
        <Zap className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search responses..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                {responses.length === 0 ? "No canned responses yet" : "No matches"}
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pick(r.content)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-900">{r.title}</span>
                    {r.shortcut && (
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {r.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{r.content}</p>
                </button>
              ))
            )}
          </div>

          {responses.length === 0 && (
            <div className="px-4 pb-3 text-center">
              <a href="/settings/canned-responses" className="text-xs text-indigo-600 hover:underline">
                Create canned responses →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
