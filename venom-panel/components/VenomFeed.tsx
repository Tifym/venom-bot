"use client";

import { ExternalLink, Check, X, Send } from "lucide-react";

export function VenomFeed({ signals }: { signals?: any[] }) {
  const displaySignals = (signals && signals.length > 0) ? signals : [
    { time: "21:45:32", dir: "LONG", score: 87, zone: "BETA", entry: "$64,250-380", result: "PENDING", isPending: true },
    { time: "21:32:15", dir: "SHORT", score: 82, zone: "ALPHA", entry: "$64,520-680", result: "WIN +2.1R", isWin: true },
    { time: "21:15:08", dir: "LONG", score: 91, zone: "ALPHA", entry: "$63,980-095", result: "WIN +3.2R", isWin: true },
    { time: "20:58:44", dir: "LONG", score: 64, zone: "GAMMA", entry: "$64,120-250", result: "LOSS -1R", isLoss: true },
    { time: "20:12:10", dir: "SHORT", score: 78, zone: "BETA", entry: "$64,400-500", result: "WIN +1.5R", isWin: true },
  ];

  return (
    <div className="glass-panel overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/5 bg-black/40">
        <h3 className="font-display font-medium text-sm tracking-widest text-white/70">LIVE SIGNALS</h3>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left text-sm font-mono whitespace-nowrap">
          <thead className="text-[10px] text-white/40 uppercase tracking-widest sticky top-0 bg-black/80 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 font-normal">Time</th>
              <th className="px-4 py-3 font-normal">Dir</th>
              <th className="px-4 py-3 font-normal">Score</th>
              <th className="px-4 py-3 font-normal">Zone</th>
              <th className="px-4 py-3 font-normal">Entry</th>
              <th className="px-4 py-3 font-normal">Result</th>
              <th className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displaySignals.map((sig, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white/70">
                  {sig.time || new Date(sig.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${sig.dir === 'LONG' || sig.direction === 'LONG' ? 'bg-venom/20 text-venom' : 'bg-alert/20 text-alert'}`}>
                    {sig.dir === 'LONG' || sig.direction === 'LONG' ? '▲' : '▼'} {sig.dir || sig.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-toxic">{sig.score || sig.total_score}</td>
                <td className="px-4 py-3 text-white/90">{sig.zone?.name || sig.zone}</td>
                <td className="px-4 py-3 text-white/60">
                   {sig.entry || `$${sig.entry_low?.toFixed(0)}-${sig.entry_high?.toFixed(0)}`}
                </td>
                <td className="px-4 py-3">
                  {sig.isPending !== false && <span className="text-toxic">PENDING</span>}
                  {sig.isWin && <span className="text-venom">{sig.result}</span>}
                  {sig.isLoss && <span className="text-alert">{sig.result}</span>}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-[#0088cc]"><Send size={14} /></button>
                  <button className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"><ExternalLink size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
