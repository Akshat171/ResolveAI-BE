import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600">ResolvAI</h1>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <h2 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          AI Customer Support
          <br />
          <span className="text-indigo-600">That Actually Works</span>
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Upload your docs, embed a chat widget, and let AI resolve customer
          questions 24/7. Escalates to humans when it can&apos;t help.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
            <p className="text-gray-600 text-sm">
              Upload PDFs, crawl URLs, paste text. Your AI agent learns from
              your docs instantly.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Chat Agent</h3>
            <p className="text-gray-600 text-sm">
              Powered by GPT-4o-mini with RAG. Answers questions accurately
              using your knowledge base.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-4">🙋</div>
            <h3 className="text-lg font-semibold mb-2">Human Handoff</h3>
            <p className="text-gray-600 text-sm">
              When AI isn&apos;t confident, it escalates to your team. Seamless
              live chat takeover.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h3 className="text-2xl font-bold mb-8">How It Works</h3>
          <div className="flex gap-8 justify-center text-left">
            <div className="flex-1 max-w-xs">
              <div className="text-sm font-bold text-indigo-600 mb-2">
                Step 1
              </div>
              <h4 className="font-semibold mb-1">Upload your docs</h4>
              <p className="text-sm text-gray-600">
                PDFs, URLs, text — we chunk and embed them automatically.
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="text-sm font-bold text-indigo-600 mb-2">
                Step 2
              </div>
              <h4 className="font-semibold mb-1">Embed the widget</h4>
              <p className="text-sm text-gray-600">
                One line of code on your site. Works everywhere.
              </p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="text-sm font-bold text-indigo-600 mb-2">
                Step 3
              </div>
              <h4 className="font-semibold mb-1">AI resolves tickets</h4>
              <p className="text-sm text-gray-600">
                Customers get instant, accurate answers 24/7.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        ResolvAI &mdash; AI-powered customer support
      </footer>
    </div>
  );
}
