"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { ZoneToggles, ConfigState } from "./ZoneToggles";
import { WeightSliders } from "./WeightSliders";
import { ThresholdControls } from "./ThresholdControls";

export function ControlDeck() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState<ConfigState | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setConfig(data.new_config);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data);
    } catch(e) {}
  };

  if (!config) return <div className="p-4 text-white/50 text-xs font-mono">LOADING PARAMS...</div>;

  return (
    <div className={`flex flex-col w-full transition-all duration-300 ${isExpanded ? 'h-full' : ''}`}>
      
      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg tracking-widest text-toxic font-semibold">SIGNAL FORGE</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <PresetSelector config={config} onChange={setConfig} />
          <button 
            className="btn-icon text-white/50 hover:text-white transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 overflow-y-auto w-full">
          {config.mode.toUpperCase() === "CUSTOM" && (
            <div className="col-span-full mb-4 p-4 border border-venom/30 bg-venom/5 rounded-lg flex flex-col gap-4">
              <h3 className="text-sm font-display text-venom tracking-widest font-semibold flex items-center justify-between">
                CUSTOM SIGNAL BLASTER
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Configuration Name</label>
                  <input type="text" maxLength={15} value={config.preset.custom_options?.name || "BLASTER_V1"}
                    onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, name: e.target.value} as any}})}
                    className="bg-black/50 border border-white/10 rounded px-3 py-1 font-mono text-sm text-white focus:outline-none focus:border-venom/50" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/50 uppercase font-mono tracking-widest flex justify-between">
                    <span>Bollinger Bands</span>
                    <input type="checkbox" checked={config.preset.custom_options?.bbands_enabled || false}
                      onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, bbands_enabled: e.target.checked} as any}})}
                      className="accent-venom" />
                  </label>
                  <div className="flex gap-2">
                    <input type="number" step="0.1" value={config.preset.custom_options?.bbands_lower || 2} placeholder="Lower Dev" 
                      onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, bbands_lower: parseFloat(e.target.value)} as any}})}
                      className="w-1/2 bg-black/50 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white" />
                    <input type="number" step="0.1" value={config.preset.custom_options?.bbands_upper || 2} placeholder="Upper Dev" 
                      onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, bbands_upper: parseFloat(e.target.value)} as any}})}
                      className="w-1/2 bg-black/50 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Timeframes</label>
                  <input type="text" value={config.preset.custom_options?.timeframes?.join(", ") || "1m, 5m"}
                    onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, timeframes: e.target.value.replace(/\s/g, '').split(",")} as any}})}
                    className="bg-black/50 border border-white/10 rounded px-3 py-1 font-mono text-sm text-white" placeholder="1m, 5m, 1h" />
                </div>

                {/* Example of dynamic Fibo entry logic for the 'alpha' pocket */}
                <div className="flex flex-col gap-2 col-span-full md:col-span-1">
                  <label className="text-[10px] text-white/50 uppercase font-mono tracking-widest text-[#00FF41]">Custom Alpha Pocket</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.001" value={config.preset.custom_options?.custom_fibs?.alpha?.[0] || 0.618} placeholder="Lower" 
                      onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, custom_fibs: {...config.preset.custom_options?.custom_fibs, alpha: [parseFloat(e.target.value), config.preset.custom_options?.custom_fibs?.alpha?.[1] || 0.650]}} as any}})}
                      className="w-1/2 bg-black/50 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white" />
                    <input type="number" step="0.001" value={config.preset.custom_options?.custom_fibs?.alpha?.[1] || 0.650} placeholder="Upper" 
                      onChange={e => setConfig({...config, preset: {...config.preset, custom_options: {...config.preset.custom_options, custom_fibs: {...config.preset.custom_options?.custom_fibs, alpha: [config.preset.custom_options?.custom_fibs?.alpha?.[0] || 0.618, parseFloat(e.target.value)]}} as any}})}
                      className="w-1/2 bg-black/50 border border-white/10 rounded px-2 py-1 font-mono text-xs text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <ZoneToggles config={config} onChange={setConfig} />
          <WeightSliders /> 
          <ThresholdControls config={config} onChange={setConfig} />
          
          <div className="col-span-full flex justify-end gap-4 mt-4 pt-4 border-t border-white/5">
            <button onClick={handleReset} className="flex items-center gap-2 text-xs font-mono px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
              <RotateCcw size={14} /> RESET
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 text-xs font-mono px-6 py-2 rounded btn-liquid border-none cursor-pointer">
              <Save size={14} className="relative z-10" /> 
              <span className="relative z-10">SAVE CONFIG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
