import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
const ChartPanel = ({ pair, timeframe }) => {
  const chartContainerRef = useRef();
  useEffect(() => {
    const chart = createChart(chartContainerRef.current, { layout: { background: { color: '#1a1a1a' }, textColor: '#d1d4dc' } });
    const series = chart.addCandlestickSeries({ upColor: '#00c853', downColor: '#ff1744' });
    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [pair, timeframe]);
  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
};
export default ChartPanel;
