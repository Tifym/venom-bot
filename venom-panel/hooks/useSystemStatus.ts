import { useState, useEffect } from 'react';

interface SystemStatus {
  binance_connected: boolean;
  bybit_connected: boolean;
  mempool_connected: boolean;
  last_signal_ago: string;
  mode: string;
  signals_24h: number;
  global: string; // 'ACTIVE' | 'DATA_STARVED' | 'DISCONNECTED'
}

const DEFAULT_STATUS: SystemStatus = {
  binance_connected: false,
  bybit_connected: false,
  mempool_connected: false,
  last_signal_ago: 'N/A',
  mode: 'HUNTER',
  signals_24h: 0,
  global: 'CONNECTING',
};

export function useSystemStatus(): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>(DEFAULT_STATUS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

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
