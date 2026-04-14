"use client";

import { Header } from "@/components/Header";
import { FooterStatus } from "@/components/FooterStatus";
import dynamic from "next/dynamic";
import { ControlDeck } from "@/components/ControlDeck";
import { VenomFeed } from "@/components/VenomFeed";
import { VenomStats } from "@/components/VenomStats";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMarketData } from "@/hooks/useMarketData";
import { useSignals } from "@/hooks/useSignals";

const VenomChart = dynamic(() => import("@/components/VenomChart"), { ssr: false });

export default function Home() {
  const { data: liveData } = useWebSocket();
  const marketData = useMarketData();
  const { signals } = useSignals();

  return (
    <main className="min-h-screen pt-16 pb-10 flex flex-col">
      <Header />
      
      {/* Zero Mock Data Warning */}
      <div className={`text-center text-xs font-mono py-1 border-b ${marketData.connected ? 'bg-venom/20 text-venom border-venom/20' : 'bg-alert/20 text-alert border-alert/20'}`}>
        {marketData.connected ? 'LIVE DATA FEED ACTIVE — MOCK DATA STRICTLY PROHIBITED' : 'DISCONNECTED — RECONNECTING...'}
      </div>

      <div className="flex-1 p-4 lg:p-6 flex flex-col xl:flex-row gap-6 overflow-y-auto">
        {/* Left Column - Chart & Deck */}
        <div className="flex-[2] flex flex-col gap-6">
          <VenomChart liveData={liveData} />
          <ControlDeck />
        </div>

        {/* Right Column - Feed & Stats */}
        <div className="flex-1 flex flex-col gap-6 min-w-[350px]">
          <VenomStats stats={marketData} />
          <VenomFeed signals={signals} />
        </div>
      </div>

      <FooterStatus connected={marketData.connected} latency={marketData.latency} />
    </main>
  );
}
