"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

export function VenomChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

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
      crosshair: {
        mode: 1, // Normal
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00FF41',
      downColor: '#FF0040',
      borderVisible: false,
      wickUpColor: '#00FF41',
      wickDownColor: '#FF0040',
    });

    // Mock data for visual setup (will be replaced by live WS)
    candlestickSeries.setData([
      { time: '2018-12-22', open: 64100, high: 64200, low: 64000, close: 64150 },
      { time: '2018-12-23', open: 64150, high: 64300, low: 64100, close: 64250 },
      { time: '2018-12-24', open: 64250, high: 64500, low: 64200, close: 64450 },
      { time: '2018-12-25', open: 64450, high: 64450, low: 64200, close: 64300 },
      { time: '2018-12-26', open: 64300, high: 64400, low: 64150, close: 64235.50 },
    ]);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="glass-panel relative flex-1 h-[60vh] overflow-hidden p-1">
      {/* Liquidation heatmap overlay hook point */}
      <div className="absolute inset-0 pointer-events-none z-10 transition-colors duration-300" id="liquidation-overlay" />
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
