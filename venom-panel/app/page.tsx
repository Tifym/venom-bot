"use client";

import { Header } from "@/components/Header";
import { FooterStatus } from "@/components/FooterStatus";
import dynamic from "next/dynamic";
import { ControlDeck } from "@/components/ControlDeck";
import { VenomFeed } from "@/components/VenomFeed";
import { VenomStats } from "@/components/VenomStats";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket"; // Assuming existing hook provides live signals
import { useSignals } from "@/hooks/useSignals";

const VenomChart = dynamic(() => import("@/components/VenomChart"), { ssr: false });

export default function VenomPanel() {
  const status = useSystemStatus();
  const { data: liveData } = useWebSocket();
  const { signals: initialSignals } = useSignals();
  const [signals, setLocalSignals] = useState<any[]>([]);

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
    <div className="venom-container">
      <Header />
      
      {status === 'DATA_STARVED' && (
        <div className="col-span-full text-center bg-alert-red/20 text-alert-red py-2 font-mono text-sm border-y border-alert-red/30">
          LIVE DATA UNAVAILABLE — SIGNALS PAUSED
        </div>
      )}

      <main className="venom-main">
        <section className="chart-section glass-panel flex flex-col p-4 w-full h-full">
          <VenomChart liveData={liveData} />
        </section>
        
        <section className="controls-section glass-panel flex flex-col">
          <ControlDeck />
        </section>

        <section className="stats-section glass-panel flex flex-col p-4">
          <VenomStats />
        </section>
        
        <section className="feed-section glass-panel flex flex-col">
          <VenomFeed signals={signals} />
        </section>
      </main>
      
      <FooterStatus />
    </div>
  );
}
