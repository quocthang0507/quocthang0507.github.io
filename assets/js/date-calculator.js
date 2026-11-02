// Date Calculator JavaScript

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Translation helper (falls back to English text when translations are unavailable)
function dcT(key, fallback) {
    if (window.translationSystem && typeof window.translationSystem.t === 'function') {
        const value = window.translationSystem.t(key, fallback);
        return value && value !== key ? value : fallback;
    }
    return fallback;
}

function dcLocale() {
    return window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
}

// Parse "YYYY-MM-DD" as a local date (new Date(str) would treat it as UTC midnight)
function parseLocalDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function toInputValue(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Whole calendar days between two local dates (rounding absorbs DST shifts)
function daysBetween(a, b) {
    return Math.round((b - a) / MS_PER_DAY);
}

// Years/months/days from an earlier date to a later one
function ymdBetween(earlier, later) {
    let totalMonths = (later.getFullYear() - earlier.getFullYear()) * 12 + later.getMonth() - earlier.getMonth();
    if (shiftDate(earlier, 0, totalMonths, 0) > later) {
        totalMonths--;
    }
    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
        days: daysBetween(shiftDate(earlier, 0, totalMonths, 0), later)
    };
}

// Shift a date by years/months, clamping to the end of the month (Jan 31 + 1 month = Feb 28/29)
function shiftDate(date, years, months, days) {
    const totalMonths = date.getMonth() + months + years * 12;
    const targetYear = date.getFullYear() + Math.floor(totalMonths / 12);
    const targetMonth = ((totalMonths % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    const result = new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDay));
    result.setDate(result.getDate() + days);
    return result;
}

// Initialize with today's date
document.addEventListener('DOMContentLoaded', function() {
    const today = toInputValue(new Date());

    // Set default dates
    document.getElementById('diffFromDate').value = today;
    document.getElementById('diffToDate').value = today;
    document.getElementById('addStartDate').value = today;
    document.getElementById('weekdayDate').value = today;
});

// Calculate Date Difference
function calculateDateDifference() {
    const fromDateStr = document.getElementById('diffFromDate').value;
    const toDateStr = document.getElementById('diffToDate').value;

    if (!fromDateStr || !toDateStr) {
        alert(dcT('date_calc.error.select_dates', 'Please select both dates'));
        return;
    }

    const fromDate = parseLocalDate(fromDateStr);
    const toDate = parseLocalDate(toDateStr);
    const reversed = fromDate > toDate;
    const earlier = reversed ? toDate : fromDate;
    const later = reversed ? fromDate : toDate;

    const diffDays = daysBetween(earlier, later);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffHours = diffDays * 24;
    const diffMinutes = diffHours * 60;

    // Show negative values when the "from" date is later than the "to" date
    const sign = reversed ? -1 : 1;
    const { years, months, days } = ymdBetween(earlier, later);

    // Display results
    document.getElementById('diffYears').textContent = sign * years;
    document.getElementById('diffMonths').textContent = sign * months;
    document.getElementById('diffDays').textContent = sign * days;
    document.getElementById('diffWeeks').textContent = diffWeeks.toLocaleString();
    document.getElementById('diffHours').textContent = diffHours.toLocaleString();
    document.getElementById('diffMinutes').textContent = diffMinutes.toLocaleString();

    // Total summary
    const totalText = `${diffDays.toLocaleString()} ${dcT('date_calc.days', 'days')} (${diffWeeks.toLocaleString()} ${dcT('date_calc.weeks', 'weeks')})`;
    document.getElementById('diffTotal').textContent = totalText;

    document.getElementById('diffResult').style.display = 'block';
}

function readOffsets() {
    return {
        years: parseInt(document.getElementById('addYears').value) || 0,
        months: parseInt(document.getElementById('addMonths').value) || 0,
        days: parseInt(document.getElementById('addDays').value) || 0,
        weeks: parseInt(document.getElementById('addWeeks').value) || 0
    };
}

// Add to Date
function addToDate() {
    shiftFromInput(1);
}

// Subtract from Date
function subtractFromDate() {
    shiftFromInput(-1);
}

let lastShiftDirection = 1;

function shiftFromInput(direction) {
    lastShiftDirection = direction;
    const startDateStr = document.getElementById('addStartDate').value;

    if (!startDateStr) {
        alert(dcT('date_calc.error.select_date', 'Please select a date'));
        return;
    }

    const startDate = parseLocalDate(startDateStr);
    const { years, months, days, weeks } = readOffsets();
    const resultDate = shiftDate(startDate, direction * years, direction * months, direction * (days + weeks * 7));

    displayAddResult(resultDate, startDate);
}

