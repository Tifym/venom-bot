"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";

export function VenomChart({ liveData }: { liveData?: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const fibSeriesRef = useRef<any>(null);

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
        vertLine: {
          color: '#00FF41',
          width: 1,
          style: 2, // dashed
        },
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

    seriesRef.current = candlestickSeries;

    // Add Fibonacci zone shading as background series
    const addFibZone = (from: number, to: number, color: string) => {
      const series = chart.addBaselineSeries({
        baseValue: { type: 'price', price: (from + to) / 2 },
        topLineColor: color,
        topFillColor1: color + '20', // 12% opacity
        topFillColor2: color + '05', // 2% opacity
        bottomLineColor: color,
        bottomFillColor1: color + '20',
        bottomFillColor2: color + '05',
        lineWidth: 1,
      });
      return series;
    };
    
    // Example: static pocket shading at 65000 - 64000 (dynamic in full integration)
    fibSeriesRef.current = addFibZone(64000, 65000, '#00FF41');

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
      // Also update fib zone if you passed it down...
      
      seriesRef.current.update({
        time: k.t / 1000,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      });
      
      // Keep fib baseline trailing along with same timestamp, dummy value
      if (fibSeriesRef.current) {
        fibSeriesRef.current.update({
           time: k.t / 1000,
           value: 64500
        });
      }
    }
  }, [liveData]);

  return (
    <div className="w-full h-full relative" id="chart-container">
      <div ref={chartContainerRef} className="absolute inset-0" />
    </div>
  );
}

export default VenomChart;
