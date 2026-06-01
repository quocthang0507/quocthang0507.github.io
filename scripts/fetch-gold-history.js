const fs = require('fs');
const path = require('path');

const VNEXPRESS_GOLD_URL = 'https://gw.vnexpress.net/cr/?name=tygia_vangv202206';
const HISTORY_FILE_PATH = path.join(process.cwd(), 'assets', 'data', 'gold-history.json');

// Fallback sources
const fetchSources = [
    { name: 'Direct VnExpress', url: VNEXPRESS_GOLD_URL },
    { name: 'Corsproxy.io', url: `https://corsproxy.io/?url=${encodeURIComponent(VNEXPRESS_GOLD_URL)}` },
    { name: 'Codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(VNEXPRESS_GOLD_URL)}` },
    { name: 'Allorigins Raw', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(VNEXPRESS_GOLD_URL)}` }
];

async function fetchGoldData() {
    let lastError = null;
    for (const source of fetchSources) {
        try {
            console.log(`Fetching from source: ${source.name} (${source.url})`);
            const response = await fetch(source.url, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
            
            const json = await response.json();
            // Verify structure
            if (json && json.code === 200 && json.data && json.data.data && json.data.data.gold) {
                console.log(`Successfully fetched and validated Gold JSON from: ${source.name}`);
                return json.data.data.gold.new;
            }
        } catch (err) {
            console.warn(`Source ${source.name} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError || new Error('All fetch sources failed');
}

function generateMockHistory(baseRates) {
    console.log('Initializing gold-history.json with 365 days of random walk simulation...');
    const history = [];
    let currentDate = new Date();
    
    // Create a deep copy of current rates
    const currentRates = JSON.parse(JSON.stringify(baseRates));
    
    for (let i = 0; i < 365; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        const dayRates = {};
        for (const [code, rateInfo] of Object.entries(currentRates)) {
            dayRates[code] = {
                buy: rateInfo.buy,
                sell: rateInfo.sell,
                label: rateInfo.label
            };
            
            // Random walk factor: daily deviation of up to 0.3% (factor between 0.997 and 1.003)
            const factor = 1 + (Math.random() - 0.5) * 0.006;
            if (currentRates[code].buy) currentRates[code].buy = Math.round(currentRates[code].buy * factor);
            if (currentRates[code].sell) currentRates[code].sell = Math.round(currentRates[code].sell * factor);
        }
        
        history.push({
            date: dateKey,
            rates: dayRates
        });
        
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return history.reverse(); // Chronological order
}

async function main() {
    try {
        const currentGold = await fetchGoldData();
        
        if (Object.keys(currentGold).length === 0) {
            throw new Error('Failed to parse any gold prices from JSON');
        }
        
        console.log(`Parsed ${Object.keys(currentGold).length} gold types successfully.`);
        
        // Ensure assets/data directory exists
        const dataDir = path.dirname(HISTORY_FILE_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        let history = [];
        if (fs.existsSync(HISTORY_FILE_PATH)) {
            try {
                const fileData = fs.readFileSync(HISTORY_FILE_PATH, 'utf8');
                history = JSON.parse(fileData);
                console.log(`Loaded existing history with ${history.length} records.`);
            } catch (err) {
                console.warn('Failed to parse existing history file, resetting...', err.message);
            }
        }
        
        if (history.length === 0) {
            // Initialize with 1 year mock random walk history
            history = generateMockHistory(currentGold);
        }
        
        // Today's date YYYY-MM-DD
        const todayDate = new Date().toISOString().split('T')[0];
        
        // Check if today is already in history, update or append
        const existingIndex = history.findIndex(item => item.date === todayDate);
        if (existingIndex !== -1) {
            history[existingIndex].rates = currentGold;
            console.log(`Updated today's gold prices in history (${todayDate}).`);
        } else {
            history.push({
                date: todayDate,
                rates: currentGold
            });
            console.log(`Appended today's gold prices to history (${todayDate}).`);
        }
        
        // Sort chronologically
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Cap to last 365 entries
        if (history.length > 365) {
            history = history.slice(history.length - 365);
            console.log(`Capped history length to 365 records.`);
        }
        
        fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf8');
        console.log(`Saved gold history to: ${HISTORY_FILE_PATH}`);
        console.log('Update finished successfully.');
    } catch (err) {
        console.error('Fatal error running gold price collector:', err);
        process.exit(1);
    }
}

main();
