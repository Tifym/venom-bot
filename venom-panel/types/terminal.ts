export interface ChartToggles {
    bb: boolean;
    volume: boolean;
    fib: boolean;
    div: boolean;
    wr: boolean;
    kdj: boolean;
    macd: boolean;
    sr: boolean;
}

export interface VenomSignal {
    id: string;
    timestamp: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    price: number;
    score: number;
    confluence?: {
        score: number;
        sources: string[];
        label: string;
    };
    entry_low?: string;
    tp1?: number;
    tp2?: number;
    stop_loss?: number;
}

export interface LiveData {
    type?: string;
    stream?: string;
    data?: any;
    price?: number;
    sentiment?: number;
    sentiment_text?: string;
    mempool?: {
        fastestFee: number;
    };
    divergence?: {
        type: string;
    };
    status?: Record<string, boolean>;
    ws_states?: Record<string, string>;
    news?: Array<{
        title: string;
        link: string;
        source: string;
    }>;
    cross_dev?: number;
}

export interface SystemStatus {
    global: 'HEALTHY' | 'DEGRADED' | 'DATA_STARVED' | 'OFFLINE' | 'CONNECTING' | 'ACTIVE' | 'DISCONNECTED';
    binance_connected: boolean;
    bybit_connected: boolean;
    mempool_connected: boolean;
    last_signal_ago: string;
    engine: string;
    uptime: string;
    binance_latency: number;
    bybit_latency?: number;
    mode?: string;
    signals_24h?: number;
}

export interface TerminalStats {
    signals_24h: number;
    win_rate: number;
    profit_factor: number;
    avg_r: number;
    best_zone: string;
    best_tf: string;
    liq_boosts: number;
    latency: number;
}
