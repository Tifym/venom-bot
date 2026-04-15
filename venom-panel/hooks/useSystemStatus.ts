import { useState, useEffect } from 'react';

export function useSystemStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${window.location.hostname}:8000/ws`;
    if (!wsUrl) return;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          setStatus(data.payload);
        }
      } catch(e) {}
    };

    return () => {
      ws.close();
    };
  }, []);

  return status;
}
