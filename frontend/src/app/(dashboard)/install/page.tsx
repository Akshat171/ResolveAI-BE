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

  const steps = [
    {
      number: 1,
      title: "Create an API Key",
      description: (
        <>
          Go to{" "}
          <Link href="/settings/api-keys" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
            API Keys
          </Link>{" "}
          and create a new key. Copy it — you&apos;ll need it in the next step.
        </>
      ),
    },
    {
      number: 3,
      title: "Add Knowledge Base Content",
      description: (
        <>
          Go to{" "}
          <Link href="/knowledge-base" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
            Knowledge Base
          </Link>{" "}
          and add your documentation, FAQs, or product information. The AI agent will use this to answer customer questions.
        </>
      ),
    },
    {
      number: 4,
      title: "Test It",
      description: "Visit your website and click the chat bubble. Ask a question that your knowledge base can answer. The AI will respond using your docs!",
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Install Widget</h1>
        <p className="text-slate-500 text-sm mt-1">Add the ResolvAI chat widget to your website in minutes</p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Create an API Key</h2>
              <p className="text-slate-600 text-sm mt-1">
                Go to{" "}
                <Link href="/settings/api-keys" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                  API Keys
                </Link>{" "}
                and create a new key. Copy it — you&apos;ll need it in the next step.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900">Add the Widget to Your Site</h2>
              <p className="text-slate-600 text-sm mt-1 mb-4">
                Paste this code just before the closing{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">&lt;/body&gt;</code>{" "}
                tag. Replace{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">YOUR_API_KEY_HERE</code>{" "}
                with your actual API key.
              </p>
              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <code>{widgetCode}</code>
                </pre>
                <button
                  onClick={() => copyCode(widgetCode, "prod")}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  {copiedKey === "prod" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dev mode */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              ⚡
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900">Development Mode</h2>
              <p className="text-slate-600 text-sm mt-1 mb-4">
                For local development, use this snippet instead:
              </p>
              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <code>{devWidgetCode}</code>
                </pre>
                <button
                  onClick={() => copyCode(devWidgetCode, "dev")}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  {copiedKey === "dev" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Add Knowledge Base Content</h2>
              <p className="text-slate-600 text-sm mt-1">
                Go to{" "}
                <Link href="/knowledge-base" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                  Knowledge Base
                </Link>{" "}
                and add your documentation, FAQs, or product information. The AI agent will use this to answer customer questions.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Test It</h2>
              <p className="text-slate-600 text-sm mt-1">
                Visit your website and click the chat bubble. Ask a question that your knowledge base can answer. The AI will respond using your docs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
