import React from 'react';
const Box = ({ l, s }) => <div className={`box ${s || 'NEUTRAL'}`}>{l}</div>;
const Row = ({ l, tfs, ss, st }) => (
  <div className="row"><div className="row-label">{l}</div>
    <div className="boxes">{tfs.map(t => <Box key={t} l={t} s={ss[t]?ss[t][st]:'NEUTRAL'}/>)}</div>
  </div>
);
const SignalGrid = ({ states }) => {
  const alfas = ['1D', '4H', '3H', '2H', '1H', '24m', '12m', '6m', '3m', '1m'];
  const others = ['1H', '24m', '12m', '6m', '3m', '1m'];
  return (
    <div className="signal-grid">
      <Row l="ALFA" tfs={alfas} ss={states} st="alfa" />
      <Row l="BETA" tfs={others} ss={states} st="beta" />
      <Row l="DELTA" tfs={others} ss={states} st="delta" />
      <Row l="GAMMA" tfs={others} ss={states} st="gamma" />
    </div>
  );
};
export default SignalGrid;
