"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { MessageSquare, CheckCircle, AlertTriangle, TrendingUp, Clock, Zap } from "lucide-react";

interface AnalyticsSummary {
  total_conversations: number;
  resolved_conversations: number;
  escalated_conversations: number;
  active_conversations: number;
  avg_confidence: number | null;
  avg_messages_per_conversation: number | null;
  resolution_rate: number | null;
  escalation_rate: number | null;
  conversations_by_day: Array<{ date: string; count: number }>;
  conversations_by_channel: Array<{ channel: string; count: number }>;
}

function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5 transition-shadow hover:shadow-md"
      style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full",
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#6F8087" }}>{sub}</p>}
    </div>
  );
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm w-24 shrink-0" style={{ color: "#324047" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#ECE2CF" }}>
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right tabular-nums" style={{ color: "#324047" }}>{value}</span>
      <span className="text-xs w-8 tabular-nums" style={{ color: "#6F8087" }}>{pct}%</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }}>
      <div className="w-10 h-10 rounded-xl mb-4" style={{ background: "#ECE2CF" }} />
      <div className="h-7 rounded-full w-1/3 mb-2" style={{ background: "#DED2BB" }} />
      <div className="h-3 rounded-full w-1/2" style={{ background: "#ECE2CF" }} />
    </div>
  );
}

const DAYS_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/summary?days=${days}`);
        setData(res.data);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally { setLoading(false); }
    };
    fetch();
  }, [days]);

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>Performance overview for your support team</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#ECE2CF" }}>
            {DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all"
                style={{
                  background: days === opt.value ? "white" : "transparent",
                  color: days === opt.value ? "#0E1B22" : "#6F8087",
                  boxShadow: days === opt.value ? "0 1px 3px rgba(14,27,34,0.08)" : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {loading ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }} />
              ))}
            </div>
          </>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Total Conversations" value={data.total_conversations} sub={`Last ${days} days`}
                icon={MessageSquare} iconBg="#E4F1EF" iconColor="#0B6E6B" />
              <MetricCard label="Resolved" value={data.resolved_conversations}
                sub={data.resolution_rate != null ? `${Math.round(data.resolution_rate * 100)}% resolution rate` : undefined}
                icon={CheckCircle} iconBg="#ECFDF5" iconColor="#059669"
                trend={data.resolution_rate != null ? `${Math.round(data.resolution_rate * 100)}%` : undefined}
                trendUp={(data.resolution_rate ?? 0) >= 0.7} />
              <MetricCard label="Escalated" value={data.escalated_conversations}
                sub={data.escalation_rate != null ? `${Math.round(data.escalation_rate * 100)}% of total` : undefined}
                icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444" />
              <MetricCard label="Avg Confidence" value={data.avg_confidence != null ? `${Math.round(data.avg_confidence * 100)}%` : "—"}
                sub="AI response quality" icon={Zap} iconBg="#FFFBEB" iconColor="#D97706"
                trend={data.avg_confidence != null ? `${Math.round(data.avg_confidence * 100)}%` : undefined}
                trendUp={(data.avg_confidence ?? 0) >= 0.65} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Status Breakdown</h2>
                </div>
                <div className="space-y-1">
                  <ProgressRow label="Resolved" value={data.resolved_conversations} total={data.total_conversations} color="bg-emerald-400" />
                  <ProgressRow label="Active" value={data.active_conversations} total={data.total_conversations} color="bg-[#0B6E6B]" />
                  <ProgressRow label="Escalated" value={data.escalated_conversations} total={data.total_conversations} color="bg-red-400" />
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <MessageSquare className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  <h2 className="font-semibold" style={{ color: "#0E1B22" }}>By Channel</h2>
                </div>
                {data.conversations_by_channel.length === 0 ? (
                  <p className="text-sm" style={{ color: "#6F8087" }}>No data yet</p>
                ) : (
                  <div className="space-y-1">
                    {data.conversations_by_channel.map((ch) => (
                      <ProgressRow
                        key={ch.channel}
                        label={ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1)}
                        value={ch.count}
                        total={data.total_conversations}
                        color={ch.channel === "email" ? "bg-blue-400" : ch.channel === "whatsapp" ? "bg-emerald-400" : "bg-[#E8B86E]"}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid #ECE2CF" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Summary</h2>
                </div>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    { label: "Total conversations", value: data.total_conversations },
                    { label: "Avg messages per conversation", value: data.avg_messages_per_conversation?.toFixed(1) ?? "—" },
                    { label: "Resolution rate", value: data.resolution_rate != null ? `${Math.round(data.resolution_rate * 100)}%` : "—" },
                    { label: "Escalation rate", value: data.escalation_rate != null ? `${Math.round(data.escalation_rate * 100)}%` : "—" },
                    { label: "Average AI confidence", value: data.avg_confidence != null ? `${Math.round(data.avg_confidence * 100)}%` : "—" },
                  ].map((row, i) => (
                    <tr key={row.label} style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                      <td className="px-6 py-3.5 text-sm" style={{ color: "#6F8087" }}>{row.label}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-right" style={{ color: "#0E1B22" }}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECE2CF" }}>
              <TrendingUp className="w-7 h-7" style={{ color: "#DED2BB" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>No analytics data</p>
            <p className="text-sm" style={{ color: "#6F8087" }}>Start receiving conversations to see your metrics here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
