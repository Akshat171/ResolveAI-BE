"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { InsightReport } from "@/types";
import { Lightbulb, AlertCircle, TrendingUp, MessageSquare, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
];

export default function InsightsPage() {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchInsights = async (d: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/insights?days=${d}`);
      setReport(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInsights(days); }, [days]);

  const formattedDate = report
    ? new Date(report.generated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="flex flex-col h-full" style={{ background: "#F4EDE0" }}>
      <div className="px-8 pt-8 pb-6" style={{ background: "#F4EDE0", borderBottom: "1px solid #DED2BB" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>AI Insights</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>What customers need and where your knowledge base has gaps</p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => fetchInsights(days)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ background: "#0B6E6B" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#064F4D")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0B6E6B")}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 max-w-4xl">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }}>
                  <div className="w-10 h-10 rounded-xl mb-4" style={{ background: "#ECE2CF" }} />
                  <div className="h-7 rounded-full w-1/3 mb-2" style={{ background: "#DED2BB" }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: "#ECE2CF" }} />
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6 animate-pulse" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #DED2BB" }}>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 rounded-full" style={{ width: `${75 - i * 10}%`, background: "#ECE2CF" }} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center py-6 text-sm gap-2" style={{ color: "#6F8087" }}>
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#0B6E6B" }} />
              Generating insights with AI...
            </div>
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: `Questions (${report.period_days}d)`, value: report.total_questions, icon: MessageSquare, iconBg: "#E4F1EF", iconColor: "#0B6E6B" },
                { label: "Knowledge Gaps", value: report.content_gaps, icon: AlertCircle, iconBg: "#FEF2F2", iconColor: "#EF4444" },
                { label: "Escalations", value: report.escalations, icon: TrendingUp, iconBg: "#FFFBEB", iconColor: "#D97706" },
              ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: iconBg }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <p className="text-3xl font-bold tracking-tight" style={{ color: "#0E1B22" }}>{value}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
              <div className="px-6 py-5" style={{ borderLeft: "4px solid #0B6E6B" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                  <h2 className="font-semibold" style={{ color: "#0E1B22" }}>AI Summary</h2>
                  {formattedDate && (
                    <span className="ml-auto text-xs" style={{ color: "#6F8087" }}>Generated {formattedDate}</span>
                  )}
                </div>
                <p className="leading-relaxed italic text-sm" style={{ color: "#324047" }}>{report.summary}</p>
              </div>
            </div>

            {/* Top Topics */}
            {report.top_topics.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid #ECE2CF" }}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: "#0B6E6B" }} />
                    <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Top Topics</h2>
                  </div>
                </div>
                <div>
                  {report.top_topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-3.5 transition-colors" style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0" style={{ background: "#E4F1EF", color: "#0B6E6B" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#0E1B22" }}>{t.topic}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "#6F8087" }}>"{t.example}"</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: "#ECE2CF", color: "#324047" }}>
                        ~{t.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Gaps */}
            {report.gap_examples.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid #ECE2CF" }}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-red-500" />
                    <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Knowledge Gaps to Fix</h2>
                  </div>
                </div>
                <div>
                  {report.gap_examples.map((g, i) => (
                    <div key={i} className="px-6 py-4 transition-colors" style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                      <p className="text-sm font-medium mb-1.5" style={{ color: "#0E1B22" }}>"{g.question}"</p>
                      <p className="text-sm" style={{ color: "#324047" }}>
                        <span className="font-semibold" style={{ color: "#0B6E6B" }}>Fix: </span>
                        {g.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid #ECE2CF" }}>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Recommendations</h2>
                  </div>
                </div>
                <div>
                  {report.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-4 px-6 py-3.5 transition-colors" style={{ borderTop: i > 0 ? "1px solid #F4EDE0" : "none" }}>
                      <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#FFFBEB", color: "#D97706" }}>
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: "#324047" }}>{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.total_questions === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECE2CF" }}>
                  <MessageSquare className="w-6 h-6" style={{ color: "#DED2BB" }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: "#0E1B22" }}>Not enough data</p>
                <p className="text-sm" style={{ color: "#6F8087" }}>{report.summary}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
