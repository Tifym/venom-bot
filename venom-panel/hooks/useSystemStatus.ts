import { useState, useEffect } from 'react';

export function useSystemStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:8000/ws`;
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
