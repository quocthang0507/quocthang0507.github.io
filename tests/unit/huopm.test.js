/**
 * Tests for the HUOPM (High Utility Occupancy Pattern Mining) algorithm.
 *
 * Definitions from the paper:
 *   "Mining High Utility Occupancy Patterns from Transactional Databases"
 *   https://arxiv.org/pdf/1812.10926
 *
 * Key definitions verified by these tests:
 *   u(i, T)  = q(i, T) × p(i)                       (item utility in a transaction)
 *   tu(T)    = Σ u(i, T) for all i ∈ T              (transaction utility)
 *   u(X, T)  = Σ u(i, T) for i ∈ X                  (itemset utility in a transaction)
 *   u(X)     = Σ u(X, T) for T ∈ g(X)               (itemset utility in the database)
 *   o(X, T)  = |X| / |T|        (occupancy of X in T, since X ⊆ T implies |X∩T|=|X|)
 *   o(X)     = (Σ o(X,T) for T ∈ g(X)) / |g(X)|    (average occupancy in the database)
 *   twu(i)   = Σ tu(T) for T containing i           (transaction-weighted utility)
 *   HUOP: X such that u(X) >= minUtil AND o(X) >= minOcc
 */

const {
    huopm,
    parseDatabase,
    transactionUtility,
    itemsetUtility,
    itemsetOccupancy,
    itemsetOccupancyInTransaction,
    computeTWU,
    itemsetTWU,
} = require('../../assets/js/huopm.js');

// ---------------------------------------------------------------------------
// Example database used across all tests
//
//  T1: { A:2, B:3, C:1 }   |T1| = 3 distinct items
//  T2: { A:1, B:1 }         |T2| = 2 distinct items
//  T3: { B:2, C:3 }         |T3| = 2 distinct items
//  T4: { A:1, C:2, D:1 }   |T4| = 3 distinct items
//
//  Profit table: A=4, B=2, C=3, D=1
//
//  Transaction utilities:
//    tu(T1) = 2×4 + 3×2 + 1×3 = 8+6+3 = 17
//    tu(T2) = 1×4 + 1×2       = 4+2   =  6
//    tu(T3) = 2×2 + 3×3       = 4+9   = 13
//    tu(T4) = 1×4 + 2×3 + 1×1 = 4+6+1 = 11
//
//  TWU of individual items:
//    twu(A) = tu(T1)+tu(T2)+tu(T4) = 17+6+11 = 34
//    twu(B) = tu(T1)+tu(T2)+tu(T3) = 17+6+13 = 36
//    twu(C) = tu(T1)+tu(T3)+tu(T4) = 17+13+11 = 41
//    twu(D) = tu(T4)               = 11
//
//  Individual item utilities:
//    u(A) = T1:8 + T2:4 + T4:4 = 16
//    u(B) = T1:6 + T2:2 + T3:4 = 12
//    u(C) = T1:3 + T3:9 + T4:6 = 18
//    u(D) = T4:1               =  1
//
//  Individual item average occupancy (|X|=1):
//    o(A) = (1/3 + 1/2 + 1/3) / 3 = (7/6) / 3 = 7/18 ≈ 0.3889
//    o(B) = (1/3 + 1/2 + 1/2) / 3 = (8/6) / 3 = 8/18 = 4/9 ≈ 0.4444
//    o(C) = (1/3 + 1/2 + 1/3) / 3 = (7/6) / 3 = 7/18 ≈ 0.3889
//    o(D) = (1/3) / 1             = 1/3         ≈ 0.3333
//
//  Selected 2-itemset values (minUtil=12, minOcc=0.4):
//    u({A,B}) = T1:14 + T2:6 = 20;  o({A,B}) = (2/3 + 2/2)/2 = 5/6 ≈ 0.8333
//    u({A,C}) = T1:11 + T4:10 = 21; o({A,C}) = (2/3 + 2/3)/2 = 2/3 ≈ 0.6667
//    u({B,C}) = T1:9  + T3:13 = 22; o({B,C}) = (2/3 + 2/2)/2 = 5/6 ≈ 0.8333
//    u({A,D}) = T4:5           =  5; (below minUtil)
//    u({B,D}) = none           =  0;
//    u({C,D}) = T4:7           =  7; (below minUtil)
//
//  3-itemset:
//    u({A,B,C}) = T1:17; o({A,B,C}) = 3/3 = 1.0
//
//  HUOPs with minUtil=12, minOcc=0.4:
//    {B}       u=12, o=4/9≈0.444
//    {A,B}     u=20, o=5/6≈0.833
//    {A,C}     u=21, o=2/3≈0.667
//    {B,C}     u=22, o=5/6≈0.833
//    {A,B,C}   u=17, o=1.0
// ---------------------------------------------------------------------------

