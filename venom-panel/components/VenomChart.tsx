"use client";
import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { Settings, BarChart2, Zap, Layers } from "lucide-react";

export function VenomChart({ liveData }: { liveData?: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);
  const bbRef = useRef<any[]>([]); // [upper, mid, lower]

  const [toggles, setToggles] = useState({
    bb: true,
    volume: true,
    fib: true,
    div: true
  });

  const lastTimeRef = useRef<number>(0);
  const candleHistory = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
        fontFamily: 'JetBrains Mono',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.02)' },
        horzLines: { color: 'rgba(255,255,255,0.02)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#00FF41', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FF41',
      downColor: '#FF0040',
      borderVisible: false,
      wickUpColor: '#00FF41',
      wickDownColor: '#FF0040',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Bollinger Band Lines
    const bbUpper = chart.addLineSeries({ color: 'rgba(0, 255, 65, 0.3)', lineWidth: 1, lineStyle: 0, title: 'BB Upper' });
    const bbMid = chart.addLineSeries({ color: 'rgba(255, 255, 255, 0.2)', lineWidth: 1, lineStyle: 2, title: 'BB Mid' });
    const bbLower = chart.addLineSeries({ color: 'rgba(255, 0, 64, 0.3)', lineWidth: 1, lineStyle: 0, title: 'BB Lower' });

    seriesRef.current = candlestickSeries;
    volumeRef.current = volumeSeries;
    chartRef.current = chart;
    bbRef.current = [bbUpper, bbMid, bbLower];

    // Fetch History on Mount
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history?timeframe=1m");
        if (res.ok) {
          const history = await res.json();
          if (history && history.length > 0) {
            candleHistory.current = history;
            candlestickSeries.setData(history.map((h: any) => ({
              time: h.time,
              open: h.open,
              high: h.high,
              low: h.low,
              close: h.close
            })));
            volumeSeries.setData(history.map((h: any) => ({
              time: h.time,
              value: h.volume,
              color: h.close >= h.open ? '#00FF4140' : '#FF004040'
            })));
            updateBB(history);
          }
        }
      } catch (e) {
        console.error("Failed to fetch chart history:", e);
      }
    };

    fetchHistory();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  const calculateBB = (data: any[], period = 20, multiplier = 2) => {
    if (data.length < period) return null;
    const closes = data.slice(-period).map(c => c.close);
    const sma = closes.reduce((a, b) => a + b) / period;
    const variance = closes.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: sma + multiplier * stdDev,
      mid: sma,
      lower: sma - multiplier * stdDev
    };
  };

  const updateBB = (history: any[]) => {
    if (!bbRef.current[0]) return;
    const upperData: any[] = [];
    const midData: any[] = [];
    const lowerData: any[] = [];
    
    for (let i = 20; i <= history.length; i++) {
        const subset = history.slice(0, i);
        const bb = calculateBB(subset);
        if (bb) {
            const time = history[i-1].time;
            upperData.push({ time, value: bb.upper });
            midData.push({ time, value: bb.mid });
            lowerData.push({ time, value: bb.lower });
        }
    }
    bbRef.current[0].setData(upperData);
    bbRef.current[1].setData(midData);
    bbRef.current[2].setData(lowerData);
  };

  // Sync Toggles Visibility
  useEffect(() => {
    if (bbRef.current[0]) {
        bbRef.current[0].applyOptions({ visible: toggles.bb });
        bbRef.current[1].applyOptions({ visible: toggles.bb });
        bbRef.current[2].applyOptions({ visible: toggles.bb });
    }
    if (volumeRef.current) volumeRef.current.applyOptions({ visible: toggles.volume });
  }, [toggles]);

  useEffect(() => {
    if (!liveData || !seriesRef.current) return;

    try {
      if (liveData.stream?.includes('kline_1m')) {
        const k = liveData.data?.k;
        if (!k) return;
        const time = Math.floor(Number(k.t) / 1000);
        lastTimeRef.current = time;
        
        const newCandle = {
          time,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v)
        };

        seriesRef.current.update(newCandle);
        volumeRef.current.update({
          time,
          value: newCandle.volume,
          color: newCandle.close >= newCandle.open ? '#00FF4140' : '#FF004040',
        });

        // Update BB for new candle
        const historyCopy = [...candleHistory.current];
        if (historyCopy.length > 0 && historyCopy[historyCopy.length-1].time === time) {
            historyCopy[historyCopy.length-1] = newCandle;
        } else {
            historyCopy.push(newCandle);
        }
        candleHistory.current = historyCopy;

        const bb = calculateBB(historyCopy);
        if (bb) {
            bbRef.current[0].update({ time, value: bb.upper });
            bbRef.current[1].update({ time, value: bb.mid });
            bbRef.current[2].update({ time, value: bb.lower });
        }
      }

      if (liveData.type === 'signal') {
        const s = liveData.data;
        const time = lastTimeRef.current || Math.floor(Date.now() / 1000);
        
        const currentMarkers = seriesRef.current.getMarkers() || [];
        seriesRef.current.setMarkers([
          ...currentMarkers,
          {
            time,
            position: s.direction?.toUpperCase() === 'LONG' ? 'belowBar' : 'aboveBar',
            color: s.direction?.toUpperCase() === 'LONG' ? '#00FF41' : '#FF0040',
            shape: s.direction?.toUpperCase() === 'LONG' ? 'arrowUp' : 'arrowDown',
            text: `${s.direction} @ ${Number(s.entry_low).toFixed(1)}`,
          }
        ].slice(-20));

        priceLinesRef.current.forEach(l => seriesRef.current.removePriceLine(l));
        priceLinesRef.current = [];

        if (toggles.fib) {
            const levels = [
              { price: s.tp1, color: '#00FF41', title: 'TP1' },
              { price: s.tp2, color: 'rgba(0, 255, 255, 0.6)', title: 'TP2' },
              { price: s.stop_loss, color: '#FF0040', title: 'SL' },
            ];

            levels.forEach(lvl => {
              if (lvl.price) {
                const pl = seriesRef.current.createPriceLine({
                  price: lvl.price,
                  color: lvl.color,
                  lineWidth: 1,
                  lineStyle: 2,
                  axisLabelVisible: true,
                  title: lvl.title,
                });
                priceLinesRef.current.push(pl);
              }
            });
        }
      }
    } catch (e) {
      console.error("[VenomChart] Update error:", e);
    }
  }, [liveData, toggles.fib]);

  return (
    <div className="w-full h-full relative group" id="chart-container">
      {/* Floating HUD Toggle Board */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => setToggles(prev => ({ ...prev, bb: !prev.bb }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.bb ? 'text-toxic' : 'text-white/40'}`}
        >
            <Zap size={12} /> BOLLINGER {toggles.bb ? 'ON' : 'OFF'}
        </button>
        <button 
            onClick={() => setToggles(prev => ({ ...prev, volume: !prev.volume }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.volume ? 'text-toxic' : 'text-white/40'}`}
        >
            <BarChart2 size={12} /> VOLUME {toggles.volume ? 'ON' : 'OFF'}
        </button>
        <button 
            onClick={() => setToggles(prev => ({ ...prev, fib: !prev.fib }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.fib ? 'text-toxic' : 'text-white/40'}`}
        >
            <Layers size={12} /> POCKETS {toggles.fib ? 'ON' : 'OFF'}
        </button>
        <button 
            onClick={() => setToggles(prev => ({ ...prev, div: !prev.div }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.div ? 'text-toxic' : 'text-white/40'}`}
        >
            <Zap size={12} /> DIVERGENCE {toggles.div ? 'ON' : 'OFF'}
        </button>
      </div>

      <div ref={chartContainerRef} className="absolute inset-0" />
      
      {/* HUD Info */}
      <div className="absolute top-4 right-4 z-10 text-[10px] font-mono text-toxic bg-toxic/5 p-2 rounded border border-toxic/20 pointer-events-none">
        BTCUSDT 1M │ BINANCE FLOW
      </div>
    </div>
  );
}

export default VenomChart;
