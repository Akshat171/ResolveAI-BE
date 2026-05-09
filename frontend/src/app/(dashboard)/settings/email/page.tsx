"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Mail, Plus, Trash2, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EmailInbox {
  id: string; name: string; email: string;
  imap_host: string; imap_port: number; imap_username: string; imap_use_ssl: boolean;
  smtp_host: string; smtp_port: number; smtp_username: string; smtp_use_tls: boolean;
  is_active: boolean; last_checked_at: string | null; created_at: string;
}

const COMMON_PROVIDERS = [
  { name: "Gmail", imap_host: "imap.gmail.com", imap_port: 993, imap_use_ssl: true, smtp_host: "smtp.gmail.com", smtp_port: 587, smtp_use_tls: true, note: "Use an App Password (not your main password). Enable IMAP in Gmail settings." },
  { name: "Outlook / Office 365", imap_host: "outlook.office365.com", imap_port: 993, imap_use_ssl: true, smtp_host: "smtp.office365.com", smtp_port: 587, smtp_use_tls: true, note: "Use your full email as username. Enable IMAP in Outlook settings." },
  { name: "Yahoo Mail", imap_host: "imap.mail.yahoo.com", imap_port: 993, imap_use_ssl: true, smtp_host: "smtp.mail.yahoo.com", smtp_port: 587, smtp_use_tls: true, note: "Generate an App Password in Yahoo Account Security settings." },
];

const emptyForm = { name: "", email: "", imap_host: "", imap_port: 993, imap_username: "", imap_password: "", imap_use_ssl: true, smtp_host: "", smtp_port: 587, smtp_username: "", smtp_password: "", smtp_use_tls: true };

const inputCls = "w-full px-3 py-2 text-sm rounded-lg outline-none transition-all";
const inputStyle = { background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" };
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)"; };
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none"; };

function InputField({ label, name, type = "text", value, placeholder, onChange }: {
  label: string; name: string; type?: string; value: string | number | boolean; placeholder?: string;
  onChange: (name: string, value: string | number | boolean) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "#324047" }}>{label}</label>
      {type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value as boolean} onChange={(e) => onChange(name, e.target.checked)}
            className="w-4 h-4 rounded" style={{ accentColor: "#0B6E6B" }} />
          <span className="text-sm" style={{ color: "#324047" }}>Enabled</span>
        </label>
      ) : (
        <input type={type} value={value as string | number}
          onChange={(e) => onChange(name, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder} className={inputCls} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      )}
    </div>
  );
}

