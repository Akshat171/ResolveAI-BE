"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function WidgetSettingsPage() {
  const [settings, setSettings] = useState({
    widget_color: "#0B6E6B",
    widget_position: "bottom-right",
    greeting_message: "Hi! How can I help you today?",
    proactive_enabled: true,
    proactive_message: "👋 Need help? I'm here!",
    proactive_time_delay: 30,
    proactive_exit_intent: true,
    proactive_scroll_depth: 70,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/tenants/me").then((res) => {
      if (res.data.settings) setSettings((prev) => ({ ...prev, ...res.data.settings }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await api.patch("/tenants/me", { settings }); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const inputStyle = { background: "#F4EDE0", border: "1px solid #DED2BB", color: "#0E1B22" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#0B6E6B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,110,107,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#DED2BB"; e.currentTarget.style.boxShadow = "none";
  };
  const cardStyle = { background: "rgba(255,255,255,0.85)", border: "1px solid #DED2BB", boxShadow: "0 1px 3px rgba(14,27,34,0.05)" };

  return (
    <div className="p-8" style={{ background: "#F4EDE0", minHeight: "100%" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#0E1B22" }}>Widget Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#6F8087" }}>Customize how your chat widget looks and behaves</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-4">
          {/* Appearance */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="font-semibold mb-5" style={{ color: "#0E1B22" }}>Appearance</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#324047" }}>Widget Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.widget_color}
                    onChange={(e) => setSettings((prev) => ({ ...prev, widget_color: e.target.value }))}
                    className="w-10 h-10 rounded-xl cursor-pointer" style={{ border: "1px solid #DED2BB" }} />
                  <input type="text" value={settings.widget_color}
                    onChange={(e) => setSettings((prev) => ({ ...prev, widget_color: e.target.value }))}
                    className="px-3 py-2 text-sm w-32 rounded-xl outline-none transition-all" style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#324047" }}>Position</label>
                <select value={settings.widget_position}
                  onChange={(e) => setSettings((prev) => ({ ...prev, widget_position: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl outline-none transition-all" style={inputStyle}
                  onFocus={onFocus} onBlur={onBlur}>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#324047" }}>Greeting Message</label>
                <textarea value={settings.greeting_message}
                  onChange={(e) => setSettings((prev) => ({ ...prev, greeting_message: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all resize-none"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* Proactive Triggers */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold" style={{ color: "#0E1B22" }}>Proactive Triggers</h2>
                <p className="text-sm mt-0.5" style={{ color: "#6F8087" }}>Automatically message visitors — increases engagement by 15–30%.</p>
              </div>
              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.proactive_enabled}
                  onChange={(e) => setSettings((prev) => ({ ...prev, proactive_enabled: e.target.checked }))}
                  className="sr-only peer" />
                <div className="w-11 h-6 rounded-full peer transition-all"
                  style={{ background: settings.proactive_enabled ? "#0B6E6B" : "#DED2BB" }}>
                  <div className="absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all"
                    style={{ transform: settings.proactive_enabled ? "translateX(20px)" : "translateX(0)" }} />
                </div>
              </label>
            </div>

            <div className={settings.proactive_enabled ? "space-y-5" : "opacity-40 pointer-events-none space-y-5"}>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#324047" }}>Message to Show</label>
                <input type="text" value={settings.proactive_message}
                  onChange={(e) => setSettings((prev) => ({ ...prev, proactive_message: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-all" style={inputStyle}
                  placeholder="👋 Need help? I'm here!" onFocus={onFocus} onBlur={onBlur} />
                <p className="text-xs mt-1" style={{ color: "#6F8087" }}>This pops up as a speech bubble above the chat button.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#324047" }}>
                  Time on Page Trigger <span className="font-normal" style={{ color: "#6F8087" }}>({settings.proactive_time_delay}s)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={120} step={5} value={settings.proactive_time_delay}
                    onChange={(e) => setSettings((prev) => ({ ...prev, proactive_time_delay: Number(e.target.value) }))}
                    className="flex-1" style={{ accentColor: "#0B6E6B" }} />
                  <span className="text-sm w-16 text-right" style={{ color: "#6F8087" }}>
                    {settings.proactive_time_delay === 0 ? "Off" : `${settings.proactive_time_delay}s`}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Show after visitor has been on page this long. Set to 0 to disable.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#324047" }}>
                  Scroll Depth Trigger <span className="font-normal" style={{ color: "#6F8087" }}>({settings.proactive_scroll_depth}%)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={100} step={5} value={settings.proactive_scroll_depth}
                    onChange={(e) => setSettings((prev) => ({ ...prev, proactive_scroll_depth: Number(e.target.value) }))}
                    className="flex-1" style={{ accentColor: "#0B6E6B" }} />
                  <span className="text-sm w-16 text-right" style={{ color: "#6F8087" }}>
                    {settings.proactive_scroll_depth === 0 ? "Off" : `${settings.proactive_scroll_depth}%`}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#6F8087" }}>Trigger when visitor scrolls this far down. Set to 0 to disable.</p>
              </div>

              <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid #ECE2CF" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#324047" }}>Exit Intent Trigger</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6F8087" }}>Fire when visitor's mouse moves toward closing the tab.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.proactive_exit_intent}
                    onChange={(e) => setSettings((prev) => ({ ...prev, proactive_exit_intent: e.target.checked }))}
                    className="sr-only" />
                  <div className="w-11 h-6 rounded-full transition-all relative"
                    style={{ background: settings.proactive_exit_intent ? "#0B6E6B" : "#DED2BB" }}>
                    <div className="absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all"
                      style={{ transform: settings.proactive_exit_intent ? "translateX(20px)" : "translateX(0)" }} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="text-white rounded-xl px-6 py-2.5 font-medium disabled:opacity-50 transition-colors"
            style={{ background: saved ? "#059669" : "#0B6E6B" }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.background = "#064F4D"; }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.background = "#0B6E6B"; }}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Preview */}
        <div className="w-72 shrink-0">
          <div className="rounded-2xl p-4 sticky top-8" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#6F8087" }}>Live Preview</p>
            <div className="rounded-xl p-6 min-h-48 relative overflow-hidden" style={{ background: "#ECE2CF" }}>
              <div className="space-y-2 opacity-30">
                {["w-3/4","w-1/2","w-5/6","w-2/3"].map((w, i) => (
                  <div key={i} className={`h-3 rounded ${w}`} style={{ background: "#DED2BB" }} />
                ))}
              </div>
              <div className={`absolute bottom-4 ${settings.widget_position === "bottom-left" ? "left-4" : "right-4"}`}>
                {settings.proactive_enabled && settings.proactive_message && (
                  <div className="rounded-xl px-3 py-2 text-xs mb-2 max-w-[120px] break-words shadow-sm"
                    style={{ background: "white", border: "1px solid #DED2BB", color: "#324047" }}>
                    {settings.proactive_message}
                  </div>
                )}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-lg cursor-pointer"
                  style={{ backgroundColor: settings.widget_color }}>
                  💬
                </div>
              </div>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "#6F8087" }}>Position: {settings.widget_position}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
