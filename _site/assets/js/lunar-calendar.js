// Vietnamese Lunar Calendar functionality
// Based on Vietnamese lunar calendar conversion algorithms by Ho Ngoc Duc

document.addEventListener('DOMContentLoaded', function() {
    const PI = Math.PI;
    
    // Julian Day Number calculation
    function jdFromDate(dd, mm, yy) {
        let a = Math.floor((14 - mm) / 12);
        let y = yy + 4800 - a;
        let m = mm + 12 * a - 3;
        let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        return jd;
    }
    
    // Convert from Julian Day Number to date
    function jdToDate(jd) {
        let a, b, c;
        if (jd > 2299160) { // After 5/10/1582, Gregorian calendar
            a = jd + 32044;
            b = Math.floor((4 * a + 3) / 146097);
            c = a - Math.floor((b * 146097) / 4);
        } else {
            b = 0;
            c = jd + 32082;
        }
        let d = Math.floor((4 * c + 3) / 1461);
        let e = c - Math.floor((1461 * d) / 4);
        let m = Math.floor((5 * e + 2) / 153);
        let day = e - Math.floor((153 * m + 2) / 5) + 1;
        let month = m + 3 - 12 * Math.floor(m / 10);
        let year = b * 100 + d - 4800 + Math.floor(m / 10);
        return { day, month, year };
    }
    
    // New Moon calculation
    function getNewMoonDay(k, timeZone) {
        let T = k / 1236.85; // Time in Julian centuries from 1900 January 0.5
        let T2 = T * T;
        let T3 = T2 * T;
        let dr = PI / 180;
        let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
        Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr); // Mean new moon
        let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3; // Sun's mean anomaly
        let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3; // Moon's mean anomaly
        let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3; // Moon's argument of latitude
        let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
        C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
        C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
        C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
        C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
        C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
        C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
        let deltat;
        if (T < -11) {
            deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
        } else {
            deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
        }
        let JdNew = Jd1 + C1 - deltat;
        return Math.floor(JdNew + 0.5 + timeZone / 24);
    }
    
    // Get sun longitude
    function getSunLongitude(jdn, timeZone) {
        let T = (jdn - 2451545.5 - timeZone / 24) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
        let T2 = T * T;
        let dr = PI / 180; // degree to radian
        let M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2; // mean anomaly, degree
        let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; // mean longitude, degree
        let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
        DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
        let L = L0 + DL; // true longitude, degree
        L = L * dr;
        L = L - PI * 2 * (Math.floor(L / (PI * 2))); // Normalize to (0, 2*PI)
        return Math.floor(L / PI * 6);
    }
    
    // Get lunar month 11
    function getLunarMonth11(yy, timeZone) {
        let off = jdFromDate(31, 12, yy) - 2415021;
        let k = Math.floor(off / 29.530588853);
        let nm = getNewMoonDay(k, timeZone);
        let sunLong = getSunLongitude(nm, timeZone); // sun longitude at local midnight
        if (sunLong >= 9) {
            nm = getNewMoonDay(k - 1, timeZone);
        }
        return nm;
    }
    
    // Get leap month offset
    function getLeapMonthOffset(a11, timeZone) {
        let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
        let last = 0;
        let i = 1; // We start with month following lunar month 11
        let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
        do {
            last = arc;
            i++;
            arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
        } while (arc != last && i < 14);
        return i - 1;
    }
    
    // Convert solar date to lunar date
    function solarToLunar(dd, mm, yy, timeZone = 7) {
        let dayNumber = jdFromDate(dd, mm, yy);
        let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
        let monthStart = getNewMoonDay(k + 1, timeZone);
        if (monthStart > dayNumber) {
            monthStart = getNewMoonDay(k, timeZone);
        }
        let a11 = getLunarMonth11(yy, timeZone);
        let b11 = a11;
        let lunarYear;
        if (a11 >= monthStart) {
            lunarYear = yy;
            a11 = getLunarMonth11(yy - 1, timeZone);
        } else {
            lunarYear = yy + 1;
            b11 = getLunarMonth11(yy + 1, timeZone);
        }
        let lunarDay = dayNumber - monthStart + 1;
        let diff = Math.floor((monthStart - a11) / 29);
        let lunarLeap = 0;
        let lunarMonth = diff + 11;
        if (b11 - a11 > 365) {
            let leapMonthDiff = getLeapMonthOffset(a11, timeZone);
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10;
                if (diff == leapMonthDiff) {
                    lunarLeap = 1;
                }
            }
        }
        if (lunarMonth > 12) {
            lunarMonth = lunarMonth - 12;
        }
        if (lunarMonth >= 11 && diff < 4) {
            lunarYear -= 1;
        }
        return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: lunarLeap == 1 };
    }
    
    // Convert lunar date to solar date
    function lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap = false, timeZone = 7) {
        let a11, b11;
        if (lunarMonth < 11) {
            a11 = getLunarMonth11(lunarYear - 1, timeZone);
            b11 = getLunarMonth11(lunarYear, timeZone);
        } else {
            a11 = getLunarMonth11(lunarYear, timeZone);
            b11 = getLunarMonth11(lunarYear + 1, timeZone);
        }
        let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
        let off = lunarMonth - 11;
        if (off < 0) {
            off += 12;
        }
        if (b11 - a11 > 365) {
            let leapOff = getLeapMonthOffset(a11, timeZone);
            let leapMonth = leapOff - 2;
            if (leapMonth < 0) {
                leapMonth += 12;
            }
            if (lunarLeap != 0 && lunarMonth != leapMonth) {
                return { day: 0, month: 0, year: 0 };
            } else if (lunarLeap != 0 || off >= leapOff) {
                off += 1;
            }
        }
        let monthStart = getNewMoonDay(k + off, timeZone);
        return jdToDate(monthStart + lunarDay - 1);
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
    
    // Check if lunar year is leap year
    function isLunarLeapYear(yy, timeZone = 7) {
        let a11 = getLunarMonth11(yy, timeZone);
        let b11 = getLunarMonth11(yy + 1, timeZone);
        return (b11 - a11) > 365;
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
