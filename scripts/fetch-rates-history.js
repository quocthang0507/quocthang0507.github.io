const fs = require('fs');
const path = require('path');

const VCB_XML_URL = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx';
const HISTORY_FILE_PATH = path.join(process.cwd(), 'assets', 'data', 'rates-history.json');

// List of fallback CORS proxies + direct fetch
const fetchSources = [
    { name: 'Direct VCB', url: VCB_XML_URL },
    { name: 'Corsproxy.io', url: `https://corsproxy.io/?url=${encodeURIComponent(VCB_XML_URL)}` },
    { name: 'Codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(VCB_XML_URL)}` },
    { name: 'Allorigins Raw', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(VCB_XML_URL)}` }
];

async function fetchRatesXML() {
    let lastError = null;
    for (const source of fetchSources) {
        try {
            console.log(`Fetching from source: ${source.name} (${source.url})`);
            const response = await fetch(source.url, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
            
            const text = await response.text();
            if (text && text.includes('ExrateList')) {
                console.log(`Successfully fetched XML from: ${source.name}`);
                return text;
            }
        } catch (err) {
            console.warn(`Source ${source.name} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError || new Error('All fetch sources failed');
}

function parseRatesXML(xmlString) {
    const rates = {};
    
    // Parse DateTime if available
    const dateMatch = xmlString.match(/<DateTime>([^<]+)<\/DateTime>/);
    let dateStr = dateMatch ? dateMatch[1] : '';
    console.log(`VCB XML timestamp: ${dateStr}`);
    
    // Parse Exrate elements
    const exrateBlocks = xmlString.match(/<Exrate[^>]+>/g) || [];
    
    const parseVal = (val) => {
        if (!val || val.trim() === '-' || val.trim() === '0') return null;
        return parseFloat(val.replace(/,/g, ''));
    };

    exrateBlocks.forEach(block => {
        const codeMatch = block.match(/CurrencyCode="([^"]*)"/);
        const buyMatch = block.match(/Buy="([^"]*)"/);
        const transferMatch = block.match(/Transfer="([^"]*)"/);
        const sellMatch = block.match(/Sell="([^"]*)"/);
        
        if (codeMatch) {
            const code = codeMatch[1];
            const buy = buyMatch ? buyMatch[1] : '';
            const transfer = transferMatch ? transferMatch[1] : '';
            const sell = sellMatch ? sellMatch[1] : '';
            
            rates[code] = {
                buyCash: parseVal(buy),
                buyTransfer: parseVal(transfer),
                sell: parseVal(sell)
            };
        }
    });
    
    return rates;
}

function generateMockHistory(baseRates) {
    console.log('Initializing rates-history.json with 365 days of random walk simulation...');
    const history = [];
    let currentDate = new Date();
    
    // Create a deep copy of current rates to walk backwards
    const currentRates = JSON.parse(JSON.stringify(baseRates));
    
    for (let i = 0; i < 365; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        const dayRates = {};
        for (const [code, rateInfo] of Object.entries(currentRates)) {
            dayRates[code] = {
                buyCash: rateInfo.buyCash,
                buyTransfer: rateInfo.buyTransfer,
                sell: rateInfo.sell
            };
            
            // Random walk factor: daily deviation of up to 0.15% (factor between 0.997 and 1.003)
            const factor = 1 + (Math.random() - 0.5) * 0.003;
            if (currentRates[code].buyCash) currentRates[code].buyCash = Math.round(currentRates[code].buyCash * factor * 100) / 100;
            if (currentRates[code].buyTransfer) currentRates[code].buyTransfer = Math.round(currentRates[code].buyTransfer * factor * 100) / 100;
            if (currentRates[code].sell) currentRates[code].sell = Math.round(currentRates[code].sell * factor * 100) / 100;
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
        const xmlString = await fetchRatesXML();
        const currentRates = parseRatesXML(xmlString);
        
        if (Object.keys(currentRates).length === 0) {
            throw new Error('Failed to parse any rates from XML');
        }
        
        console.log(`Parsed ${Object.keys(currentRates).length} currencies successfully.`);
        
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
            history = generateMockHistory(currentRates);
        }
        
        // Today's date YYYY-MM-DD
        const todayDate = new Date().toISOString().split('T')[0];
        
        // Check if today is already in history, update or append
        const existingIndex = history.findIndex(item => item.date === todayDate);
        if (existingIndex !== -1) {
            history[existingIndex].rates = currentRates;
            console.log(`Updated today's rates in history (${todayDate}).`);
        } else {
            history.push({
                date: todayDate,
                rates: currentRates
            });
            console.log(`Appended today's rates to history (${todayDate}).`);
        }
        
        // Sort chronologically
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Cap to last 365 entries
        if (history.length > 365) {
            history = history.slice(history.length - 365);
            console.log(`Capped history length to 365 records.`);
        }
        
        fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history, null, 2), 'utf8');
        console.log(`Saved history to: ${HISTORY_FILE_PATH}`);
        console.log('Update finished successfully.');
    } catch (err) {
        console.error('Fatal error running rate collector:', err);
        process.exit(1);
    }
}

main();
