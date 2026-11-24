#!/usr/bin/env node

/**
 * Backfill real Vietcombank exchange rates for past dates into rates-history.json.
 *
 * Usage: node scripts/backfill-rates-history.js [--days 365] [--to YYYY-MM-DD] [--replace-all]
 *   --days         How many calendar days back from --to to cover (default 365)
 *   --to           Last date to cover (default: latest date already in the file, else today)
 *   --replace-all  Re-fetch dates that already have entries (e.g. to replace synthetic data)
 *
 * Run it from a checkout of the `data` branch, like the daily workflow does.
 */

const fs = require('fs');
const path = require('path');
const { parseVal, HISTORY_FILE_PATH, VCB_JSON_URL } = require('./fetch-rates-history');

const CONCURRENCY = 3;
const DELAY_MS = 250;
const MAX_ENTRIES = 365;

function argValue(name, fallback) {
    const index = process.argv.indexOf(name);
    return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function addDays(isoDate, delta) {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + delta);
    return date.toISOString().slice(0, 10);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRatesForDate(isoDate, attempts = 3) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await fetch(`${VCB_JSON_URL}${isoDate}`, { signal: AbortSignal.timeout(15000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (!json || !Array.isArray(json.Data) || json.Data.length === 0) throw new Error('Empty payload');

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
            if (Object.keys(rates).length === 0) throw new Error('No currencies');
            return rates;
        } catch (err) {
            if (attempt === attempts) throw err;
            await sleep(1000 * attempt);
        }
    }
}

async function main() {
    const history = fs.existsSync(HISTORY_FILE_PATH)
        ? JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, 'utf8'))
        : [];
    const byDate = new Map(history.map(entry => [entry.date, entry]));

    const days = parseInt(argValue('--days', '365'), 10);
    const latest = history.length ? history[history.length - 1].date : new Date().toISOString().slice(0, 10);
    const to = argValue('--to', latest);
    const replaceAll = process.argv.includes('--replace-all');

    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = addDays(to, -i);
        if (replaceAll || !byDate.has(date)) dates.push(date);
    }
    console.log(`Fetching ${dates.length} dates (${dates[0] || '-'} → ${dates[dates.length - 1] || '-'})...`);

    const failed = [];
    let done = 0;
    for (let i = 0; i < dates.length; i += CONCURRENCY) {
        const batch = dates.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(batch.map(date => fetchRatesForDate(date)));
        results.forEach((result, j) => {
            if (result.status === 'fulfilled' && result.value) {
                byDate.set(batch[j], { date: batch[j], rates: result.value });
            } else {
                failed.push(batch[j]);
                // Drop a stale (e.g. synthetic) entry rather than keep it when replacing
                if (replaceAll) byDate.delete(batch[j]);
            }
        });
        done += batch.length;
        if (done % 30 < CONCURRENCY) console.log(`  ${done}/${dates.length}`);
        await sleep(DELAY_MS);
    }

    let merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (merged.length > MAX_ENTRIES) merged = merged.slice(merged.length - MAX_ENTRIES);

    fs.mkdirSync(path.dirname(HISTORY_FILE_PATH), { recursive: true });
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`Saved ${merged.length} entries (${merged[0].date} → ${merged[merged.length - 1].date}).`);
    if (failed.length) {
        console.warn(`${failed.length} dates failed: ${failed.join(', ')}`);
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
