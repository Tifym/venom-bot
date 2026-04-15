"use client";

import { ExternalLink, Send } from "lucide-react";

export function VenomFeed({ signals }: { signals?: any[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/5 bg-black/40">
        <button className="flex-1 py-3 text-[10px] tracking-widest font-mono text-toxic border-b border-toxic bg-toxic/5">
          LIVE SIGNALS
        </button>
      </div>

      <div className="overflow-y-auto flex-1 w-full p-2">
        <div className="flex flex-col gap-2">
          {(signals || []).map((sig, i) => (
            <div key={i} className={`signal-card glass-panel flex flex-col p-3 text-sm leading-relaxed ${i === 0 ? 'signal-new' : ''}`}>
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${sig.direction === 'LONG' ? 'bg-venom/20 text-venom' : 'bg-alert/20 text-alert'}`}>
                   {sig.direction === 'LONG' ? '▲' : '▼'} {sig.direction}
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  {new Date(sig.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="signal-details grid grid-cols-2 gap-2 text-[12px]">
                <div className="flex flex-col">
                  <span className="signal-label text-white/50 text-[10px] uppercase font-mono tracking-wider">Score</span>
                  <span className="signal-value font-mono text-toxic font-medium">{sig.score ?? sig.total_score}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="signal-label text-white/50 text-[10px] uppercase font-mono tracking-wider">Zone</span>
                  <span className="signal-value font-mono text-white/90 truncate">{sig.zone}</span>
                </div>
                <div className="col-span-2 flex flex-col">
                  <span className="signal-label text-white/50 text-[10px] uppercase font-mono tracking-wider">Entry Target</span>
                  <span className="signal-value font-mono text-white/80">
                     ${Number(sig.entry_low).toLocaleString()} — ${Number(sig.entry_high).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-white/5">
                 <button className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-[#0088cc] transition-colors"><Send size={14} /></button>
                 <button className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ExternalLink size={14} /></button>
              </div>
            </div>
          ))}

          {(!signals || signals.length === 0) && (
            <div className="p-10 text-center text-white/30 font-mono text-xs">
              WAITING FOR MARKET CONFLUENCE...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
