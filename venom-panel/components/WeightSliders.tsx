"use client";

import { ReactNode } from "react";

interface WeightItem {
  name: string;
  score: number | string;
  filled?: number;
  total?: number;
  isText?: boolean;
  extras: ReactNode;
}

export function WeightSliders() {
  const weights: WeightItem[] = [
    { name: "Divergence", score: 30, filled: 7, total: 10, extras: <span className="text-white/40 ml-2">Min TFs: <span className="text-[#00FFFF] bg-white/5 px-1 rounded cursor-pointer">1 ▼</span> | Ind: <label className="cursor-pointer hover:text-white"><input type="checkbox" defaultChecked className="mr-1 accent-venom" />RSI</label> <label className="cursor-pointer hover:text-white"><input type="checkbox" defaultChecked className="mr-1 accent-venom" />Stoch</label></span> },
    { name: "Order Book", score: 25, filled: 6, total: 10, extras: <span className="text-white/40 ml-2">Min Ratio: <span className="text-[#00FFFF] bg-white/5 px-1 rounded cursor-pointer">1.3 ▼</span> | Spread: <span className="text-[#00FFFF] bg-white/5 px-1 rounded cursor-pointer">&lt;0.05% ▼</span></span> },
    { name: "Volume", score: 20, filled: 4, total: 10, extras: <span className="text-white/40 ml-2">Min Mult: <span className="text-[#00FFFF] bg-white/5 px-1 rounded cursor-pointer">1.2x ▼</span></span> },
    { name: "Funding", score: 15, filled: 3, total: 10, extras: <span className="text-white/40 ml-2">Require Aligned: <input type="checkbox" defaultChecked className="ml-1 accent-venom" /></span> },
    { name: "Price Action", score: 10, filled: 2, total: 10, extras: <span className="text-white/40 ml-2">Patterns: <span className="text-[#00FFFF] bg-white/5 px-1 rounded cursor-pointer">All ▼</span></span> },
    { name: "Liquidation", score: "+10 bonus", isText: true, extras: <span className="text-white/40 ml-2">Enabled: <input type="checkbox" defaultChecked className="ml-1 accent-venom" /></span> },
  ];

  return (
    <div className="flex flex-col gap-4 border-l border-white/10 pl-8">
      <h4 className="font-mono text-xs text-white/50 border-b border-white/10 pb-2 mb-2">┌─ CONFLUENCE WEIGHTS ────</h4>
      <div className="space-y-3">
        {weights.map((w) => (
          <div key={w.name} className="flex flex-col gap-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-24 text-white/80">{w.name}:</span>
              
              {!w.isText ? (
                <div className="flex gap-0.5 opacity-80">
                  {Array.from({length: w.total ?? 10}).map((_, i) => (
                    <div key={i} className={`w-1.5 h-3 ${i < (w.filled ?? 0) ? 'bg-venom shadow-[0_0_5px_rgba(0,255,65,0.5)]' : 'bg-white/10'}`} />
                  ))}
                </div>
              ) : (
                <span className="text-alert">{w.score}</span>
              )}
              
              {!w.isText && <span className="text-white/60 ml-1 w-12">{w.score} pts</span>}
              {w.extras}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
