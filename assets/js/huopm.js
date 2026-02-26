// HUOPM - High Utility Occupancy Pattern Mining
// Reference: "Mining High Utility Occupancy Patterns from Transactional Databases"
// https://arxiv.org/pdf/1812.10926

/**
 * Parse a raw database (array of plain objects) into internal Map-based format.
 *
 * @param {Array<Object.<string,number>>} rawDatabase
 *   Each element is a transaction object mapping item names to positive quantities.
 *   Example: [{ A: 2, B: 3 }, { A: 1, C: 2 }]
 * @returns {Array<Map<string,number>>} Parsed transactions.
 */
function parseDatabase(rawDatabase) {
    return rawDatabase.map(function(transaction) {
        var map = new Map();
        for (var item in transaction) {
            if (Object.prototype.hasOwnProperty.call(transaction, item)) {
                map.set(item, transaction[item]);
            }
        }
        return map;
    });
}

/**
 * Compute the transaction utility of a single transaction.
 * tu(T) = Σ q(i, T) × p(i)  for all i ∈ T
 *
 * @param {Map<string,number>} transaction
 * @param {Object.<string,number>} profitTable
 * @returns {number}
 */
function transactionUtility(transaction, profitTable) {
    var total = 0;
    transaction.forEach(function(qty, item) {
        total += qty * (profitTable[item] || 0);
    });
    return total;
}

/**
 * Compute the utility of an itemset X inside one transaction T.
 * u(X, T) = Σ q(i, T) × p(i)  for i ∈ X
 * Assumes X ⊆ T (every item in X must be present in T).
 *
 * @param {string[]} itemset
 * @param {Map<string,number>} transaction
 * @param {Object.<string,number>} profitTable
 * @returns {number}
 */
function itemsetUtilityInTransaction(itemset, transaction, profitTable) {
    var total = 0;
    for (var k = 0; k < itemset.length; k++) {
        var item = itemset[k];
        total += (transaction.get(item) || 0) * (profitTable[item] || 0);
    }
    return total;
}

/**
 * Compute the utility of an itemset X across the entire database.
 * u(X) = Σ u(X, T)  for T ∈ g(X)
 * where g(X) = { T | X ⊆ T }
 *
 * @param {string[]} itemset
 * @param {Array<Map<string,number>>} database
 * @param {Object.<string,number>} profitTable
 * @returns {number}
 */
function itemsetUtility(itemset, database, profitTable) {
    var total = 0;
    for (var t = 0; t < database.length; t++) {
        var transaction = database[t];
        var contained = true;
        for (var k = 0; k < itemset.length; k++) {
            if (!transaction.has(itemset[k])) { contained = false; break; }
        }
        if (contained) {
            total += itemsetUtilityInTransaction(itemset, transaction, profitTable);
        }
    }
    return total;
}

/**
 * Compute the occupancy of an itemset X in a single transaction T.
 * o(X, T) = |X| / |T|
 * (Since X ⊆ T, |X ∩ T| = |X|.)
 *
 * @param {string[]} itemset
 * @param {Map<string,number>} transaction
 * @returns {number}
 */
function itemsetOccupancyInTransaction(itemset, transaction) {
    return itemset.length / transaction.size;
}

/**
 * Compute the average occupancy of an itemset X across all transactions that contain it.
 * o(X) = (Σ o(X, T)  for T ∈ g(X)) / |g(X)|
 *
 * @param {string[]} itemset
 * @param {Array<Map<string,number>>} database
 * @returns {number}
 */
function itemsetOccupancy(itemset, database) {
    var count = 0;
    var totalOcc = 0;
    for (var t = 0; t < database.length; t++) {
        var transaction = database[t];
        var contained = true;
        for (var k = 0; k < itemset.length; k++) {
            if (!transaction.has(itemset[k])) { contained = false; break; }
        }
        if (contained) {
            count++;
            totalOcc += itemsetOccupancyInTransaction(itemset, transaction);
        }
    }
    return count === 0 ? 0 : totalOcc / count;
}

/**
 * Compute the Transaction Weighted Utility (TWU) for each individual item.
 * twu(i) = Σ tu(T)  for all T containing i
 *
 * TWU is an upper bound on the utility of any itemset containing i.
 * Any itemset with twu(i) < minUtil can be safely pruned.
 *
 * @param {Array<Map<string,number>>} database
 * @param {Object.<string,number>} profitTable
 * @returns {Object.<string,number>}
 */
