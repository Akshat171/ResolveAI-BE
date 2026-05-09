"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Zap, Check, X } from "lucide-react";
import api from "@/lib/api";

interface CannedResponse { id: string; title: string; shortcut: string | null; content: string; }

const emptyForm = { title: "", shortcut: "", content: "" };
const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all";
const inputStyle = { background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; };
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; };

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/canned-responses").then((r) => setResponses(r.data)); }, []);

  function startEdit(cr: CannedResponse) { setEditingId(cr.id); setForm({ title: cr.title, shortcut: cr.shortcut || "", content: cr.content }); setShowForm(false); }
  function cancelEdit() { setEditingId(null); setForm(emptyForm); setError(""); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, shortcut: form.shortcut || null };
    try {
      if (editingId) {
        const res = await api.patch(`/canned-responses/${editingId}`, payload);
        setResponses((prev) => prev.map((r) => (r.id === editingId ? res.data : r))); setEditingId(null);
      } else {
        const res = await api.post("/canned-responses", payload);
        setResponses((prev) => [...prev, res.data]); setShowForm(false);
      }
      setForm(emptyForm);
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this canned response?")) return;
    await api.delete(`/canned-responses/${id}`);
    setResponses((prev) => prev.filter((r) => r.id !== id));
  }

  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };

  const Form = ({ onCancel }: { onCancel: () => void }) => (
    <form onSubmit={handleSave} className="rounded-2xl p-6 mb-4" style={cardStyle}>
      {error && <div className="text-red-600 text-sm p-3 rounded-xl mb-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>{error}</div>}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Title <span className="text-red-400">*</span></label>
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required
            placeholder="e.g. Greeting" className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Shortcut <span style={{ color: "#6F8087" }}>(optional)</span></label>
          <input value={form.shortcut} onChange={(e) => setForm((p) => ({ ...p, shortcut: e.target.value }))}
            placeholder="e.g. /hi" className={`${inputCls} font-mono`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Message <span className="text-red-400">*</span></label>
        <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required
          rows={4} placeholder="Type the message template here..."
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          style={{ background: "#0B6E6B" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
          <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors" style={{ color: "#6F8087" }}>
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-8 max-w-2xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>Canned Responses</h1>
          <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Save reply templates for quick insertion during chats</p>
        </div>
        {!showForm && !editingId && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#0B6E6B" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
            <Plus className="w-4 h-4" /> New Response
          </button>
        )}
      </div>

      {showForm && <Form onCancel={() => { setShowForm(false); setForm(emptyForm); setError(""); }} />}

      {responses.length === 0 && !showForm ? (
        <div className="text-center py-16 rounded-2xl" style={cardStyle}>
          <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "#DED2BB" }} />
          <p className="text-sm font-medium" style={{ color: "#6F8087" }}>No canned responses yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "#6F8087" }}>Create templates to speed up your replies</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#0B6E6B" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
            <Plus className="w-4 h-4" /> Create first response
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((cr) =>
            editingId === cr.id ? (
              <Form key={cr.id} onCancel={cancelEdit} />
            ) : (
              <div key={cr.id} className="rounded-2xl p-5" style={cardStyle}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: "#0E1B22" }}>{cr.title}</span>
                      {cr.shortcut && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#ECE2CF", color: "#6F8087" }}>
                          {cr.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2" style={{ color: "#6F8087" }}>{cr.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(cr)}
                      className="p-2 rounded-lg transition-colors hover:bg-[#E4F1EF]" style={{ color: "#6F8087" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0B6E6B")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#6F8087")}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cr.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: "#6F8087" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
