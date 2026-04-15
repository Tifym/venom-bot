"use client";

// Define shape matching backend
export interface ConfigState {
  mode: string;
  preset: {
    min_score: number;
    min_tfs: number;
    zones: string[];
    cooldown_dir: number;
    daily_cap: number;
    atr_filter: number;
  };
}

export function ZoneToggles({ config, onChange }: { config: ConfigState, onChange: (c: ConfigState) => void }) {
  const zones = ["alpha", "beta", "gamma", "delta", "omega"];

  const colors: Record<string, string> = {
    alpha: "bg-venom",
    beta: "bg-[#CCFF00]",
    gamma: "bg-[#FFA500]",
    delta: "bg-[#800080]",
    omega: "bg-[#FF0040]"
  };

  const toggle = (z: string) => {
    const active = config.preset.zones.includes(z);
    const newZones = active 
      ? config.preset.zones.filter(x => x !== z)
      : [...config.preset.zones, z];
    onChange({ ...config, preset: { ...config.preset, zones: newZones }});
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-xs text-white/50 font-mono tracking-widest uppercase border-b border-white/10 pb-2">Active Zones</h4>
      <div className="flex flex-col gap-3">
        {zones.map(z => {
          const isActive = config.preset.zones.includes(z);
          return (
            <div key={z} className="flex justify-between items-center cursor-pointer" onClick={() => toggle(z)}>
              <span className={`text-sm font-mono ${isActive ? 'text-white' : 'text-white/30'}`}>{z.toUpperCase()} Pocket</span>
              <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${isActive ? colors[z] : 'bg-white/10'}`}>
                <div className={`w-3 h-3 rounded-full bg-black transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
