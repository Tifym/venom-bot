"use client";

export function PresetSelector() {
  const presets = ["SILENT", "HUNTER", "PREDATOR", "RAMPAGE", "CUSTOM ▼"];
  const active = "PREDATOR";

  return (
    <div className="flex bg-black/40 p-1 rounded-md border border-white/10">
      {presets.map((p) => {
        const isActive = p === active;
        return (
          <button
            key={p}
            className={`px-3 py-1 text-[10px] font-mono tracking-widest uppercase transition-all rounded ${
              isActive 
                ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        )
      })}
    </div>
  );
}
