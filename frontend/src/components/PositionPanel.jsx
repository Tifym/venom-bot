import React, { useEffect, useState } from 'react';
const PositionPanel = () => {
    const [pos, setPos] = useState([]);
    useEffect(() => { fetch('/api/positions').then(res => res.json()).then(setPos); }, []);
    return <div className="position-panel" style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
        {pos.length === 0 ? <span>NO POSITIONS</span> : pos.map(p => <div key={p.position_id}>{p.pair} | {p.direction}</div>)}
    </div>
};
export default PositionPanel;
