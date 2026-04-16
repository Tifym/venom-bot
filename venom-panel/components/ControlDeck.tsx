"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, RotateCcw, Zap, BarChart2, Activity, Layers } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { ZoneToggles } from "./ZoneToggles";
import { WeightSliders } from "./WeightSliders";
import { ThresholdControls } from "./ThresholdControls";
import { useWebSocket } from "@/hooks/useWebSocket";

import { ChartToggles } from "@/types/terminal";

const PRESETS = ["SILENT", "HUNTER", "PREDATOR", "RAMPAGE", "CUSTOM"];

interface ControlDeckProps {
    toggles: ChartToggles;
    setToggles: React.Dispatch<React.SetStateAction<ChartToggles>>;
}

export function ControlDeck({ toggles, setToggles }: ControlDeckProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState({ score: 50, text: "Neutral" });
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

  // Sync config when backend broadcasts a config_update
  useEffect(() => {
    if (!wsData) return;
    if (wsData.type === "config_update" && wsData.config) {
      setConfig(wsData.config);
    }
    if (wsData.type === "macro_update") {
      if (wsData.news) setNews(wsData.news);
      if (wsData.sentiment) setSentiment({ score: wsData.sentiment, text: wsData.sentiment_text });
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

  const handleSaveConfig = async () => {
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
      {/* NEWS TICKER */}
      <div className="bg-toxic/5 border-y border-toxic/10 overflow-hidden whitespace-nowrap py-1">
            <div className="flex gap-8 animate-marquee">
                {news.length > 0 ? news.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" className="text-[9px] font-mono text-toxic/70 hover:text-toxic flex items-center gap-2">
                        <span className="opacity-40">[{item.source}]</span> {item.title}
                    </a>
                )) : (
                    <span className="text-[9px] font-mono text-toxic/30 uppercase tracking-widest pl-4">Waiting for incoming news flashes...</span>
                )}
            </div>
        </div>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${wsData?.status === 'HEALTHY' ? 'bg-toxic shadow-[0_0_8px_#00FF41]' : 'bg-red-500 animate-pulse'} `} />
            <h2 className="font-mono text-sm tracking-[0.2em] text-white/90 font-black uppercase">
              VENOM CORE <span className="text-white/20">V2</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded border border-white/5">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`text-[9px] font-black px-3 py-1.5 rounded transition-all duration-300 ${
                  config.mode === p
                    ? (p === "RAMPAGE" ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105" : "bg-toxic text-black shadow-[0_0_15px_rgba(0,255,65,0.4)] scale-105")
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
             <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">Market Sentiment</span>
             <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                 sentiment.score < 25 ? 'text-red-500' : sentiment.score > 75 ? 'text-toxic' : 'text-white'
             }`}>{sentiment.score} - {sentiment.text}</span>
          </div>

          <div className="hidden lg:flex flex-col items-end">
             <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">Engine Status</span>
             <span className="text-[10px] font-mono text-toxic font-bold uppercase tracking-widest">{config.status}</span>
          </div>
          
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className={`p-2 rounded-lg border transition-all ${
              saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            } bg-toxic/10 border-toxic/20 text-toxic`}
            title="Save All Atomic Nodes"
          >
            <Save size={20} />
          </button>

          <button
            className="text-white/40 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

      {/* Expanded config panel */}
      {isExpanded && (
        <div className="p-4 flex flex-col gap-6 w-full overflow-y-auto max-h-[70vh] no-scrollbar">

          {/* INDICATOR SUITE (Global) */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-4">
              <h3 className="text-xs font-mono text-toxic tracking-[0.2em] uppercase font-black flex items-center gap-2">
                <BarChart2 size={14} /> Indicator Suite (Visuals)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                      { id: 'bb', label: 'Bollinger Bands' },
                      { id: 'volume', label: 'Volume MAs' },
                      { id: 'wr', label: 'Williams %R' },
                      { id: 'kdj', label: 'KDJ Matrix' },
                      { id: 'macd', label: 'MACD Suite' },
                      { id: 'fib', label: 'Fibonacci Pockets' },
                      { id: 'div', label: 'Divergence Arrows' },
                      { id: 'sr', label: 'Auto S/R Levels' }
                  ].map(ind => (
                      <button
                          key={ind.id}
                          onClick={() => setToggles((prev: ChartToggles) => ({ ...prev, [ind.id]: !prev[ind.id as keyof ChartToggles] }))}
                          className={`py-2 px-3 rounded border text-[10px] font-mono font-bold uppercase transition-all flex justify-between items-center ${
                              toggles[ind.id]
                              ? 'bg-toxic/10 border-toxic text-toxic shadow-[0_0_10px_rgba(0,255,65,0.1)]'
                              : 'bg-black/20 border-white/5 text-white/20'
                          }`}
                      >
                          {ind.label}
                          <div className={`w-1.5 h-1.5 rounded-full ${toggles[ind.id] ? 'bg-toxic shadow-[0_0_5px_#00FF41]' : 'bg-white/10'}`} />
                      </button>
                  ))}
              </div>
          </div>

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
              {/* Atomic Matrix: Multi-TF Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 p-4 bg-white/5 rounded-lg border border-white/5">
                 {/* TF Diversion Matrix */}
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] text-toxic font-mono uppercase tracking-widest flex items-center gap-2">
                     <Zap size={14} /> Divergence Matrix
                   </label>
                   <div className="flex flex-wrap gap-1">
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf: string) => (
                       <button
                         key={tf}
                         onClick={() => {
                            const current: string[] = config.preset?.custom_options?.tfs_divergence || [];
                            const next = current.includes(tf) ? current.filter((t: string) => t !== tf) : [...current, tf];
                            setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tfs_divergence: next } } });
                         }}
                         className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${
                           (config.preset?.custom_options?.tfs_divergence || []).includes(tf) 
                           ? "bg-toxic/20 border-toxic text-toxic" : "border-white/10 text-white/40 hover:border-white/20"
                         }`}
                       >
                         {tf}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* TF Bollinger Matrix */}
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] text-toxic font-mono uppercase tracking-widest flex items-center gap-2">
                     <Activity size={14} /> Bollinger Matrix
                   </label>
                   <div className="flex flex-wrap gap-1">
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf: string) => (
                       <button
                         key={tf}
                         onClick={() => {
                            const current: string[] = config.preset?.custom_options?.tfs_bollinger || [];
                            const next = current.includes(tf) ? current.filter((t: string) => t !== tf) : [...current, tf];
                            setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tfs_bollinger: next } } });
                         }}
                         className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${
                           (config.preset?.custom_options?.tfs_bollinger || []).includes(tf) 
                           ? "bg-toxic/20 border-toxic text-toxic" : "border-white/10 text-white/40 hover:border-white/20"
                         }`}
                       >
                         {tf}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* TF Fibonacci Matrix */}
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] text-toxic font-mono uppercase tracking-widest flex items-center gap-2">
                     <Layers size={14} /> Fibonacci Matrix
                   </label>
                   <div className="flex flex-wrap gap-1">
                     {["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf: string) => (
                       <button
                         key={tf}
                         onClick={() => {
                            const current: string[] = config.preset?.custom_options?.tfs_fib || [];
                            const next = current.includes(tf) ? current.filter((t: string) => t !== tf) : [...current, tf];
                            setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, tfs_fib: next } } });
                         }}
                         className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${
                           (config.preset?.custom_options?.tfs_fib || []).includes(tf) 
                           ? "bg-toxic/20 border-toxic text-toxic" : "border-white/10 text-white/40 hover:border-white/20"
                         }`}
                       >
                         {tf}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>

              {/* UNIVERSAL DATA MATRIX HUB */}
              <div className="flex flex-col gap-3 mt-4 p-4 bg-toxic/5 rounded-lg border border-toxic/10">
                  <label className="text-[10px] text-toxic font-mono uppercase tracking-[0.2em] flex items-center gap-2 font-black">
                    <Layers size={14} className="animate-pulse" /> Universal Data Matrix
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
                    {['binance', 'bybit', 'deribit', 'kraken', 'bitfinex', 'mempool', 'news'].map(src => {
                      const key = `source_${src}`;
                      const isActive = config.preset?.custom_options?.[key] ?? true;
                      return (
                        <button
                          key={src}
                          onClick={() => {
                            setConfig({
                              ...config,
                              preset: {
                                ...config.preset,
                                custom_options: {
                                  ...config.preset.custom_options,
                                  [key]: !isActive
                                }
                              }
                            });
                          }}
                          className={`py-2 px-1 rounded border text-[8px] font-black uppercase text-center transition-all ${
                            isActive
                              ? 'bg-toxic/20 border-toxic text-toxic shadow-[0_0_10px_rgba(0,255,65,0.2)]'
                              : 'bg-black/40 border-white/5 text-white/20 hover:border-white/20'
                          }`}
                        >
                          {src}
                        </button>
                      );
                    })}
                  </div>
              </div>

              {/* Raw Data Thresholds */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 border-t border-white/5 pt-4">
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">OB Wall Ratio</label>
                   <input 
                     type="number" step="0.1"
                     value={config.preset?.custom_options?.ob_ratio_min || 2.5}
                     onChange={e => setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, ob_ratio_min: parseFloat(e.target.value) } } })}
                     className="bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-toxic"
                   />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">Liq Burst ($)</label>
                   <input 
                     type="number"
                     value={config.preset?.custom_options?.liq_burst_usd || 50000}
                     onChange={e => setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, liq_burst_usd: parseInt(e.target.value) } } })}
                     className="bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-toxic"
                   />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">OI Spike %</label>
                   <input 
                     type="number" step="0.01"
                     value={config.preset?.custom_options?.oi_spike_pct || 1.2}
                     onChange={e => setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, oi_spike_pct: parseFloat(e.target.value) } } })}
                     className="bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-toxic"
                   />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[9px] text-white/40 font-mono uppercase">Min. Fee (Sat)</label>
                   <input 
                     type="number"
                     value={config.preset?.custom_options?.mempool_fee_min || 5}
                     onChange={e => setConfig({ ...config, preset: { ...config.preset, custom_options: { ...config.preset.custom_options, mempool_fee_min: parseInt(e.target.value) } } })}
                     className="bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-xs text-toxic"
                   />
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
              onClick={handleSaveConfig}
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
