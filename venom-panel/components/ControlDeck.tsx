"use client";

import { useState } from "react";
import { ChevronDown, Save, RotateCcw } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { ZoneToggles } from "./ZoneToggles";
import { WeightSliders } from "./WeightSliders";
import { ThresholdControls } from "./ThresholdControls";

export function ControlDeck() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`glass-panel overflow-hidden transition-all duration-300 flex flex-col ${isOpen ? 'h-auto' : 'h-[60px]'}`}>
      
      {/* Header / Collapse Toggle */}
      <div 
        className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center cursor-pointer hover:bg-white/[0.02]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <ChevronDown className={`transition-transform ${isOpen ? "rotate-180" : ""}`} size={20} />
          <h3 className="font-display font-medium tracking-widest text-[#00FFFF]">SIGNAL FORGE</h3>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <PresetSelector />
          <div className="w-[1px] h-4 bg-white/10" />
          <button className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors">
            <Save size={14} /> SAVE
          </button>
          <button className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-alert/10 text-alert hover:bg-alert/20 transition-colors">
            <RotateCcw size={14} /> RESET
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 bg-black/20">
          <ZoneToggles />
          <WeightSliders />
          <ThresholdControls />
        </div>
      )}
    </div>
  );
}
