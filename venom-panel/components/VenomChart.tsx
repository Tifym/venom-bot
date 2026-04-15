"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

export function VenomChart({ liveData }: { liveData?: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const volumeRef = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
        fontFamily: 'JetBrains Mono',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
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

    seriesRef.current = candlestickSeries;
    volumeRef.current = volumeSeries;
    chartRef.current = chart;

    // Fetch History on Mount
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history?timeframe=1m");
        if (res.ok) {
          const history = await res.json();
          if (history && history.length > 0) {
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

  // Update logic
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!liveData || !seriesRef.current) return;

    try {
      // 1. Handle Kline updates (STRICT 1M FILTER)
      if (liveData.stream?.includes('kline_1m')) {
        const k = liveData.data?.k;
        if (!k) return;
        const time = Math.floor(Number(k.t) / 1000);
        lastTimeRef.current = time;
        
        seriesRef.current.update({
          time,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        });

        volumeRef.current.update({
          time,
          value: parseFloat(k.v),
          color: parseFloat(k.c) >= parseFloat(k.o) ? '#00FF4140' : '#FF004040',
        });
      }

      // 2. Handle Signal Markers and Price Lines
      if (liveData.type === 'signal') {
        const s = liveData.data;
        // Use last known candle time to avoid out-of-order crashes
        const time = lastTimeRef.current || Math.floor(Date.now() / 1000);
        
        // Add Marker
        const currentMarkers = seriesRef.current.getMarkers() || [];
        seriesRef.current.setMarkers([
          ...currentMarkers,
          {
            time,
            position: s.direction?.toUpperCase() === 'LONG' ? 'belowBar' : 'aboveBar',
            color: s.direction?.toUpperCase() === 'LONG' ? '#00FF41' : '#FF0040',
            shape: s.direction?.toUpperCase() === 'LONG' ? 'arrowUp' : 'arrowDown',
            text: `${s.direction} @ ${s.entry_low}`,
          }
        ].slice(-20)); // Keep last 20 signs

        // Draw TP/SL Lines
        priceLinesRef.current.forEach(l => seriesRef.current.removePriceLine(l));
        priceLinesRef.current = [];

        const levels = [
          { price: s.tp1, color: '#00FF41', title: 'TP1' },
          { price: s.tp2, color: '#00FFFF', title: 'TP2' },
          { price: s.stop_loss, color: '#FF0040', title: 'SL' },
        ];

        levels.forEach(lvl => {
          if (lvl.price) {
            const pl = seriesRef.current.createPriceLine({
              price: lvl.price,
              color: lvl.color,
              lineWidth: 1,
              lineStyle: 2, // dashed
              axisLabelVisible: true,
              title: lvl.title,
            });
            priceLinesRef.current.push(pl);
          }
        });
      }
    } catch (e) {
      console.error("[VenomChart] Update error:", e);
    }
  }, [liveData]);

  return (
    <div className="w-full h-full relative" id="chart-container">
      <div ref={chartContainerRef} className="absolute inset-0" />
    </div>
  );
}

export default VenomChart;
