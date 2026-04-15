"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, RotateCcw, Zap, BarChart2 } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { ZoneToggles } from "./ZoneToggles";
import { WeightSliders } from "./WeightSliders";
import { ThresholdControls } from "./ThresholdControls";
import { useWebSocket } from "@/hooks/useWebSocket";

const PRESETS = ["SILENT", "HUNTER", "PREDATOR", "RAMPAGE", "CUSTOM"];

export function ControlDeck() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: wsData } = useWebSocket();

  // Load config and profiles on mount
  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);

    fetch("/api/profiles")
      .then(res => res.json())
      .then(data => setProfiles(data))
      .catch(console.error);
  }, []);

  // Sync config when backend broadcasts a config_update (another tab saved, or server restarted with restored config)
  useEffect(() => {
    if (!wsData) return;
    if (wsData.type === "config_update" && wsData.config) {
      setConfig(wsData.config);
    }
  }, [wsData]);

  const handlePresetChange = async (newMode: string) => {
    // When switching preset, POST to backend which reloads full preset definition
    // Then backend broadcasts config_update back so we get the fresh params
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode })
      });
      const data = await res.json();
      if (data.new_config) setConfig(data.new_config);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // 1. Save general active config
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.new_config) setConfig(data.new_config);
      
      // 2. If it's a CUSTOM mode, also save it as a named profile
      if (config.mode?.toUpperCase() === "CUSTOM" && config.preset?.custom_options?.name) {
        const pRes = await fetch("/api/profiles/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: config.preset.custom_options.name,
            config: config.preset
          })
        });
        const pData = await pRes.json();
        if (pData.profiles) setProfiles(pData.profiles);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (name: string) => {
    try {
      const res = await fetch(`/api/profiles/${name}`, { method: "DELETE" });
      const data = await res.json();
      if (data.profiles) setProfiles(data.profiles);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadProfile = (profile: any) => {
    setConfig({
      ...config,
      mode: "CUSTOM",
      preset: profile.config
    });
  };

  const handleReset = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data);
    } catch (e) {}
  };

  if (!config) {
    return (
      <div className="p-4 flex items-center gap-2 text-white/30 text-xs font-mono">
        <div className="w-2 h-2 rounded-full bg-venom-green animate-pulse" />
        LOADING CONFIG...
      </div>
    );
  }

  const isCustom = config.mode?.toUpperCase() === "CUSTOM";

  return (
    <div className="flex flex-col w-full">
      {/* Header row */}
      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <Zap size={16} className="text-venom-green" />
          <h2 className="font-mono text-sm tracking-widest text-venom-green font-semibold uppercase">
            Signal Forge
          </h2>
          <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
            {config.mode}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset quick-switcher */}
          <div className="flex gap-1">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-all ${
                  config.mode === p
                    ? "bg-venom-green text-black font-bold"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p === "SILENT" ? "SIL" : p === "HUNTER" ? "HNT" : p === "PREDATOR" ? "PRD" : p === "RAMPAGE" ? "RMP" : "CST"}
              </button>
            ))}
          </div>

          <button
            className="text-white/40 hover:text-white transition-colors p-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded config panel */}
      {isExpanded && (
        <div className="p-4 flex flex-col gap-6 w-full overflow-y-auto max-h-[70vh]">

          {/* Custom Signal Blaster panel */}
          {isCustom && (
            <div className="p-4 border border-venom-green/20 bg-venom-green/5 rounded-xl flex flex-col gap-4">
              <h3 className="text-xs font-mono text-venom-green tracking-widest uppercase font-semibold">
                ⚡ Custom Signal Blaster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Profile Name</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={config.preset?.custom_options?.name || "BLASTER_V1"}
                    onChange={e => setConfig({
                      ...config,
                      preset: { ...config.preset, custom_options: { ...config.preset.custom_options, name: e.target.value } }
                    })}
                    className="bg-black/60 border border-white/10 rounded px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-venom-green/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bollinger Controls */}
                <div className="flex flex-col gap-2 p-3 bg-black/40 rounded border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-white/40 font-mono uppercase tracking-widest flex items-center gap-2">
                       <Zap size={10} className="text-toxic" /> Bollinger Engine
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.preset?.custom_options?.bbands_enabled || false}
                        onChange={e => setConfig({
                          ...config,
                          preset: { ...config.preset, custom_options: { ...config.preset.custom_options, bbands_enabled: e.target.checked } }
                        })}
                        className="accent-toxic"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/30 font-mono">WINDOW</span>
                      <input 
                        type="number" 
                        value={config.preset?.custom_options?.bbands_window ?? 20}
                        onChange={e => setConfig({
                          ...config,
                          preset: { ...config.preset, custom_options: { ...config.preset.custom_options, bbands_window: parseInt(e.target.value) } }
                        })}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/30 font-mono">UPPER σ</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={config.preset?.custom_options?.bbands_upper ?? 2.0}
                        onChange={e => setConfig({
                          ...config,
                          preset: { ...config.preset, custom_options: { ...config.preset.custom_options, bbands_upper: parseFloat(e.target.value) } }
                        })}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/30 font-mono">LOWER σ</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={config.preset?.custom_options?.bbands_lower ?? 2.0}
                        onChange={e => setConfig({
                          ...config,
                          preset: { ...config.preset, custom_options: { ...config.preset.custom_options, bbands_lower: parseFloat(e.target.value) } }
                        })}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white" 
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Raw Data Filters */}
                <div className="flex flex-col gap-2 p-3 bg-black/40 rounded border border-white/5">
                   <label className="text-[10px] text-white/40 font-mono uppercase tracking-widest flex items-center gap-2">
                       <BarChart2 size={10} className="text-toxic" /> Volume Filter
                    </label>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] text-white/30 font-mono">MIN SURGE %</span>
                       <input 
                         type="number"
                         value={config.preset?.atr_filter ?? 1.5}
                         onChange={e => setConfig({
                           ...config,
                           preset: { ...config.preset, atr_filter: parseFloat(e.target.value) }
                         })}
                         className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white"
                       />
                    </div>
                </div>
              </div>

              {/* Custom Fibonacci Pockets */}
              <div>
                <label className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Fibonacci Pockets</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  {["alpha", "beta", "gamma", "delta", "omega"].map(zone => {
                    const fibs = config.preset?.custom_options?.custom_fibs?.[zone];
                    return (
                      <div key={zone} className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-venom-green/70 uppercase">{zone}</span>
                        <div className="flex gap-1">
                          {[0, 1].map(idx => (
                            <input
                              key={idx}
                              type="number"
                              step="0.001"
                              min="0"
                              max="1"
                              value={fibs?.[idx] ?? (idx === 0 ? 0.618 : 0.65)}
                              onChange={e => {
                                const cur = config.preset?.custom_options?.custom_fibs?.[zone] || [0.618, 0.65];
                                const next = [...cur];
                                next[idx] = parseFloat(e.target.value);
                                setConfig({
                                  ...config,
                                  preset: {
                                    ...config.preset,
                                    custom_options: {
                                      ...config.preset.custom_options,
                                      custom_fibs: { ...config.preset.custom_options?.custom_fibs, [zone]: next }
                                    }
                                  }
                                });
                              }}
                              className="w-full bg-black/60 border border-white/10 rounded px-1.5 py-1 font-mono text-[10px] text-white focus:outline-none focus:border-venom-green/50"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saved Profiles Gallery */}
              {profiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Saved Custom Profiles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profiles.map(p => (
                      <div key={p.name} className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
                        <button
                          onClick={() => handleLoadProfile(p)}
                          className="px-3 py-1.5 text-[10px] font-mono text-venom-green hover:bg-venom-green/10 transition-colors"
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(p.name)}
                          className="px-2 py-1.5 text-[10px] text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors border-l border-white/5"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                 {/* TF Diversion */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">Div Timeframe</label>
                   <select 
                     value={config.preset?.custom_options?.tf_divergence || "1m"}
                     onChange={e => setConfig({
                       ...config,
                       preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tf_divergence: e.target.value } }
                     })}
                     className="bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-toxic"
                   >
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
                   </select>
                 </div>
                 {/* TF BB */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">BB Timeframe</label>
                   <select 
                     value={config.preset?.custom_options?.tf_bollinger || "1m"}
                     onChange={e => setConfig({
                       ...config,
                       preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tf_bollinger: e.target.value } }
                     })}
                     className="bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-toxic"
                   >
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
                   </select>
                 </div>
                 {/* TF Fib */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">Fib Timeframe</label>
                   <select 
                     value={config.preset?.custom_options?.tf_fib || "1m"}
                     onChange={e => setConfig({
                       ...config,
                       preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tf_fib: e.target.value } }
                     })}
                     className="bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-toxic"
                   >
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
                   </select>
                 </div>
                 {/* TF Chart Default */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">Default Chart</label>
                   <select 
                     value={config.preset?.custom_options?.tf_chart || "1m"}
                     onChange={e => setConfig({
                       ...config,
                       preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tf_chart: e.target.value } }
                     })}
                     className="bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-toxic"
                   >
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
                   </select>
                 </div>
              </div>
            </div>
          )}

          {/* Standard controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <ZoneToggles config={config} onChange={setConfig} />
            <ThresholdControls config={config} onChange={setConfig} />
            <WeightSliders />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-mono px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <RotateCcw size={13} /> RELOAD
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 text-xs font-mono px-6 py-2 rounded font-semibold transition-all ${
                saved
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-venom-green text-black hover:bg-venom-green/90"
              }`}
            >
              <Save size={13} />
              {saving ? "SAVING..." : saved ? "SAVED ✓" : "SAVE CONFIG"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
