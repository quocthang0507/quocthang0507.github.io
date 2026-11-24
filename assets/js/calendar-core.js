// Shared Calendar Core Engine
// Unified solar/lunar calendar calculations, 60-year Nap Am table, month/week/year data builders,
// and shared date details modal used across Home, Weekly, Monthly, and Yearly calendars.

(function () {
    const CAN_LIST = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const CHI_LIST = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const CHI_HOURS = [
        '23h–1h', '1h–3h', '3h–5h', '5h–7h', '7h–9h', '9h–11h',
        '11h–13h', '13h–15h', '15h–17h', '17h–19h', '19h–21h', '21h–23h'
    ];
    const ZODIAC_ICONS = ['🐭', '🐃', '🐯', '🐱', '🐉', '🐍', '🐴', '🐐', '🐒', '🐓', '🐕', '🐖'];
    const ZODIAC_ANIMALS_VI = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Heo'];

    // Classical Ngoc Hap Thong Thu auspicious hours table indexed by (dayChiIndex % 6)
    const HOANG_DAO_HOURS_BY_CHI_MOD6 = [
        [0, 1, 3, 6, 8, 9],     // Tý, Ngọ
        [2, 3, 5, 8, 10, 11],   // Sửu, Mùi
        [0, 1, 4, 5, 7, 10],    // Dần, Thân
        [0, 2, 3, 6, 7, 9],     // Mão, Dậu
        [2, 4, 5, 8, 9, 11],    // Thìn, Tuất
        [1, 4, 6, 7, 10, 11]    // Tỵ, Hợi
    ];

    // Built-in fallback gallery (replaced automatically once /assets/data/vietnam_photos.json loads with 40 curated photos)
    let vietnamFeaturedPhotos = [
        {
            title: 'Hoàng hôn Hà Nội sau cơn mưa',
            titleEn: 'Sunset over Hanoi After the Rain',
            location: 'Hà Nội',
            region: 'north',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Sunset_over_Hanoi_After_the_Rain.jpg/960px-Sunset_over_Hanoi_After_the_Rain.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Sunset_over_Hanoi_After_the_Rain.jpg',
            author: 'Christopher Crouzet',
            license: 'CC BY-SA 4.0'
        },
        {
            title: 'Vịnh Hạ Long & Làng chài nổi',
            titleEn: 'Hạ Long Bay Floating Village',
            location: 'Quảng Ninh',
            region: 'north',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Vietnam_08_-_49_-_Halong_Bay_floating_village_%283170198801%29.jpg/960px-Vietnam_08_-_49_-_Halong_Bay_floating_village_%283170198801%29.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Vietnam_08_-_49_-_Halong_Bay_floating_village_(3170198801).jpg',
            author: 'McKay Savage',
            license: 'CC BY 2.0'
        },
        {
            title: 'Phố cổ Hội An đêm rằm hoa đăng',
            titleEn: 'Hội An Full Moon Lantern Festival',
            location: 'Quảng Nam',
            region: 'central',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Hoi_An_Full_Moon_Festival.jpg/960px-Hoi_An_Full_Moon_Festival.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Hoi_An_Full_Moon_Festival.jpg',
            author: 'Christophe95',
            license: 'CC BY-SA 4.0'
        },
        {
            title: 'Kinh thành Huế — Cố đô di sản',
            titleEn: 'Imperial Citadel of Huế',
            location: 'Thừa Thiên Huế',
            region: 'central',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Hue_Vietnam_Citadel-of-Hu%E1%BA%BF-21.jpg/960px-Hue_Vietnam_Citadel-of-Hu%E1%BA%BF-21.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Hue_Vietnam_Citadel-of-Hu%E1%BA%BF-21.jpg',
            author: 'Uwe Aranas',
            license: 'CC BY-SA 3.0'
        },
        {
            title: 'Chợ nổi Cái Răng buổi sớm',
            titleEn: 'Cái Răng Floating Market, Cần Thơ',
            location: 'Cần Thơ',
            region: 'south',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Can_Tho%2C_Vietnam%2C_Floating_Market_2.jpg/960px-Can_Tho%2C_Vietnam%2C_Floating_Market_2.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Can_Tho,_Vietnam,_Floating_Market_2.jpg',
            author: 'Vyacheslav Argenberg',
            license: 'CC BY 4.0'
        },
        {
            title: 'Hoàng hôn đảo ngọc Phú Quốc',
            titleEn: 'Sunset at Phú Quốc Island',
            location: 'Kiên Giang',
            region: 'south',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sunset_at_Phu_Quoc.jpg/960px-Sunset_at_Phu_Quoc.jpg',
            page: 'https://commons.wikimedia.org/wiki/File:Sunset_at_Phu_Quoc.jpg',
            author: 'Pswanson1980',
            license: 'CC BY-SA 4.0'
        }
    ];

    async function loadFeaturedPhotos() {
        if (typeof fetch !== 'function') return vietnamFeaturedPhotos;
        try {
            const res = await fetch('/assets/data/vietnam_photos.json');
            if (!res.ok) return vietnamFeaturedPhotos;
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
                vietnamFeaturedPhotos = list;
                try {
                    window.dispatchEvent(new CustomEvent('vietnamPhotosLoaded', { detail: list }));
                } catch (_) {}
            }
        } catch (_) {
            // Keep built-in fallback gallery when offline or in tests
        }
        return vietnamFeaturedPhotos;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFeaturedPhotos);
    } else {
        loadFeaturedPhotos();
    }

    const DAILY_QUOTES = [
        'Đi một ngày đàng, học một sàng khôn.',
        'Có công mài sắt, có ngày nên kim.',
        'Uống nước nhớ nguồn, ăn quả nhớ kẻ trồng cây.',
        'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
        'Học ăn, học nói, học gói, học mở.',
        'Tốt gỗ hơn tốt nước sơn.',
        'Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.',
        'Chớ thấy sóng cả mà ngã tay chèo.',
        'Đoàn kết là sức mạnh, chia rẽ là yếu hèn.',
        'Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.',
        'Tích tiểu thành đại, góp gió thành bão.',
        'Cần cù bù thông minh, kiên trì ắt thành công.',
        'Ở hiền gặp lành, gieo nhân nào gặt quả nấy.',
        'Mỗi ngày mới là một cơ hội để bắt đầu điều tốt đẹp.'
    ];

    function getJulianDay(dd, mm, yy) {
        const a = Math.floor((14 - mm) / 12);
        const y = yy + 4800 - a;
        const m = mm + 12 * a - 3;
        return dd + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }

    // Compute traditional Vietnamese Lịch Bloc data for any date
    function getBlocDetails(day, month, year, photoOverrideIndex = null) {
        const info = getDayInfo(day, month, year);
        const jd = getJulianDay(day, month, year);
        const dayCanIdx = (((jd + 9) % 10) + 10) % 10;
        const dayChiIdx = (((jd + 1) % 12) + 12) % 12;
        const dayCanChi = `${CAN_LIST[dayCanIdx]} ${CHI_LIST[dayChiIdx]}`;

        const lunarYear = info.lunar ? info.lunar.year : year;
        const lunarMonth = info.lunar ? info.lunar.month : month;
        const yearCanIdx = (((lunarYear - 4) % 10) + 10) % 10;
        const yearChiIdx = (((lunarYear - 4) % 12) + 12) % 12;
        const monthCanIdx = (((yearCanIdx * 2 + lunarMonth + 1) % 10) + 10) % 10;
        const monthChiIdx = (((lunarMonth + 1) % 12) + 12) % 12;
        const firstHourCanIdx = (((dayCanIdx * 2) % 10) + 10) % 10;

        const hoangDaoIndices = HOANG_DAO_HOURS_BY_CHI_MOD6[dayChiIdx % 6] || [];
        const hoangDaoHours = hoangDaoIndices.map(ci => ({
            chi: CHI_LIST[ci],
            range: CHI_HOURS[ci],
            label: `${CHI_LIST[ci]} (${CHI_HOURS[ci]})`
        }));

        const photoCount = vietnamFeaturedPhotos.length || 1;
        const photoIndex = photoOverrideIndex !== null && photoOverrideIndex >= 0
            ? photoOverrideIndex % photoCount
            : (((info.dayOfYear - 1) % photoCount) + photoCount) % photoCount;
        const quoteIndex = (((info.dayOfYear - 1) % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length;

        return {
            ...info,
            dayCanChi,
            monthCanChi: `${CAN_LIST[monthCanIdx]} ${CHI_LIST[monthChiIdx]}`,
            yearCanChi: `${CAN_LIST[yearCanIdx]} ${CHI_LIST[yearChiIdx]}`,
            firstHourCanChi: `${CAN_LIST[firstHourCanIdx]} Tý`,
            dayZodiac: {
                chi: CHI_LIST[dayChiIdx],
                animal: ZODIAC_ANIMALS_VI[dayChiIdx],
                icon: ZODIAC_ICONS[dayChiIdx]
            },
            yearZodiac: {
                chi: CHI_LIST[yearChiIdx],
                animal: ZODIAC_ANIMALS_VI[yearChiIdx],
                icon: ZODIAC_ICONS[yearChiIdx]
            },
            napAm: getNapAm(lunarYear),
            hoangDaoHours,
            photo: vietnamFeaturedPhotos[photoIndex],
            photoIndex,
            totalPhotos: photoCount,
            quote: DAILY_QUOTES[quoteIndex]
        };
    }

    // 60-year Sexagenary Nap Am (Ngũ hành nạp âm) table indexed by (year - 4) % 60
    const NAP_AM_60 = [
        'Hải Trung Kim', 'Hải Trung Kim', 'Lư Trung Hỏa', 'Lư Trung Hỏa',
        'Đại Lâm Mộc', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Lộ Bàng Thổ',
        'Kiếm Phong Kim', 'Kiếm Phong Kim', 'Sơn Đầu Hỏa', 'Sơn Đầu Hỏa',
        'Giản Hạ Thủy', 'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Thành Đầu Thổ',
        'Bạch Lạp Kim', 'Bạch Lạp Kim', 'Dương Liễu Mộc', 'Dương Liễu Mộc',
        'Tuyền Trung Thủy', 'Tuyền Trung Thủy', 'Ốc Thượng Thổ', 'Ốc Thượng Thổ',
        'Tích Lịch Hỏa', 'Tích Lịch Hỏa', 'Tùng Bách Mộc', 'Tùng Bách Mộc',
        'Trường Lưu Thủy', 'Trường Lưu Thủy', 'Sa Trung Kim', 'Sa Trung Kim',
        'Sơn Hạ Hỏa', 'Sơn Hạ Hỏa', 'Bình Địa Mộc', 'Bình Địa Mộc',
        'Bích Thượng Thổ', 'Bích Thượng Thổ', 'Kim Bạch Kim', 'Kim Bạch Kim',
        'Phúc Đăng Hỏa', 'Phúc Đăng Hỏa', 'Thiên Hà Thủy', 'Thiên Hà Thủy',
        'Đại Trạch Thổ', 'Đại Trạch Thổ', 'Thoa Xuyến Kim', 'Thoa Xuyến Kim',
        'Tang Đố Mộc', 'Tang Đố Mộc', 'Đại Khê Thủy', 'Đại Khê Thủy',
        'Sa Trung Thổ', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thiên Thượng Hỏa',
        'Thạch Lựu Mộc', 'Thạch Lựu Mộc', 'Đại Hải Thủy', 'Đại Hải Thủy'
    ];

    const NAP_AM_DESC = {
        'Hải Trung Kim': 'Vàng trong biển',
        'Lư Trung Hỏa': 'Lửa trong lò',
        'Đại Lâm Mộc': 'Gỗ rừng lớn',
        'Lộ Bàng Thổ': 'Đất ven đường',
        'Kiếm Phong Kim': 'Vàng mũi kiếm',
        'Sơn Đầu Hỏa': 'Lửa trên núi',
        'Giản Hạ Thủy': 'Nước dưới khe',
        'Thành Đầu Thổ': 'Đất đầu thành',
        'Bạch Lạp Kim': 'Vàng sáp ong',
        'Dương Liễu Mộc': 'Gỗ cây dương liễu',
        'Tuyền Trung Thủy': 'Nước trong suối',
        'Ốc Thượng Thổ': 'Đất nóc nhà',
        'Tích Lịch Hỏa': 'Lửa sấm sét',
        'Tùng Bách Mộc': 'Gỗ tùng bách',
        'Trường Lưu Thủy': 'Nước sông dài',
        'Sa Trung Kim': 'Vàng trong cát',
        'Sơn Hạ Hỏa': 'Lửa chân núi',
        'Bình Địa Mộc': 'Gỗ đồng bằng',
        'Bích Thượng Thổ': 'Đất tò vò',
        'Kim Bạch Kim': 'Vàng pha bạc',
        'Phúc Đăng Hỏa': 'Lửa đèn dầu',
        'Thiên Hà Thủy': 'Nước trên trời',
        'Đại Trạch Thổ': 'Đất nền nhà',
        'Thoa Xuyến Kim': 'Vàng trang sức',
        'Tang Đố Mộc': 'Gỗ cây dâu',
        'Đại Khê Thủy': 'Nước khe lớn',
        'Sa Trung Thổ': 'Đất pha cát',
        'Thiên Thượng Hỏa': 'Lửa trên trời',
        'Thạch Lựu Mộc': 'Gỗ thạch lựu',
        'Đại Hải Thủy': 'Nước biển lớn'
    };

    const tr = (key, fallback) => {
        if (typeof window.t === 'function') {
            const val = window.t(key, fallback);
            if (val && val !== key) return val;
        }
        return fallback !== undefined ? fallback : key;
    };

    const esc = (s) => {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(s);
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    function getCurrentLang() {
        return (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';
    }

    function computeDayOfYear(date) {
        const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        const utcStart = Date.UTC(date.getFullYear(), 0, 0);
        return Math.round((utcDate - utcStart) / 86400000);
    }

    function computeISOWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    function isLeapSolarYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // Return the Monday (weekStartsOn=1) or Sunday (weekStartsOn=0) starting the week of `date`
    function getWeekStartDate(date, weekStartsOn = 1) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dow = d.getDay();
        const diff = (dow - weekStartsOn + 7) % 7;
        d.setDate(d.getDate() - diff);
        return d;
    }

    function getWeekDates(anchorDate, weekStartsOn = 1) {
        const start = getWeekStartDate(anchorDate, weekStartsOn);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function getNapAm(lunarYear) {
        const idx = (((lunarYear - 4) % 60) + 60) % 60;
        const name = NAP_AM_60[idx] || '';
        return {
            name,
            meaning: NAP_AM_DESC[name] || ''
        };
    }

    function formatShortDate(day, month, year) {
        const dd = String(day).padStart(2, '0');
        const mm = String(month).padStart(2, '0');
        return year ? `${dd}/${mm}/${year}` : `${dd}/${mm}`;
    }

    function getWeekdayName(dayOfWeekIndex, short = false) {
        const keys = short
            ? ['cal.sunday', 'cal.monday', 'cal.tuesday', 'cal.wednesday', 'cal.thursday', 'cal.friday', 'cal.saturday']
            : ['day.sunday', 'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday'];
        const fallbacks = short
            ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
            : ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return tr(keys[dayOfWeekIndex], fallbacks[dayOfWeekIndex]);
    }

    function getMonthName(month) {
        return tr(`month.${month}`, `Tháng ${month}`);
    }

    function getDayInfo(day, month, year) {
        const solarDate = new Date(year, month - 1, day);
        const today = new Date();
        const isToday = year === today.getFullYear() &&
            month === today.getMonth() + 1 &&
            day === today.getDate();
        const dow = solarDate.getDay();

        let lunar = null;
        let canChi = '';
        let zodiac = '';
        let lunarMonthName = '';
        let goodBad = null;

        if (window.LunarCalendar) {
            try {
                lunar = window.LunarCalendar.solarToLunar(day, month, year);
                if (lunar) {
                    canChi = window.LunarCalendar.getCanChi(lunar.year) || '';
                    zodiac = window.LunarCalendar.getZodiacAnimal(lunar.year) || '';
                    lunarMonthName = window.LunarCalendar.getLunarMonthName(lunar.month, lunar.isLeap) || '';
                    goodBad = window.LunarCalendar.getGoodBadDayInfo(day, month, year);
                }
            } catch (_) {
                lunar = null;
            }
        }

        let holiday = null;
        if (window.VietnamHolidays && typeof window.VietnamHolidays.getHoliday === 'function') {
            holiday = window.VietnamHolidays.getHoliday(day, month, year);
        }

        return {
            day,
            month,
            year,
            date: solarDate,
            weekday: dow,
            weekdayName: getWeekdayName(dow, false),
            weekdayShort: getWeekdayName(dow, true),
            dayOfYear: computeDayOfYear(solarDate),
            isoWeek: computeISOWeek(solarDate),
            isToday,
            isWeekend: dow === 0 || dow === 6,
            lunar,
            canChi,
            zodiac,
            lunarMonthName,
            goodBad,
            holiday
        };
    }

    // Collect holidays & good/bad day counts for a specific month
    function getMonthSummary(year, month) {
        const totalDays = getDaysInMonth(year, month);
        const holidays = [];
        const goodDays = [];
        let badCount = 0;

        for (let d = 1; d <= totalDays; d++) {
            const info = getDayInfo(d, month, year);
            if (info.holiday) {
                holidays.push(info);
            }
            if (info.goodBad) {
                if (info.goodBad.status === 'tốt') {
                    goodDays.push(info);
                } else if (info.goodBad.status === 'xấu') {
                    badCount++;
                }
            }
        }

        return {
            year,
            month,
            totalDays,
            holidays,
            goodDays,
            badCount
        };
    }

    // Compute comprehensive overview for a given solar year (inspired by ngaydep.com yearly lunar calendar)
    function getYearOverview(year) {
        const canChi = window.LunarCalendar ? window.LunarCalendar.getCanChi(year) : '';
        const zodiac = window.LunarCalendar ? window.LunarCalendar.getZodiacAnimal(year) : '';
        const napAm = getNapAm(year);

        let tetSolar = null;
        let lunarYearEndSolar = null;
        let leapMonth = null;
        const publicHolidays = [];
        const notableEvents = [];

        // Scan the solar year once (~365 days, takes <3ms)
        for (let m = 1; m <= 12; m++) {
            const totalDays = getDaysInMonth(year, m);
            for (let d = 1; d <= totalDays; d++) {
                const info = getDayInfo(d, m, year);
                if (info.lunar) {
                    if (info.lunar.year === year && info.lunar.month === 1 && info.lunar.day === 1 && !info.lunar.isLeap) {
                        tetSolar = info;
                    }
                    if (info.lunar.year === year && info.lunar.isLeap && leapMonth === null) {
                        leapMonth = info.lunar.month;
                    }
                }
                if (info.holiday) {
                    if (info.holiday.is_public_holiday || info.holiday.is_workday_swap) {
                        publicHolidays.push(info);
                    } else if (info.holiday.type === 'lunar') {
                        notableEvents.push(info);
                    }
                }
            }
        }

        // Find end of this lunar year (day before next lunar year's 1/1 in Jan–Feb of year+1)
        if (window.LunarCalendar) {
            outer: for (let m = 1; m <= 3; m++) {
                const totalDays = getDaysInMonth(year + 1, m);
                for (let d = 1; d <= totalDays; d++) {
                    try {
                        const l = window.LunarCalendar.solarToLunar(d, m, year + 1);
                        if (l && l.year === year + 1 && l.month === 1 && l.day === 1 && !l.isLeap) {
                            const prev = new Date(year + 1, m - 1, d - 1);
                            lunarYearEndSolar = {
                                day: prev.getDate(),
                                month: prev.getMonth() + 1,
                                year: prev.getFullYear()
                            };
                            break outer;
                        }
                    } catch (_) {}
                }
            }
        }

        return {
            year,
            isLeapSolar: isLeapSolarYear(year),
            totalSolarDays: isLeapSolarYear(year) ? 366 : 365,
            canChi,
            zodiac,
            napAm,
            tetSolar,
            lunarYearEndSolar,
            leapMonth,
            publicHolidays,
            notableEvents
        };
    }

    // Shared month table renderer used by Home, Monthly, and Yearly calendar views
    function renderMonthTableHTML(year, month, options = {}) {
        const {
            weekStartsOn = 0, // 0 = Sunday, 1 = Monday
            compact = false,
            showWeekNumbers = false,
            showGoodBad = false,
            showHolidayLabels = false,
            filterMode = 'all' // 'all' | 'holidays' | 'good'
        } = options;

        const firstDay = new Date(year, month - 1, 1);
        const daysInMonth = getDaysInMonth(year, month);
        const prevMonthDays = getDaysInMonth(year, month - 1);
        const startOffset = (firstDay.getDay() - weekStartsOn + 7) % 7;

        const headerOrder = weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
        const tableClasses = ['calendar-table'];
        if (compact) tableClasses.push('calendar-table-compact');
        if (showHolidayLabels) tableClasses.push('calendar-table-detailed');

        let html = `<table class="${tableClasses.join(' ')}"><thead><tr>`;
        if (showWeekNumbers) {
            html += `<th class="calendar-week-col" title="${esc(tr('lunar.week_of_year', 'Tuần'))}">${esc(tr('cal.week_short', 'T'))}</th>`;
        }
        headerOrder.forEach(dow => {
            const isWknd = dow === 0 || dow === 6;
            html += `<th class="${isWknd ? 'calendar-weekend-col' : ''}">${esc(getWeekdayName(dow, true))}</th>`;
        });
        html += '</tr></thead><tbody>';

        let date = 1;
        for (let week = 0; week < 6; week++) {
            const rowFirstDate = week === 0
                ? new Date(year, month - 1, 1 - startOffset)
                : new Date(year, month - 1, date);
            const isoWeek = computeISOWeek(rowFirstDate);

            html += '<tr>';
            if (showWeekNumbers) {
                html += `<td class="calendar-week-num">${isoWeek}</td>`;
            }

            for (let col = 0; col < 7; col++) {
                if (week === 0 && col < startOffset) {
                    const prevDate = prevMonthDays - (startOffset - col - 1);
                    html += `<td class="other-month">${prevDate}</td>`;
                } else if (date > daysInMonth) {
                    const nextDate = date - daysInMonth;
                    html += `<td class="other-month">${nextDate}</td>`;
                    date++;
                } else {
                    const info = getDayInfo(date, month, year);
                    const cellClasses = ['calendar-day'];
                    if (info.isToday) cellClasses.push('today');
                    if (info.isWeekend) cellClasses.push('is-weekend');

                    let titleParts = [];
                    if (info.holiday) {
                        cellClasses.push('has-holiday');
                        if (info.holiday.is_public_holiday) {
                            cellClasses.push('public-holiday');
                        } else if (info.holiday.is_workday_swap) {
                            cellClasses.push('workday-swap');
                        }
                        titleParts.push(info.holiday.name);
                        if (Array.isArray(info.holiday.extra_holidays)) {
                            info.holiday.extra_holidays.forEach(h => titleParts.push(h.name));
                        }
                    }

                    let goodBadDot = '';
                    if (showGoodBad && info.goodBad) {
                        if (info.goodBad.status === 'tốt') {
                            cellClasses.push('is-good-day');
                            goodBadDot = `<span class="day-auspicious-dot good" title="${esc(tr('lunar.status_good', 'Ngày Hoàng Đạo (Tốt)'))}" aria-hidden="true"></span>`;
                        } else if (info.goodBad.status === 'xấu') {
                            cellClasses.push('is-bad-day');
                            goodBadDot = `<span class="day-auspicious-dot bad" title="${esc(tr('lunar.status_bad', 'Ngày Hắc Đạo (Xấu/Kiêng kỵ)'))}" aria-hidden="true"></span>`;
                        }
                    }

                    if (filterMode === 'holidays' && !info.holiday) {
                        cellClasses.push('calendar-day-dimmed');
                    } else if (filterMode === 'good' && (!info.goodBad || info.goodBad.status !== 'tốt')) {
                        cellClasses.push('calendar-day-dimmed');
                    }

                    let lunarHtml = '';
                    if (info.lunar) {
                        const isSpecialLunar = info.lunar.day === 1 || info.lunar.day === 15;
                        const lunarText = (compact && !isSpecialLunar)
                            ? `${info.lunar.day}`
                            : `${info.lunar.day}/${info.lunar.month}${info.lunar.isLeap ? '*' : ''}`;
                        lunarHtml = `<small class="lunar-date${isSpecialLunar ? ' lunar-special' : ''} mt-auto">${lunarText}</small>`;
                    }

                    let holidayTag = '';
                    if (showHolidayLabels && info.holiday) {
                        const tagClass = info.holiday.is_public_holiday
                            ? 'holiday-chip-public'
                            : (info.holiday.is_workday_swap ? 'holiday-chip-swap' : 'holiday-chip-commemorative');
                        holidayTag = `<span class="calendar-holiday-chip ${tagClass}" title="${esc(titleParts.join(' • '))}">${esc(info.holiday.name)}</span>`;
                    }

                    const titleAttr = titleParts.length ? ` title="${esc(titleParts.join(' • '))}"` : '';
                    const ariaLabel = titleParts.length
                        ? `${date}/${month}/${year} - ${titleParts.join(', ')}`
                        : `${date}/${month}/${year}`;

                    html += `<td class="${cellClasses.join(' ')}" data-date="${date}" data-month="${month}" data-year="${year}"${titleAttr}>
                        <a href="#" class="calendar-day-link d-flex flex-column align-items-center p-1" aria-label="${esc(ariaLabel)}">
                            <div class="solar-date-row">
                                <span class="solar-date">${date}</span>${goodBadDot}
                            </div>
                            ${lunarHtml}
                            ${holidayTag}
                        </a>
                    </td>`;
                    date++;
                }
            }
            html += '</tr>';
            if (date > daysInMonth) break;
        }

        html += '</tbody></table>';
        return html;
    }

    function bindDayClickHandlers(container, onSelect) {
        if (!container) return;
        const handler = typeof onSelect === 'function' ? onSelect : showDateDetails;
        container.querySelectorAll('.calendar-day-link, [data-calendar-open-date]').forEach(el => {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                const target = this.closest('.calendar-day') || this;
                const day = parseInt(target.dataset.date, 10);
                const month = parseInt(target.dataset.month, 10);
                const year = parseInt(target.dataset.year, 10);
                if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
                    handler(day, month, year);
                }
            });
        });
    }

    // Shared rich Date Details Modal (used by Home, Weekly, Monthly, and Yearly calendars)
    function showDateDetails(day, month, year) {
        const lang = getCurrentLang();
        const info = getDayInfo(day, month, year);
        const dayOfWeek = info.weekdayName;
        const dayOfYear = info.dayOfYear;
        const weekOfYear = info.isoWeek;
        const lunar = info.lunar;
        const lunarOk = Boolean(lunar);
        const goodBadInfo = info.goodBad;
        const holiday = info.holiday;

        let modal = document.getElementById('dateDetailsModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="dateDetailsModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content date-modal">
                  <div class="modal-header date-modal-header">
                    <h5 class="modal-title" id="dateDetailsTitle"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body" id="dateDetailsBody"></div>
                  <div class="modal-footer flex-wrap gap-2">
                    <div class="btn-group me-auto" role="group" aria-label="Navigation">
                      <button type="button" class="btn btn-outline-primary" id="datePrevBtn"><i class="fas fa-chevron-left"></i></button>
                      <button type="button" class="btn btn-outline-secondary" id="dateTodayBtn"><i class="fas fa-calendar-day"></i></button>
                      <button type="button" class="btn btn-outline-primary" id="dateNextBtn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <button type="button" class="btn btn-outline-success" id="dateCopyBtn"><i class="fas fa-copy"></i> ${esc(tr('lunar.copy', 'Sao chép'))}</button>
                    <button type="button" class="btn btn-secondary" id="dateCloseBtn" data-bs-dismiss="modal">${esc(tr('lunar.close', 'Đóng'))}</button>
                  </div>
                </div>
              </div>
            </div>`);
            modal = document.getElementById('dateDetailsModal');
        }

        const copyBtnEl = modal.querySelector('#dateCopyBtn');
        if (copyBtnEl) {
            copyBtnEl.innerHTML = `<i class="fas fa-copy"></i> ${esc(tr('lunar.copy', 'Sao chép'))}`;
        }
        const closeBtnEl = modal.querySelector('#dateCloseBtn');
        if (closeBtnEl) {
            closeBtnEl.textContent = tr('lunar.close', 'Đóng');
        }

        const titleEl = modal.querySelector('#dateDetailsTitle');
        titleEl.textContent = `${tr('lunar.details_title', 'Chi tiết ngày')} ${day}/${month}/${year}`;

        let lunarSection = '';
        if (lunarOk) {
            const napAm = getNapAm(lunar.year);
            lunarSection = `
            <div class="col-md-6">
                <div class="date-card lunar-card p-3 h-100">
                    <h6 class="text-muted mb-2"><i class="fas fa-moon"></i> ${esc(tr('lunar.lunar', 'Âm lịch'))}</h6>
                    <div class="display-6 fw-bold mb-1">${esc(lunar.day)}</div>
                    <div class="fs-6">${esc(info.lunarMonthName)}</div>
                    <div class="small text-secondary mt-1">${esc(tr('lunar.year', 'Năm'))}: ${esc(lunar.year)} (${esc(info.canChi)})</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-info-subtle text-info-emphasis border date-badge">${esc(info.zodiac)}</span>
                        ${napAm.name ? `<span class="badge bg-primary-subtle text-primary-emphasis border date-badge">${esc(napAm.name)}</span>` : ''}
                        <span class="badge bg-warning-subtle text-warning-emphasis border date-badge">${esc(lunar.isLeap ? tr('lunar.month_leap', 'Tháng nhuận') : tr('lunar.month_normal', 'Tháng thường'))}</span>
                    </div>
                </div>
            </div>`;
        } else {
            lunarSection = `<div class="col-md-6"><div class="alert alert-warning mb-0">${esc(tr('lunar.unavailable', 'Không có dữ liệu âm lịch'))}</div></div>`;
        }

        let goodBadSection = '';
        if (lunarOk && goodBadInfo) {
            const isVi = lang === 'vi';
            const statusLabel = goodBadInfo.status === 'tốt'
                ? tr('lunar.status_good', 'Ngày Hoàng Đạo (Tốt)')
                : (goodBadInfo.status === 'xấu' ? tr('lunar.status_bad', 'Ngày Hắc Đạo (Xấu/Kiêng kỵ)') : tr('lunar.status_normal', 'Ngày Bình Thường'));
            const statusClass = goodBadInfo.status === 'tốt' ? 'success' : (goodBadInfo.status === 'xấu' ? 'danger' : 'secondary');
            const starText = isVi ? goodBadInfo.starName : goodBadInfo.starNameEn;
            const activeWarnings = isVi ? goodBadInfo.warnings : goodBadInfo.warningsEn;

            let warningsHtml = '';
            if (activeWarnings && activeWarnings.length > 0) {
                warningsHtml = `
                <div class="mt-3 text-danger small">
                    <strong><i class="fas fa-exclamation-triangle"></i> ${esc(tr('lunar.warnings', 'Cảnh báo kỵ'))}:</strong>
                    <ul class="mb-0 ps-3 mt-1">
                        ${activeWarnings.map(w => `<li>${esc(w)}</li>`).join('')}
                    </ul>
                </div>`;
            }

            let descText = tr('lunar.details_normal_desc', 'Thích hợp cho các công việc thường nhật, công việc lớn cần cân nhắc kỹ lưỡng.');
            if (goodBadInfo.status === 'tốt') {
                descText = tr('lunar.details_good_desc', 'Thích hợp cho các công việc quan trọng như khởi công, cưới hỏi, khai trương, giao dịch.');
            } else if (goodBadInfo.status === 'xấu') {
                descText = tr('lunar.details_bad_desc', 'Hạn chế làm các việc lớn như xuất hành đi xa, ký kết đại sự, khởi công xây dựng.');
            }

            let shouldDo = '';
            let shouldAvoid = '';
            if (goodBadInfo.status === 'tốt') {
                shouldDo = isVi ? 'Cưới hỏi, khai trương, mở cửa hàng, giao dịch ký kết, động thổ, xuất hành đi xa.' : 'Weddings, grand openings, business transactions, groundbreaking, long journeys.';
                shouldAvoid = isVi ? 'Tranh chấp khiếu nại, kiện tụng.' : 'Disputes, lawsuits.';
            } else if (goodBadInfo.status === 'xấu') {
                shouldDo = isVi ? 'Dọn dẹp nhà cửa, quét dọn, nghỉ ngơi.' : 'House cleaning, resting, routine maintenance.';
                shouldAvoid = isVi ? 'Khởi công xây nhà, cưới hỏi, khai trương, ký hợp đồng lớn, xuất hành hướng xấu.' : 'Starting construction, weddings, grand openings, signing major contracts, travelling.';
            } else {
                shouldDo = isVi ? 'Làm các việc thường nhật, đi chùa, làm việc thiện.' : 'Routine work, visiting temples, charity work.';
                shouldAvoid = isVi ? 'Tránh quyết định vội vàng đối với các giao dịch có tính rủi ro cao.' : 'Avoid rushed decisions for high-risk transactions.';
            }

            goodBadSection = `
            <div class="col-12 mt-3">
                <div class="date-card p-3">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h6 class="mb-0 text-primary"><i class="fas fa-balance-scale"></i> ${esc(tr('lunar.day_status', 'Đánh giá ngày'))}</h6>
                        <span class="badge bg-${statusClass}-subtle text-${statusClass}-emphasis border date-badge">${esc(statusLabel)}</span>
                    </div>
                    <p class="small text-secondary mb-3">${esc(descText)}</p>
                    <div class="row g-2 mb-2">
                        <div class="col-sm-6">
                            <div class="p-2 border rounded bg-light-subtle h-100">
                                <strong class="small text-secondary d-block mb-1">${esc(tr('lunar.day_canchi', 'Can Chi ngày'))}</strong>
                                <span class="fs-6 fw-bold text-dark">${esc(goodBadInfo.dayCanChi)}</span>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="p-2 border rounded bg-light-subtle h-100">
                                <strong class="small text-secondary d-block mb-1">${esc(tr('lunar.zodiac_star', 'Sao hoàng đạo'))}</strong>
                                <span class="fs-6 fw-bold text-dark">${esc(starText)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="row g-2 mt-1">
                        <div class="col-sm-6">
                            <div class="p-2 rounded bg-success-subtle h-100">
                                <strong class="small text-success-emphasis d-block mb-1"><i class="fas fa-check-circle"></i> ${esc(tr('lunar.should_do', 'Nên làm'))}</strong>
                                <span class="small text-dark-emphasis d-block mt-1">${esc(shouldDo)}</span>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="p-2 rounded bg-danger-subtle h-100">
                                <strong class="small text-danger-emphasis d-block mb-1"><i class="fas fa-times-circle"></i> ${esc(tr('lunar.should_avoid', 'Kiêng kỵ'))}</strong>
                                <span class="small text-dark-emphasis d-block mt-1">${esc(shouldAvoid)}</span>
                            </div>
                        </div>
                    </div>
                    ${warningsHtml}
                </div>
            </div>`;
        }

        let holidaySection = '';
        if (holiday) {
            const isWorkdaySwap = Boolean(holiday.is_workday_swap);
            const alertVariant = holiday.is_public_holiday ? 'danger' : (isWorkdaySwap ? 'warning' : 'info');
            const holidayIcon = holiday.is_public_holiday
                ? '<i class="fas fa-star text-danger"></i>'
                : (isWorkdaySwap ? '<i class="fas fa-exchange-alt text-warning"></i>' : '<i class="fas fa-calendar-alt text-info"></i>');
            const holidayBadge = holiday.is_public_holiday
                ? `<span class="badge bg-danger-subtle text-danger-emphasis border date-badge"><i class="fas fa-flag"></i> Ngày lễ chính thức</span>`
                : (isWorkdaySwap
                    ? `<span class="badge bg-warning-subtle text-warning-emphasis border date-badge"><i class="fas fa-briefcase"></i> Ngày làm bù</span>`
                    : `<span class="badge bg-info-subtle text-info-emphasis border date-badge">Ngày kỷ niệm</span>`);
            const holidayType = holiday.type === 'lunar'
                ? `<span class="badge bg-secondary-subtle text-secondary-emphasis border date-badge"><i class="fas fa-moon"></i> Âm lịch</span>`
                : `<span class="badge bg-primary-subtle text-primary-emphasis border date-badge"><i class="fas fa-sun"></i> Dương lịch</span>`;
            const extraHtml = Array.isArray(holiday.extra_holidays) && holiday.extra_holidays.length > 0
                ? `<div class="mt-2 pt-2 border-top small"><strong>Sự kiện khác trong ngày:</strong> ${holiday.extra_holidays.map(h => esc(h.name)).join(' • ')}</div>`
                : '';

            holidaySection = `
            <div class="col-12 mt-3">
                <div class="alert alert-${alertVariant} mb-0">
                    <h6 class="alert-heading mb-2">${holidayIcon} ${isWorkdaySwap ? 'Lịch hoán đổi ngày làm việc' : 'Ngày lễ'}</h6>
                    <p class="mb-2 fw-bold">${esc(holiday.name)}</p>
                    ${holiday.name_en ? `<p class="mb-2 small text-muted">${esc(holiday.name_en)}</p>` : ''}
                    ${holiday.description ? `<p class="mb-2 small">${esc(holiday.description)}</p>` : ''}
                    ${holiday.schedule_note ? `<p class="mb-2 small"><i class="fas fa-info-circle me-1"></i>${esc(holiday.schedule_note)}</p>` : ''}
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        ${holidayBadge}
                        ${holidayType}
                        ${holiday.duration_days ? `<span class="badge bg-success-subtle text-success-emphasis border date-badge">Nghỉ: ${esc(holiday.duration_days)} ngày</span>` : ''}
                    </div>
                    ${extraHtml}
                </div>
            </div>`;
        }

        const bodyHTML = `
        <div class="row g-3 align-items-stretch">
            <div class="col-md-6">
                <div class="date-card solar-card p-3 h-100">
                    <h6 class="text-muted mb-2"><i class="fas fa-sun"></i> ${esc(tr('lunar.solar', 'Dương lịch'))}</h6>
                    <div class="display-6 fw-bold mb-1">${esc(day)}</div>
                    <div class="fs-5">${esc(dayOfWeek)}</div>
                    <div class="small text-secondary mt-1">${esc(tr('lunar.full_date', 'Ngày'))} ${esc(day)} / ${esc(month)} / ${esc(year)}</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-primary-subtle text-primary-emphasis border date-badge">${esc(tr('lunar.day_of_year', 'Ngày trong năm'))}: ${esc(dayOfYear)}</span>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis border date-badge">${esc(tr('lunar.week_of_year', 'Tuần'))}: ${esc(weekOfYear)}</span>
                    </div>
                </div>
            </div>
            ${lunarSection}
            ${goodBadSection}
            ${holidaySection}
        </div>`;

        modal.querySelector('#dateDetailsBody').innerHTML = bodyHTML;
        modal.dataset.day = day;
        modal.dataset.month = month;
        modal.dataset.year = year;

        modal.querySelector('#datePrevBtn').onclick = () => {
            const d = new Date(year, month - 1, day);
            d.setDate(d.getDate() - 1);
            showDateDetails(d.getDate(), d.getMonth() + 1, d.getFullYear());
        };
        modal.querySelector('#dateNextBtn').onclick = () => {
            const d = new Date(year, month - 1, day);
            d.setDate(d.getDate() + 1);
            showDateDetails(d.getDate(), d.getMonth() + 1, d.getFullYear());
        };
        modal.querySelector('#dateTodayBtn').onclick = () => {
            const today = new Date();
            showDateDetails(today.getDate(), today.getMonth() + 1, today.getFullYear());
        };
        modal.querySelector('#dateCopyBtn').onclick = () => {
            const parts = [
                `${tr('lunar.solar', 'Dương lịch')}: ${day}/${month}/${year} (${dayOfWeek})`,
                lunarOk ? `${tr('lunar.lunar', 'Âm lịch')}: ${lunar.day} ${info.lunarMonthName} ${lunar.year} (${info.canChi})` : '',
                lunarOk ? `${tr('lunar.zodiac', 'Con giáp')}: ${info.zodiac}` : '',
                lunarOk && goodBadInfo ? `${tr('lunar.day_canchi', 'Can Chi ngày')}: ${goodBadInfo.dayCanChi}` : '',
                lunarOk && goodBadInfo ? `${tr('lunar.day_status', 'Đánh giá ngày')}: ${goodBadInfo.status === 'tốt' ? tr('lunar.status_good') : (goodBadInfo.status === 'xấu' ? tr('lunar.status_bad') : tr('lunar.status_normal'))}` : '',
                lunarOk && goodBadInfo ? `${tr('lunar.zodiac_star', 'Sao hoàng đạo')}: ${lang === 'vi' ? goodBadInfo.starName : goodBadInfo.starNameEn}` : '',
                holiday ? `Ngày lễ: ${holiday.name}` : '',
                `${tr('lunar.day_of_year', 'Ngày trong năm')}: ${dayOfYear}`,
                `${tr('lunar.week_of_year', 'Tuần')}: ${weekOfYear}`
            ].filter(Boolean).join('\n');

            if (navigator.clipboard) {
                navigator.clipboard.writeText(parts).then(() => {
                    if (typeof window.showAlert === 'function') {
                        window.showAlert(tr('lunar.copied', 'Đã sao chép!'), 'success');
                    }
                }).catch(() => {
                    if (typeof window.copyToClipboard === 'function') window.copyToClipboard(parts);
                });
            } else if (typeof window.copyToClipboard === 'function') {
                window.copyToClipboard(parts);
            }
        };

        if (window.bootstrap && typeof window.bootstrap.Modal === 'function') {
            window.bootstrap.Modal.getOrCreateInstance(modal).show();
        }
    }

    window.closeDateModal = function () {
        const modal = document.getElementById('dateDetailsModal');
        if (modal) modal.remove();
    };

    window.CalendarCore = {
        computeDayOfYear,
        computeISOWeek,
        getDaysInMonth,
        isLeapSolarYear,
        getWeekStartDate,
        getWeekDates,
        getNapAm,
        formatShortDate,
        getWeekdayName,
        getMonthName,
        getDayInfo,
        getBlocDetails,
        getFeaturedPhotos: () => vietnamFeaturedPhotos,
        _setFeaturedPhotos: (list) => {
            if (Array.isArray(list) && list.length > 0) vietnamFeaturedPhotos = list;
        },
        getMonthSummary,
        getYearOverview,
        renderMonthTableHTML,
        bindDayClickHandlers,
        showDateDetails
    };
})();
