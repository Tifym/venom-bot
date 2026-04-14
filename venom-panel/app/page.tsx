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
    <main className="min-h-screen pt-16 flex flex-col bg-[#050505]">
      <Header stats={marketData} />
      
      {/* Dynamic Status Banner */}
      <div className={`text-center text-[10px] font-mono py-1 border-b transition-colors duration-500 ${marketData.connected ? 'bg-venom/10 text-venom border-venom/20' : 'bg-alert/10 text-alert border-alert/20'}`}>
        {marketData.connected 
          ? `LIVE DATA FEED ACTIVE — ${process.env.NEXT_PUBLIC_WS_URL}` 
          : `DISCONNECTED — ATTEMPTING RECONNECT TO ${process.env.NEXT_PUBLIC_WS_URL || 'BACKEND'}`}
      </div>

      <div className="flex-1 p-4 lg:p-6 flex flex-col xl:flex-row gap-6 overflow-hidden">
        {/* Left Column - Main Viewport */}
        <div className="flex-[3] flex flex-col gap-6 min-h-0">
          <VenomChart liveData={liveData} />
          <div className="h-1/3 min-h-[250px]">
            <ControlDeck />
          </div>
        </div>

        {/* Right Column - Intelligence Feed */}
        <div className="flex-1 flex flex-col gap-6 min-w-[380px] min-h-0">
          <div className="flex-none">
            <VenomStats stats={marketData} />
          </div>
          <div className="flex-1 min-h-0">
            <VenomFeed signals={signals} />
          </div>
        </div>
      </div>

      <FooterStatus connected={marketData.connected} latency={marketData.latency} />
    </main>
  );
}
