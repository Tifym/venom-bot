export interface SystemStatus {
  binance_connected: boolean;
  bybit_connected: boolean;
  mempool_connected: boolean;
  binance_latency: number;
  bybit_latency: number;
  last_signal_ago: string;
  mode: string;
  signals_24h: number;
  global: string; // 'ACTIVE' | 'DATA_STARVED' | 'DISCONNECTED' | 'CONNECTING'
}

export interface Signal {
  id: string;
  direction: 'LONG' | 'SHORT';
  score: number;
  zone: string;
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  tp1: number;
  tp2: number;
  timestamp: string;
}

export interface Stats {
  signals_24h: number;
  win_rate: number;
  profit_factor: number;
  avg_r: number;
  best_zone: string;
  best_tf: string;
  liq_boosts: number;
  latency: number;
}
