import { Header } from "@/components/Header";
import { FooterStatus } from "@/components/FooterStatus";
import dynamic from "next/dynamic";
import { ControlDeck } from "@/components/ControlDeck";
import { VenomFeed } from "@/components/VenomFeed";
import { VenomStats } from "@/components/VenomStats";

const VenomChart = dynamic(() => import("@/components/VenomChart"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen pt-16 pb-10 flex flex-col">
      <Header />
      
      {/* Zero Mock Data Warning (conditionally rendered by live state layer later) */}
      <div className="bg-alert/20 text-alert text-center text-xs font-mono py-1 border-b border-alert/20">
        LIVE DATA FEED ACTIVE — MOCK DATA STRICTLY PROHIBITED
      </div>

      <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 h-[calc(100vh-104px)] overflow-hidden">
        {/* Left Column - Chart & Deck */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <VenomChart />
          <ControlDeck />
        </div>

        {/* Right Column - Feed & Stats */}
        <div className="w-full xl:w-[600px] flex flex-col gap-6 overflow-y-auto pr-2">
          <VenomFeed />
          <VenomStats />
        </div>
      </div>

      <FooterStatus />
    </main>
  );
}
