export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  tenant_id: string;
  is_email_verified: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  settings: Record<string, string>;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  source_type: string;
  source_url: string | null;
  title: string | null;
  status: string;
  chunk_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
  channel: string;
  resolution_type: string | null;
  confidence_avg: number | null;
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  email_subject: string | null;
  email_inbox_id: string | null;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  confidence_score: number | null;
  emotion: "calm" | "frustrated" | "angry" | null;
  sources: Array<{ title: string; similarity: number }>;
  created_at: string;
}

export interface Escalation {
  id: string;
  conversation_id: string;
  reason: string;
  reason_detail: string | null;
  status: string;
  priority: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_conversations: number;
  ai_resolved: number;
  escalations: number;
  resolution_rate: number;
  avg_confidence: number | null;
  period_days: number;
}

export interface InsightTopic {
  topic: string;
  count: number;
  example: string;
}

export interface InsightGap {
  question: string;
  fix: string;
}

export interface InsightReport {
  period_days: number;
  total_questions: number;
  content_gaps: number;
  escalations: number;
  summary: string;
  top_topics: InsightTopic[];
  gap_examples: InsightGap[];
  recommendations: string[];
  generated_at: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}
