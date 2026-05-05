"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { InsightReport } from "@/types";
import {
  Lightbulb,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  BookOpen,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchInsights = async (d: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/insights?days=${d}`);
      setReport(res.data);
    } catch (err) {
      console.error("Failed to fetch insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(days);
  }, [days]);

  const formattedDate = report
    ? new Date(report.generated_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Insights</h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-generated report on what your customers need and where your knowledge base has gaps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={() => fetchInsights(days)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mb-3 text-indigo-600" />
          <p className="text-sm">Generating insights...</p>
        </div>
      )}

      {!loading && report && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label={`Questions (${report.period_days}d)`}
              value={report.total_questions}
              icon={MessageSquare}
              iconBg="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              label="Knowledge Gaps"
              value={report.content_gaps}
              icon={AlertCircle}
              iconBg="bg-red-100 text-red-500"
            />
            <StatCard
              label="Escalations"
              value={report.escalations}
              icon={TrendingUp}
              iconBg="bg-amber-100 text-amber-600"
            />
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-xl border-l-4 border-indigo-600 p-6 bg-indigo-50/30 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">AI Summary</h2>
            </div>
            <p className="italic text-slate-700 leading-relaxed">{report.summary}</p>
            {formattedDate && (
              <p className="text-xs text-slate-400 mt-3">Generated {formattedDate}</p>
            )}
          </div>

          {/* Top Topics */}
          {report.top_topics.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Top Topics</h2>
              </div>
              <div>
                {report.top_topics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{t.topic}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">"{t.example}"</p>
                      </div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium ml-3 shrink-0">
                      ~{t.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Gaps */}
          {report.gap_examples.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Knowledge Gaps to Fix</h2>
              </div>
              <div>
                {report.gap_examples.map((g, i) => (
                  <div key={i} className="py-4 border-b border-slate-100 last:border-0">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      "{g.question}"
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      <span className="font-medium text-indigo-600">Fix: </span>
                      {g.fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Recommendations</h2>
              </div>
              <ol>
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Empty state */}
          {report.total_questions === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">{report.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
