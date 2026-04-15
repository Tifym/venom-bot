"use client";
import { useState, useEffect } from "react";

export function WeightSliders() {
  const [weights, setWeights] = useState({
    Divergence: 30,
    OrderBook: 25,
    Volume: 20,
    Funding: 15,
    PriceAction: 10
  });

  const updateWeight = (k: keyof typeof weights, val: number) => {
    setWeights(p => ({ ...p, [k]: val }));
  };

  const total = Object.values(weights).reduce((a,b) => a+b, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <h4 className="text-xs text-white/50 font-mono tracking-widest uppercase">Scoring Weights</h4>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${total === 100 ? 'bg-venom/20 text-venom' : 'bg-alert/20 text-alert'}`}>
          {total}/100
        </span>
      </div>
      
      <div className="flex flex-col gap-4">
        {(Object.keys(weights) as Array<keyof typeof weights>).map(k => (
          <div key={k} className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-white/70">
              <span>{k}</span>
              <span>{weights[k]}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={weights[k]}
              onChange={(e) => updateWeight(k, parseInt(e.target.value))}
              className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${total !== 100 ? 'bg-alert/50' : 'bg-white/20'}`}
              style={{ accentColor: total === 100 ? '#00FF41' : '#FF0040' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
