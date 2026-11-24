const fs = require('fs');
const path = require('path');

const VCB_XML_URL = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx';
const VCB_JSON_URL = 'https://www.vietcombank.com.vn/api/exchangerates?date=';
const HISTORY_FILE_PATH = path.join(process.cwd(), 'assets', 'data', 'rates-history.json');

// List of fallback CORS proxies + direct fetch
const fetchSources = [
    { name: 'Direct VCB XML', url: VCB_XML_URL, type: 'xml' },
    { name: 'Direct VCB JSON', url: VCB_JSON_URL, type: 'json' },
    { name: 'Allorigins Raw', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(VCB_XML_URL)}`, type: 'xml' },
    { name: 'Codetabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(VCB_XML_URL)}`, type: 'xml' }
];

const parseVal = (val) => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str || str === '-' || str === '0') return null;
    const parsed = parseFloat(str.replace(/,/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

async function fetchCurrentRates() {
    let lastError = null;
    for (const source of fetchSources) {
        try {
            console.log(`Fetching from source: ${source.name} (${source.url})`);
            const response = await fetch(source.url, { signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error(`HTTP Status ${response.status}`);

            if (source.type === 'json') {
                const json = await response.json();
                if (json && Array.isArray(json.Data) && json.Data.length > 0) {
                    const rates = {};
                    json.Data.forEach(item => {
                        const code = (item.currencyCode || '').trim().toUpperCase();
                        if (!code) return;
                        rates[code] = {
                            buyCash: parseVal(item.cash),
                            buyTransfer: parseVal(item.transfer),
                            sell: parseVal(item.sell)
                        };
                    });
                    if (Object.keys(rates).length > 0) {
                        console.log(`Successfully fetched JSON from: ${source.name}`);
                        return rates;
                    }
                }
            } else {
                const text = await response.text();
                if (text && text.includes('ExrateList')) {
                    console.log(`Successfully fetched XML from: ${source.name}`);
                    return parseRatesXML(text);
                }
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

async function main() {
    try {
        const currentRates = await fetchCurrentRates();
        
        if (Object.keys(currentRates).length === 0) {
            throw new Error('Failed to parse any rates');
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
        
        // Never synthesize past data: an empty history simply starts from today.
        // Use scripts/backfill-rates-history.js to fetch real rates for past dates.
        
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

if (require.main === module) {
    main();
}

module.exports = { parseVal, HISTORY_FILE_PATH, VCB_JSON_URL };
