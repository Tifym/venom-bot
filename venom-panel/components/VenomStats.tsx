"use client";
import { useSystemStatus } from "../hooks/useSystemStatus";

export function VenomStats() {
  const status = useSystemStatus();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Overview Stats */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">24H Signals</span>
        <span className="text-xl font-mono text-white">{status?.signals_24h || 0}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Win Rate</span>
        <span className="text-xl font-mono text-venom">68.4%</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Profit Factor</span>
        <span className="text-xl font-mono text-[#00FFFF]">2.14</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Avg R</span>
        <span className="text-xl font-mono text-white">4.2</span>
      </div>

      {/* Analytics Stats */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Best Zone</span>
        <span className="text-lg font-mono text-[#CCFF00]">BETA</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Best TF</span>
        <span className="text-lg font-mono text-white">5M</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Liq Boosts</span>
        <span className="text-xl font-mono text-[#FF0040]">12</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Latency</span>
        <span className="text-xl font-mono text-toxic">{status?.binance_latency || 0}ms</span>
      </div>
    </div>
  );
}
