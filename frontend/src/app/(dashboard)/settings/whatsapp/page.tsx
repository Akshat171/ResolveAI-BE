"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MessageCircle, CheckCircle, XCircle, Copy } from "lucide-react";
import api from "@/lib/api";

interface WhatsAppInbox {
  id: string; display_name: string; phone_number: string;
  phone_number_id: string; business_account_id: string; verify_token: string; is_active: boolean;
}

const emptyForm = { display_name: "", phone_number: "", phone_number_id: "", business_account_id: "", access_token: "", verify_token: "" };

const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all";
const inputStyle = { background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" };
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; };
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; };

export default function WhatsAppSettingsPage() {
  const [inboxes, setInboxes] = useState<WhatsAppInbox[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/whatsapp/webhook`;

  useEffect(() => { api.get("/whatsapp/inboxes").then((r) => setInboxes(r.data)); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await api.post("/whatsapp/inboxes", form);
      setInboxes((prev) => [res.data, ...prev]); setForm(emptyForm); setShowForm(false);
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to save inbox"); }
    finally { setSaving(false); }
  }

  async function toggleActive(inbox: WhatsAppInbox) {
    const res = await api.patch(`/whatsapp/inboxes/${inbox.id}`, { is_active: !inbox.is_active });
    setInboxes((prev) => prev.map((i) => (i.id === inbox.id ? res.data : i)));
  }

  async function deleteInbox(id: string) {
    if (!confirm("Delete this WhatsApp inbox?")) return;
    await api.delete(`/whatsapp/inboxes/${id}`);
    setInboxes((prev) => prev.filter((i) => i.id !== id));
  }

  function copyWebhook() { navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };

  return (
    <div className="p-8 max-w-3xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>WhatsApp Inboxes</h1>
          <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Connect WhatsApp Business numbers to auto-reply with AI</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#0B6E6B" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
          <Plus className="w-4 h-4" /> Add Inbox
        </button>
      </div>

      {/* Webhook URL */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: "#E4F1EF", border: "1px solid #0B6E6B33" }}>
        <p className="text-sm font-medium mb-1" style={{ color: "#064F4D" }}>Your Webhook URL</p>
        <p className="text-xs mb-3" style={{ color: "#0B6E6B" }}>Paste this into your Meta App → WhatsApp → Configuration → Webhook URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xl px-3 py-2 text-xs font-mono truncate" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #0B6E6B22", color: "#324047" }}>
            {webhookUrl}
          </code>
          <button onClick={copyWebhook} className="shrink-0 p-2 rounded-xl transition-colors" style={{ color: "#0B6E6B" }}>
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <h2 className="font-semibold mb-4" style={{ color: "#0E1B22" }}>New WhatsApp Inbox</h2>
          <div className="rounded-xl p-4 mb-5 text-xs space-y-1" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
            <p className="font-semibold">How to get these credentials:</p>
            <p>1. Go to <strong>developers.facebook.com</strong> → My Apps → Create App → Business</p>
            <p>2. Add <strong>WhatsApp</strong> product → Get Started</p>
            <p>3. Under <strong>API Setup</strong> you'll find Phone Number ID &amp; Access Token</p>
            <p>4. Under <strong>Configuration</strong> → set Webhook URL (above) + your Verify Token</p>
            <p>5. Subscribe to <strong>messages</strong> field</p>
          </div>
          {error && <div className="text-red-600 text-sm p-3 rounded-xl mb-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>{error}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "display_name", label: "Display Name", placeholder: "Support WhatsApp" },
                { name: "phone_number", label: "Phone Number", placeholder: "+1234567890" },
                { name: "phone_number_id", label: "Phone Number ID", placeholder: "From Meta API Setup" },
                { name: "business_account_id", label: "Business Account ID", placeholder: "From Meta API Setup" },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>{f.label}</label>
                  <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} required
                    placeholder={f.placeholder} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Access Token</label>
                <input name="access_token" value={form.access_token} onChange={handleChange} required placeholder="EAAxxxxxxxx..."
                  className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#324047" }}>Verify Token</label>
                <input name="verify_token" value={form.verify_token} onChange={handleChange} required placeholder="Any secret string you choose"
                  className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Make up any secret string. You'll paste this into Meta's Webhook Verify Token field too.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ background: "#0B6E6B" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
                {saving ? "Saving..." : "Save Inbox"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                className="px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ color: "#6F8087" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {inboxes.length === 0 && !showForm ? (
        <div className="text-center py-16 rounded-2xl" style={cardStyle}>
          <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#DED2BB" }} />
          <p className="text-sm" style={{ color: "#6F8087" }}>No WhatsApp inboxes yet</p>
          <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Connect a WhatsApp Business number to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inboxes.map((inbox) => (
            <div key={inbox.id} className="rounded-2xl p-5 flex items-center gap-4" style={cardStyle}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm" style={{ color: "#0E1B22" }}>{inbox.display_name}</p>
                  {inbox.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECE2CF", color: "#6F8087" }}>
                      <XCircle className="w-3 h-3" /> Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#6F8087" }}>{inbox.phone_number} · ID: {inbox.phone_number_id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(inbox)}
                  className="text-xs px-3 py-1.5 rounded-xl transition-colors"
                  style={{ border: "1px solid #DED2BB", color: "#6F8087" }}>
                  {inbox.is_active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => deleteInbox(inbox.id)}
                  className="p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors" style={{ color: "#DED2BB" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
