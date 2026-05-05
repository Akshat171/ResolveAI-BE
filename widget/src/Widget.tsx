import { useState, useEffect, useRef } from "preact/hooks";

interface Message {
  id: string;
  role: "visitor" | "ai" | "agent" | "system";
  content: string;
}

interface VisitorProfile {
  is_returning: boolean;
  visit_count?: number;
  days_since_last_visit?: number;
  visitor_name?: string | null;
  last_emotion?: string;
  has_unresolved?: boolean;
  recent_questions?: string[];
}

interface WidgetProps {
  apiKey: string;
  position: string;
  apiUrl: string;
}

function buildReturningGreeting(profile: VisitorProfile, defaultGreeting: string): string {
  const name = profile.visitor_name ? `, ${profile.visitor_name}` : "";
  const base = `Welcome back${name}!`;

  if (profile.has_unresolved) {
    return `${base} Are you following up on your previous issue? I'm here to help.`;
  }

  if (profile.last_emotion === "frustrated" || profile.last_emotion === "angry") {
    return `${base} I hope we can help you better this time. What can I do for you?`;
  }

  if (profile.recent_questions && profile.recent_questions.length > 0) {
    const lastQ = profile.recent_questions[0];
    const truncated = lastQ.length > 50 ? lastQ.slice(0, 50) + "…" : lastQ;
    return `${base} Last time you asked about "${truncated}". How can I help you today?`;
  }

  return `${base} ${defaultGreeting}`;
}

export function Widget({ apiKey, position, apiUrl }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    tenant_name: "Support",
    widget_color: "#6366f1",
    greeting_message: "Hi! How can I help you today?",
    proactive_enabled: true,
    proactive_message: "👋 Need help? I'm here!",
    proactive_time_delay: 30,
    proactive_exit_intent: true,
    proactive_scroll_depth: 70,
  });
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveFired, setProactiveFired] = useState(false);
  const [visitorProfile, setVisitorProfile] = useState<VisitorProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load widget config
  useEffect(() => {
    fetch(`${apiUrl}/api/v1/widget/config`, {
      headers: { "X-API-Key": apiKey },
    })
      .then((r) => r.json())
      .then((data) => setConfig((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, [apiUrl, apiKey]);

  // Load visitor profile for returning-visitor personalisation
  useEffect(() => {
    const existingId = localStorage.getItem("resolvai_visitor_id");
    if (!existingId) return; // first-time visitor — nothing to fetch

    fetch(`${apiUrl}/api/v1/widget/visitor/${existingId}`, {
      headers: { "X-API-Key": apiKey },
    })
      .then((r) => r.json())
      .then((data: VisitorProfile) => {
        if (data.is_returning) setVisitorProfile(data);
      })
      .catch(() => {});
  }, [apiUrl, apiKey]);

  // Proactive triggers — fires once per page load
  useEffect(() => {
    if (!config.proactive_enabled || proactiveFired) return;

    const fireProactive = () => {
      if (proactiveFired || isOpen) return;
      setShowProactive(true);
      setProactiveFired(true);
    };

    // Time-on-page trigger
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (config.proactive_time_delay > 0) {
      timer = setTimeout(fireProactive, config.proactive_time_delay * 1000);
    }

    // Exit intent — mouse leaves the top of the viewport
    const handleExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 5 && config.proactive_exit_intent) {
        fireProactive();
      }
    };
    if (config.proactive_exit_intent) {
      document.addEventListener("mouseleave", handleExitIntent);
    }

    // Scroll depth trigger
    const handleScroll = () => {
      if (config.proactive_scroll_depth <= 0) return;
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      if (pct >= config.proactive_scroll_depth) {
        fireProactive();
      }
    };
    if (config.proactive_scroll_depth > 0) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("mouseleave", handleExitIntent);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [config, proactiveFired, isOpen]);

  // Hide proactive bubble when chat is opened
  useEffect(() => {
    if (isOpen) setShowProactive(false);
  }, [isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const getVisitorId = () => {
    let id = localStorage.getItem("resolvai_visitor_id");
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("resolvai_visitor_id", id);
    }
    return id;
  };

  const startConversation = async (): Promise<string> => {
    const res = await fetch(`${apiUrl}/api/v1/widget/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ visitor_id: getVisitorId() }),
    });
    const data = await res.json();
    setConversationId(data.id);

    // Connect WebSocket
    const wsUrl = `${apiUrl.replace("http", "ws")}/ws/chat/${data.id}?api_key=${apiKey}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "message") {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: msg.id || crypto.randomUUID(), role: msg.role, content: msg.content },
        ]);
      } else if (msg.type === "typing") {
        setTyping(true);
      } else if (msg.type === "escalated") {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "system", content: msg.message },
        ]);
      } else if (msg.type === "agent_joined") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: `${msg.agent_name} has joined the chat`,
          },
        ]);
      } else if (msg.type === "resolved") {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "system",
            content: "This conversation has been resolved. Thank you!",
          },
        ]);
      }
    };
    wsRef.current = ws;

    return data.id;
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "visitor", content },
    ]);

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await startConversation();
      }

      setTyping(true);
      const res = await fetch(
        `${apiUrl}/api/v1/widget/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify({ content, visitor_id: getVisitorId() }),
        }
      );
      const data = await res.json();
      setTyping(false);
      if (data.content) {
        setMessages((prev) => [
          ...prev,
          { id: data.id, role: "ai", content: data.content },
        ]);
      }
    } catch {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const openFromProactive = () => {
    setShowProactive(false);
    setIsOpen(true);
  };

  return (
    <div class={`resolvai-container ${position}`}>
      {/* Proactive speech bubble */}
      {showProactive && !isOpen && (
        <div class="resolvai-proactive" onClick={openFromProactive}>
          <button
            class="resolvai-proactive-close"
            onClick={(e) => { e.stopPropagation(); setShowProactive(false); }}
          >
            ✕
          </button>
          {visitorProfile?.is_returning
            ? `Welcome back${visitorProfile.visitor_name ? `, ${visitorProfile.visitor_name}` : ""}! Need help with anything?`
            : config.proactive_message}
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div class="resolvai-window">
          <div
            class="resolvai-header"
            style={{ backgroundColor: config.widget_color }}
          >
            <h3>{config.tenant_name}</h3>
            <button onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          <div class="resolvai-messages">
            {messages.length === 0 && (
              <div class="resolvai-greeting">
                {visitorProfile?.is_returning
                  ? buildReturningGreeting(visitorProfile, config.greeting_message)
                  : config.greeting_message}
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                class={`resolvai-msg ${msg.role}`}
                style={
                  msg.role === "visitor"
                    ? { backgroundColor: config.widget_color }
                    : undefined
                }
              >
                {msg.content}
              </div>
            ))}
            {typing && <div class="resolvai-typing">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div class="resolvai-input-area">
            <input
              type="text"
              value={input}
              onInput={(e) => setInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              style={{ backgroundColor: config.widget_color }}
            >
              &#x27A4;
            </button>
          </div>
        </div>
      )}

      {/* Launcher bubble */}
      <button
        class="resolvai-bubble"
        style={{ backgroundColor: config.widget_color }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}
