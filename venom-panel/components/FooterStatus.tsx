"use client";

import { useSystemStatus } from "../hooks/useSystemStatus";
import { SystemStatus } from "@/types/terminal";

export function FooterStatus({ connected, latency }: { connected?: boolean, latency?: number }) {
  const status: SystemStatus = useSystemStatus();
  
  const b_stat = status?.binance_connected;
  const by_stat = status?.bybit_connected;
  const m_stat = status?.mempool_connected;

  return (
    <div className="h-8 glass-panel border-x-0 border-b-0 rounded-none z-50 flex items-center justify-between px-6 text-[10px] font-mono text-white/50 tracking-widest uppercase">
      <div className="flex gap-6">
        <span className="flex items-center gap-2">
          Binance: <span className={`w-2 h-2 rounded-full ${b_stat ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
        </span>
        <span className="flex items-center gap-2">
          Bybit: <span className={`w-2 h-2 rounded-full ${by_stat ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
        </span>
        <span className="flex items-center gap-2">
          Mempool: <span className={`w-2 h-2 rounded-full ${m_stat ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
        </span>
      </div>

      <div className="flex gap-6">
        <span>Last Signal: {status?.last_signal_ago ?? "None"}</span>
        <span>Next Funding: 4h 32m</span>
        <span>Uptime: 99.9%</span>
      </div>
    </div>
  );
}
