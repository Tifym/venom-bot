"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { Settings, BarChart2, Zap, Layers, Activity } from "lucide-react";
import { calculateWR, calculateKDJ, calculateMACD, calculatePivots } from "@/utils/indicators";
import { VenomIndicatorPanel } from "./VenomIndicatorPanel";
import { ChartToggles, LiveData } from "@/types/terminal";

interface VenomChartProps {
    liveData: LiveData;
    toggles: ChartToggles;
    setToggles: React.Dispatch<React.SetStateAction<ChartToggles>>;
}

interface IndicatorStack {
    wr: any[];
    kdj: any[][];
    macd: any[][];
    pivots: number[];
}

export function VenomChart({ liveData, toggles, setToggles }: VenomChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);
  const bbRef = useRef<any[]>([]); // [upper, mid, lower]
  const srLinesRef = useRef<any[]>([]); // Auto S/R
  const drawingSeriesRef = useRef<any[]>([]); // For trendlines

  const [activeTF, setActiveTF] = useState("1m");
  const [drawMode, setDrawMode] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorStack>({ 
    wr: [], 
    kdj: [[],[],[]], 
    macd: [[],[],[]], 
    pivots: [] 
  });

  const lastTimeRef = useRef<number>(0);
  const candleHistory = useRef<any[]>([]);
  const fibZonesRef = useRef<any[]>([]); // Array of price lines/boxes

  const fetchDrawings = useCallback(async () => {
    try {
      const res = await fetch(`/api/drawings?timeframe=${activeTF}`);
      if (res.ok) {
        const data = await res.json();
        setDrawings(data);
      }
    } catch (e) { console.error("Failed to fetch drawings", e); }
  }, [activeTF]);

  const saveDrawing = async (drawing: any) => {
    try {
      await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...drawing, timeframe: activeTF })
      });
      fetchDrawings();
    } catch (e) { console.error("Failed to save drawing", e); }
  };

  // Helper to fetch history
  const fetchHistory = useCallback(async (tf: string) => {
    if (!seriesRef.current) return;
    try {
      const res = await fetch(`/api/history?timeframe=${tf}`);
      if (res.ok) {
        const history = await res.json();
        if (history && history.length > 0) {
          candleHistory.current = history;
          seriesRef.current.setData(history.map((h: any) => ({
            time: h.time,
            open: h.open,
            high: h.high,
            low: h.low,
            close: h.close
          })));
          volumeRef.current.setData(history.map((h: any) => ({
            time: h.time,
            value: h.volume,
            color: h.close >= h.open ? '#00FF4140' : '#FF004040'
          })));
          updateBB(history);
        }
      }
    } catch (e) { console.error("Failed to fetch chart history:", e); }
  }, []);

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
    const bbUpper = chart.addLineSeries({ color: 'rgba(0, 255, 65, 0.3)', lineWidth: 1, lineStyle: 0 });
    const bbMid = chart.addLineSeries({ color: 'rgba(255, 255, 255, 0.2)', lineWidth: 1, lineStyle: 2 });
    const bbLower = chart.addLineSeries({ color: 'rgba(255, 0, 64, 0.3)', lineWidth: 1, lineStyle: 0 });

    seriesRef.current = candlestickSeries;
    volumeRef.current = volumeSeries;
    chartRef.current = chart;
    bbRef.current = [bbUpper, bbMid, bbLower];

    fetchHistory(activeTF);
    fetchDrawings();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    // Drawing Logic
    chart.subscribeClick((param) => {
        if (!param.point || !drawMode) return;
        const price = seriesRef.current.coordinateToPrice(param.point.y);
        
        if (drawMode === 'horizontal') {
            const id = `h-${Date.now()}`;
            saveDrawing({ id, type: 'horizontal', data: { price } });
            setDrawMode(null);
        }
    });

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [fetchHistory, fetchDrawings]);

  // Sync Drawings to Chart
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // Clear old drawings
    drawingSeriesRef.current.forEach(s => chartRef.current.removeSeries(s));
    drawingSeriesRef.current = [];

    // Render horizontal lines as PriceLines on the main series (simpler for now)
    // or as separate LineSeries for more complex shapes.
    drawings.forEach(d => {
        if (d.type === 'horizontal') {
            const pl = seriesRef.current.createPriceLine({
                price: d.data.price,
                color: '#ffffff80',
                lineWidth: 1,
                lineStyle: 0,
                axisLabelVisible: true,
                title: 'LEVEL',
            });
            drawingSeriesRef.current.push({ remove: () => seriesRef.current.removePriceLine(pl) });
        }
    });

    return () => {
        drawingSeriesRef.current.forEach(s => s.remove());
        drawingSeriesRef.current = [];
    };
  }, [drawings]);

  // Handle Timeframe Switch
  const handleTFSwitch = (tf: string) => {
    setActiveTF(tf);
    fetchHistory(tf);
    fetchDrawings();
  };

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

    // Calculate Extended Indicators
    const wrData = calculateWR(history, 10);
    const kdjData = calculateKDJ(history);
    const macdData = calculateMACD(history);
    const pivots = calculatePivots(history);
    
    setIndicatorData({
        wr: wrData,
        kdj: [kdjData.k, kdjData.d, kdjData.j],
        macd: [macdData.macd, macdData.signal, macdData.histogram],
        pivots: pivots
    });
  };

  // Sync Toggles Visibility
  useEffect(() => {
    if (bbRef.current[0]) {
        bbRef.current[0].applyOptions({ visible: toggles.bb });
        bbRef.current[1].applyOptions({ visible: toggles.bb });
        bbRef.current[2].applyOptions({ visible: toggles.bb });
    }
    if (volumeRef.current) volumeRef.current.applyOptions({ visible: toggles.volume });

    // Sync Auto S/R
    srLinesRef.current.forEach(l => seriesRef.current?.removePriceLine(l));
    srLinesRef.current = [];
    if (toggles.sr && indicatorData.pivots?.length > 0) {
        indicatorData.pivots.forEach((price: number) => {
            const pl = seriesRef.current?.createPriceLine({
                price,
                color: 'rgba(255, 255, 255, 0.15)',
                lineWidth: 1,
                lineStyle: 2,
                title: 'PVT'
            });
            if (pl) srLinesRef.current.push(pl);
        });
    }
  }, [toggles, indicatorData.pivots]);

  useEffect(() => {
    if (!liveData || !seriesRef.current) return;

    try {
      // 1. Raw Tech Data (Fib & Div)
      if (liveData.type === 'raw_tech') {
          // Clear old visuals
          fibZonesRef.current.forEach(l => seriesRef.current.removePriceLine(l));
          fibZonesRef.current = [];
          
          if (liveData.fib_pockets && toggles.fib) {
              Object.entries(liveData.fib_pockets).forEach(([zone, range]: any) => {
                  if (!range || range.length < 2) return;
                  const colors: any = { omega: '#00FF41', alpha: '#FF0040', beta: '#f59e0b', delta: '#3b82f6', gamma: '#6366f1' };
                  const color = colors[zone] || 'rgba(255,255,255,0.2)';
                  
                  // For pockets, we draw two lines and slightly color the gap
                  range.forEach((price: number, i: number) => {
                    const pl = seriesRef.current.createPriceLine({
                      price,
                      color: color,
                      lineWidth: i === 0 ? 2 : 1,
                      lineStyle: 1,
                      axisLabelVisible: true,
                      title: i === 0 ? `${zone.toUpperCase()} ZONE` : '',
                    });
                    fibZonesRef.current.push(pl);
                  });
              });
          }

          if (liveData.divergence && liveData.divergence.score && liveData.divergence.score > 0 && toggles.div) {
              const time = lastTimeRef.current || Math.floor(Date.now() / 1000);
              const isBull = liveData.divergence.type.includes('BULL');
              const currentMarkers = seriesRef.current.getMarkers() || [];
              seriesRef.current.setMarkers([
                ...currentMarkers,
                {
                  time,
                  position: isBull ? 'belowBar' : 'aboveBar',
                  color: isBull ? '#00FF41' : '#FF0040',
                  shape: 'circle',
                  text: `DIV [${liveData.tf_source || activeTF}]`,
                }
              ].slice(-100));
          }
      }

      if (liveData.stream?.includes(`kline_${activeTF}`)) {
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

        // Update all indicators for new candle
        updateBB(historyCopy);
      }

      if (liveData.type === 'signal') {
        const s = liveData.data;
        const time = lastTimeRef.current || Math.floor(Date.now() / 1000);
        const isAtomic = s.confluence?.label === 'ATOMIC_CONFLUENCE';
        
        const currentMarkers = (seriesRef.current.getMarkers() || []).filter((m: any) => m.time !== time);
        if (isAtomic) {
            // High-decibel Atomic Cue
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
        }

        seriesRef.current.setMarkers([
          ...currentMarkers,
          {
            time,
            position: s.direction?.toUpperCase() === 'LONG' ? 'belowBar' : 'aboveBar',
            color: s.direction?.toUpperCase() === 'LONG' ? '#00FF41' : '#FF0040',
            shape: s.direction?.toUpperCase() === 'LONG' ? 'arrowUp' : 'arrowDown',
            text: isAtomic ? "ATOMIC ENTRY" : "CONFIRMED",
            size: isAtomic ? 2 : 1
          }
        ].slice(-100));

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
  }, [liveData, toggles.fib, activeTF]);

  return (
    <div className="w-full h-full relative group" id="chart-container">
      {/* Drawing Toolbar (Left) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => setDrawMode(drawMode === 'horizontal' ? null : 'horizontal')}
            className={`p-2 rounded bg-black/80 border ${drawMode === 'horizontal' ? 'border-toxic text-toxic' : 'border-white/10 text-white/40'} hover:border-toxic/50`}
            title="Horizontal Line"
        >
            <Layers size={16} />
        </button>
        <button 
            onClick={() => setDrawings([])} // Clear local for now, add delete logic later
            className={`p-2 rounded bg-black/80 border border-white/10 text-white/40 hover:border-red-500/50`}
            title="Clear Chart"
        >
            <Zap size={16} className="rotate-45" />
        </button>
      </div>

      {/* Indicator HUD (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => setToggles((prev: ChartToggles) => ({ ...prev, bb: !prev.bb }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.bb ? 'text-toxic' : 'text-white/40'}`}
        >
            <Activity size={12} /> BBANDS {toggles.bb ? 'ON' : 'OFF'}
        </button>
        <button 
            onClick={() => setToggles((prev: ChartToggles) => ({ ...prev, fib: !prev.fib }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.fib ? 'text-toxic' : 'text-white/40'}`}
        >
            <Layers size={12} /> FIB {toggles.fib ? 'ON' : 'OFF'}
        </button>
        <button 
            onClick={() => setToggles((prev: ChartToggles) => ({ ...prev, div: !prev.div }))}
            className={`p-2 rounded bg-black/60 border border-white/10 hover:border-toxic/50 flex items-center gap-2 text-[10px] font-mono tracking-widest ${toggles.div ? 'text-toxic' : 'text-white/40'}`}
        >
            <Zap size={12} /> DIVS {toggles.div ? 'ON' : 'OFF'}
        </button>
      </div>

      <div ref={chartContainerRef} className="flex-grow w-full h-[400px]" />

      {/* INDICATOR STACK */}
      <div className="flex flex-col w-full h-fit border-t border-white/10">
          {toggles.wr && (
              <VenomIndicatorPanel 
                title="Williams %R (10)" 
                data={indicatorData.wr} 
                type="line" 
                height={120} 
                syncScale={chartRef.current?.timeScale()}
              />
          )}
          {toggles.kdj && (
              <VenomIndicatorPanel 
                title="KDJ (9,3,3)" 
                data={indicatorData.kdj} 
                type="kdj" 
                height={140} 
                syncScale={chartRef.current?.timeScale()}
              />
          )}
          {toggles.macd && (
              <VenomIndicatorPanel 
                title="MACD (12,26,9)" 
                data={indicatorData.macd} 
                type="macd" 
                height={160} 
                syncScale={chartRef.current?.timeScale()}
              />
          )}
      </div>

      {/* MATRIX STATUS LIGHTS (Enhanced for Multi-Exchange) */}
      <div className="absolute bottom-16 left-4 z-10 flex flex-col gap-3">
          {/* Signal Confluence Indicators */}
          {liveData?.status && (
            <div className="flex gap-2 p-1 bg-black/40 rounded border border-white/5">
                {Object.entries(liveData.status).map(([key, isActive]: any) => (
                    <div key={key} className="flex flex-col items-center gap-1 group/item">
                        <div className={`w-3 h-3 rounded-sm border ${
                            isActive ? 'bg-toxic shadow-[0_0_10px_#00FF41] border-toxic' : 'bg-black/40 border-white/10'
                        } transition-all duration-300`} />
                        <span className="text-[7px] font-mono uppercase text-white/30 group-hover/item:text-toxic">{key}</span>
                    </div>
                ))}
            </div>
          )}

          {/* Exchange Connectivity Status */}
          <div className="flex gap-1.5 p-1 px-2 bg-black/60 rounded-full border border-white/10 items-center">
            {['BINANCE', 'BYBIT', 'DERIBIT', 'KRAKEN', 'BITFINEX', 'MEMPOOL'].map(ex => (
                <div key={ex} className="flex items-center gap-1 group/ex">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        (liveData?.ws_states?.[ex.toLowerCase()] || 'HEALTHY') === 'HEALTHY' 
                        ? 'bg-toxic shadow-[0_0_5px_#00FF41]' : 'bg-red-500 animate-pulse'
                    }`} />
                    <span className="text-[6px] font-mono text-white/20 group-hover/ex:text-white/60">{ex[0]}</span>
                </div>
            ))}
          </div>
      </div>

      {/* MATRIX INTELLIGENCE HUD */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-4 items-end">
          {/* Sentiment Gauge */}
          {liveData?.sentiment !== undefined && (
              <div className={`p-4 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 bg-black/40 ${
                  (liveData?.sentiment ?? 50) < 25 ? 'border-red-500 shadow-red-500/20' :
                  (liveData?.sentiment ?? 50) > 75 ? 'border-toxic shadow-toxic/20' :
                  ''
              }`}>
                  <span className="text-[10px] text-white/50 font-mono tracking-[0.2em] uppercase">Fear & Greed</span>
                  <div className="flex flex-col items-center">
                      <span className={`text-2xl font-black font-mono tracking-tighter ${
                      (liveData?.sentiment ?? 50) >= 70 ? 'text-toxic' : (liveData?.sentiment ?? 50) <= 30 ? 'text-red-500' : 'text-white'
                      }`}>
                      {liveData?.sentiment ?? 50}/100
                      </span>
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
                      {liveData?.sentiment_text || 'SCANNING...'}
                      </span>
                  </div>
              </div>
          )}

          {/* Macro Intelligence Stats */}
          <div className="bg-black/80 border border-white/10 p-3 rounded-lg backdrop-blur-xl flex flex-col gap-2 w-52 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-[9px] text-white/40 font-mono tracking-tighter uppercase">Mempool Priority</span>
                  <span className="text-[10px] font-mono font-black text-toxic">{liveData?.mempool?.fastestFee || '--'} SAT/vB</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-[9px] text-white/40 font-mono tracking-tighter uppercase">Divergence Alert</span>
                  <span className={`text-[9px] font-mono font-black ${
                      liveData?.divergence?.type ? 'text-blue-400' : 'text-white/20'
                  }`}>
                      {liveData?.divergence?.type || 'NO ACTIVE DIV'}
                  </span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-[9px] text-white/40 font-mono tracking-tighter uppercase">Circuit Breaker</span>
                  <span className={`text-[10px] font-mono font-black ${
                      (liveData?.cross_dev > 0.003) ? 'text-red-500 animate-pulse' : 'text-toxic'
                  }`}>
                      {liveData?.cross_dev > 0.003 ? 'VETO_WARNING' : 'STABLE'}
                  </span>
              </div>
          </div>
      </div>

      {/* SIGNAL PULSE OVERLAY */}
      {liveData?.type === 'signal' && (
        <div className="absolute inset-0 pointer-events-none animate-pulse bg-toxic/5 z-0" />
      )}
      
      {/* Advanced Timeframe Switcher */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-1 bg-black/60 p-1 rounded border border-white/10 opacity-60 group-hover:opacity-100 transition-opacity flex-wrap max-w-[300px]">
        {["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"].map(tf => (
          <button
            key={tf}
            onClick={() => handleTFSwitch(tf)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
              activeTF === tf ? "bg-toxic text-black" : "text-white/50 hover:bg-white/5"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
        <div className="text-[10px] font-mono text-toxic bg-toxic/5 p-2 rounded border border-toxic/20 pointer-events-none">
          BTCUSDT {activeTF.toUpperCase()} │ ATOMIC SYMBOL
        </div>
        {liveData?.type === 'signal' && (
            <div className={`text-[12px] font-black italic px-3 py-1 bg-toxic text-black shadow-lg animate-bounce`}>
                NEW {liveData.data.direction} SIGNAL DETECTED
            </div>
        )}
      </div>
    </div>
  );
}

export default VenomChart;
