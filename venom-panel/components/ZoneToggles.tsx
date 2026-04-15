"use client";
import { useState } from "react";

export function ZoneToggles() {
  const [zones, setZones] = useState({
    Alpha: true,
    Beta: true,
    Gamma: false,
    Delta: false,
    Omega: false
  });

  const colors = {
    Alpha: "bg-venom",
    Beta: "bg-[#CCFF00]",
    Gamma: "bg-[#FFA500]",
    Delta: "bg-[#800080]",
    Omega: "bg-[#FF0040]"
  };

  const toggle = (z: keyof typeof zones) => setZones(p => ({ ...p, [z]: !p[z] }));

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs text-white/50 font-mono tracking-widest uppercase border-b border-white/10 pb-2">Active Zones</h4>
      <div className="flex flex-col gap-3">
        {(Object.keys(zones) as Array<keyof typeof zones>).map(z => (
          <div key={z} className="flex justify-between items-center cursor-pointer" onClick={() => toggle(z)}>
            <span className={`text-sm font-mono ${zones[z] ? 'text-white' : 'text-white/30'}`}>{z} Pocket</span>
            <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${zones[z] ? colors[z] : 'bg-white/10'}`}>
              <div className={`w-3 h-3 rounded-full bg-black transition-transform ${zones[z] ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
