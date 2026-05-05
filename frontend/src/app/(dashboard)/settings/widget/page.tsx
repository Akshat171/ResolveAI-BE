"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function WidgetSettingsPage() {
  const [settings, setSettings] = useState({
    widget_color: "#6366f1",
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
    const fetch = async () => {
      try {
        const res = await api.get("/tenants/me");
        if (res.data.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/tenants/me", { settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Widget Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Customize how your chat widget looks and behaves</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Form */}
        <div className="flex-1 space-y-4">
          {/* Appearance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-5">Appearance</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Widget Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.widget_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, widget_color: e.target.value }))
                    }
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.widget_color}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, widget_color: e.target.value }))
                    }
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                <select
                  value={settings.widget_position}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, widget_position: e.target.value }))
                  }
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Greeting Message</label>
                <textarea
                  value={settings.greeting_message}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, greeting_message: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Proactive Triggers */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-900">Proactive Triggers</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Automatically message visitors — increases engagement by 15–30%.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.proactive_enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, proactive_enabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className={settings.proactive_enabled ? "space-y-5" : "opacity-40 pointer-events-none space-y-5"}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message to Show</label>
                <input
                  type="text"
                  value={settings.proactive_message}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, proactive_message: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="👋 Need help? I'm here!"
                />
                <p className="text-xs text-slate-400 mt-1">
                  This pops up as a speech bubble above the chat button.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time on Page Trigger
                  <span className="ml-2 font-normal text-slate-400">
                    ({settings.proactive_time_delay}s)
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={5}
                    value={settings.proactive_time_delay}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        proactive_time_delay: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm w-16 text-right text-slate-500">
                    {settings.proactive_time_delay === 0 ? "Off" : `${settings.proactive_time_delay}s`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Show after visitor has been on page this long. Set to 0 to disable.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Scroll Depth Trigger
                  <span className="ml-2 font-normal text-slate-400">
                    ({settings.proactive_scroll_depth}%)
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.proactive_scroll_depth}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        proactive_scroll_depth: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm w-16 text-right text-slate-500">
                    {settings.proactive_scroll_depth === 0 ? "Off" : `${settings.proactive_scroll_depth}%`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Trigger when visitor scrolls this far down. Set to 0 to disable.
                </p>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Exit Intent Trigger</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fire when visitor's mouse moves toward closing the tab.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.proactive_exit_intent}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        proactive_exit_intent: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Preview */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm sticky top-8">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Live Preview</p>
            <div className="bg-slate-50 rounded-xl p-6 min-h-48 relative overflow-hidden">
              {/* Mock page content */}
              <div className="space-y-2 opacity-30">
                <div className="h-3 bg-slate-300 rounded w-3/4" />
                <div className="h-3 bg-slate-300 rounded w-1/2" />
                <div className="h-3 bg-slate-300 rounded w-5/6" />
                <div className="h-3 bg-slate-300 rounded w-2/3" />
              </div>

              {/* Chat bubble */}
              <div className={`absolute bottom-4 ${settings.widget_position === "bottom-left" ? "left-4" : "right-4"}`}>
                {settings.proactive_enabled && settings.proactive_message && (
                  <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-sm mb-2 max-w-[120px] break-words">
                    {settings.proactive_message}
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-lg cursor-pointer"
                  style={{ backgroundColor: settings.widget_color }}
                >
                  💬
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Position: {settings.widget_position}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
