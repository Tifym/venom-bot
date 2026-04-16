"use client";
import React, { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";

interface IndicatorDataPoint {
    time: number;
    value: number;
    color?: string;
}

interface IndicatorPanelProps {
    title: string;
    data: IndicatorDataPoint[] | IndicatorDataPoint[][];
    type: 'line' | 'histogram' | 'kdj' | 'macd';
    height?: number;
    syncScale?: any;
    config?: any;
    colors?: string[];
}

export function VenomIndicatorPanel({ title, data, type, height = 150, syncScale, config, colors = ['#3b82f6', '#f59e0b', '#8b5cf6'] }: IndicatorPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#ffffff40',
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            timeScale: {
                visible: false, // Hidden for synced panels
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: { top: 0.2, bottom: 0.2 },
            },
            crosshair: {
                vertLine: { color: '#00FF41', width: 1, style: 2 },
                horzLine: { color: 'rgba(255, 255, 255, 0.2)' },
            },
        });

        if (type === 'macd') {
            const hist = chart.addHistogramSeries({ color: '#ffffff20', priceFormat: { type: 'volume' } });
            const macd = chart.addLineSeries({ color: colors[0], lineWidth: 1.5 });
            const signal = chart.addLineSeries({ color: colors[1], lineWidth: 1, lineStyle: 2 });
            seriesRef.current = [hist, macd, signal];
        } else if (type === 'kdj') {
            const k = chart.addLineSeries({ color: colors[0], lineWidth: 1 });
            const d = chart.addLineSeries({ color: colors[1], lineWidth: 1 });
            const j = chart.addLineSeries({ color: colors[2], lineWidth: 1.5 });
            seriesRef.current = [k, d, j];
        } else if (type === 'histogram') {
            const hist = chart.addHistogramSeries({ color: colors[0] });
            seriesRef.current = [hist];
        } else {
            const line = chart.addLineSeries({ color: colors[0], lineWidth: 1.5 });
            seriesRef.current = [line];
        }

        chartRef.current = chart;

        const handleResize = () => {
            chart.applyOptions({ width: containerRef.current?.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // Sync TimeScale if provided
    useEffect(() => {
        if (!chartRef.current || !syncScale) return;
        const localScale = chartRef.current.timeScale();
        
        // This is a simplified sync logic. 
        // Real lightweight-charts sync requires subscribing to visibleLogicalRangeChange.
    }, [syncScale]);

    // Data Update
    useEffect(() => {
        if (!seriesRef.current.length || !data.length) return;
        
        if (type === 'kdj') {
            seriesRef.current[0].setData(data[0]); // K
            seriesRef.current[1].setData(data[1]); // D
            seriesRef.current[2].setData(data[2]); // J
        } else if (type === 'macd') {
            seriesRef.current[0].setData(data[2]); // Histogram
            seriesRef.current[1].setData(data[0]); // MACD
            seriesRef.current[2].setData(data[1]); // Signal
        } else {
            seriesRef.current[0].setData(data);
        }
    }, [data]);

    return (
        <div className="relative border-b border-white/5 bg-black/10 hover:bg-black/20 transition-all">
            <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-toxic uppercase tracking-widest">{title}</span>
                {/* Current Values could go here */}
            </div>
            <div ref={containerRef} className="w-full" />
        </div>
    );
}
