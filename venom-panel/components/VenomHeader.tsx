"use client";
import React, { useEffect, useState } from "react";
import { ChevronDown, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LiveData } from "@/types/terminal";

interface HeaderStats {
    last: number;
    change: number;
    high: number;
    low: number;
    vol: number;
    quoteVol: number;
}

export function VenomHeader({ liveData }: { liveData: LiveData }) {
    const [stats, setStats] = useState<HeaderStats>({
        last: 0,
        change: 0,
        high: 0,
        low: 0,
        vol: 0,
        quoteVol: 0
    });

    useEffect(() => {
        // Fetch initial 24h stats from Binance
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
            .then(res => res.json())
            .then(data => {
                setStats({
                    last: parseFloat(data.lastPrice),
                    change: parseFloat(data.priceChangePercent),
                    high: parseFloat(data.highPrice),
                    low: parseFloat(data.lowPrice),
                    vol: parseFloat(data.volume),
                    quoteVol: parseFloat(data.quoteVolume)
                });
            })
            .catch(e => console.error("Stats fetch error", e));
    }, []);

    // Update with live price from WebSocket if available
    const currentPrice = liveData?.price || stats.last;
    const isPositive = stats.change >= 0;

    return (
        <div className="flex flex-col w-full bg-black/60 border-b border-white/5 backdrop-blur-xl sticky top-0 z-[60]">
            {/* NEWS TICKER (Marquee) */}
            <div className="bg-toxic/5 border-b border-toxic/10 overflow-hidden whitespace-nowrap py-1">
                <div className="flex gap-8 animate-marquee">
                    {liveData?.news && liveData.news.length > 0 ? liveData.news.map((item: any, i: number) => (
                        <a key={i} href={item.link} target="_blank" className="text-[10px] font-mono text-toxic/70 hover:text-toxic flex items-center gap-2">
                            <span className="opacity-40">[{item.source.toUpperCase()}]</span> {item.title}
                        </a>
                    )) : (
                        <span className="text-[10px] font-mono text-toxic/30 uppercase tracking-widest pl-4">Waiting for incoming news flashes...</span>
                    )}
                </div>
            </div>

            {/* TOP ROW: LOGO & STATS */}
            <div className="flex flex-wrap items-center justify-between p-3 px-6 gap-4">
                <div className="flex items-center gap-6">
                    {/* Pair Selector */}
                    <div className="flex items-center gap-2 group cursor-pointer bg-white/5 px-3 py-1.5 rounded border border-white/5 hover:border-toxic/30 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white/40 font-mono leading-none">SYMBOL</span>
                            <span className="text-sm font-black tracking-widest text-white group-hover:text-toxic transition-colors">BTC/USDT</span>
                        </div>
                        <ChevronDown size={14} className="text-white/20 group-hover:text-toxic" />
                    </div>
                    
                    <Star size={16} className="text-white/10 hover:text-yellow-500 cursor-pointer transition-colors" />

                    {/* MAIN PRICE */}
                    <div className="flex items-baseline gap-3">
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-white/40 font-mono leading-none">LAST PRICE</span>
                            <span className={`text-2xl font-black tabular-nums tracking-tighter ${isPositive ? 'text-toxic' : 'text-red-500'}`}>
                                {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${isPositive ? 'text-toxic' : 'text-red-500'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {stats.change > 0 ? '+' : ''}{stats.change.toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="flex gap-8 border-l border-white/10 pl-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">24h High</span>
                        <span className="text-[11px] font-mono text-white/70 font-bold">{stats.high.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">24h Low</span>
                        <span className="text-[11px] font-mono text-white/70 font-bold">{stats.low.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">24h Volume (BTC)</span>
                        <span className="text-[11px] font-mono text-white/70 font-bold">{stats.vol.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* PERFORMANCE BAR */}
            <div className="flex items-center gap-4 px-4 py-1.5 bg-black/20 border-t border-white/5 overflow-x-auto no-scrollbar">
                {['Today', '7D', '30D', '90D', '180D', '1Y'].map((label, idx) => {
                    const mockVal = (Math.random() * 20 - 10).toFixed(2);
                    const isPos = parseFloat(mockVal) >= 0;
                    return (
                        <div key={label} className="flex items-center gap-1.5 px-3 border-r last:border-0 border-white/5 min-w-fit">
                            <span className="text-[9px] text-white/30 font-mono uppercase">{label}</span>
                            <span className={`text-[10px] font-mono font-black ${isPos ? 'text-toxic' : 'text-red-500'}`}>
                                {isPos ? '+' : ''}{mockVal}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
