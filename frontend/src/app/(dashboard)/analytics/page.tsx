"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { AnalyticsOverview } from "@/types";
import { MessageSquare, Bot, AlertTriangle, TrendingUp } from "lucide-react";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/analytics/overview");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-500">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      Loading...
    </div>
  );
  if (!data) return <div className="p-8 text-slate-500">Failed to load analytics</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Performance overview for the last {data.period_days} days</p>
        </div>
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option>Last {data.period_days} days</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Conversations"
          value={data.total_conversations}
          icon={MessageSquare}
          iconBg="bg-indigo-100 text-indigo-600"
        />
        <MetricCard
          title="AI Resolved"
          value={data.ai_resolved}
          subtitle={`${data.resolution_rate}% resolution rate`}
          icon={Bot}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <MetricCard
          title="Escalations"
          value={data.escalations}
          icon={AlertTriangle}
          iconBg="bg-red-100 text-red-600"
        />
        <MetricCard
          title="Avg Confidence"
          value={data.avg_confidence ? `${Math.round(data.avg_confidence * 100)}%` : "N/A"}
          icon={TrendingUp}
          iconBg="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Additional context */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Resolution Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">AI Resolved</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${data.resolution_rate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-10 text-right">{data.resolution_rate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Escalated</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${data.total_conversations > 0 ? Math.round((data.escalations / data.total_conversations) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-10 text-right">
                  {data.total_conversations > 0 ? Math.round((data.escalations / data.total_conversations) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Avg Confidence Score</span>
              <span className="font-semibold text-slate-900">
                {data.avg_confidence ? `${Math.round(data.avg_confidence * 100)}%` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Escalations</span>
              <span className="font-semibold text-slate-900">{data.escalations}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">AI Resolved</span>
              <span className="font-semibold text-slate-900">{data.ai_resolved}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
