"use client";

export function ThresholdControls() {
  return (
    <div className="flex flex-col gap-4 border-l border-white/10 pl-8">
      <h4 className="font-mono text-xs text-white/50 border-b border-white/10 pb-2 mb-2">┌─ THRESHOLDS & ADVANCED ─</h4>
      
      <div className="space-y-4">
        {/* Simple Thresholds */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-white/80">
            <span>Min Score:</span>
            <div className="flex items-center gap-2">
              <span className="text-toxic">60</span><span className="text-white/30">/100</span>
              <input type="range" min="40" max="95" defaultValue="60" className="w-24 accent-venom" />
            </div>
          </div>
          
          <div className="flex items-center justify-between font-mono text-xs text-white/80">
            <span>Direction CD:</span>
            <div className="flex items-center gap-2">
              <span className="text-white">3</span><span className="text-white/30">m</span>
              <input type="range" min="0" max="30" defaultValue="3" className="w-24 accent-venom" />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-white/80">
            <span>Daily Cap:</span>
            <div className="flex items-center gap-2">
              <span className="text-white">50</span>
              <input type="range" min="10" max="200" defaultValue="50" className="w-24 accent-venom" />
            </div>
          </div>
        </div>

        {/* Advanced Toggles */}
        <div className="pt-2 border-t border-white/5 space-y-2">
           <label className="flex items-center gap-2 font-mono text-[10px] text-white/60 hover:text-white cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-venom" />
              Pre-Pocket Warnings (within 0.5%)
           </label>
           <label className="flex items-center gap-2 font-mono text-[10px] text-white/60 hover:text-white cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-venom" />
              Liquidation Scalp (instant blast)
           </label>
           <div className="flex items-center gap-2 font-mono text-[10px] text-white/60 mt-1">
             <span>Session Filter:</span>
             <label className="cursor-pointer hover:text-white"><input type="checkbox" defaultChecked className="mr-1 accent-venom" />London</label>
             <label className="cursor-pointer hover:text-white"><input type="checkbox" defaultChecked className="mr-1 accent-venom" />NY</label>
             <label className="cursor-pointer hover:text-white"><input type="checkbox" className="mr-1 accent-venom" />Asia</label>
           </div>
        </div>

      </div>
    </div>
  );
}
