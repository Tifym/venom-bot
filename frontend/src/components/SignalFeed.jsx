import React, { useEffect, useState } from 'react';
const SignalCard = ({ s, onA, onR }) => (
  <div style={{ background: '#222', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
    <div style={{ fontWeight: 'bold' }}>{s.pair} | {s.direction} ({Math.round(s.score * 100)}%)</div>
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <button onClick={() => onA(s.signal_id)} style={{ background: '#00c853' }}>APPROVE</button>
      <button onClick={() => onR(s.signal_id)}>REJECT</button>
    </div>
  </div>
);
const SignalFeed = () => {
  const [sigs, setSigs] = useState([]);
  useEffect(() => { fetch('/api/signals').then(res => res.json()).then(setSigs); }, []);
  return <div style={{ height: '100%', overflowY: 'auto' }}>
    {sigs.map(s => <SignalCard key={s.signal_id} s={s} onA={(id) => fetch(`/api/signals/${id}/approve`, {method:'POST'})} onR={(id) => fetch(`/api/signals/${id}/reject`, {method:'POST'})}/>)}
  </div>
};
export default SignalFeed;
