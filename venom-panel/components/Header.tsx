"use client";

import { Activity, Settings, BarChart2 } from "lucide-react";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { useWebSocket } from "../hooks/useWebSocket";
import { useState, useEffect } from "react";

export function Header() {
  const status = useSystemStatus();
  const { data: liveData } = useWebSocket();
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (liveData?.stream?.includes('kline')) {
      setPrice(parseFloat(liveData.data.k.c));
    } else if (liveData?.type === 'ticker') {
      setPrice(parseFloat(liveData.data.lastPrice));
    }
  }, [liveData]);

  return (
    <header className="h-16 glass-panel border-x-0 border-t-0 rounded-none flex items-center justify-between px-6 z-50 sticky top-0 bg-black/50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Activity className="text-venom chart-glow" size={24} />
        <span className="font-display font-semibold text-xl tracking-tight">VENOM BOT</span>
      </div>
      
      <div className="flex gap-8 items-center bg-white/5 px-6 py-2 rounded-full border border-white/10">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">BTC/USDT</span>
          <span className="font-mono text-toxic font-medium tracking-tight">
            ${price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "LOADING"}
          </span>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">MODE</span>
          <span className="font-mono text-white text-sm">{status?.mode || "HUNTER"}</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">STREAMS</span>
          <div className="flex gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${status?.binance_connected ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
            <div className={`w-2 h-2 rounded-full ${status?.bybit_connected ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
            <div className={`w-2 h-2 rounded-full ${status?.mempool_connected ? 'bg-venom chart-glow' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
        >
          <BarChart2 size={20} className="text-white/70 hover:text-toxic transition-colors" />
        </button>
        <button 
          className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
        >
          <Settings size={20} className="text-white/70 hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}
