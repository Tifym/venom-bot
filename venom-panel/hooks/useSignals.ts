import { useState, useEffect } from 'react';

export function useSignals() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals?limit=20');
        if (res.ok) {
          const data = await res.json();
          // API returns { signals: [...] } — extract the array
          setSignals(Array.isArray(data) ? data : (data.signals ?? []));
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    // Live signals are appended via WebSocket handler in page.tsx
  }, []);

  return { signals, setSignals, loading };
}
