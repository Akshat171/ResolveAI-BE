import { render } from "preact";
import { Widget } from "./Widget";

function init() {
  // Find the script tag to get config
  const script = document.querySelector(
    'script[data-api-key][src*="resolvai"]'
  ) as HTMLScriptElement | null;

  if (!script) {
    console.error("ResolvAI: Missing script tag with data-api-key");
    return;
  }

  const apiKey = script.getAttribute("data-api-key") || "";
  const position = script.getAttribute("data-position") || "bottom-right";
  const apiUrl =
    script.getAttribute("data-api-url") || "http://localhost:8000";

  // Create container with Shadow DOM
  const container = document.createElement("div");
  container.id = "resolvai-widget-root";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  // Inject styles into shadow DOM
  const style = document.createElement("style");
  style.textContent = getStyles();
  shadow.appendChild(style);

  // Render mount point
  const mountPoint = document.createElement("div");
  mountPoint.id = "resolvai-mount";
  shadow.appendChild(mountPoint);

  render(
    <Widget apiKey={apiKey} position={position} apiUrl={apiUrl} />,
    mountPoint
  );
}

function getStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .resolvai-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .resolvai-container.bottom-right { bottom: 24px; right: 24px; }
    .resolvai-container.bottom-left  { bottom: 24px; left: 24px; }

    /* ── Launcher bubble ── */
    .resolvai-bubble {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(11,110,107,0.45);
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 22px;
      color: white;
    }
    .resolvai-bubble:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 10px 28px rgba(11,110,107,0.5);
    }

    /* ── Chat window ── */
    .resolvai-window {
      position: absolute;
      bottom: 70px;
      width: 370px;
      height: 530px;
      background: #F4EDE0;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(14,27,34,0.18), 0 2px 8px rgba(14,27,34,0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
      border: 1px solid #DED2BB;
    }
    .resolvai-container.bottom-right .resolvai-window { right: 0; }
    .resolvai-container.bottom-left  .resolvai-window { left: 0; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    /* ── Header ── */
    .resolvai-header {
      padding: 14px 16px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .resolvai-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .resolvai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      color: white;
      flex-shrink: 0;
    }
    .resolvai-header-name {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
    }
    .resolvai-header-status {
      font-size: 11px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 1px;
    }
    .resolvai-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6EE7B7;
      display: inline-block;
    }
    .resolvai-close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .resolvai-close-btn:hover { background: rgba(255,255,255,0.25); }

    /* ── Messages area ── */
    .resolvai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #F4EDE0;
      scrollbar-width: thin;
      scrollbar-color: #DED2BB transparent;
    }
    .resolvai-messages::-webkit-scrollbar { width: 4px; }
    .resolvai-messages::-webkit-scrollbar-track { background: transparent; }
    .resolvai-messages::-webkit-scrollbar-thumb { background: #DED2BB; border-radius: 4px; }

    /* ── Greeting ── */
    .resolvai-greeting-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 10px 8px;
      text-align: center;
    }
    .resolvai-greeting-icon {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.8);
      border: 1px solid #DED2BB;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .resolvai-greeting-text {
      font-size: 14px;
      color: #6F8087;
      line-height: 1.55;
      max-width: 260px;
    }

    /* ── Message rows ── */
    .resolvai-msg-wrap {
      display: flex;
      align-items: flex-end;
      gap: 7px;
    }
    .resolvai-msg-wrap.visitor { flex-direction: row-reverse; }
    .resolvai-msg-wrap.system  { justify-content: center; }

    .resolvai-ai-avatar {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: #E4F1EF;
      color: #0B6E6B;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-bottom: 2px;
    }

    .resolvai-msg {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.55;
      word-wrap: break-word;
    }
    .resolvai-msg.visitor {
      color: white;
      border-bottom-right-radius: 5px;
    }
    .resolvai-msg.ai,
    .resolvai-msg.agent {
      background: rgba(255,255,255,0.85);
      color: #0E1B22;
      border: 1px solid #DED2BB;
      border-bottom-left-radius: 5px;
    }
    .resolvai-msg.system {
      background: rgba(232,184,110,0.15);
      color: #7A5C1E;
      font-size: 12px;
      border-radius: 10px;
      border: 1px solid rgba(232,184,110,0.3);
      padding: 6px 12px;
      max-width: 90%;
    }

    /* ── Typing dots ── */
    .resolvai-typing {
      background: rgba(255,255,255,0.85);
      border: 1px solid #DED2BB;
      border-radius: 16px;
      border-bottom-left-radius: 5px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .resolvai-typing span {
      width: 6px;
      height: 6px;
      background: #0B6E6B;
      border-radius: 50%;
      opacity: 0.4;
      animation: bounce 1.2s infinite;
    }
    .resolvai-typing span:nth-child(2) { animation-delay: 0.2s; }
    .resolvai-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30%            { transform: translateY(-5px); opacity: 1; }
    }

    /* ── Input area ── */
    .resolvai-input-area {
      padding: 10px 12px;
      border-top: 1px solid #DED2BB;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.6);
      flex-shrink: 0;
    }
    .resolvai-input-area input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #DED2BB;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      background: #F4EDE0;
      color: #0E1B22;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .resolvai-input-area input::placeholder { color: #A0A8AC; }
    .resolvai-input-area input:focus {
      border-color: #0B6E6B;
      box-shadow: 0 0 0 3px rgba(11,110,107,0.12);
    }
    .resolvai-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 3px 10px rgba(11,110,107,0.35);
    }
    .resolvai-send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 5px 14px rgba(11,110,107,0.45);
    }
    .resolvai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Footer ── */
    .resolvai-footer {
      text-align: center;
      font-size: 11px;
      color: #A0A8AC;
      padding: 6px 0 8px;
      background: rgba(255,255,255,0.6);
      flex-shrink: 0;
    }
    .resolvai-footer strong { color: #6F8087; }

    /* ── Proactive bubble ── */
    .resolvai-proactive {
      position: absolute;
      bottom: 70px;
      background: #FFFDF8;
      border-radius: 14px;
      padding: 12px 34px 12px 14px;
      box-shadow: 0 6px 24px rgba(14,27,34,0.13);
      font-size: 13.5px;
      color: #0E1B22;
      max-width: 240px;
      cursor: pointer;
      animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1);
      line-height: 1.5;
      border: 1px solid #DED2BB;
    }
    .resolvai-proactive:hover { box-shadow: 0 8px 28px rgba(14,27,34,0.18); }
    .resolvai-container.bottom-right .resolvai-proactive { right: 0; }
    .resolvai-container.bottom-left  .resolvai-proactive { left: 0; }

    .resolvai-proactive::after {
      content: '';
      position: absolute;
      bottom: -6px;
      width: 12px;
      height: 12px;
      background: #FFFDF8;
      border-right: 1px solid #DED2BB;
      border-bottom: 1px solid #DED2BB;
      transform: rotate(45deg);
    }
    .resolvai-container.bottom-right .resolvai-proactive::after { right: 22px; }
    .resolvai-container.bottom-left  .resolvai-proactive::after { left: 22px; }

    .resolvai-proactive-close {
      position: absolute;
      top: 8px;
      right: 9px;
      background: none;
      border: none;
      cursor: pointer;
      color: #A0A8AC;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .resolvai-proactive-close:hover { color: #6F8087; }
  `;
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
