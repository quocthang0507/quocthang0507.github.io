// Date Calculator JavaScript

// Initialize with today's date
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    
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
        alert(window.i18n?.translate('date_calc.error.select_dates') || 'Please select both dates');
        return;
    }
    
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    
    // Calculate difference in milliseconds
    const diffMs = Math.abs(toDate - fromDate);
    
    // Calculate different units
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    
    // Calculate years, months, days
    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();
    let days = toDate.getDate() - fromDate.getDate();
    
    if (days < 0) {
        months--;
        const lastMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Handle negative differences (from date is later than to date)
    if (fromDate > toDate) {
        years = -years;
        months = -months;
        days = -days;
    }
    
    // Display results
    document.getElementById('diffYears').textContent = years;
    document.getElementById('diffMonths').textContent = months;
    document.getElementById('diffDays').textContent = days;
    document.getElementById('diffWeeks').textContent = diffWeeks.toLocaleString();
    document.getElementById('diffHours').textContent = diffHours.toLocaleString();
    document.getElementById('diffMinutes').textContent = diffMinutes.toLocaleString();
    
    // Total summary
    const totalText = `${diffDays.toLocaleString()} ${window.i18n?.translate('date_calc.days') || 'days'} (${diffWeeks.toLocaleString()} ${window.i18n?.translate('date_calc.weeks') || 'weeks'})`;
    document.getElementById('diffTotal').textContent = totalText;
    
    document.getElementById('diffResult').style.display = 'block';
}

// Add to Date
function addToDate() {
    const startDateStr = document.getElementById('addStartDate').value;
    
    if (!startDateStr) {
        alert(window.i18n?.translate('date_calc.error.select_date') || 'Please select a date');
        return;
    }
    
    const startDate = new Date(startDateStr);
    const years = parseInt(document.getElementById('addYears').value) || 0;
    const months = parseInt(document.getElementById('addMonths').value) || 0;
    const days = parseInt(document.getElementById('addDays').value) || 0;
    const weeks = parseInt(document.getElementById('addWeeks').value) || 0;
    
    const resultDate = new Date(startDate);
    resultDate.setFullYear(resultDate.getFullYear() + years);
    resultDate.setMonth(resultDate.getMonth() + months);
    resultDate.setDate(resultDate.getDate() + days + (weeks * 7));
    
    displayAddResult(resultDate, startDate, '+');
}

// Subtract from Date
function subtractFromDate() {
    const startDateStr = document.getElementById('addStartDate').value;
    
    if (!startDateStr) {
        alert(window.i18n?.translate('date_calc.error.select_date') || 'Please select a date');
        return;
    }
    
    const startDate = new Date(startDateStr);
    const years = parseInt(document.getElementById('addYears').value) || 0;
    const months = parseInt(document.getElementById('addMonths').value) || 0;
    const days = parseInt(document.getElementById('addDays').value) || 0;
    const weeks = parseInt(document.getElementById('addWeeks').value) || 0;
    
    const resultDate = new Date(startDate);
    resultDate.setFullYear(resultDate.getFullYear() - years);
    resultDate.setMonth(resultDate.getMonth() - months);
    resultDate.setDate(resultDate.getDate() - days - (weeks * 7));
    
    displayAddResult(resultDate, startDate, '-');
}

// Display Add/Subtract Result
function displayAddResult(resultDate, startDate, operation) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const locale = localStorage.getItem('language') || 'vi';
    
    document.getElementById('addResultDate').textContent = resultDate.toLocaleDateString(locale, options);
    
    const diffDays = Math.floor(Math.abs(resultDate - startDate) / (1000 * 60 * 60 * 24));
    const infoText = operation === '+' 
        ? `${diffDays} ${window.i18n?.translate('date_calc.days_after') || 'days after'}`
        : `${diffDays} ${window.i18n?.translate('date_calc.days_before') || 'days before'}`;
    
    document.getElementById('addResultInfo').textContent = infoText;
    document.getElementById('addResult').style.display = 'block';
}

// Calculate Age
function calculateAge() {
    const birthDateStr = document.getElementById('birthDate').value;
    
    if (!birthDateStr) {
        alert(window.i18n?.translate('date_calc.error.select_birth_date') || 'Please select your birth date');
        return;
    }
    
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    
    if (birthDate > today) {
        alert(window.i18n?.translate('date_calc.error.future_date') || 'Birth date cannot be in the future');
        return;
    }
    
    // Calculate age
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Total calculations
    const totalMonths = years * 12 + months;
    const diffMs = today - birthDate;
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    
    // Display age
    document.getElementById('ageYears').textContent = years;
    document.getElementById('ageMonths').textContent = months;
    document.getElementById('ageDays').textContent = days;
    document.getElementById('ageTotalMonths').textContent = totalMonths.toLocaleString();
    document.getElementById('ageTotalWeeks').textContent = totalWeeks.toLocaleString();
    document.getElementById('ageTotalDays').textContent = totalDays.toLocaleString();
    
    // Calculate next birthday
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntilBirthday = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
    const locale = localStorage.getItem('language') || 'vi';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    const birthdayText = `${nextBirthday.toLocaleDateString(locale, options)} (${daysUntilBirthday} ${window.i18n?.translate('date_calc.days_left') || 'days left'})`;
    document.getElementById('nextBirthday').textContent = birthdayText;
    
    document.getElementById('ageResult').style.display = 'block';
}

// Calculate Weekday
function calculateWeekday() {
    const dateStr = document.getElementById('weekdayDate').value;
    
    if (!dateStr) {
        alert(window.i18n?.translate('date_calc.error.select_date') || 'Please select a date');
        return;
    }
    
    const date = new Date(dateStr);
    const locale = localStorage.getItem('language') || 'vi';
    
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
    
    const infoText = `
        <strong>${fullDate}</strong><br>
        ${window.i18n?.translate('date_calc.day_of_year') || 'Day of year'}: ${dayOfYear}<br>
        ${window.i18n?.translate('date_calc.week_of_year') || 'Week of year'}: ${weekOfYear}
    `;
    
    document.getElementById('weekdayInfo').innerHTML = infoText;
    document.getElementById('weekdayResult').style.display = 'block';
}

// Helper function: Get day of year
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
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
if (window.i18n) {
    window.i18n.on('languageChanged', function() {
        // Re-render results if they exist
        if (document.getElementById('diffResult').style.display === 'block') {
            calculateDateDifference();
        }
        if (document.getElementById('ageResult').style.display === 'block') {
            calculateAge();
        }
        if (document.getElementById('weekdayResult').style.display === 'block') {
            calculateWeekday();
        }
    });
}
