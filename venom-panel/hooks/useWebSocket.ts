import { useWebSocketData } from "@/context/WebSocketContext";

export function useWebSocket() {
    const { data, isConnected } = useWebSocketData();
    return { data, connected: isConnected, latency: 0, send: () => {} };
}
