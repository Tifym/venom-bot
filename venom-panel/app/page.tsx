"use client";

import { VenomHeader } from "@/components/VenomHeader";
import { FooterStatus } from "@/components/FooterStatus";
import dynamic from "next/dynamic";
import { ControlDeck } from "@/components/ControlDeck";
import { VenomFeed } from "@/components/VenomFeed";
import { VenomStats } from "@/components/VenomStats";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSignals } from "@/hooks/useSignals";

const VenomChart = dynamic(() => import("@/components/VenomChart"), { ssr: false });

export default function VenomPanel() {
  const status = useSystemStatus();
  const { data: liveData } = useWebSocket();
  const { signals: initialSignals } = useSignals();
  const [signals, setLocalSignals] = useState<any[]>([]);
  const [chartToggles, setChartToggles] = useState({
    bb: true,
    volume: true,
    fib: true,
    div: true,
    wr: true,
    kdj: true,
    macd: true,
    sr: true
  });

  useEffect(() => {
    if (initialSignals && initialSignals.length > 0) {
      setLocalSignals(initialSignals);
    }
  }, [initialSignals]);

  useEffect(() => {
    if (!liveData) return;
    if (liveData.type === 'signal') {
      setLocalSignals(prev => [liveData.data, ...prev].slice(0, 50));
    }
  }, [liveData]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <VenomHeader liveData={liveData} />
      
      {status.global === 'DATA_STARVED' && (
        <div className="text-center bg-alert-red/20 text-alert-red py-2 font-mono text-sm border-y border-alert-red/30 w-full mb-4">
          LIVE DATA UNAVAILABLE — SIGNALS PAUSED
        </div>
      )}

      <main className="venom-main">
        {/* Left Stack: Chart & ControlDeck */}
        <div className="left-stack">
          <section id="v-chart" className="chart-section glass-panel flex flex-col p-4 w-full h-fit min-h-[600px]">
            <VenomChart liveData={liveData} toggles={chartToggles} />
          </section>
          
          <section id="v-control" className="glass-panel w-full">
            <ControlDeck toggles={chartToggles} setToggles={setChartToggles} />
          </section>
        </div>
        
        {/* Right Stack: Stats & Signal Feed */}
        <div className="right-stack">
          <section className="glass-panel p-4">
            <VenomStats />
          </section>
          
          <section className="glass-panel flex-1 min-h-[400px] flex flex-col">
            <VenomFeed signals={signals} />
          </section>
        </div>
      </main>
      
      <FooterStatus />
    </div>
  );
}
