import React, { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import SignalGrid from './components/SignalGrid';
import ChartPanel from './components/ChartPanel';
import SignalFeed from './components/SignalFeed';
import PositionPanel from './components/PositionPanel';

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

const App = () => {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const { states, isConnected } = useSocket(selectedPair);

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1 style={{ color: '#00c853' }}>VENOMTRADEBOT</h1>
        <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)}>
          {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </header>
      <main style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SignalGrid states={states} />
          <ChartPanel pair={selectedPair} timeframe="1H" />
        </div>
        <SignalFeed />
      </main>
      <PositionPanel />
    </div>
  );
};
export default App;
