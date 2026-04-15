"use client";
import { useState } from "react";

export function ThresholdControls() {
  const [minScore, setMinScore] = useState(75);
  const [dirCooldown, setDirCooldown] = useState(5);
  const [zoneCooldown, setZoneCooldown] = useState(10);
  const [dailyCap, setDailyCap] = useState(25);
  const [atrFilter, setAtrFilter] = useState(0.2);

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs text-white/50 font-mono tracking-widest uppercase border-b border-white/10 pb-2">Global Filters</h4>
      
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Min Score</span><span>{minScore}</span>
          </div>
          <input type="range" min="40" max="95" value={minScore} onChange={e => setMinScore(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Dir Cooldown</span><span>{dirCooldown}m</span>
          </div>
          <input type="range" min="0" max="30" value={dirCooldown} onChange={e => setDirCooldown(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Zone Cooldown</span><span>{zoneCooldown}m</span>
          </div>
          <input type="range" min="0" max="60" value={zoneCooldown} onChange={e => setZoneCooldown(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>Daily Cap</span><span>{dailyCap === 200 ? 'Infinite' : dailyCap}</span>
          </div>
          <input type="range" min="10" max="200" step="5" value={dailyCap} onChange={e => setDailyCap(parseInt(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>

        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-mono text-white/70">
            <span>ATR Filter</span><span>{atrFilter}%</span>
          </div>
          <input type="range" min="0.05" max="1" step="0.05" value={atrFilter} onChange={e => setAtrFilter(parseFloat(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none" style={{ accentColor: '#00FFFF'}} />
        </label>
      </div>
    </div>
  );
}
