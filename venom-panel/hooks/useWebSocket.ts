import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${window.location.host}/ws`;
    
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    console.log('Connecting to Venom WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      console.log('Venom WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setData(message);
        
        if (message.timestamp) {
          setLatency(Date.now() - message.timestamp);
        }
      } catch (err) {
        console.error('WS Message Error:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Venom WebSocket Disconnected. Retrying in 3s...');
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      ws.close();
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { data, connected, latency, send };
}
