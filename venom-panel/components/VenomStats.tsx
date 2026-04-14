"use client";

function StatCard({ label, value, highlight = "white", sub = "" }: { label: string, value: string, highlight?: string, sub?: string }) {
  return (
    <div className="glass-panel p-4 flex flex-col justify-center border-white/5 bg-white/[0.02]">
      <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-2">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-display font-medium text-${highlight}`}>{value}</span>
        {sub && <span className="text-xs font-mono text-white/40">{sub}</span>}
      </div>
    </div>
  );
}

export function VenomStats() {
  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      <StatCard label="24H SIGNALS" value="34" highlight="toxic" sub="PREDATOR" />
      <StatCard label="WIN RATE" value="67%" highlight="venom" sub="Target: >60%" />
      <StatCard label="PROFIT FAC" value="2.1" highlight="toxic" />
      <StatCard label="AVG R" value="+1.8R" highlight="venom" />
      
      <StatCard label="BEST ZONE" value="ALPHA" highlight="venom" sub="61.8-65.0%" />
      <StatCard label="BEST TF" value="5m" />
      <StatCard label="LIQ BOOSTS" value="12" highlight="alert" />
      <StatCard label="LATENCY" value="312ms" sub="Avg" />
    </div>
  );
}
