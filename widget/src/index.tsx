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
    .resolvai-container.bottom-right { bottom: 20px; right: 20px; }
    .resolvai-container.bottom-left { bottom: 20px; left: 20px; }

    .resolvai-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
      font-size: 24px;
      color: white;
    }
    .resolvai-bubble:hover { transform: scale(1.1); }

    .resolvai-window {
      position: absolute;
      bottom: 72px;
      width: 380px;
      height: 520px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }
    .resolvai-container.bottom-right .resolvai-window { right: 0; }
    .resolvai-container.bottom-left .resolvai-window { left: 0; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .resolvai-header {
      padding: 16px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .resolvai-header h3 { font-size: 16px; font-weight: 600; }
    .resolvai-header button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      opacity: 0.8;
    }
    .resolvai-header button:hover { opacity: 1; }

    .resolvai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resolvai-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .resolvai-msg.visitor {
      align-self: flex-end;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .resolvai-msg.ai, .resolvai-msg.agent {
      align-self: flex-start;
      background: #f3f4f6;
      color: #1f2937;
      border-bottom-left-radius: 4px;
    }
    .resolvai-msg.system {
      align-self: center;
      background: #fef3c7;
      color: #92400e;
      font-size: 12px;
      border-radius: 8px;
    }

    .resolvai-typing {
      align-self: flex-start;
      padding: 10px 14px;
      background: #f3f4f6;
      border-radius: 12px;
      font-size: 14px;
      color: #9ca3af;
    }

    .resolvai-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    .resolvai-input-area input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .resolvai-input-area input:focus { border-color: #6366f1; }
    .resolvai-input-area button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .resolvai-input-area button:disabled { opacity: 0.5; cursor: not-allowed; }

    .resolvai-greeting {
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }

    .resolvai-proactive {
      position: absolute;
      bottom: 72px;
      background: white;
      border-radius: 12px;
      padding: 12px 32px 12px 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.13);
      font-size: 14px;
      color: #1f2937;
      max-width: 230px;
      cursor: pointer;
      animation: slideUp 0.3s ease;
      line-height: 1.5;
      border: 1px solid #e5e7eb;
    }
    .resolvai-proactive:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.18); }
    .resolvai-container.bottom-right .resolvai-proactive { right: 0; }
    .resolvai-container.bottom-left .resolvai-proactive { left: 0; }

    .resolvai-proactive::after {
      content: '';
      position: absolute;
      bottom: -6px;
      width: 12px;
      height: 12px;
      background: white;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      transform: rotate(45deg);
    }
    .resolvai-container.bottom-right .resolvai-proactive::after { right: 24px; }
    .resolvai-container.bottom-left .resolvai-proactive::after { left: 24px; }

    .resolvai-proactive-close {
      position: absolute;
      top: 7px;
      right: 9px;
      background: none;
      border: none;
      font-size: 12px;
      cursor: pointer;
      color: #9ca3af;
      line-height: 1;
      padding: 2px;
    }
    .resolvai-proactive-close:hover { color: #4b5563; }
  `;
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