// Display Add/Subtract Result
function displayAddResult(resultDate, startDate) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    document.getElementById('addResultDate').textContent = resultDate.toLocaleDateString(dcLocale(), options);

    const diff = daysBetween(startDate, resultDate);
    const infoText = diff >= 0
        ? `${diff} ${dcT('date_calc.days_after', 'days after')}`
        : `${-diff} ${dcT('date_calc.days_before', 'days before')}`;

    document.getElementById('addResultInfo').textContent = infoText;
    document.getElementById('addResult').style.display = 'block';
}

// Calculate Age
function calculateAge() {
    const birthDateStr = document.getElementById('birthDate').value;

    if (!birthDateStr) {
        alert(dcT('date_calc.error.select_birth_date', 'Please select your birth date'));
        return;
    }

    const birthDate = parseLocalDate(birthDateStr);
    const today = startOfToday();

    if (birthDate > today) {
        alert(dcT('date_calc.error.future_date', 'Birth date cannot be in the future'));
        return;
    }

    const { years, months, days } = ymdBetween(birthDate, today);

    // Total calculations
    const totalMonths = years * 12 + months;
    const totalDays = daysBetween(birthDate, today);
    const totalWeeks = Math.floor(totalDays / 7);

    // Display age
    document.getElementById('ageYears').textContent = years;
    document.getElementById('ageMonths').textContent = months;
    document.getElementById('ageDays').textContent = days;
    document.getElementById('ageTotalMonths').textContent = totalMonths.toLocaleString();
    document.getElementById('ageTotalWeeks').textContent = totalWeeks.toLocaleString();
    document.getElementById('ageTotalDays').textContent = totalDays.toLocaleString();

    // Calculate next birthday (today counts; Feb 29 falls back to Feb 28 in common years)
    let nextBirthday = shiftDate(birthDate, today.getFullYear() - birthDate.getFullYear(), 0, 0);
    if (nextBirthday < today) {
        nextBirthday = shiftDate(birthDate, today.getFullYear() + 1 - birthDate.getFullYear(), 0, 0);
    }

    const daysUntilBirthday = daysBetween(today, nextBirthday);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    const birthdayText = `${nextBirthday.toLocaleDateString(dcLocale(), options)} (${daysUntilBirthday} ${dcT('date_calc.days_left', 'days left')})`;
    document.getElementById('nextBirthday').textContent = birthdayText;

    document.getElementById('ageResult').style.display = 'block';
}

// Calculate Weekday
function calculateWeekday() {
    const dateStr = document.getElementById('weekdayDate').value;

    if (!dateStr) {
        alert(dcT('date_calc.error.select_date', 'Please select a date'));
        return;
    }

    const date = parseLocalDate(dateStr);
    const locale = dcLocale();

    const weekdayLong = date.toLocaleDateString(locale, { weekday: 'long' });
    const fullDate = date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('weekdayName').textContent = weekdayLong;

    // Additional info
    const dayOfYear = getDayOfYear(date);
    const weekOfYear = getWeekNumber(date);

    const infoEl = document.getElementById('weekdayInfo');
    infoEl.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = fullDate;
    infoEl.append(
        strong,
        document.createElement('br'),
        `${dcT('date_calc.day_of_year', 'Day of year')}: ${dayOfYear}`,
        document.createElement('br'),
        `${dcT('date_calc.week_of_year', 'Week of year')}: ${weekOfYear}`
    );
    document.getElementById('weekdayResult').style.display = 'block';
}

// Helper function: Get day of year
function getDayOfYear(date) {
    return daysBetween(new Date(date.getFullYear(), 0, 0), date);
}

// Helper function: Get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Update translations when language changes
window.addEventListener('languageChanged', function() {
    // Re-render results if they exist
    if (document.getElementById('diffResult').style.display === 'block') {
        calculateDateDifference();
    }
    if (document.getElementById('addResult').style.display === 'block') {
        shiftFromInput(lastShiftDirection);
    }
    if (document.getElementById('ageResult').style.display === 'block') {
        calculateAge();
    }
    if (document.getElementById('weekdayResult').style.display === 'block') {
        calculateWeekday();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseLocalDate,
        toInputValue,
        daysBetween,
        ymdBetween,
        shiftDate,
        getDayOfYear
    };
}