export default function EmailInboxesPage() {
  const [inboxes, setInboxes] = useState<EmailInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showProviders, setShowProviders] = useState(false);

  const handleFieldChange = (name: string, value: string | number | boolean) => setForm((prev) => ({ ...prev, [name]: value }));

  const fetchInboxes = async () => {
    try { const res = await api.get("/email/inboxes"); setInboxes(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInboxes(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try { await api.post("/email/inboxes", form); setForm({ ...emptyForm }); setShowForm(false); fetchInboxes(); }
    catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await api.delete(`/email/inboxes/${id}`); setInboxes((prev) => prev.filter((i) => i.id !== id)); }
    catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    try { await api.post(`/email/inboxes/${id}/check`); }
    catch (err) { console.error(err); }
    finally { setCheckingId(null); setTimeout(fetchInboxes, 2000); }
  };

  const handleToggleActive = async (inbox: EmailInbox) => {
    setTogglingId(inbox.id);
    try { await api.patch(`/email/inboxes/${inbox.id}`, { is_active: !inbox.is_active }); fetchInboxes(); }
    catch (err) { console.error(err); }
    finally { setTogglingId(null); }
  };

  const applyProvider = (p: typeof COMMON_PROVIDERS[number]) =>
    setForm((prev) => ({ ...prev, imap_host: p.imap_host, imap_port: p.imap_port, imap_use_ssl: p.imap_use_ssl, smtp_host: p.smtp_host, smtp_port: p.smtp_port, smtp_use_tls: p.smtp_use_tls }));

  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };
  const sectionLabel = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#6F8087", marginBottom: "12px" };

  return (
    <div className="p-8 max-w-3xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>Email Inboxes</h1>
          <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Connect email inboxes to automatically handle customer emails with AI</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#0B6E6B" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
          onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
          <Plus className="w-4 h-4" /> Add Inbox
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <h2 className="font-semibold mb-5" style={{ color: "#0E1B22" }}>New Email Inbox</h2>
          <div className="mb-5">
            <button onClick={() => setShowProviders((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: "#0B6E6B" }}>
              {showProviders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Common Providers (quick fill)
            </button>
            {showProviders && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {COMMON_PROVIDERS.map((p) => (
                  <div key={p.name} className="flex items-start justify-between rounded-xl p-3 transition-all"
                    style={{ border: "1px solid #DED2BB", background: "#F4EDE0" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0E1B22" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6F8087" }}>{p.note}</p>
                    </div>
                    <button onClick={() => applyProvider(p)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ml-4 shrink-0"
                      style={{ color: "#0B6E6B", border: "1px solid #0B6E6B33", background: "#E4F1EF" }}>
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Inbox Name" name="name" value={form.name} placeholder="e.g. Support" onChange={handleFieldChange} />
            <InputField label="Inbox Email Address" name="email" value={form.email} placeholder="support@company.com" onChange={handleFieldChange} />
          </div>
          <div className="mt-5">
            <p style={sectionLabel}>IMAP Settings (Receiving)</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="IMAP Host" name="imap_host" value={form.imap_host} placeholder="imap.gmail.com" onChange={handleFieldChange} />
              <InputField label="IMAP Port" name="imap_port" type="number" value={form.imap_port} onChange={handleFieldChange} />
              <InputField label="IMAP Username" name="imap_username" value={form.imap_username} placeholder="user@gmail.com" onChange={handleFieldChange} />
              <InputField label="IMAP Password" name="imap_password" type="password" value={form.imap_password} placeholder="App password" onChange={handleFieldChange} />
              <div className="col-span-2"><InputField label="Use SSL" name="imap_use_ssl" type="checkbox" value={form.imap_use_ssl} onChange={handleFieldChange} /></div>
            </div>
          </div>
          <div className="mt-5">
            <p style={sectionLabel}>SMTP Settings (Sending)</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="SMTP Host" name="smtp_host" value={form.smtp_host} placeholder="smtp.gmail.com" onChange={handleFieldChange} />
              <InputField label="SMTP Port" name="smtp_port" type="number" value={form.smtp_port} onChange={handleFieldChange} />
              <InputField label="SMTP Username" name="smtp_username" value={form.smtp_username} placeholder="user@gmail.com" onChange={handleFieldChange} />
              <InputField label="SMTP Password" name="smtp_password" type="password" value={form.smtp_password} placeholder="App password" onChange={handleFieldChange} />
              <div className="col-span-2"><InputField label="Use STARTTLS" name="smtp_use_tls" type="checkbox" value={form.smtp_use_tls} onChange={handleFieldChange} /></div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreate} disabled={creating || !form.name || !form.email || !form.imap_host || !form.smtp_host}
              className="flex items-center gap-2 px-5 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ background: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}>
              {creating ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? "Saving..." : "Save Inbox"}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ ...emptyForm }); }}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ border: "1px solid #DED2BB", color: "#6F8087" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-3" style={{ background: "#ECE2CF", borderBottom: "1px solid #DED2BB" }}>
          <p style={sectionLabel}>Connected Inboxes</p>
        </div>
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-3" style={{ color: "#6F8087" }}>
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0B6E6B", borderTopColor: "transparent" }} />
            Loading...
          </div>
        ) : inboxes.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: "#DED2BB" }} />
            <p className="text-sm" style={{ color: "#6F8087" }}>No email inboxes connected yet.</p>
            <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Add an inbox above to start receiving and replying to emails automatically.</p>
          </div>
        ) : (
          <div>
            {inboxes.map((inbox, i) => (
              <div key={inbox.id} className="px-6 py-4 flex items-center justify-between transition-colors"
                style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E4F1EF" }}>
                    <Mail className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: "#0E1B22" }}>{inbox.name}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${inbox.is_active ? "bg-emerald-50 text-emerald-700" : "bg-[#ECE2CF] text-[#6F8087]"}`}>
                        {inbox.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {inbox.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6F8087" }}>{inbox.email}</p>
                    <p className="text-xs" style={{ color: "#6F8087" }}>{inbox.imap_host}:{inbox.imap_port} · SMTP {inbox.smtp_host}:{inbox.smtp_port}</p>
                    {inbox.last_checked_at && <p className="text-xs mt-0.5" style={{ color: "#DED2BB" }}>Last checked: {formatDate(inbox.last_checked_at)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button onClick={() => handleToggleActive(inbox)} disabled={togglingId === inbox.id}
                    className="text-xs px-3 py-1.5 rounded-xl disabled:opacity-50 transition-colors"
                    style={{ border: "1px solid #DED2BB", color: "#6F8087", background: "transparent" }}>
                    {togglingId === inbox.id ? "..." : inbox.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => handleCheck(inbox.id)} disabled={checkingId === inbox.id || !inbox.is_active}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl disabled:opacity-50 transition-colors"
                    style={{ border: "1px solid #DED2BB", color: "#6F8087" }}>
                    <RefreshCw className={`w-3 h-3 ${checkingId === inbox.id ? "animate-spin" : ""}`} />
                    Check Now
                  </button>
                  <button onClick={() => handleDelete(inbox.id)} disabled={deletingId === inbox.id}
                    className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all"
                    style={{ color: "#DED2BB" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
