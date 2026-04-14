"use client";

import { Activity, Settings, BarChart2 } from "lucide-react";

export function Header({ stats }: { stats?: any }) {
  const price = stats?.price || 0;
  const change = stats?.change || 0;

  return (
    <div className="fixed top-0 left-0 right-0 h-16 glass-panel border-x-0 border-t-0 rounded-none z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Activity className="text-venom chart-glow" size={24} />
        <span className="font-display font-semibold text-xl tracking-tight">VENOM BOT</span>
      </div>
      
      <div className="flex gap-8 items-center bg-black/20 px-6 py-2 rounded-full border border-white/5">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">BTC/USDT</span>
          <span className="font-mono text-toxic font-medium tracking-tight">
            ${price.toLocaleString()} 
            <span className={change >= 0 ? "text-venom text-xs ml-2" : "text-alert text-xs ml-2"}>
              {change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%
            </span>
          </span>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">MODE</span>
          <span className="font-mono text-white text-sm">PREDATOR</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">STREAMS</span>
          <div className="flex gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${stats?.connected ? 'bg-venom chart-glow' : 'bg-white/10'}`} />
            <div className={`w-2 h-2 rounded-full ${stats?.connected ? 'bg-venom chart-glow' : 'bg-white/10'}`} />
            <div className={`w-2 h-2 rounded-full ${stats?.connected ? 'bg-venom chart-glow' : 'bg-white/10'}`} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10">
          <BarChart2 size={20} className="text-white/70 hover:text-toxic transition-colors" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10">
          <Settings size={20} className="text-white/70 hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
