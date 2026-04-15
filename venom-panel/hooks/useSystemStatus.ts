import { useState, useEffect } from 'react';
import { useWebSocketData } from "@/context/WebSocketContext";
import { SystemStatus } from '@/types';

const DEFAULT_STATUS: SystemStatus = {
  binance_connected: false,
  bybit_connected: false,
  mempool_connected: false,
  binance_latency: 0,
  bybit_latency: 0,
  last_signal_ago: 'N/A',
  mode: 'HUNTER',
  signals_24h: 0,
  global: 'CONNECTING',
};

export function useSystemStatus(): SystemStatus {
  const { status: rawStatus, isConnected } = useWebSocketData();
  const [status, setStatus] = useState<SystemStatus>(DEFAULT_STATUS);

  useEffect(() => {
    if (rawStatus && rawStatus.type === 'status_update') {
      const p = rawStatus.payload;
      setStatus({
        binance_connected: !!p.binance_connected,
        bybit_connected: !!p.bybit_connected,
        mempool_connected: !!p.mempool_connected,
        binance_latency: p.binance_latency ?? 0,
        bybit_latency: p.bybit_latency ?? 0,
        last_signal_ago: p.last_signal_ago ?? 'N/A',
        mode: p.mode ?? 'HUNTER',
        signals_24h: p.signals_24h ?? 0,
        global: p.binance_connected ? 'ACTIVE' : 'DATA_STARVED',
      });
    } else if (!isConnected) {
        setStatus(s => ({ ...s, global: 'DISCONNECTED' }));
    } else {
        setStatus(s => ({ ...s, global: 'ACTIVE' }));
    }
  }, [rawStatus, isConnected]);

  return status;
}
