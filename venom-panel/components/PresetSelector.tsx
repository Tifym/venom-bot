"use client";
import { useState } from "react";

const PRESETS = ["SILENT", "HUNTER", "PREDATOR", "RAMPAGE", "CUSTOM"];

export function PresetSelector() {
  const [active, setActive] = useState("HUNTER");

  return (
    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
      {PRESETS.map(p => (
        <button
          key={p}
          onClick={() => setActive(p)}
          className={`px-3 py-1 text-[10px] font-mono rounded transition-all duration-300 ${active === p ? 'bg-venom/20 text-venom venom-glow' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
