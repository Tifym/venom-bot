export function calculateWR(data: any[], period: number) {
    if (data.length < period) return [];
    
    return data.map((d, i) => {
        if (i < period - 1) return { time: d.time, value: 0 };
        
        const slice = data.slice(i - period + 1, i + 1);
        const highestHigh = Math.max(...slice.map(o => o.high));
        const lowestLow = Math.min(...slice.map(o => o.low));
        
        const wr = ((highestHigh - d.close) / (highestHigh - lowestLow)) * -100;
        return { time: d.time, value: wr };
    });
}

export function calculateKDJ(data: any[], n = 9, m1 = 3, m2 = 3) {
    if (data.length < n) return { k: [], d: [], j: [] };

    let kValues: any[] = [];
    let dValues: any[] = [];
    let jValues: any[] = [];

    let lastK = 50;
    let lastD = 50;

    data.forEach((d, i) => {
        if (i < n - 1) {
            kValues.push({ time: d.time, value: 50 });
            dValues.push({ time: d.time, value: 50 });
            jValues.push({ time: d.time, value: 50 });
            return;
        }

        const slice = data.slice(i - n + 1, i + 1);
        const lowN = Math.min(...slice.map(o => o.low));
        const highN = Math.max(...slice.map(o => o.high));
        
        const rsv = highN === lowN ? 0 : ((d.close - lowN) / (highN - lowN)) * 100;
        
        const k = (2 / 3) * lastK + (1 / 3) * rsv;
        const d_val = (2 / 3) * lastD + (1 / 3) * k;
        const j = 3 * k - 2 * d_val;

        kValues.push({ time: d.time, value: k });
        dValues.push({ time: d.time, value: d_val });
        jValues.push({ time: d.time, value: j });

        lastK = k;
        lastD = d_val;
    });

    return { k: kValues, d: dValues, j: jValues };
}

export function calculateMACD(data: any[], fast = 12, slow = 26, signal = 9) {
    // Basic EMA helper
    const calculateEMA = (values: number[], period: number) => {
        const k = 2 / (period + 1);
        let ema = [values[0]];
        for (let i = 1; i < values.length; i++) {
            ema.push(values[i] * k + ema[i - 1] * (1 - k));
        }
        return ema;
    };

    const closes = data.map(d => d.close);
    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);
    
    const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
    const signalLine = calculateEMA(macdLine, signal);
    const histogram = macdLine.map((m, i) => m - signalLine[i]);

    return {
        macd: data.map((d, i) => ({ time: d.time, value: macdLine[i] })),
        signal: data.map((d, i) => ({ time: d.time, value: signalLine[i] })),
        histogram: data.map((d, i) => ({ 
            time: d.time, 
            value: histogram[i],
            color: histogram[i] >= 0 ? '#00FF41' : '#FF0040' 
        }))
    };
}

export function calculatePivots(data: any[], window = 10) {
    if (data.length < window * 2 + 1) return [];
    
    const pivots: number[] = [];
    for (let i = window; i < data.length - window; i++) {
        const slice = data.slice(i - window, i + window + 1);
        const high = data[i].high;
        const low = data[i].low;
        
        // Pivot High
        if (high === Math.max(...slice.map(d => d.high))) {
            pivots.push(high);
        }
        // Pivot Low
        if (low === Math.min(...slice.map(d => d.low))) {
            pivots.push(low);
        }
    }
    
    // De-duplicate and keep only recent/relevant ones
    return [...new Set(pivots)].slice(-10);
}
