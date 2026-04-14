"use client";

export function ZoneToggles() {
  const zones = [
    { name: "ALPHA", range: "0.618—0.650", on: true, priority: "HIGH", color: "bg-venom text-black" },
    { name: "BETA", range: "0.500—0.618", on: true, priority: "MED", color: "bg-toxic text-black" },
    { name: "GAMMA", range: "0.382—0.500", on: true, priority: "LOW", color: "bg-[#FF9500] text-black" },
    { name: "DELTA", range: "0.786—0.850", on: false, priority: "LOW", color: "bg-[#BF5AF2] text-white" },
    { name: "OMEGA", range: "0.850—0.886", on: false, priority: "LOW", color: "bg-alert text-white" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-mono text-xs text-white/50 border-b border-white/10 pb-2 mb-2">┌─ POCKET ZONES ──────────</h4>
      <div className="space-y-3">
        {zones.map((z) => (
          <div key={z.name} className="flex items-center justify-between font-mono text-sm group cursor-pointer">
            <div className="flex items-center gap-3">
              <span className={`w-16 font-bold ${z.on ? "text-white" : "text-white/30"}`}>{z.name}</span>
              <span className="text-white/40 text-xs">[{z.range}]</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40 w-24">Priority: {z.priority}</span>
              <button className={`px-2 py-0.5 rounded text-xs transition-all ${z.on ? z.color : 'bg-white/5 text-white/30'}`}>
                {z.on ? 'ON 🟢' : 'OFF ⚪'}
              </button>
            </div>
          </div>
        ))}
        <button className="text-xs font-mono text-[#00FFFF] hover:underline mt-2 opacity-80">+ Add Custom Zone</button>
      </div>
    </div>
  );
}
