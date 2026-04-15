import { useState, useEffect } from 'react';

export function useSystemStatus() {
  const [status, setStatus] = useState<string>('CONNECTING');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'status_update') {
          const payload = msg.payload;
          if (!payload.binance_connected && !payload.bybit_connected) {
            setStatus('DATA_STARVED');
          } else {
            setStatus('ACTIVE');
          }
        }
      } catch {}
    };

    ws.onopen = () => setStatus('ACTIVE');
    ws.onclose = () => setStatus('DISCONNECTED');
    ws.onerror = () => ws.close();

    return () => ws.close();
  }, []);

  return status;
}
