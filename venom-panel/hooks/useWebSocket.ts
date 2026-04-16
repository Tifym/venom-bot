import { useWebSocketData } from "@/context/WebSocketContext";
import { LiveData } from "@/types/terminal";

export function useWebSocket() {
    const { data, isConnected } = useWebSocketData();
    return { 
        data: data as LiveData, 
        connected: isConnected, 
        latency: 0, 
        send: (msg: any) => {} 
    };
}
