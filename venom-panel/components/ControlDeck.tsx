"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { ZoneToggles } from "./ZoneToggles";
import { WeightSliders } from "./WeightSliders";
import { ThresholdControls } from "./ThresholdControls";

export function ControlDeck() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex flex-col w-full transition-all duration-300 ${isExpanded ? 'h-full' : ''}`}>
      
      {/* Header Container */}
      <div className="flex justify-between items-center p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg tracking-widest text-toxic font-semibold">SIGNAL FORGE</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <PresetSelector />
          <button 
            className="btn-icon text-white/50 hover:text-white transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto w-full">
          <ZoneToggles />
          <WeightSliders />
          <ThresholdControls />
          
          <div className="col-span-full flex justify-end gap-4 mt-4 pt-4 border-t border-white/5">
            <button className="flex items-center gap-2 text-xs font-mono px-4 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
              <RotateCcw size={14} /> RESET
            </button>
            <button className="flex items-center gap-2 text-xs font-mono px-6 py-2 rounded btn-liquid border-none cursor-pointer">
              <Save size={14} className="relative z-10" /> 
              <span className="relative z-10">SAVE CONFIG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
