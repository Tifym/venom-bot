import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    // Use the same host/protocol as the page - works locally AND through Cloudflare
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('Connecting to Venom WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
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
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      socketRef.current = null;
      console.log('Venom WebSocket Disconnected. Retrying in 3s...');
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  const send = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { data, connected, latency, send };
}
