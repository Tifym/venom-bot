"use client";

import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

export function FooterStatus({ connected, latency }: { connected: boolean, latency: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 glass-panel border-x-0 border-b-0 rounded-none z-50 flex items-center justify-between px-6 text-xs font-mono text-white/50 bg-black/80">
      
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
          {connected ? (
            <>
              <CheckCircle2 size={12} className="text-venom" />
              <span>Binance WS: {latency}ms</span>
            </>
          ) : (
            <>
              <XCircle size={12} className="text-alert" />
              <span>Binance WS: DISCONNECTED</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
          <CheckCircle2 size={12} className={connected ? "text-venom" : "text-white/20"} />
          <span>Mempool: {connected ? 'Active' : 'Standby'}</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
          <CheckCircle2 size={12} className={connected ? "text-venom" : "text-white/20"} />
          <span>DB: Sync</span>
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>v1.0.0-venom</span>
        </div>
      </div>
    </div>
  );
}
