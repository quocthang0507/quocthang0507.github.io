// Unified Controller for Weekly, Monthly, and Yearly Calendar pages
// Powered by shared window.CalendarCore + LunarCalendar + VietnamHolidays

document.addEventListener('DOMContentLoaded', function () {
    const root = document.querySelector('[data-calendar-view]');
    if (!root || !window.CalendarCore) return;

    const Core = window.CalendarCore;
    const view = root.dataset.calendarView;
    const esc = (s) => (typeof window.escapeHtml === 'function'
        ? window.escapeHtml(s)
        : String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
    const tr = (key, fallback) => {
        if (typeof window.t === 'function') {
            const val = window.t(key, fallback);
            if (val && val !== key) return val;
        }
        return fallback !== undefined ? fallback : key;
    };

    const params = new URLSearchParams(window.location.search);
    const today = new Date();
    const MIN_YEAR = 1950;
    const MAX_YEAR = 2100;

    function clampYear(y) {
        const n = parseInt(y, 10);
        if (Number.isNaN(n)) return today.getFullYear();
        return Math.min(MAX_YEAR, Math.max(MIN_YEAR, n));
    }

    function clampMonth(m) {
        const n = parseInt(m, 10);
        if (Number.isNaN(n)) return today.getMonth() + 1;
        return Math.min(12, Math.max(1, n));
    }

    function toIsoInputValue(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function populateYearSelect(selectEl, selectedYear) {
        if (!selectEl) return;
        const options = [];
        for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
            const canChi = window.LunarCalendar ? ` (${window.LunarCalendar.getCanChi(y)})` : '';
            options.push(`<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}${esc(canChi)}</option>`);
        }
        selectEl.innerHTML = options.join('');
    }

    // ═══════════════════════════════════════════
    // 0. DAILY BLOC CALENDAR VIEW (Lịch ngày kiểu Lịch Bloc Việt Nam)
    // ═══════════════════════════════════════════
    function initDailyView() {
        let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const qDate = params.get('date');
        if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
            const [y, m, d] = qDate.split('-').map(Number);
            currentDate = new Date(y, m - 1, d);
        }
        let photoOverride = null;

        const containerEl = document.getElementById('daily-bloc-sheet');
        const datePicker = document.getElementById('daily-date-picker');
        const prevBtn = document.getElementById('daily-prev-btn');
        const todayBtn = document.getElementById('daily-today-btn');
        const nextBtn = document.getElementById('daily-next-btn');
        const shufflePhotoBtn = document.getElementById('daily-shuffle-photo-btn');
        const detailsBtn = document.getElementById('daily-details-btn');
        const copyBtn = document.getElementById('daily-copy-btn');

        const ENGLISH_MONTHS = [
            '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        const ENGLISH_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

        function render(animateDir = '') {
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const bloc = Core.getBlocDetails(day, month, year, photoOverride);
            const weekDates = Core.getWeekDates(currentDate, 1);
            const lang = (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';
            const isVi = lang === 'vi';

            if (datePicker) datePicker.value = toIsoInputValue(currentDate);

            const isRedDay = bloc.weekday === 0 || (bloc.holiday && bloc.holiday.is_public_holiday);
            const statusGood = bloc.goodBad && bloc.goodBad.status === 'tốt';
            const statusBad = bloc.goodBad && bloc.goodBad.status === 'xấu';
            const statusClass = statusGood ? 'success' : (statusBad ? 'danger' : 'secondary');
            const statusLabel = statusGood
                ? tr('lunar.status_good', 'Ngày Hoàng Đạo (Tốt)')
                : (statusBad ? tr('lunar.status_bad', 'Ngày Hắc Đạo (Xấu/Kiêng kỵ)') : tr('lunar.status_normal', 'Ngày Bình Thường'));
            const starText = bloc.goodBad ? (isVi ? bloc.goodBad.starName : bloc.goodBad.starNameEn) : '';

            const shouldDo = statusGood
                ? (isVi ? 'Khai trương, cưới hỏi, ký kết, xuất hành, động thổ.' : 'Grand openings, weddings, signing contracts, travel.')
                : (statusBad
                    ? (isVi ? 'Dọn dẹp nhà cửa, nghỉ ngơi, công việc thường nhật.' : 'Tidying up, resting, routine tasks.')
                    : (isVi ? 'Công việc thường nhật, gặp gỡ, học tập, thiện nguyện.' : 'Routine work, study, meetings, volunteering.'));

            const eventBannerHtml = bloc.holiday
                ? `<div class="bloc-event-banner ${bloc.holiday.is_public_holiday ? 'is-public' : (bloc.holiday.is_workday_swap ? 'is-swap' : 'is-event')}">
                        <i class="fas ${bloc.holiday.is_public_holiday ? 'fa-star' : 'fa-calendar-check'} me-1"></i>
                        <strong>${esc(bloc.holiday.name)}</strong>
                        ${bloc.holiday.schedule_note ? `<span class="d-block small fw-normal mt-1">${esc(bloc.holiday.schedule_note)}</span>` : ''}
                   </div>`
                : `<div class="bloc-quote-banner">
                        <i class="fas fa-quote-left me-1 opacity-50"></i>${esc(bloc.quote)}
                   </div>`;

            const weekStripHtml = weekDates.map(wd => {
                const isSel = wd.getDate() === day && (wd.getMonth() + 1) === month && wd.getFullYear() === year;
                const dInfo = Core.getDayInfo(wd.getDate(), wd.getMonth() + 1, wd.getFullYear());
                const cls = ['bloc-week-day'];
                if (isSel) cls.push('is-selected');
                if (dInfo.isToday) cls.push('is-today');
                if (dInfo.weekday === 0 || (dInfo.holiday && dInfo.holiday.is_public_holiday)) cls.push('is-red');
                return `<button type="button" class="${cls.join(' ')}" data-bloc-jump="${toIsoInputValue(wd)}" title="${Core.formatShortDate(wd.getDate(), wd.getMonth() + 1, wd.getFullYear())}">
                    <span class="bloc-wd-label">${esc(Core.getWeekdayName(wd.getDay(), true))}</span>
                    <span class="bloc-wd-num">${String(wd.getDate()).padStart(2, '0')}</span>
                </button>`;
            }).join('');

            const hoursHtml = bloc.hoangDaoHours.map(h =>
                `<span class="bloc-hour-chip"><strong>${esc(h.chi)}</strong> <span>(${esc(h.range)})</span></span>`
            ).join('');

            const photoCaption = isVi ? bloc.photo.title : (bloc.photo.titleEn || bloc.photo.title);
            const lunarDayStr = bloc.lunar ? String(bloc.lunar.day) : '—';
            const lunarMonthStr = bloc.lunar ? bloc.lunarMonthName : '';
            const lunarYearStr = bloc.lunar ? `${bloc.lunar.year}` : `${year}`;

            if (containerEl) {
                containerEl.classList.remove('bloc-flip-next', 'bloc-flip-prev');
                containerEl.innerHTML = `
                    <article class="bloc-card">
                        <!-- Top Ceremonial Crimson & Gold Header -->
                        <div class="bloc-header">
                            <div class="bloc-header-year">
                                <span class="bloc-year-num">${year}</span>
                                <span class="bloc-year-canchi">${esc(bloc.yearZodiac.icon)} ${esc(bloc.yearCanChi)}</span>
                            </div>
                            <div class="bloc-header-month">
                                <div class="bloc-month-vi">${esc(Core.getMonthName(month).toUpperCase())}</div>
                                <div class="bloc-month-en">${ENGLISH_MONTHS[month]}</div>
                            </div>
                            <div class="bloc-header-meta">
                                <span class="bloc-iso-pill">${esc(tr('lunar.week_of_year', 'Tuần'))} ${bloc.isoWeek}</span>
                                ${bloc.napAm.name ? `<span class="bloc-napam-pill">${esc(bloc.napAm.name)}</span>` : ''}
                            </div>
                        </div>

                        <!-- Scenic Featured Picture of Vietnam (Wikimedia Commons) -->
                        <div class="bloc-hero">
                            <img class="bloc-hero-img" src="${esc(bloc.photo.url)}" alt="${esc(photoCaption)}" loading="eager" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.style.display='none'">
                            <div class="bloc-hero-overlay">
                                <div class="bloc-hero-title">
                                    <i class="fas fa-map-marker-alt me-1"></i>${esc(photoCaption)}
                                    <span class="opacity-75">· ${esc(bloc.photo.location)}</span>
                                </div>
                                <a class="bloc-hero-credit" href="${esc(bloc.photo.page)}" target="_blank" rel="noopener noreferrer">
                                    Wikimedia Commons · ${esc(bloc.photo.author)} (${esc(bloc.photo.license)}) · ${bloc.photoIndex + 1}/${bloc.totalPhotos}
                                </a>
                            </div>
                        </div>

                        <!-- Sculptural Giant Solar Day Number -->
                        <div class="bloc-solar-stage">
                            <div class="bloc-solar-ornament left" aria-hidden="true">✦</div>
                            <div class="bloc-solar-number${isRedDay ? ' is-red' : ''}">${day}</div>
                            <div class="bloc-solar-ornament right" aria-hidden="true">✦</div>
                        </div>

                        <!-- Holiday or Proverb Ribbon -->
                        <div class="bloc-middle-strip">
                            ${eventBannerHtml}
                        </div>

                        <!-- Weekday Divider Ribbon -->
                        <div class="bloc-weekday-bar">
                            <span class="bloc-weekday-vi${isRedDay ? ' is-red' : ''}">${esc(bloc.weekdayName.toUpperCase())}</span>
                            <span class="bloc-weekday-en">${ENGLISH_DAYS[bloc.weekday]}</span>
                        </div>

                        <!-- Traditional 3-Column Lịch Bloc Footer -->
                        <div class="bloc-lower-grid">
                            <!-- Left: Day Zodiac Emblem & Can Chi Stack -->
                            <div class="bloc-col bloc-col-canchi">
                                <div class="bloc-zodiac-medallion" title="${esc(bloc.dayZodiac.chi)} (${esc(bloc.dayZodiac.animal)})">
                                    <span class="bloc-zodiac-emoji" aria-hidden="true">${bloc.dayZodiac.icon}</span>
                                    <span class="bloc-zodiac-label">${esc(bloc.dayZodiac.chi)}</span>
                                </div>
                                <ul class="bloc-canchi-list">
                                    <li><span>${esc(tr('cal.bloc_day', 'Ngày'))}:</span> <strong>${esc(bloc.dayCanChi)}</strong></li>
                                    <li><span>${esc(tr('cal.bloc_month', 'Tháng'))}:</span> <strong>${esc(bloc.monthCanChi)}</strong></li>
                                    <li><span>${esc(tr('cal.bloc_year', 'Năm'))}:</span> <strong>${esc(bloc.yearCanChi)}</strong></li>
                                    <li><span>${esc(tr('cal.bloc_first_hour', 'Giờ đầu'))}:</span> <strong>${esc(bloc.firstHourCanChi)}</strong></li>
                                </ul>
                            </div>

                            <!-- Center: Giant Lunar Date + Auspicious Badge -->
                            <div class="bloc-col bloc-col-lunar">
                                <div class="bloc-lunar-caption">${esc(lunarMonthStr.toUpperCase())}</div>
                                <div class="bloc-lunar-number">${esc(lunarDayStr)}</div>
                                <div class="bloc-lunar-year-sub">${esc(tr('lunar.lunar', 'Âm lịch'))} · ${esc(lunarYearStr)}</div>
                                <span class="badge bg-${statusClass}-subtle text-${statusClass}-emphasis border mt-2">${esc(statusLabel)}</span>
                            </div>

                            <!-- Right: Giờ Hoàng Đạo & Favorable Activities -->
                            <div class="bloc-col bloc-col-hours">
                                <div class="bloc-section-label">
                                    <i class="fas fa-clock me-1"></i>${esc(tr('cal.bloc_hoang_dao_hours', 'GIỜ HOÀNG ĐẠO'))}
                                </div>
                                <div class="bloc-hours-list">${hoursHtml}</div>
                                ${starText ? `<div class="bloc-star-line"><strong>${esc(tr('lunar.zodiac_star', 'Sao'))}:</strong> ${esc(starText)}</div>` : ''}
                                <div class="bloc-advice-line"><strong>${esc(tr('lunar.should_do', 'Thuận lợi'))}:</strong> ${esc(shouldDo)}</div>
                            </div>
                        </div>

                        <!-- Bottom Mini 7-Day Week Strip (like traditional printed Lịch Bloc) -->
                        <div class="bloc-week-strip">
                            ${weekStripHtml}
                        </div>
                    </article>
                `;

                if (animateDir) {
                    void containerEl.offsetWidth;
                    containerEl.classList.add(animateDir === 'next' ? 'bloc-flip-next' : 'bloc-flip-prev');
                }

                containerEl.querySelectorAll('[data-bloc-jump]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const [y, m, d] = btn.dataset.blocJump.split('-').map(Number);
                        currentDate = new Date(y, m - 1, d);
                        photoOverride = null;
                        render();
                    });
                });
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() - 1); photoOverride = null; render('prev'); });
        if (nextBtn) nextBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() + 1); photoOverride = null; render('next'); });
        if (todayBtn) todayBtn.addEventListener('click', () => { currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); photoOverride = null; render(); });
        if (datePicker) {
            datePicker.addEventListener('change', () => {
                if (!datePicker.value) return;
                const [y, m, d] = datePicker.value.split('-').map(Number);
                currentDate = new Date(y, m - 1, d);
                photoOverride = null;
                render();
            });
        }
        if (shufflePhotoBtn) {
            shufflePhotoBtn.addEventListener('click', () => {
                const bloc = Core.getBlocDetails(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear(), photoOverride);
                photoOverride = (bloc.photoIndex + 1) % bloc.totalPhotos;
                render();
            });
        }
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                Core.showDateDetails(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear());
            });
        }
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const bloc = Core.getBlocDetails(currentDate.getDate(), currentDate.getMonth() + 1, currentDate.getFullYear(), photoOverride);
                const text = [
                    `${bloc.weekdayName}, ${Core.formatShortDate(bloc.day, bloc.month, bloc.year)}`,
                    bloc.lunar ? `Âm lịch: ${bloc.lunar.day}/${bloc.lunar.month}/${bloc.lunar.year} (${bloc.lunarMonthName})` : '',
                    `Ngày ${bloc.dayCanChi} · Tháng ${bloc.monthCanChi} · Năm ${bloc.yearCanChi} (${bloc.napAm.name})`,
                    `Giờ Hoàng Đạo: ${bloc.hoangDaoHours.map(h => h.label).join(', ')}`,
                    bloc.holiday ? `Ngày lễ: ${bloc.holiday.name}` : ''
                ].filter(Boolean).join('\n');
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        if (typeof window.showAlert === 'function') window.showAlert(tr('lunar.copied', 'Đã sao chép!'), 'success');
                    }).catch(() => {});
                }
            });
        }

        // Keyboard Left/Right arrow to flip calendar pages
        document.addEventListener('keydown', e => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.key === 'ArrowLeft') { currentDate.setDate(currentDate.getDate() - 1); photoOverride = null; render('prev'); }
            else if (e.key === 'ArrowRight') { currentDate.setDate(currentDate.getDate() + 1); photoOverride = null; render('next'); }
        });

        window.addEventListener('languageChanged', () => render());
        window.addEventListener('vietnamHolidaysLoaded', () => render());
        window.addEventListener('vietnamPhotosLoaded', () => render());
        render();

        return () => ({
            targetEl: containerEl,
            filename: `lich-bloc-${toIsoInputValue(currentDate)}.png`,
            orientation: 'portrait'
        });
    }

    // ═══════════════════════════════════════════
    // 1. WEEKLY CALENDAR VIEW
    // ═══════════════════════════════════════════
    function initWeeklyView() {
        let anchorDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const qDate = params.get('date');
        if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
            const [y, m, d] = qDate.split('-').map(Number);
            anchorDate = new Date(y, m - 1, d);
        }

        const titleEl = document.getElementById('week-range-title');
        const subtitleEl = document.getElementById('week-meta-subtitle');
        const gridEl = document.getElementById('weekly-calendar-grid');
        const summaryEl = document.getElementById('weekly-summary');
        const datePicker = document.getElementById('week-date-picker');
        const prevBtn = document.getElementById('prev-week-btn');
        const nextBtn = document.getElementById('next-week-btn');
        const todayBtn = document.getElementById('this-week-btn');

        function render() {
            const weekDates = Core.getWeekDates(anchorDate, 1); // Monday -> Sunday
            const first = weekDates[0];
            const last = weekDates[6];
            const isoWeek = Core.computeISOWeek(first);

            if (datePicker) datePicker.value = toIsoInputValue(anchorDate);
            if (titleEl) {
                titleEl.textContent = `${tr('lunar.week_of_year', 'Tuần')} ${isoWeek} · ${Core.formatShortDate(first.getDate(), first.getMonth() + 1, first.getFullYear())} – ${Core.formatShortDate(last.getDate(), last.getMonth() + 1, last.getFullYear())}`;
            }

            let goodCount = 0;
            let holidayCount = 0;
            const lang = (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';
            const isVi = lang === 'vi';

            const cardsHtml = weekDates.map(d => {
                const info = Core.getDayInfo(d.getDate(), d.getMonth() + 1, d.getFullYear());
                if (info.goodBad && info.goodBad.status === 'tốt') goodCount++;
                if (info.holiday) holidayCount++;

                const cardClasses = ['week-day-card'];
                if (info.isToday) cardClasses.push('is-today');
                if (info.isWeekend) cardClasses.push('is-weekend');
                if (info.holiday) {
                    cardClasses.push(info.holiday.is_public_holiday ? 'is-public-holiday' : (info.holiday.is_workday_swap ? 'is-workday-swap' : 'is-commemorative'));
                }

                let statusBadge = '';
                if (info.goodBad) {
                    const cls = info.goodBad.status === 'tốt' ? 'success' : (info.goodBad.status === 'xấu' ? 'danger' : 'secondary');
                    const lbl = info.goodBad.status === 'tốt'
                        ? tr('cal.good_short', 'Hoàng Đạo')
                        : (info.goodBad.status === 'xấu' ? tr('cal.bad_short', 'Hắc Đạo') : tr('cal.normal_short', 'Bình thường'));
                    const star = isVi ? info.goodBad.starName : info.goodBad.starNameEn;
                    statusBadge = `
                        <div class="d-flex flex-wrap align-items-center gap-1 mt-2">
                            <span class="badge bg-${cls}-subtle text-${cls}-emphasis border">${esc(lbl)}</span>
                            <span class="small text-muted">${esc(star)}</span>
                        </div>
                        <div class="small text-muted mt-1">${esc(tr('lunar.day_canchi', 'Can Chi ngày'))}: <strong>${esc(info.goodBad.dayCanChi)}</strong></div>`;
                }

                let holidayHtml = '';
                if (info.holiday) {
                    const hClass = info.holiday.is_public_holiday
                        ? 'danger'
                        : (info.holiday.is_workday_swap ? 'warning' : 'info');
                    holidayHtml = `
                        <div class="mt-2 pt-2 border-top">
                            <span class="badge bg-${hClass}-subtle text-${hClass}-emphasis border text-wrap text-start">
                                <i class="fas ${info.holiday.is_public_holiday ? 'fa-star' : (info.holiday.is_workday_swap ? 'fa-exchange-alt' : 'fa-calendar-alt')} me-1"></i>
                                ${esc(info.holiday.name)}
                            </span>
                        </div>`;
                }

                const lunarWord = tr('lunar.lunar', 'Âm lịch').replace(/:\s*$/, '');
                const lunarLine = info.lunar
                    ? `${info.lunar.day}/${info.lunar.month}${info.lunar.isLeap ? '*' : ''} ${lunarWord} · ${info.canChi}`
                    : '';

                return `
                    <div class="${cardClasses.join(' ')}" role="button" tabindex="0" data-calendar-open-date="1" data-date="${info.day}" data-month="${info.month}" data-year="${info.year}">
                        <div class="d-flex justify-content-between align-items-start gap-2">
                            <div>
                                <div class="small fw-semibold text-uppercase text-muted">${esc(info.weekdayName)}</div>
                                <div class="week-solar-num">${info.day}<span class="week-solar-month">/${info.month}/${info.year}</span></div>
                            </div>
                            ${info.isToday ? `<span class="badge bg-primary">${esc(tr('cal.today_badge', 'Hôm nay'))}</span>` : `<span class="badge bg-secondary-subtle text-secondary-emphasis border">#${info.dayOfYear}</span>`}
                        </div>
                        ${lunarLine ? `<div class="small fw-medium text-primary mt-1"><i class="fas fa-moon me-1"></i>${esc(lunarLine)}</div>` : ''}
                        ${statusBadge}
                        ${holidayHtml}
                    </div>`;
            }).join('');

            if (gridEl) {
                gridEl.innerHTML = `<div class="weekly-cards-grid">${cardsHtml}</div>`;
                Core.bindDayClickHandlers(gridEl);
                gridEl.querySelectorAll('[data-calendar-open-date]').forEach(card => {
                    card.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            card.click();
                        }
                    });
                });
            }

            if (subtitleEl) {
                const startInfo = Core.getDayInfo(first.getDate(), first.getMonth() + 1, first.getFullYear());
                const yearText = startInfo.canChi ? `${first.getFullYear()} (${startInfo.canChi})` : `${first.getFullYear()}`;
                subtitleEl.textContent = yearText;
            }

            if (summaryEl) {
                summaryEl.innerHTML = `
                    <span class="badge bg-success-subtle text-success-emphasis border px-3 py-2">
                        <i class="fas fa-sun me-1"></i>${esc(tr('cal.good_days_count', 'Ngày Hoàng Đạo'))}: <strong>${goodCount}</strong>
                    </span>
                    <span class="badge bg-danger-subtle text-danger-emphasis border px-3 py-2">
                        <i class="fas fa-star me-1"></i>${esc(tr('cal.holidays_count', 'Ngày lễ / sự kiện'))}: <strong>${holidayCount}</strong>
                    </span>
                    <span class="badge bg-primary-subtle text-primary-emphasis border px-3 py-2">
                        <i class="fas fa-calendar-week me-1"></i>${esc(tr('lunar.week_of_year', 'Tuần'))} ISO: <strong>${isoWeek}</strong>
                    </span>`;
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { anchorDate.setDate(anchorDate.getDate() - 7); render(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { anchorDate.setDate(anchorDate.getDate() + 7); render(); });
        if (todayBtn) todayBtn.addEventListener('click', () => { anchorDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); render(); });
        if (datePicker) {
            datePicker.addEventListener('change', () => {
                if (!datePicker.value) return;
                const [y, m, d] = datePicker.value.split('-').map(Number);
                anchorDate = new Date(y, m - 1, d);
                render();
            });
        }

        window.addEventListener('languageChanged', render);
        window.addEventListener('vietnamHolidaysLoaded', render);
        render();

        return () => {
            const weekDates = Core.getWeekDates(anchorDate, 1);
            const first = weekDates[0];
            const isoWeek = String(Core.computeISOWeek(first)).padStart(2, '0');
            return {
                targetEl: document.getElementById('weekly-export-area') || root,
                filename: `lich-tuan-${isoWeek}-${first.getFullYear()}.png`,
                orientation: 'landscape'
            };
        };
    }

    // ═══════════════════════════════════════════
    // 2. MONTHLY CALENDAR VIEW
    // ═══════════════════════════════════════════
    function initMonthlyView() {
        let currentYear = clampYear(params.get('year') || today.getFullYear());
        let currentMonth = clampMonth(params.get('month') || (today.getMonth() + 1));
        let weekStartsOn = 1; // Monday default (Vietnamese calendar convention)
        let filterMode = 'all';

        const titleEl = document.getElementById('monthly-title');
        const subtitleEl = document.getElementById('monthly-subtitle');
        const monthSelect = document.getElementById('monthly-month-select');
        const yearSelect = document.getElementById('monthly-year-select');
        const startSelect = document.getElementById('monthly-week-start');
        const filterSelect = document.getElementById('monthly-filter');
        const gridEl = document.getElementById('monthly-calendar-display');
        const holidaysListEl = document.getElementById('monthly-holidays-list');
        const goodDaysEl = document.getElementById('monthly-good-days-list');
        const prevBtn = document.getElementById('monthly-prev-btn');
        const nextBtn = document.getElementById('monthly-next-btn');
        const todayBtn = document.getElementById('monthly-today-btn');

        function populateMonthSelect() {
            if (!monthSelect) return;
            const opts = [];
            for (let m = 1; m <= 12; m++) {
                opts.push(`<option value="${m}"${m === currentMonth ? ' selected' : ''}>${esc(Core.getMonthName(m))}</option>`);
            }
            monthSelect.innerHTML = opts.join('');
        }

        function render() {
            populateMonthSelect();
            populateYearSelect(yearSelect, currentYear);
            if (monthSelect) monthSelect.value = String(currentMonth);
            if (yearSelect) yearSelect.value = String(currentYear);

            const monthName = Core.getMonthName(currentMonth);
            const canChi = window.LunarCalendar ? window.LunarCalendar.getCanChi(currentYear) : '';
            const napAm = Core.getNapAm(currentYear);
            if (titleEl) titleEl.textContent = `${monthName} ${currentYear}`;
            if (subtitleEl) {
                subtitleEl.textContent = canChi
                    ? `${tr('lunar.year', 'Năm')} ${canChi}${napAm.name ? ` · ${napAm.name}` : ''}`
                    : String(currentYear);
            }

            if (gridEl) {
                gridEl.innerHTML = Core.renderMonthTableHTML(currentYear, currentMonth, {
                    weekStartsOn,
                    compact: false,
                    showWeekNumbers: true,
                    showGoodBad: true,
                    showHolidayLabels: true,
                    filterMode
                });
                Core.bindDayClickHandlers(gridEl);
            }

            const summary = Core.getMonthSummary(currentYear, currentMonth);

            if (holidaysListEl) {
                if (summary.holidays.length === 0) {
                    holidaysListEl.innerHTML = `<p class="text-muted small mb-0">${esc(tr('cal.no_holidays_month', 'Không có ngày lễ đặc biệt trong tháng này.'))}</p>`;
                } else {
                    holidaysListEl.innerHTML = summary.holidays.map(info => {
                        const h = info.holiday;
                        const badgeCls = h.is_public_holiday ? 'danger' : (h.is_workday_swap ? 'warning' : 'info');
                        const lunarTxt = info.lunar ? ` (${info.lunar.day}/${info.lunar.month} ÂL)` : '';
                        return `
                            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2 text-start" data-calendar-open-date="1" data-date="${info.day}" data-month="${info.month}" data-year="${info.year}">
                                <div>
                                    <div class="fw-semibold">${esc(h.name)}</div>
                                    <div class="small text-muted">${esc(info.weekdayName)}, ${Core.formatShortDate(info.day, info.month, info.year)}${esc(lunarTxt)}</div>
                                    ${h.schedule_note ? `<div class="small text-muted mt-1">${esc(h.schedule_note)}</div>` : ''}
                                </div>
                                <span class="badge bg-${badgeCls}-subtle text-${badgeCls}-emphasis border flex-shrink-0">
                                    ${esc(h.is_public_holiday ? tr('cal.public_holiday_short', 'Nghỉ lễ') : (h.is_workday_swap ? tr('cal.workday_swap_short', 'Làm bù') : tr('cal.event_short', 'Sự kiện')))}
                                </span>
                            </button>`;
                    }).join('');
                    Core.bindDayClickHandlers(holidaysListEl);
                }
            }

            if (goodDaysEl) {
                if (summary.goodDays.length === 0) {
                    goodDaysEl.innerHTML = `<p class="text-muted small mb-0">—</p>`;
                } else {
                    goodDaysEl.innerHTML = summary.goodDays.map(info => {
                        const lunarTxt = info.lunar ? `${info.lunar.day}/${info.lunar.month} ÂL` : '';
                        return `
                            <button type="button" class="btn btn-sm btn-outline-success calendar-date-pill" data-calendar-open-date="1" data-date="${info.day}" data-month="${info.month}" data-year="${info.year}">
                                <strong>${Core.formatShortDate(info.day, info.month)}</strong>
                                <span class="small opacity-75">(${esc(lunarTxt)})</span>
                            </button>`;
                    }).join('');
                    Core.bindDayClickHandlers(goodDaysEl);
                }
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 1) {
                    currentMonth = 12;
                    currentYear = Math.max(MIN_YEAR, currentYear - 1);
                }
                render();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear = Math.min(MAX_YEAR, currentYear + 1);
                }
                render();
            });
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentYear = today.getFullYear();
                currentMonth = today.getMonth() + 1;
                render();
            });
        }
        if (monthSelect) monthSelect.addEventListener('change', () => { currentMonth = clampMonth(monthSelect.value); render(); });
        if (yearSelect) yearSelect.addEventListener('change', () => { currentYear = clampYear(yearSelect.value); render(); });
        if (startSelect) startSelect.addEventListener('change', () => { weekStartsOn = parseInt(startSelect.value, 10) === 0 ? 0 : 1; render(); });
        if (filterSelect) filterSelect.addEventListener('change', () => { filterMode = filterSelect.value || 'all'; render(); });

        window.addEventListener('languageChanged', render);
        window.addEventListener('vietnamHolidaysLoaded', render);
        render();

        return () => ({
            targetEl: document.getElementById('monthly-export-area') || root,
            filename: `lich-thang-${currentYear}-${String(currentMonth).padStart(2, '0')}.png`,
            orientation: 'landscape'
        });
    }

    // ═══════════════════════════════════════════
    // 3. YEARLY CALENDAR VIEW (ngaydep.com style 12-month lunar-solar overview)
    // ═══════════════════════════════════════════
    function initYearlyView() {
        let currentYear = clampYear(params.get('year') || today.getFullYear());
        let filterMode = 'all';
        let weekStartsOn = 1;

        const yearSelect = document.getElementById('yearly-year-select');
        const filterSelect = document.getElementById('yearly-filter');
        const prevBtn = document.getElementById('yearly-prev-btn');
        const nextBtn = document.getElementById('yearly-next-btn');
        const thisYearBtn = document.getElementById('yearly-current-btn');
        const overviewEl = document.getElementById('yearly-overview-banner');
        const headerBadgeEl = document.getElementById('yearly-header-badge');
        const gridEl = document.getElementById('yearly-months-grid');
        const publicListEl = document.getElementById('yearly-public-holidays');
        const lunarListEl = document.getElementById('yearly-lunar-events');
        const monthlyBaseUrl = root.dataset.monthlyUrl || '/monthly-calendar/';

        function render() {
            populateYearSelect(yearSelect, currentYear);
            if (yearSelect) yearSelect.value = String(currentYear);

            const overview = Core.getYearOverview(currentYear);
            if (headerBadgeEl) {
                headerBadgeEl.textContent = overview.canChi ? `${overview.year} · ${overview.canChi}` : String(overview.year);
            }

            // 1. Year Overview Banner (inspired by ngaydep.com/xem-lich-nam-2026.html)
            if (overviewEl) {
                const tetText = overview.tetSolar
                    ? `${overview.tetSolar.weekdayName}, ${Core.formatShortDate(overview.tetSolar.day, overview.tetSolar.month, overview.tetSolar.year)}`
                    : '—';
                const rangeText = overview.tetSolar && overview.lunarYearEndSolar
                    ? `${Core.formatShortDate(overview.tetSolar.day, overview.tetSolar.month, overview.tetSolar.year)} – ${Core.formatShortDate(overview.lunarYearEndSolar.day, overview.lunarYearEndSolar.month, overview.lunarYearEndSolar.year)}`
                    : '—';
                const leapText = overview.leapMonth
                    ? `${tr('cal.lunar_leap_month', 'Tháng nhuận')}: ${tr('month.' + overview.leapMonth, 'Tháng ' + overview.leapMonth)}`
                    : tr('cal.no_lunar_leap', 'Không có tháng nhuận âm lịch');

                overviewEl.innerHTML = `
                    <div class="row g-3 align-items-center">
                        <div class="col-lg-5">
                            <div class="small text-uppercase fw-semibold text-primary mb-1">
                                <i class="fas fa-calendar me-1"></i>${esc(tr('cal.year_overview_label', 'Tổng quan Lịch Âm Dương'))}
                            </div>
                            <h2 class="h4 fw-bold mb-1">
                                ${esc(tr('lunar.year', 'Năm'))} ${overview.year} · ${esc(overview.canChi)}
                            </h2>
                            <div class="d-flex flex-wrap gap-2 mt-2">
                                ${overview.zodiac ? `<span class="badge bg-info-subtle text-info-emphasis border">${esc(overview.zodiac)}</span>` : ''}
                                ${overview.napAm.name ? `<span class="badge bg-primary-subtle text-primary-emphasis border">${esc(tr('cal.nap_am', 'Mệnh'))}: ${esc(overview.napAm.name)}${overview.napAm.meaning ? ` (${esc(overview.napAm.meaning)})` : ''}</span>` : ''}
                                <span class="badge bg-secondary-subtle text-secondary-emphasis border">${overview.totalSolarDays} ${esc(tr('date_calc.days', 'ngày'))}</span>
                            </div>
                        </div>
                        <div class="col-lg-7">
                            <div class="row g-2 small">
                                <div class="col-sm-6">
                                    <div class="year-stat-box">
                                        <span class="text-muted d-block">${esc(tr('cal.tet_date', 'Mùng 1 Tết Nguyên đán'))}</span>
                                        <strong class="text-danger">${esc(tetText)}</strong>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="year-stat-box">
                                        <span class="text-muted d-block">${esc(tr('cal.lunar_year_span', 'Thời gian năm Âm lịch'))}</span>
                                        <strong>${esc(rangeText)}</strong>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="year-stat-box">
                                        <span class="text-muted d-block">${esc(tr('cal.leap_info', 'Năm nhuận'))}</span>
                                        <strong>${esc(leapText)}</strong>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <div class="year-stat-box">
                                        <span class="text-muted d-block">${esc(tr('cal.public_holidays_in_year', 'Ngày nghỉ lễ / hoán đổi'))}</span>
                                        <strong>${overview.publicHolidays.length} ${esc(tr('cal.milestones', 'mốc trong năm'))}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }

            // 2. 12-Month Compact Grid
            if (gridEl) {
                const cards = [];
                for (let m = 1; m <= 12; m++) {
                    const monthTitle = `${Core.getMonthName(m)} ${currentYear}`;
                    const monthUrl = `${monthlyBaseUrl}?year=${currentYear}&month=${m}`;
                    const tableHtml = Core.renderMonthTableHTML(currentYear, m, {
                        weekStartsOn,
                        compact: true,
                        showGoodBad: true,
                        filterMode
                    });
                    const isCurrentMonth = currentYear === today.getFullYear() && m === (today.getMonth() + 1);
                    cards.push(`
                        <div class="card year-month-card h-100${isCurrentMonth ? ' is-current-month' : ''}">
                            <div class="card-header d-flex justify-content-between align-items-center py-2 px-3">
                                <a href="${esc(monthUrl)}" class="fw-bold text-decoration-none year-month-link">
                                    ${esc(monthTitle)}
                                </a>
                                <a href="${esc(monthUrl)}" class="btn btn-sm btn-outline-primary py-0 px-2 calendar-no-print" title="${esc(tr('cal.open_month', 'Xem chi tiết tháng'))}">
                                    <i class="fas fa-external-link-alt fa-xs"></i>
                                </a>
                            </div>
                            <div class="card-body p-2">
                                ${tableHtml}
                            </div>
                        </div>`);
                }
                gridEl.innerHTML = `<div class="yearly-months-grid">${cards.join('')}</div>`;
                Core.bindDayClickHandlers(gridEl);
            }

            // 3. Public Holidays & Major Lunar Festivals Tables
            if (publicListEl) {
                if (overview.publicHolidays.length === 0) {
                    publicListEl.innerHTML = `<p class="text-muted small mb-0">${esc(tr('cal.loading_holidays', 'Đang tải danh sách ngày lễ...'))}</p>`;
                } else {
                    publicListEl.innerHTML = overview.publicHolidays.map(info => {
                        const h = info.holiday;
                        const badgeCls = h.is_public_holiday ? 'danger' : 'warning';
                        const badgeText = h.is_public_holiday
                            ? tr('cal.public_holiday_short', 'Nghỉ lễ')
                            : tr('cal.workday_swap_short', 'Làm bù');
                        const lunarTxt = info.lunar ? `${info.lunar.day}/${info.lunar.month} ÂL` : '';
                        return `
                            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2 text-start" data-calendar-open-date="1" data-date="${info.day}" data-month="${info.month}" data-year="${info.year}">
                                <div>
                                    <div class="fw-semibold">${esc(h.name)}</div>
                                    <div class="small text-muted">${esc(info.weekdayName)}, ${Core.formatShortDate(info.day, info.month, info.year)}${lunarTxt ? ` · ${esc(lunarTxt)}` : ''}</div>
                                    ${h.schedule_note ? `<div class="small text-muted mt-1">${esc(h.schedule_note)}</div>` : ''}
                                </div>
                                <span class="badge bg-${badgeCls}-subtle text-${badgeCls}-emphasis border flex-shrink-0">${esc(badgeText)}</span>
                            </button>`;
                    }).join('');
                    Core.bindDayClickHandlers(publicListEl);
                }
            }

            if (lunarListEl) {
                if (overview.notableEvents.length === 0) {
                    lunarListEl.innerHTML = `<p class="text-muted small mb-0">—</p>`;
                } else {
                    lunarListEl.innerHTML = overview.notableEvents.map(info => {
                        const h = info.holiday;
                        const lunarTxt = info.lunar ? `${info.lunar.day}/${info.lunar.month} ÂL` : '';
                        return `
                            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2 text-start" data-calendar-open-date="1" data-date="${info.day}" data-month="${info.month}" data-year="${info.year}">
                                <div>
                                    <div class="fw-semibold">${esc(h.name)}</div>
                                    <div class="small text-muted">${esc(info.weekdayName)}, ${Core.formatShortDate(info.day, info.month, info.year)}</div>
                                </div>
                                <span class="badge bg-info-subtle text-info-emphasis border flex-shrink-0">${esc(lunarTxt)}</span>
                            </button>`;
                    }).join('');
                    Core.bindDayClickHandlers(lunarListEl);
                }
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', () => { currentYear = Math.max(MIN_YEAR, currentYear - 1); render(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { currentYear = Math.min(MAX_YEAR, currentYear + 1); render(); });
        if (thisYearBtn) thisYearBtn.addEventListener('click', () => { currentYear = today.getFullYear(); render(); });
        if (yearSelect) yearSelect.addEventListener('change', () => { currentYear = clampYear(yearSelect.value); render(); });
        if (filterSelect) filterSelect.addEventListener('change', () => { filterMode = filterSelect.value || 'all'; render(); });

        document.querySelectorAll('[data-quick-year]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentYear = clampYear(btn.dataset.quickYear);
                render();
            });
        });

        window.addEventListener('languageChanged', render);
        window.addEventListener('vietnamHolidaysLoaded', render);
        render();

        return () => ({
            targetEl: document.getElementById('yearly-export-area') || root,
            filename: `lich-nam-${currentYear}.png`,
            orientation: 'portrait'
        });
    }

    // ═══════════════════════════════════════════
    // 4. SHARED PRINT & HIGH-FIDELITY PNG EXPORT (All 4 Calendar Views)
    // ═══════════════════════════════════════════
    function setupCalendarOutputActions(getExportMeta) {
        if (typeof getExportMeta !== 'function') return;

        const printBtn = document.getElementById('calendar-print-btn');
        const exportBtn = document.getElementById('calendar-export-img-btn');
        const imgDataCache = new Map();

        function applyPrintPageStyle(orientation) {
            let styleEl = document.getElementById('calendar-print-page-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'calendar-print-page-style';
                document.head.appendChild(styleEl);
            }
            const pageSize = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait';
            styleEl.textContent = `@media print { @page { size: ${pageSize}; margin: 8mm; } }`;
        }

        // Apply optimal @page orientation immediately so Ctrl+P / Cmd+P matches the Print button
        const initialMeta = getExportMeta();
        if (initialMeta && initialMeta.orientation) {
            applyPrintPageStyle(initialMeta.orientation);
        }

        async function waitForImages(container) {
            const imgs = Array.from(container.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.style.display === 'none' || !img.src || img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    const timer = setTimeout(resolve, 4000);
                    const done = () => { clearTimeout(timer); resolve(); };
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                });
            }));
        }

        function inlineLoadedImages(container) {
            const restored = [];
            const imgs = Array.from(container.querySelectorAll('img'));
            imgs.forEach(img => {
                const origSrc = img.getAttribute('src');
                if (!origSrc || origSrc.startsWith('data:') || !img.complete || img.naturalWidth === 0) return;
                if (imgDataCache.has(origSrc)) {
                    img.setAttribute('src', imgDataCache.get(origSrc));
                    restored.push({ img, origSrc });
                    return;
                }
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    if (dataUrl && dataUrl.startsWith('data:image/')) {
                        imgDataCache.set(origSrc, dataUrl);
                        img.setAttribute('src', dataUrl);
                        restored.push({ img, origSrc });
                    }
                } catch (_) {
                    // Tainted canvas or non-CORS image: leave src for html-to-image fallback
                }
            });
            return () => {
                restored.forEach(({ img, origSrc }) => {
                    img.setAttribute('src', origSrc);
                });
            };
        }

        function ensureHtmlToImage() {
            if (window.htmlToImage && typeof window.htmlToImage.toBlob === 'function') {
                return Promise.resolve(window.htmlToImage);
            }
            return new Promise((resolve, reject) => {
                const existing = document.querySelector('script[src*="html-to-image"]');
                if (existing) {
                    const timer = setTimeout(() => {
                        if (window.htmlToImage && typeof window.htmlToImage.toBlob === 'function') resolve(window.htmlToImage);
                        else reject(new Error('html-to-image failed to load'));
                    }, 5000);
                    existing.addEventListener('load', () => {
                        clearTimeout(timer);
                        if (window.htmlToImage) resolve(window.htmlToImage);
                        else reject(new Error('html-to-image unavailable'));
                    }, { once: true });
                    existing.addEventListener('error', () => {
                        clearTimeout(timer);
                        reject(new Error('html-to-image network error'));
                    }, { once: true });
                    return;
                }
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
                s.onload = () => (window.htmlToImage ? resolve(window.htmlToImage) : reject(new Error('html-to-image unavailable')));
                s.onerror = () => reject(new Error('html-to-image network error'));
                document.head.appendChild(s);
            });
        }

        async function printCalendar() {
            const meta = getExportMeta();
            if (!meta || !meta.targetEl) return;
            applyPrintPageStyle(meta.orientation);
            await waitForImages(meta.targetEl);
            window.print();
        }

        async function exportCalendarImage() {
            const meta = getExportMeta();
            if (!meta || !meta.targetEl) return;

            const targetEl = meta.targetEl;
            const filename = meta.filename || `calendar-${view}.png`;
            const origHtml = exportBtn ? exportBtn.innerHTML : '';

            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-1" aria-hidden="true"></i><span>${esc(tr('cal.exporting_image', 'Đang xuất ảnh...'))}</span>`;
            }

            let restoreImages = () => {};
            try {
                const htmlToImage = await ensureHtmlToImage();
                await waitForImages(targetEl);
                if (document.fonts && document.fonts.ready) {
                    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
                }

                targetEl.classList.add('is-exporting-image');
                restoreImages = inlineLoadedImages(targetEl);

                // Let layout settle so export-only legend & framing padding apply before capture
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                const bodyBg = getComputedStyle(document.body).backgroundColor || '#ffffff';
                const pixelRatio = targetEl.scrollHeight > 3200 ? 1.5 : 2;
                const exportOpts = {
                    pixelRatio,
                    backgroundColor: bodyBg,
                    cacheBust: false,
                    style: {
                        margin: '0'
                    },
                    filter: (node) => {
                        if (node && node.classList && node.classList.contains('calendar-no-print')) return false;
                        return true;
                    }
                };

                let blob;
                try {
                    blob = await htmlToImage.toBlob(targetEl, exportOpts);
                } catch (_) {
                    // Offline or restricted stylesheet fallback: preserve full layout & photo without remote font embedding
                    blob = await htmlToImage.toBlob(targetEl, Object.assign({}, exportOpts, { skipFonts: true }));
                }

                if (!blob) throw new Error('Empty image blob');

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 2000);

                if (typeof window.showAlert === 'function') {
                    window.showAlert(tr('cal.export_success', 'Đã xuất ảnh lịch PNG!'), 'success');
                }
            } catch (_) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert(
                        tr('cal.export_error', 'Không thể xuất ảnh. Vui lòng thử lại hoặc dùng nút In lịch (Lưu PDF).'),
                        'danger'
                    );
                }
            } finally {
                restoreImages();
                targetEl.classList.remove('is-exporting-image');
                if (exportBtn) {
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = origHtml;
                }
            }
        }

        if (printBtn) printBtn.addEventListener('click', printCalendar);
        if (exportBtn) exportBtn.addEventListener('click', exportCalendarImage);

        window.CalendarOutput = {
            print: printCalendar,
            exportImage: exportCalendarImage,
            getExportMeta
        };
    }

    let getExportMeta = null;
    if (view === 'day') getExportMeta = initDailyView();
    else if (view === 'week') getExportMeta = initWeeklyView();
    else if (view === 'month') getExportMeta = initMonthlyView();
    else if (view === 'year') getExportMeta = initYearlyView();

    setupCalendarOutputActions(getExportMeta);
});
