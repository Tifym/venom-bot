"use client";
import { useEffect, useState } from "react";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { TerminalStats } from "@/types/terminal";

export function VenomStats() {
  // wsStatus drives connection indicators; stats drives the tiles
  const wsStatus = useSystemStatus();
  const [stats, setStats] = useState<TerminalStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Latency: prefer live WS latency (binance), fall back to REST stats latency
  const displayLatency = wsStatus.binance_latency > 0 ? wsStatus.binance_latency : (stats?.latency || 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Overview Stats */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">24H Signals</span>
        <span className="text-xl font-mono text-white">{stats?.signals_24h ?? 0}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Win Rate</span>
        <span className="text-xl font-mono text-venom">{stats?.win_rate ?? 0}%</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Profit Factor</span>
        <span className="text-xl font-mono text-[#00FFFF]">{stats && stats.profit_factor > 0 ? stats.profit_factor : "---"}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Avg R</span>
        <span className="text-xl font-mono text-white">{stats && stats.avg_r > 0 ? stats.avg_r : "---"}</span>
      </div>

      {/* Analytics Stats */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Best Zone</span>
        <span className="text-lg font-mono text-[#CCFF00]">{stats?.best_zone ?? "NONE"}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Best TF</span>
        <span className="text-lg font-mono text-white">{stats?.best_tf ?? "-"}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Liq Boosts</span>
        <span className="text-xl font-mono text-[#FF0040]">{stats?.liq_boosts ?? 0}</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center">
        <span className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Latency</span>
        <span className="text-xl font-mono text-toxic">{displayLatency}ms</span>
      </div>
    </div>
  );
}
