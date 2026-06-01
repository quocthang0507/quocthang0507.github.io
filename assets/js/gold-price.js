// Gold Price History Chart
document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const chartLoading = document.getElementById('chart-loading');
    const chartContent = document.getElementById('chart-content');
    const chartGoldTypeSelect = document.getElementById('chart-gold-type');
    const chartRateTypeSelect = document.getElementById('chart-rate-type');
    const durationButtons = document.querySelectorAll('#chart-content [data-period]');
    const goldChartCanvas = document.getElementById('goldChart');

    // Chart State
    let goldChartInstance = null;
    let historicalGold = [];
    let currentPeriod = 30; // Default to 30 days

    // Gold Names localization
    const GOLD_NAMES = {
        vi: {
            ha_noi_pnj: "Hà Nội PNJ",
            ha_noi_sjc: "Hà Nội SJC",
            "nu_trang_99.99percent": "Nữ Trang 99.99%",
            nu_trang_99percent: "Nữ Trang 99%",
            sjc_1l_10l: "SJC 1L, 10L, 1KG",
            sjc_2c_1c_5_phan: "SJC 2c, 1C, 5 phân",
            sjc_5c: "SJC 5c",
            thegioi: "Giá vàng thế giới",
            tphcm_pnj: "TPHCM PNJ",
            tphcm_sjc: "TPHCM SJC"
        },
        en: {
            ha_noi_pnj: "Hanoi PNJ",
            ha_noi_sjc: "Hanoi SJC",
            "nu_trang_99.99percent": "Jewelry 99.99%",
            nu_trang_99percent: "Jewelry 99%",
            sjc_1l_10l: "SJC 1L, 10L, 1KG",
            sjc_2c_1c_5_phan: "SJC 2c, 1C, 0.5 Tael",
            sjc_5c: "SJC 5c",
            thegioi: "World Gold Price",
            tphcm_pnj: "HCMC PNJ",
            tphcm_sjc: "HCMC SJC"
        },
        zh: {
            ha_noi_pnj: "河内 PNJ 金价",
            ha_noi_sjc: "河内 SJC 金价",
            "nu_trang_99.99percent": "首饰金 99.99%",
            nu_trang_99percent: "首饰金 99%",
            sjc_1l_10l: "SJC 金条 (1L, 10L, 1KG)",
            sjc_2c_1c_5_phan: "SJC 金条 (2钱, 1钱, 5分)",
            sjc_5c: "SJC 金条 (5钱)",
            thegioi: "国际金价",
            tphcm_pnj: "胡志明市 PNJ 金价",
            tphcm_sjc: "胡志明市 SJC 金价"
        },
        ko: {
            ha_noi_pnj: "하노이 PNJ",
            ha_noi_sjc: "하노이 SJC",
            "nu_trang_99.99percent": "순금 주얼리 99.99%",
            nu_trang_99percent: "금 주얼리 99%",
            sjc_1l_10l: "SJC (1L, 10L, 1KG)",
            sjc_2c_1c_5_phan: "SJC (2돈, 1돈, 5푼)",
            sjc_5c: "SJC (5돈)",
            thegioi: "국제 금 시세",
            tphcm_pnj: "호치민 PNJ",
            tphcm_sjc: "호치민 SJC"
        },
        ja: {
            ha_noi_pnj: "ハノイ PNJ",
            ha_noi_sjc: "ハノイ SJC",
            "nu_trang_99.99percent": "装飾用金 99.99%",
            nu_trang_99percent: "装飾用金 99%",
            sjc_1l_10l: "SJC (1L, 10L, 1KG)",
            sjc_2c_1c_5_phan: "SJC (2c, 1c, 5分)",
            sjc_5c: "SJC (5c)",
            thegioi: "世界金相場",
            tphcm_pnj: "ホーチミン PNJ",
            tphcm_sjc: "ホーチミン SJC"
        }
    };

    function tr(key, fallback = key) {
        try {
            if (typeof window.t !== 'function') return fallback;
            const val = window.t(key);
            return (!val || val === key) ? fallback : val;
        } catch (_) {
            return fallback;
        }
    }

    // Load history
    loadHistoricalGold();

    async function loadHistoricalGold() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/quocthang0507/quocthang0507.github.io/data/assets/data/gold-history.json');
            if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
            historicalGold = await response.json();
            
            if (historicalGold && historicalGold.length > 0) {
                console.log(`Loaded ${historicalGold.length} gold records.`);
                initializeUI();
            } else {
                throw new Error('Gold history data empty');
            }
        } catch (err) {
            console.error('Failed to load gold history:', err.message);
            showErrorState();
        }
    }

    function initializeUI() {
        if (chartLoading) chartLoading.style.display = 'none';
        if (chartContent) chartContent.style.display = 'block';

        populateGoldTypesSelector();
        updateChart();

        // Event listeners
        chartGoldTypeSelect.addEventListener('change', updateChart);
        chartRateTypeSelect.addEventListener('change', updateChart);

        durationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                durationButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPeriod = parseInt(btn.dataset.period);
                updateChart();
            });
        });

        // Dark Mode response
        const darkModeBtn = document.getElementById('dark-mode-toggle');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', () => {
                setTimeout(updateChart, 50);
            });
        }
    }

    function populateGoldTypesSelector() {
        if (!chartGoldTypeSelect || !historicalGold || historicalGold.length === 0) return;
        
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        
        // Extract all gold codes from the last entry
        const lastEntry = historicalGold[historicalGold.length - 1];
        if (!lastEntry || !lastEntry.rates) return;

        const codes = Object.keys(lastEntry.rates).sort();
        
        const currentSelected = chartGoldTypeSelect.value;
        chartGoldTypeSelect.innerHTML = codes.map(code => {
            const label = GOLD_NAMES[lang]?.[code] || GOLD_NAMES['en']?.[code] || lastEntry.rates[code].label || code;
            return `<option value="${code}">${label}</option>`;
        }).join('');

        if (currentSelected && codes.includes(currentSelected)) {
            chartGoldTypeSelect.value = currentSelected;
        } else {
            chartGoldTypeSelect.value = codes.includes('sjc_1l_10l') ? 'sjc_1l_10l' : codes[0];
        }
    }

    function showErrorState() {
        const errorMsg = tr('gold.fetch_error', 'Không thể tải dữ liệu giá vàng. Vui lòng thử lại sau.');
        if (typeof window.showAlert === 'function') {
            window.showAlert(errorMsg, 'danger');
        }
        if (chartLoading) {
            chartLoading.innerHTML = `
                <div class="text-danger mb-3"><i class="fas fa-exclamation-triangle fa-3x"></i></div>
                <p class="text-danger font-weight-bold">${errorMsg}</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i> ${tr('error.back', 'Thử lại')}
                </button>
            `;
        }
    }

    function updateChart() {
        if (!goldChartCanvas || !historicalGold || historicalGold.length === 0) return;

        const goldType = chartGoldTypeSelect.value;
        const rateType = chartRateTypeSelect.value;
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';

        // Slice history
        const filteredHistory = historicalGold.slice(-currentPeriod);

        // Labels
        const labels = filteredHistory.map(item => {
            const dateObj = new Date(item.date);
            return dateObj.toLocaleDateString(lang, {
                day: '2-digit',
                month: '2-digit'
            });
        });

        // Values
        const dataPoints = filteredHistory.map(item => {
            return item.rates?.[goldType]?.[rateType] || null;
        });

        const hasData = dataPoints.some(val => val !== null);
        if (!hasData) {
            console.warn(`No data points found for ${goldType} - ${rateType}`);
            return;
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const primaryColor = '#D4AF37'; // Premium Gold color for line
        const textColor = isDark ? '#E6E1E5' : '#2D2D36';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(163, 177, 198, 0.25)';
        const tooltipBg = isDark ? '#33333D' : '#FFFFFF';
        const tooltipBorder = '#D4AF37';

        const ctx = goldChartCanvas.getContext('2d');

        if (goldChartInstance) {
            goldChartInstance.destroy();
        }

        const goldTypeLabel = GOLD_NAMES[lang]?.[goldType] || GOLD_NAMES['en']?.[goldType] || goldType;
        const rateTypeLabel = tr(`gold.${rateType}`, rateType === 'sell' ? 'Bán ra' : 'Mua vào');

        goldChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${goldTypeLabel} - ${rateTypeLabel}`,
                    data: dataPoints,
                    borderColor: primaryColor,
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: currentPeriod > 90 ? 0 : 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: isDark ? '#2D2D36' : '#FFFFFF',
                    pointBorderWidth: 1.5,
                    tension: 0.2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: tooltipBg,
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        titleFont: {
                            family: 'Inter, sans-serif',
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Inter, sans-serif'
                        },
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    // SJC and general gold rates are in thousand VND per chỉ or actual values
                                    const value = context.parsed.y;
                                    const formatted = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US').format(value);
                                    
                                    // Display unit
                                    if (goldType === 'thegioi') {
                                        label += formatted + ' USD/oz';
                                    } else {
                                        label += formatted + ' ' + (lang === 'vi' ? 'nghìn VND/lượng' : 'k VND/tael');
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 10
                            },
                            maxTicksLimit: currentPeriod > 90 ? 12 : (currentPeriod > 30 ? 8 : 7)
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 10
                            },
                            callback: function(value) {
                                return new Intl.NumberFormat().format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Translate callback
    window.addEventListener('languageChanged', function(event) {
        populateGoldTypesSelector();
        updateChart();
    });
});
