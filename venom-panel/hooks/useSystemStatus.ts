import { useState, useEffect } from 'react';
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
  const [status, setStatus] = useState<SystemStatus>(DEFAULT_STATUS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    let ws: WebSocket;
    let retryTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status_update') {
            const p = msg.payload;
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
          }
        } catch {}
      };

      ws.onopen = () => setStatus(s => ({ ...s, global: 'ACTIVE' }));
      ws.onclose = () => {
        setStatus(s => ({ ...s, global: 'DISCONNECTED' }));
        retryTimeout = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);

  return status;
}
