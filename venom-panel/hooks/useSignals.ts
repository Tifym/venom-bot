import { useState, useEffect } from 'react';

export function useSignals() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`;
        const res = await fetch(`${apiUrl}/api/signals?limit=20`);
        if (res.ok) {
          const data = await res.json();
          setSignals(data);
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    
    // In a real implementation, we'd also listen to the WebSocket for NEW signals
    // and append them to the state. handled in the main page usually.
  }, []);

  return { signals, setSignals, loading };
}
