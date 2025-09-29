// Vietnamese Lunar Calendar functionality
// Based on Vietnamese lunar calendar conversion algorithms

document.addEventListener('DOMContentLoaded', function() {
    // Lunar calendar data and conversion functions
    
    // Julian Day Number calculation
    function getJulianDayNumber(day, month, year) {
        const a = Math.floor((14 - month) / 12);
        const y = year - a;
        const m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
    }
    
    // Convert from Julian Day Number to date
    function getDateFromJDN(jdn) {
        const a = jdn + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);
        
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        
        return { day, month, year };
    }
    
    // New Moon calculation (simplified)
    function getNewMoon(k) {
        const T = k / 1236.85;
        const T2 = T * T;
        const T3 = T2 * T;
        const dr = Math.PI / 180;
        
        let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
        Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
        
        const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
        const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
        const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
        
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
        C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
        C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr) + 0.0104 * Math.sin(dr * 2 * F);
        C1 = C1 - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr));
        C1 = C1 + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M));
        C1 = C1 - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr));
        C1 = C1 + 0.0005 * Math.sin(dr * (2 * Mpr + M));
        
        const deltaT = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
        
        return Jd1 + C1 - deltaT;
    }
    
    // Get lunar month info
    function getLunarMonth11(year, timeZone) {
        const off = Math.floor((getJulianDayNumber(31, 12, year) - 2415021.076998695) / 29.530588853 + 0.5);
        return getNewMoon(off) + timeZone / 24;
    }
    
    // Check if lunar year is leap year
    function isLunarLeapYear(year, timeZone) {
        const month11 = getLunarMonth11(year, timeZone);
        const month11NextYear = getLunarMonth11(year + 1, timeZone);
        return Math.round((month11NextYear - month11) / 29.530588853) === 13;
    }
    
    // Get leap month in lunar year
    function getLeapMonth(year, timeZone) {
        if (!isLunarLeapYear(year, timeZone)) return 0;
        
        const month11 = getLunarMonth11(year, timeZone);
        const month12 = getNewMoon(Math.floor((month11 - 2415021.076998695) / 29.530588853 + 0.5) + 1) + timeZone / 24;
        
        for (let i = 1; i <= 12; i++) {
            const nm = getNewMoon(Math.floor((month11 - 2415021.076998695) / 29.530588853 + 0.5) + i) + timeZone / 24;
            const solarMonth = getSolarMonth(nm);
            const nextNm = getNewMoon(Math.floor((month11 - 2415021.076998695) / 29.530588853 + 0.5) + i + 1) + timeZone / 24;
            const nextSolarMonth = getSolarMonth(nextNm);
            
            if (solarMonth === nextSolarMonth) {
                return i;
            }
        }
        return 0;
    }
    
    // Get solar month from Julian Day Number
    function getSolarMonth(jdn) {
        const date = getDateFromJDN(Math.floor(jdn + 0.5));
        return date.month;
    }
    
    // Convert solar date to lunar date
    function solarToLunar(day, month, year, timeZone = 7) {
        const jdn = getJulianDayNumber(day, month, year);
        
        // Find lunar year
        let lunarYear = year;
        const month11 = getLunarMonth11(year - 1, timeZone);
        const month11NextYear = getLunarMonth11(year, timeZone);
        
        if (jdn >= Math.floor(month11NextYear + 0.5)) {
            lunarYear = year + 1;
        } else if (jdn < Math.floor(month11 + 0.5)) {
            lunarYear = year - 1;
        }
        
        // Find lunar month and day
        const month11LunarYear = getLunarMonth11(lunarYear - 1, timeZone);
        const off = Math.floor((month11LunarYear - 2415021.076998695) / 29.530588853 + 0.5);
        const leapMonth = getLeapMonth(lunarYear, timeZone);
        
        let lunarMonth = 1;
        let isLeap = false;
        
        for (let i = 1; i <= 14; i++) {
            const nm1 = getNewMoon(off + i) + timeZone / 24;
            const nm2 = getNewMoon(off + i + 1) + timeZone / 24;
            
            if (jdn >= Math.floor(nm1 + 0.5) && jdn < Math.floor(nm2 + 0.5)) {
                if (i > leapMonth && leapMonth > 0) {
                    lunarMonth = i - 1;
                    if (i === leapMonth + 1) {
                        isLeap = true;
                    }
                } else {
                    lunarMonth = i;
                }
                
                const lunarDay = jdn - Math.floor(nm1 + 0.5) + 1;
                return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap };
            }
        }
        
        return null;
    }
    
    // Convert lunar date to solar date
    function lunarToSolar(day, month, year, isLeap = false, timeZone = 7) {
        const month11 = getLunarMonth11(year - 1, timeZone);
        const off = Math.floor((month11 - 2415021.076998695) / 29.530588853 + 0.5);
        const leapMonth = getLeapMonth(year, timeZone);
        
        let monthOffset = month;
        if (isLeap && month === leapMonth) {
            monthOffset = month + 1;
        } else if (month > leapMonth && leapMonth > 0) {
            monthOffset = month + 1;
        }
        
        const nm = getNewMoon(off + monthOffset) + timeZone / 24;
        const jdn = Math.floor(nm + 0.5) + day - 1;
        
        return getDateFromJDN(jdn);
    }
    
    // Get Vietnamese zodiac animal
    function getZodiacAnimal(year) {
        const animals = ['Tý (Chuột)', 'Sửu (Trâu)', 'Dần (Hổ)', 'Mão (Mèo)', 'Thìn (Rồng)', 'Tỵ (Rắn)', 
                        'Ngọ (Ngựa)', 'Mùi (Dê)', 'Thân (Khỉ)', 'Dậu (Gà)', 'Tuất (Chó)', 'Hợi (Heo)'];
        return animals[(year - 4) % 12];
    }
    
    // Get heavenly stems and earthly branches
    function getCanChi(year) {
        const can = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
        const chi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
        
        const canIndex = (year - 4) % 10;
        const chiIndex = (year - 4) % 12;
        
        return `${can[canIndex]} ${chi[chiIndex]}`;
    }
    
    // Get lunar month names
    function getLunarMonthName(month, isLeap = false) {
        const monthNames = ['', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];
        const leapPrefix = isLeap ? 'Nhuận ' : '';
        return `${leapPrefix}Tháng ${monthNames[month]}`;
    }
    
    // Public API
    window.LunarCalendar = {
        solarToLunar,
        lunarToSolar,
        getZodiacAnimal,
        getCanChi,
        getLunarMonthName,
        isLunarLeapYear
    };
});