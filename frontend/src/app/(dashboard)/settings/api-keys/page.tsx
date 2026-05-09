"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { ApiKeyInfo } from "@/types";
import { Key, Plus, Copy, Trash2, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("Default");
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try { const res = await api.get("/api-keys"); setKeys(res.data); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    setCreating(true);
    try { const res = await api.post(`/api-keys?name=${encodeURIComponent(keyName)}`); setNewKey(res.data.key); setKeyName("Default"); fetchKeys(); }
    catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const revokeKey = async (id: string) => {
    try { await api.delete(`/api-keys/${id}`); fetchKeys(); }
    catch (err) { console.error(err); }
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };

  return (
    <div className="p-8 max-w-2xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>API Keys</h1>
        <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Manage API keys for the chat widget</p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
        <h2 className="font-semibold mb-4" style={{ color: "#0E1B22" }}>Create New Key</h2>
        <div className="flex gap-3">
          <input type="text" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name"
            className="flex-1 px-3 py-2 text-sm rounded-xl outline-none transition-all"
            style={{ background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; }}
            onKeyDown={(e) => e.key === "Enter" && createKey()} />
          <button onClick={createKey} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: "#0B6E6B" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Create"}
          </button>
        </div>

        {newKey && (
          <div className="mt-4 rounded-2xl p-4" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "#92400E" }}>Save this key — it won't be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm p-3 rounded-xl font-mono break-all" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #FDE68A", color: "#0E1B22" }}>
                {newKey}
              </code>
              <button onClick={copyKey} className="p-2.5 rounded-xl transition-colors" style={{ border: "1px solid #FDE68A", color: "#D97706" }}>
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 mt-2 font-medium">Copied to clipboard!</p>}
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-3" style={{ background: "#ECE2CF", borderBottom: "1px solid #DED2BB" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6F8087" }}>Active Keys</p>
        </div>
        {keys.length === 0 ? (
          <div className="p-10 text-center">
            <Key className="w-8 h-8 mx-auto mb-3" style={{ color: "#DED2BB" }} />
            <p className="text-sm" style={{ color: "#6F8087" }}>No API keys yet. Create one to use the widget.</p>
          </div>
        ) : (
          <div>
            {keys.map((key, i) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between transition-colors"
                style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#E4F1EF" }}>
                    <Key className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#0E1B22" }}>{key.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "#6F8087" }}>
                      {key.key_prefix}... · Created {formatDate(key.created_at)}
                    </p>
                  </div>
                </div>
                <button onClick={() => revokeKey(key.id)}
                  className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all" style={{ color: "#DED2BB" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
