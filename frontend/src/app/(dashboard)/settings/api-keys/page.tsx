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
    try {
      const res = await api.get("/api-keys");
      setKeys(res.data);
    } catch (err) {
      console.error("Failed to fetch keys", err);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    setCreating(true);
    try {
      const res = await api.post(`/api-keys?name=${encodeURIComponent(keyName)}`);
      setNewKey(res.data.key);
      setKeyName("Default");
      fetchKeys();
    } catch (err) {
      console.error("Failed to create key", err);
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      console.error("Failed to revoke key", err);
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
        <p className="text-slate-500 text-sm mt-1">Manage API keys for the chat widget</p>
      </div>

      {/* Create new key */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Create New Key</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key name"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && createKey()}
          />
          <button
            onClick={createKey}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Create"}
          </button>
        </div>

        {newKey && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Save this key — it won&apos;t be shown again!
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white p-3 rounded-lg border border-amber-100 font-mono break-all text-slate-800">
                {newKey}
              </code>
              <button
                onClick={copyKey}
                className="p-2.5 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-amber-700"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 mt-2 font-medium">Copied to clipboard!</p>}
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Active Keys</p>
        </div>
        {keys.length === 0 ? (
          <div className="p-10 text-center">
            <Key className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No API keys yet. Create one to use the widget.</p>
          </div>
        ) : (
          <div>
            {keys.map((key) => (
              <div key={key.id} className="border-b border-slate-100 last:border-0 px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{key.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {key.key_prefix}... &middot; Created {formatDate(key.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                >
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
