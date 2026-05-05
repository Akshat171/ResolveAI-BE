"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Mail, Plus, Trash2, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EmailInbox {
  id: string;
  name: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_use_ssl: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_use_tls: boolean;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

const COMMON_PROVIDERS = [
  {
    name: "Gmail",
    imap_host: "imap.gmail.com",
    imap_port: 993,
    imap_use_ssl: true,
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_use_tls: true,
    note: "Use an App Password (not your main password). Enable IMAP in Gmail settings.",
  },
  {
    name: "Outlook / Office 365",
    imap_host: "outlook.office365.com",
    imap_port: 993,
    imap_use_ssl: true,
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
    smtp_use_tls: true,
    note: "Use your full email as username. Enable IMAP in Outlook settings.",
  },
  {
    name: "Yahoo Mail",
    imap_host: "imap.mail.yahoo.com",
    imap_port: 993,
    imap_use_ssl: true,
    smtp_host: "smtp.mail.yahoo.com",
    smtp_port: 587,
    smtp_use_tls: true,
    note: "Generate an App Password in Yahoo Account Security settings.",
  },
];

const emptyForm = {
  name: "",
  email: "",
  imap_host: "",
  imap_port: 993,
  imap_username: "",
  imap_password: "",
  imap_use_ssl: true,
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_use_tls: true,
};

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

  const fetchInboxes = async () => {
    try {
      const res = await api.get("/email/inboxes");
      setInboxes(res.data);
    } catch (err) {
      console.error("Failed to fetch email inboxes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxes();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/email/inboxes", form);
      setForm({ ...emptyForm });
      setShowForm(false);
      fetchInboxes();
    } catch (err) {
      console.error("Failed to create inbox", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/email/inboxes/${id}`);
      setInboxes((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to delete inbox", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    try {
      await api.post(`/email/inboxes/${id}/check`);
    } catch (err) {
      console.error("Failed to trigger check", err);
    } finally {
      setCheckingId(null);
      setTimeout(fetchInboxes, 2000);
    }
  };

  const handleToggleActive = async (inbox: EmailInbox) => {
    setTogglingId(inbox.id);
    try {
      await api.patch(`/email/inboxes/${inbox.id}`, { is_active: !inbox.is_active });
      fetchInboxes();
    } catch (err) {
      console.error("Failed to toggle inbox", err);
    } finally {
      setTogglingId(null);
    }
  };

  const applyProvider = (provider: (typeof COMMON_PROVIDERS)[number]) => {
    setForm((prev) => ({
      ...prev,
      imap_host: provider.imap_host,
      imap_port: provider.imap_port,
      imap_use_ssl: provider.imap_use_ssl,
      smtp_host: provider.smtp_host,
      smtp_port: provider.smtp_port,
      smtp_use_tls: provider.smtp_use_tls,
    }));
  };

  const InputField = ({
    label,
    name,
    type = "text",
    value,
    placeholder,
  }: {
    label: string;
    name: string;
    type?: string;
    value: string | number | boolean;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm text-slate-700">Enabled</span>
        </label>
      ) : (
        <input
          type={type}
          value={value as string | number}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [name]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value,
            }))
          }
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Inboxes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Connect email inboxes to automatically handle customer emails with AI
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Inbox
        </button>
      </div>

      {/* Add Inbox Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-5">New Email Inbox</h2>

          {/* Common Providers */}
          <div className="mb-5">
            <button
              onClick={() => setShowProviders((v) => !v)}
              className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              {showProviders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Common Providers (quick fill)
            </button>
            {showProviders && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {COMMON_PROVIDERS.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-start justify-between border border-slate-100 rounded-lg p-3 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.note}</p>
                    </div>
                    <button
                      onClick={() => applyProvider(p)}
                      className="text-xs text-indigo-600 font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors ml-4 shrink-0"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Inbox Name" name="name" value={form.name} placeholder="e.g. Support" />
            <InputField label="Inbox Email Address" name="email" value={form.email} placeholder="support@company.com" />
          </div>

          {/* IMAP Section */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              IMAP Settings (Receiving)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="IMAP Host" name="imap_host" value={form.imap_host} placeholder="imap.gmail.com" />
              <InputField label="IMAP Port" name="imap_port" type="number" value={form.imap_port} />
              <InputField label="IMAP Username" name="imap_username" value={form.imap_username} placeholder="user@gmail.com" />
              <InputField label="IMAP Password" name="imap_password" type="password" value={form.imap_password} placeholder="App password" />
              <div className="col-span-2">
                <InputField label="Use SSL" name="imap_use_ssl" type="checkbox" value={form.imap_use_ssl} />
              </div>
            </div>
          </div>

          {/* SMTP Section */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              SMTP Settings (Sending)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="SMTP Host" name="smtp_host" value={form.smtp_host} placeholder="smtp.gmail.com" />
              <InputField label="SMTP Port" name="smtp_port" type="number" value={form.smtp_port} />
              <InputField label="SMTP Username" name="smtp_username" value={form.smtp_username} placeholder="user@gmail.com" />
              <InputField label="SMTP Password" name="smtp_password" type="password" value={form.smtp_password} placeholder="App password" />
              <div className="col-span-2">
                <InputField label="Use STARTTLS" name="smtp_use_tls" type="checkbox" value={form.smtp_use_tls} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.email || !form.imap_host || !form.smtp_host}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creating ? "Saving..." : "Save Inbox"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...emptyForm }); }}
              className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Inbox List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Connected Inboxes</p>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center gap-3 text-slate-500">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            Loading...
          </div>
        ) : inboxes.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No email inboxes connected yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              Add an inbox above to start receiving and replying to emails automatically.
            </p>
          </div>
        ) : (
          <div>
            {inboxes.map((inbox) => (
              <div
                key={inbox.id}
                className="border-b border-slate-100 last:border-0 px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{inbox.name}</p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          inbox.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {inbox.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {inbox.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{inbox.email}</p>
                    <p className="text-xs text-slate-400">
                      {inbox.imap_host}:{inbox.imap_port} &middot; SMTP {inbox.smtp_host}:{inbox.smtp_port}
                    </p>
                    {inbox.last_checked_at && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        Last checked: {formatDate(inbox.last_checked_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(inbox)}
                    disabled={togglingId === inbox.id}
                    className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    {togglingId === inbox.id ? "..." : inbox.is_active ? "Disable" : "Enable"}
                  </button>

                  {/* Check now */}
                  <button
                    onClick={() => handleCheck(inbox.id)}
                    disabled={checkingId === inbox.id || !inbox.is_active}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${checkingId === inbox.id ? "animate-spin" : ""}`}
                    />
                    Check Now
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(inbox.id)}
                    disabled={deletingId === inbox.id}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
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
