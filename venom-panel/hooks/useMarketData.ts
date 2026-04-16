import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export function useMarketData() {
  const { data: wsData, connected, latency } = useWebSocket();
  const [marketData, setMarketData] = useState({
    price: 0,
    change: 0,
    fundingRate: 0,
    orderbookRatio: 1.0,
    mempoolCongestion: 'Low'
  });

  useEffect(() => {
    if (!wsData) return;

    // Handle incoming WebSocket updates
    if (wsData.stream?.includes('markPrice')) {
      setMarketData(prev => ({ ...prev, fundingRate: parseFloat(wsData.data.r) * 100 }));
    }
    
    if (wsData.stream?.includes('kline')) {
      const k = wsData.data.k;
      setMarketData(prev => ({ 
        ...prev, 
        price: parseFloat(k.c),
        change: ((parseFloat(k.c) - parseFloat(k.o)) / parseFloat(k.o)) * 100
      }));
    }

    if (wsData.type === 'orderbook_ratio') {
      setMarketData(prev => ({ ...prev, orderbookRatio: wsData.ratio ?? prev.orderbookRatio }));
    }
  }, [wsData]);

  return { ...marketData, connected, latency };
}
