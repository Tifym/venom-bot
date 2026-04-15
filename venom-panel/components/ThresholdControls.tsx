"use client";
import { ConfigState } from "./ZoneToggles";

export function ThresholdControls({ config, onChange }: { config: ConfigState, onChange: (c: ConfigState) => void }) {
  const updatePreset = (k: keyof ConfigState['preset'], val: any) => {
    onChange({ ...config, preset: { ...config.preset, [k]: val } });
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs text-white/50 font-mono tracking-widest uppercase border-b border-white/10 pb-2">Global Filters</h4>
      
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Min Score</span><span>{config.preset.min_score}</span>
          </div>
          <input type="range" min="40" max="95" value={config.preset.min_score} onChange={e => updatePreset('min_score', parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Dir Cooldown</span><span>{config.preset.cooldown_dir}m</span>
          </div>
          <input type="range" min="0" max="30" value={config.preset.cooldown_dir} onChange={e => updatePreset('cooldown_dir', parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Daily Cap</span><span>{config.preset.daily_cap === 200 ? 'Infinite' : config.preset.daily_cap}</span>
          </div>
          <input type="range" min="10" max="200" step="5" value={config.preset.daily_cap} onChange={e => updatePreset('daily_cap', parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>ATR Filter</span><span>{config.preset.atr_filter}%</span>
          </div>
          <input type="range" min="0.05" max="1" step="0.05" value={config.preset.atr_filter} onChange={e => updatePreset('atr_filter', parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>
      </div>
    </div>
  );
}
