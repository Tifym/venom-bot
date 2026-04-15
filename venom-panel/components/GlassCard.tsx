import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ children, className = '', glow = false }: GlassCardProps) {
  return (
    <div className={`glass-panel border border-white/10 rounded-xl bg-white/5 backdrop-blur-[20px] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-white/10 hover:border-white/20 p-4 ${glow ? 'venom-glow' : ''} ${className}`}>
      {children}
    </div>
  );
}