const RAW_DB = [
    { A: 2, B: 3, C: 1 },
    { A: 1, B: 1 },
    { B: 2, C: 3 },
    { A: 1, C: 2, D: 1 },
];

const PROFIT = { A: 4, B: 2, C: 3, D: 1 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sort patterns lexicographically so test assertions are order-independent. */
function sortPatterns(patterns) {
    return patterns
        .map(p => ({ ...p, itemset: p.itemset.slice().sort() }))
        .sort((a, b) => a.itemset.join(',').localeCompare(b.itemset.join(',')));
}

// ---------------------------------------------------------------------------
// parseDatabase
// ---------------------------------------------------------------------------

describe('parseDatabase', () => {
    it('converts plain objects to Maps', () => {
        const db = parseDatabase([{ A: 2, B: 3 }]);
        expect(db).toHaveLength(1);
        expect(db[0]).toBeInstanceOf(Map);
        expect(db[0].get('A')).toBe(2);
        expect(db[0].get('B')).toBe(3);
    });

    it('records the correct number of items per transaction', () => {
        const db = parseDatabase(RAW_DB);
        expect(db[0].size).toBe(3); // T1: A, B, C
        expect(db[1].size).toBe(2); // T2: A, B
        expect(db[2].size).toBe(2); // T3: B, C
        expect(db[3].size).toBe(3); // T4: A, C, D
    });
});

// ---------------------------------------------------------------------------
// transactionUtility
// ---------------------------------------------------------------------------

describe('transactionUtility', () => {
    const db = parseDatabase(RAW_DB);

    it('computes tu(T1) = 17', () => {
        expect(transactionUtility(db[0], PROFIT)).toBe(17);
    });

    it('computes tu(T2) = 6', () => {
        expect(transactionUtility(db[1], PROFIT)).toBe(6);
    });

    it('computes tu(T3) = 13', () => {
        expect(transactionUtility(db[2], PROFIT)).toBe(13);
    });

    it('computes tu(T4) = 11', () => {
        expect(transactionUtility(db[3], PROFIT)).toBe(11);
    });
});

// ---------------------------------------------------------------------------
// computeTWU
// ---------------------------------------------------------------------------

describe('computeTWU', () => {
    it('computes twu for each item correctly', () => {
        const db = parseDatabase(RAW_DB);
        const twu = computeTWU(db, PROFIT);
        expect(twu['A']).toBe(34); // T1+T2+T4 = 17+6+11
        expect(twu['B']).toBe(36); // T1+T2+T3 = 17+6+13
        expect(twu['C']).toBe(41); // T1+T3+T4 = 17+13+11
        expect(twu['D']).toBe(11); // T4       = 11
    });
});

// ---------------------------------------------------------------------------
// itemsetTWU
// ---------------------------------------------------------------------------

describe('itemsetTWU', () => {
    const db = parseDatabase(RAW_DB);

    it('itemsetTWU({A}) = 34 (T1+T2+T4)', () => {
        expect(itemsetTWU(['A'], db, PROFIT)).toBe(34);
    });

    it('itemsetTWU({A,B}) = 23 (T1+T2)', () => {
        expect(itemsetTWU(['A', 'B'], db, PROFIT)).toBe(23);
    });

    it('itemsetTWU({A,B,C}) = 17 (only T1 contains all three)', () => {
        expect(itemsetTWU(['A', 'B', 'C'], db, PROFIT)).toBe(17);
    });

    it('itemsetTWU({B,D}) = 0 (no transaction contains both B and D)', () => {
        expect(itemsetTWU(['B', 'D'], db, PROFIT)).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// itemsetUtility
// ---------------------------------------------------------------------------

describe('itemsetUtility', () => {
    const db = parseDatabase(RAW_DB);

    it('u({A}) = 16', () => {
        expect(itemsetUtility(['A'], db, PROFIT)).toBe(16);
    });

    it('u({B}) = 12', () => {
        expect(itemsetUtility(['B'], db, PROFIT)).toBe(12);
    });

    it('u({C}) = 18', () => {
        expect(itemsetUtility(['C'], db, PROFIT)).toBe(18);
    });

    it('u({D}) = 1', () => {
        expect(itemsetUtility(['D'], db, PROFIT)).toBe(1);
    });

    it('u({A,B}) = 20 (T1:14 + T2:6)', () => {
        expect(itemsetUtility(['A', 'B'], db, PROFIT)).toBe(20);
    });

    it('u({A,C}) = 21 (T1:11 + T4:10)', () => {
        expect(itemsetUtility(['A', 'C'], db, PROFIT)).toBe(21);
    });

    it('u({B,C}) = 22 (T1:9 + T3:13)', () => {
        expect(itemsetUtility(['B', 'C'], db, PROFIT)).toBe(22);
    });

    it('u({A,D}) = 5 (T4 only: 4+1)', () => {
        expect(itemsetUtility(['A', 'D'], db, PROFIT)).toBe(5);
    });

    it('u({B,D}) = 0 (no shared transaction)', () => {
        expect(itemsetUtility(['B', 'D'], db, PROFIT)).toBe(0);
    });

    it('u({A,B,C}) = 17 (T1 only)', () => {
        expect(itemsetUtility(['A', 'B', 'C'], db, PROFIT)).toBe(17);
    });
});

// ---------------------------------------------------------------------------
// itemsetOccupancyInTransaction
// ---------------------------------------------------------------------------

describe('itemsetOccupancyInTransaction', () => {
    const db = parseDatabase(RAW_DB);

    it('o({A}, T1) = 1/3  (1 item in a 3-item transaction)', () => {
        expect(itemsetOccupancyInTransaction(['A'], db[0])).toBeCloseTo(1 / 3, 10);
    });

    it('o({A,B}, T1) = 2/3  (2 items in a 3-item transaction)', () => {
        expect(itemsetOccupancyInTransaction(['A', 'B'], db[0])).toBeCloseTo(2 / 3, 10);
    });

    it('o({A,B}, T2) = 1.0  (2 items in a 2-item transaction)', () => {
        expect(itemsetOccupancyInTransaction(['A', 'B'], db[1])).toBe(1.0);
    });

    it('o({A,B,C}, T1) = 1.0  (3 items in a 3-item transaction)', () => {
        expect(itemsetOccupancyInTransaction(['A', 'B', 'C'], db[0])).toBe(1.0);
    });
});

// ---------------------------------------------------------------------------
// itemsetOccupancy
// ---------------------------------------------------------------------------

describe('itemsetOccupancy', () => {
    const db = parseDatabase(RAW_DB);

    // o(A): T1=1/3, T2=1/2, T4=1/3  →  (1/3+1/2+1/3)/3 = (7/6)/3 = 7/18
    it('o({A}) ≈ 7/18', () => {
        expect(itemsetOccupancy(['A'], db)).toBeCloseTo(7 / 18, 10);
    });

    // o(B): T1=1/3, T2=1/2, T3=1/2  →  (1/3+1/2+1/2)/3 = (8/6)/3 = 4/9
    it('o({B}) ≈ 4/9', () => {
        expect(itemsetOccupancy(['B'], db)).toBeCloseTo(4 / 9, 10);
    });

    // o(C): T1=1/3, T3=1/2, T4=1/3  →  (1/3+1/2+1/3)/3 = 7/18
    it('o({C}) ≈ 7/18', () => {
        expect(itemsetOccupancy(['C'], db)).toBeCloseTo(7 / 18, 10);
    });

    // o(D): T4=1/3  →  1/3
    it('o({D}) ≈ 1/3', () => {
        expect(itemsetOccupancy(['D'], db)).toBeCloseTo(1 / 3, 10);
    });

    // o({A,B}): T1=2/3, T2=2/2=1  →  (2/3+1)/2 = 5/6
    it('o({A,B}) ≈ 5/6', () => {
        expect(itemsetOccupancy(['A', 'B'], db)).toBeCloseTo(5 / 6, 10);
    });

    // o({A,C}): T1=2/3, T4=2/3  →  (2/3+2/3)/2 = 2/3
    it('o({A,C}) ≈ 2/3', () => {
        expect(itemsetOccupancy(['A', 'C'], db)).toBeCloseTo(2 / 3, 10);
    });

    // o({B,C}): T1=2/3, T3=2/2=1  →  (2/3+1)/2 = 5/6
    it('o({B,C}) ≈ 5/6', () => {
        expect(itemsetOccupancy(['B', 'C'], db)).toBeCloseTo(5 / 6, 10);
    });

    // o({A,B,C}): only T1, |{A,B,C}|/|T1| = 3/3 = 1
    it('o({A,B,C}) = 1.0', () => {
        expect(itemsetOccupancy(['A', 'B', 'C'], db)).toBe(1.0);
    });

    it('returns 0 for an itemset not present in any transaction', () => {
        expect(itemsetOccupancy(['A', 'B', 'D'], db)).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// huopm — full algorithm
// ---------------------------------------------------------------------------

describe('huopm', () => {
    it('returns an empty array when no patterns meet the thresholds', () => {
        // minUtil=100 is far above any attainable utility in this database
        const result = huopm(RAW_DB, PROFIT, 100, 0.1);
        expect(result).toHaveLength(0);
    });

    it('finds every HUOP with minUtil=12, minOcc=0.4', () => {
        const result = sortPatterns(huopm(RAW_DB, PROFIT, 12, 0.4));

        // Expected HUOPs: {B}, {A,B}, {A,C}, {B,C}, {A,B,C}
        const expected = sortPatterns([
            { itemset: ['B'],       utility: 12, occupancy: 4 / 9 },
            { itemset: ['A', 'B'],  utility: 20, occupancy: 5 / 6 },
            { itemset: ['A', 'C'],  utility: 21, occupancy: 2 / 3 },
            { itemset: ['B', 'C'],  utility: 22, occupancy: 5 / 6 },
            { itemset: ['A', 'B', 'C'], utility: 17, occupancy: 1.0 },
        ]);

        expect(result).toHaveLength(expected.length);
        for (let i = 0; i < expected.length; i++) {
            expect(result[i].itemset).toEqual(expected[i].itemset);
            expect(result[i].utility).toBe(expected[i].utility);
            expect(result[i].occupancy).toBeCloseTo(expected[i].occupancy, 10);
        }
    });

    it('finds more patterns when only the utility threshold is relaxed (minUtil=6)', () => {
        // With lower minUtil, additional single items {A} and {C} qualify because
        // their TWUs allow them through, but their occupancy (≈0.389) is below 0.4.
        // Lowering minOcc to 0.3 as well should admit {A}, {C}, and {D}.
        const result = sortPatterns(huopm(RAW_DB, PROFIT, 6, 0.3));
        const itemsets = result.map(p => p.itemset.join(','));

        // All single items have utility >= 6 (A=16, B=12, C=18, D=1 — D=1<6 so excluded)
        // and occupancy >= 0.3 (all single items satisfy this with minOcc=0.3).
        expect(itemsets).toContain('A');
        expect(itemsets).toContain('B');
        expect(itemsets).toContain('C');
        // D has u=1 < 6; also twu(D)=11 >= 6 so it is not pruned by TWU,
        // but its actual utility 1 < 6, so it must not appear.
        expect(itemsets).not.toContain('D');
    });

    it('applies TWU pruning: item D (twu=11) is excluded when minUtil=12', () => {
        // When minUtil=12, twu(D)=11 < 12, so D and any pattern containing D
        // must be absent from the results regardless of occupancy.
        const result = huopm(RAW_DB, PROFIT, 12, 0.0);
        const containsD = result.some(p => p.itemset.includes('D'));
        expect(containsD).toBe(false);
    });

    it('each reported pattern satisfies both the utility and occupancy thresholds', () => {
        const minUtil = 10;
        const minOcc  = 0.35;
        const result = huopm(RAW_DB, PROFIT, minUtil, minOcc);
        for (const p of result) {
            expect(p.utility).toBeGreaterThanOrEqual(minUtil);
            expect(p.occupancy).toBeGreaterThanOrEqual(minOcc);
        }
    });

    it('handles an empty database gracefully', () => {
        expect(huopm([], PROFIT, 10, 0.5)).toEqual([]);
    });

    it('handles a single-item transaction database', () => {
        const result = huopm([{ X: 3 }], { X: 5 }, 10, 0.5);
        expect(result).toHaveLength(1);
        expect(result[0].itemset).toEqual(['X']);
        expect(result[0].utility).toBe(15);
        expect(result[0].occupancy).toBe(1.0);
    });

    it('handles a single transaction with multiple items', () => {
        // One transaction: {P:1, Q:2}; profit P=3, Q=4
        // tu = 3+8 = 11; u({P})=3, u({Q})=8, u({P,Q})=11
        // o({P})=1/2, o({Q})=1/2, o({P,Q})=2/2=1
        const result = sortPatterns(huopm([{ P: 1, Q: 2 }], { P: 3, Q: 4 }, 3, 0.4));
        const itemsets = result.map(p => p.itemset.join(','));
        expect(itemsets).toContain('P');
        expect(itemsets).toContain('Q');
        expect(itemsets).toContain('P,Q');
    });
});