function computeTWU(database, profitTable) {
    var twu = {};
    for (var t = 0; t < database.length; t++) {
        var transaction = database[t];
        var tu = transactionUtility(transaction, profitTable);
        transaction.forEach(function(qty, item) {
            twu[item] = (twu[item] || 0) + tu;
        });
    }
    return twu;
}

/**
 * Compute the TWU of an itemset X (sum of tu(T) for transactions containing X).
 * Used as an upper bound on utility during the depth-first search.
 *
 * @param {string[]} itemset
 * @param {Array<Map<string,number>>} database
 * @param {Object.<string,number>} profitTable
 * @returns {number}
 */
function itemsetTWU(itemset, database, profitTable) {
    var total = 0;
    for (var t = 0; t < database.length; t++) {
        var transaction = database[t];
        var contained = true;
        for (var k = 0; k < itemset.length; k++) {
            if (!transaction.has(itemset[k])) { contained = false; break; }
        }
        if (contained) {
            total += transactionUtility(transaction, profitTable);
        }
    }
    return total;
}

/**
 * HUOPM: Mine High Utility Occupancy Patterns.
 *
 * A pattern X is a High Utility Occupancy Pattern (HUOP) if and only if:
 *   u(X) >= minUtil   (its utility meets the minimum utility threshold), AND
 *   o(X) >= minOcc    (its average occupancy meets the minimum occupancy threshold).
 *
 * The algorithm performs a depth-first search over the itemset lattice and
 * uses TWU-based upper-bound pruning (Theorem 1 from the paper) to avoid
 * exploring branches that cannot yield any HUOP.
 *
 * @param {Array<Object.<string,number>>} rawDatabase
 *   Array of transactions; each transaction maps item names to purchase quantities.
 *   Example: [{ A: 2, B: 3, C: 1 }, { A: 1, B: 1 }]
 * @param {Object.<string,number>} profitTable
 *   Maps each item name to its external profit (unit utility).
 *   Example: { A: 4, B: 2, C: 3 }
 * @param {number} minUtil - Minimum utility threshold (positive number).
 * @param {number} minOcc  - Minimum occupancy threshold (float in [0, 1]).
 * @returns {Array.<{itemset: string[], utility: number, occupancy: number}>}
 *   All discovered High Utility Occupancy Patterns.
 */
function huopm(rawDatabase, profitTable, minUtil, minOcc) {
    var database = parseDatabase(rawDatabase);
    var patterns = [];

    // Step 1: Compute TWU for each single item.
    var twu = computeTWU(database, profitTable);

    // Step 2: Discard items whose TWU < minUtil (utility-pruning, Theorem 1).
    // Any itemset containing such an item cannot be a HUOP.
    var candidates = Object.keys(twu)
        .filter(function(item) { return twu[item] >= minUtil; })
        .sort(function(a, b) { return twu[a] - twu[b]; }); // ascending TWU order

    // Step 3: Depth-first search over subsets of the candidate items.
    function search(prefix, remaining) {
        for (var i = 0; i < remaining.length; i++) {
            var itemset = prefix.concat([remaining[i]]);

            // TWU of this itemset is an upper bound on u(X) for X and all its supersets.
            // If it is below minUtil, prune this branch entirely (Theorem 1).
            var twuBound = itemsetTWU(itemset, database, profitTable);
            if (twuBound < minUtil) {
                continue;
            }

            // Compute the actual utility and occupancy of this itemset.
            var utility = itemsetUtility(itemset, database, profitTable);
            var occupancy = itemsetOccupancy(itemset, database);

            // Output the pattern if both thresholds are satisfied.
            if (utility >= minUtil && occupancy >= minOcc) {
                patterns.push({ itemset: itemset.slice(), utility: utility, occupancy: occupancy });
            }

            // Recursively extend with items that come after remaining[i].
            search(itemset, remaining.slice(i + 1));
        }
    }

    search([], candidates);

    return patterns;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        huopm,
        parseDatabase,
        transactionUtility,
        itemsetUtility,
        itemsetOccupancy,
        itemsetOccupancyInTransaction,
        computeTWU,
        itemsetTWU,
    };
}
