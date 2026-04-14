"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export function VenomChart({ liveData }: { liveData?: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FF41',
      downColor: '#FF0040',
      borderVisible: false,
      wickUpColor: '#00FF41',
      wickDownColor: '#FF0040',
    });

    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (liveData && seriesRef.current && liveData.stream?.includes('kline')) {
      const k = liveData.data.k;
      seriesRef.current.update({
        time: k.t / 1000,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      });
    }
  }, [liveData]);

  return (
    <div className="glass-panel relative flex-1 h-[60vh] overflow-hidden p-1">
      {/* Liquidation heatmap overlay hook point */}
      <div className="absolute inset-0 pointer-events-none z-10 transition-colors duration-300" id="liquidation-overlay" />
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

export default VenomChart;
