"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Escalation } from "@/types";
import { AlertTriangle, CheckCircle, Headphones } from "lucide-react";
import Link from "next/link";

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalations = async () => {
    try {
      const res = await api.get("/escalations?status=pending");
      setEscalations(res.data);
    } catch (err) {
      console.error("Failed to fetch escalations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEscalations(); }, []);

  const handleAccept = async (id: string) => {
    try {
      await api.patch(`/escalations/${id}/accept`);
      fetchEscalations();
    } catch (err) {
      console.error("Failed to accept", err);
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
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Escalations</h1>
          <p className="text-slate-500 text-sm mt-1">Conversations that need your attention</p>
        </div>
        {escalations.length > 0 && (
          <span className="ml-auto bg-red-50 text-red-700 text-sm font-semibold px-3 py-1.5 rounded-lg border border-red-100">
            {escalations.length} pending
          </span>
        )}
      </div>

      {escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CheckCircle className="w-12 h-12 text-emerald-400 mb-4" />
          <p className="text-slate-700 font-semibold text-lg">All caught up!</p>
          <p className="text-slate-400 text-sm mt-1">No pending escalations right now</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {escalations.map((esc) => (
            <div
              key={esc.id}
              className={`bg-white rounded-xl border-l-4 shadow-sm p-5 ${
                esc.reason === "frustration_detected"
                  ? "border-red-500"
                  : "border-orange-400"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    esc.reason === "frustration_detected" ? "text-red-500" : "text-orange-400"
                  }`} />
                  <span className="font-semibold text-slate-900 text-sm">
                    {esc.reason === "low_confidence"
                      ? "Low AI Confidence"
                      : esc.reason === "visitor_request"
                      ? "Visitor Requested Human"
                      : esc.reason === "frustration_detected"
                      ? "Frustrated Customer"
                      : esc.reason}
                  </span>
                  {esc.reason === "frustration_detected" && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      urgent
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-xs">{formatRelativeTime(esc.created_at)}</span>
              </div>
              {esc.reason_detail && (
                <p className="text-slate-600 text-sm mt-2">{esc.reason_detail}</p>
              )}
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/conversations/${esc.conversation_id}`}
                  className="border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  View Conversation
                </Link>
                <button
                  onClick={() => handleAccept(esc.id)}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
