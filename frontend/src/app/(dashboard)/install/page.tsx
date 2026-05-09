"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function InstallPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const widgetCode = `<script
  src="https://widget.resolvai.com/v1/resolvai.js"
  data-api-key="YOUR_API_KEY_HERE"
  data-position="bottom-right"
  async>
</script>`;

  const devWidgetCode = `<script
  src="http://localhost:5173/resolvai.js"
  data-api-key="YOUR_API_KEY_HERE"
  data-position="bottom-right"
  async>
</script>`;

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };
  const stepBadge = { background: "linear-gradient(135deg,#0B6E6B,#5BC7B6)", color: "white", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 };

  return (
    <div className="p-8 max-w-2xl" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>Install Widget</h1>
        <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Add the ResolvAI chat widget to your website in minutes</p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-start gap-4">
            <div style={stepBadge}>1</div>
            <div>
              <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Create an API Key</h2>
              <p className="text-sm mt-1" style={{ color: "#6F8087" }}>
                Go to{" "}
                <Link href="/settings/api-keys" className="font-medium underline transition-colors" style={{ color: "#0B6E6B" }}>
                  API Keys
                </Link>{" "}
                and create a new key. Copy it — you'll need it in the next step.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-start gap-4">
            <div style={stepBadge}>2</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Add the Widget to Your Site</h2>
              <p className="text-sm mt-1 mb-4" style={{ color: "#6F8087" }}>
                Paste this code just before the closing{" "}
                <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "#ECE2CF", color: "#0E1B22" }}>&lt;/body&gt;</code>{" "}
                tag. Replace{" "}
                <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "#ECE2CF", color: "#0E1B22" }}>YOUR_API_KEY_HERE</code>{" "}
                with your actual API key.
              </p>
              <div className="relative">
                <pre className="rounded-xl p-4 font-mono text-sm overflow-x-auto" style={{ background: "#06181F", color: "#5BC7B6" }}>
                  <code>{widgetCode}</code>
                </pre>
                <button onClick={() => copyCode(widgetCode, "prod")}
                  className="absolute top-3 right-3 p-2 rounded-lg transition-all" style={{ color: "#7AACB0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {copiedKey === "prod" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dev mode */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-start gap-4">
            <div style={{ ...stepBadge, background: "#ECE2CF", color: "#6F8087" }}>⚡</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Development Mode</h2>
              <p className="text-sm mt-1 mb-4" style={{ color: "#6F8087" }}>For local development, use this snippet instead:</p>
              <div className="relative">
                <pre className="rounded-xl p-4 font-mono text-sm overflow-x-auto" style={{ background: "#06181F", color: "#5BC7B6" }}>
                  <code>{devWidgetCode}</code>
                </pre>
                <button onClick={() => copyCode(devWidgetCode, "dev")}
                  className="absolute top-3 right-3 p-2 rounded-lg transition-all" style={{ color: "#7AACB0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  {copiedKey === "dev" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-start gap-4">
            <div style={stepBadge}>3</div>
            <div>
              <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Add Knowledge Base Content</h2>
              <p className="text-sm mt-1" style={{ color: "#6F8087" }}>
                Go to{" "}
                <Link href="/knowledge-base" className="font-medium underline transition-colors" style={{ color: "#0B6E6B" }}>
                  Knowledge Base
                </Link>{" "}
                and add your documentation, FAQs, or product information. The AI agent will use this to answer customer questions.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-start gap-4">
            <div style={stepBadge}>4</div>
            <div>
              <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Test It</h2>
              <p className="text-sm mt-1" style={{ color: "#6F8087" }}>
                Visit your website and click the chat bubble. Ask a question that your knowledge base can answer. The AI will respond using your docs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
