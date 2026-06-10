// Currency Converter Functionality
document.addEventListener('DOMContentLoaded', function() {
    // API Configurations
    const VCB_XML_URL = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx';
    const PROXY_URL = `https://api.allorigins.win/get?url=${encodeURIComponent(VCB_XML_URL)}`;

    // Text translations inside script (covers 5 supported languages)
    const LOCALIZED_TEXTS = {
        vi: {
            transfer: 'Chuyển khoản',
            cash: 'Tiền mặt',
            transaction_type: 'Loại giao dịch:',
            copy_result: 'Sao chép',
            copied: 'Đã sao chép kết quả!',
            common_amounts: 'Bảng quy đổi phổ biến',
            popular_presets: 'Gợi ý nhanh:',
            no_results: 'Không tìm thấy kết quả'
        },
        en: {
            transfer: 'Transfer',
            cash: 'Cash',
            transaction_type: 'Transaction Type:',
            copy_result: 'Copy',
            copied: 'Result copied!',
            common_amounts: 'Common Conversion Amounts',
            popular_presets: 'Quick Presets:',
            no_results: 'No results found'
        },
        zh: {
            transfer: '现汇 (转账)',
            cash: '现钞 (现金)',
            transaction_type: '交易类型:',
            copy_result: '复制',
            copied: '结果已复制！',
            common_amounts: '常见兑换金额',
            popular_presets: '快速预设:',
            no_results: '未找到结果'
        },
        ko: {
            transfer: '송금 (계좌이체)',
            cash: '현찰 (현금)',
            transaction_type: '거래 유형:',
            copy_result: '복사',
            copied: '결과가 복사되었습니다!',
            common_amounts: '자주 쓰이는 환산 금액',
            popular_presets: '빠른 선택:',
            no_results: '결과가 없습니다'
        },
        ja: {
            transfer: '電信 (振込)',
            cash: '現金 (キャッシュ)',
            transaction_type: '取引タイプ:',
            copy_result: 'コピー',
            copied: '結果をコピーしました！',
            common_amounts: '主な換算金額表',
            popular_presets: 'クイック設定:',
            no_results: '結果が見つかりません'
        }
    };

    // Fallback dictionary for currency names
    const CURRENCY_NAMES = {
        vi: {
            VND: 'Việt Nam Đồng', USD: 'Đô la Mỹ', EUR: 'Euro', JPY: 'Yên Nhật',
            GBP: 'Bảng Anh', AUD: 'Đô la Úc', CAD: 'Đô la Canada', CHF: 'Franc Thụy Sĩ',
            CNY: 'Nhân dân tệ', DKK: 'Krone Đan Mạch', HKD: 'Đô la Hồng Kông', INR: 'Rupee Ấn Độ',
            KRW: 'Won Hàn Quốc', KWD: 'Dinar Kuwait', MYR: 'Ringgit Malaysia', NOK: 'Krone Na Uy',
            RUB: 'Rúp Nga', SAR: 'Riyal Ả Rập Xê-út', SEK: 'Krona Thụy Điển', SGD: 'Đô la Singapore',
            THB: 'Baht Thái'
        },
        en: {
            VND: 'Vietnamese Dong', USD: 'US Dollar', EUR: 'Euro', JPY: 'Japanese Yen',
            GBP: 'British Pound', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc',
            CNY: 'Chinese Yuan', DKK: 'Danish Krone', HKD: 'Hong Kong Dollar', INR: 'Indian Rupee',
            KRW: 'South Korean Won', KWD: 'Kuwaiti Dinar', MYR: 'Malaysian Ringgit', NOK: 'Norwegian Krone',
            RUB: 'Russian Ruble', SAR: 'Saudi Riyal', SEK: 'Swedish Krona', SGD: 'Singapore Dollar',
            THB: 'Thai Baht'
        },
        zh: {
            VND: '越南盾', USD: '美元', EUR: '欧元', JPY: '日元',
            GBP: '英镑', AUD: '澳元', CAD: '加元', CHF: '瑞士法郎',
            CNY: '人民币', DKK: '丹麦克朗', HKD: '港币', INR: '印度卢比',
            KRW: '韩元', KWD: '科威特第纳尔', MYR: '马来西亚林吉特', NOK: '挪威克朗',
            RUB: '俄罗斯卢布', SAR: '沙特里亚尔', SEK: '瑞典克朗', SGD: '新加坡元',
            THB: '泰铢'
        },
        ko: {
            VND: '베트남 동', USD: '미국 달러', EUR: '유로', JPY: '일본 엔',
            GBP: '영국 파운드', AUD: '호주 달러', CAD: '캐나다 달러', CHF: '스위스 프랑',
            CNY: '중국 위안', DKK: '덴마크 크로네', HKD: '홍콩 달러', INR: '인도 루피',
            KRW: '대한민국 원', KWD: '쿠웨이트 디나르', MYR: '마레이시아 링깃', NOK: '노르웨이 크로네',
            RUB: '러시아 루블', SAR: '사우디 리얄', SEK: '스웨덴 크로나', SGD: '싱가포르 달러',
            THB: '태국 바트'
        },
        ja: {
            VND: 'ベトナム ドン', USD: '米ドル', EUR: 'ユーロ', JPY: '日本円',
            GBP: '英ポンド', AUD: '豪ドル', CAD: 'カナダ ドル', CHF: 'スイス フラン',
            CNY: '中国元', DKK: 'デンマーク クローネ', HKD: '香港ドル', INR: 'インドルピー',
            KRW: '韓国ウォン', KWD: 'クウェート ディナール', MYR: 'マレイシア リンギット', NOK: 'ノルウェー クローネ',
            RUB: 'ロシア ルーブル', SAR: 'サウディ リヤル', SEK: 'スウェーデン クローナ', SGD: 'シンガポール ドル',
            THB: 'タイ バーツ'
        }
    };

    // Country flags for currencies
    const CURRENCY_FLAGS = {
        VND: '🇻🇳', USD: '🇺🇸', EUR: '🇪🇺', JPY: '🇯🇵', GBP: '🇬🇧',
        AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳', DKK: '🇩🇰',
        HKD: '🇭🇰', INR: '🇮🇳', KRW: '🇰🇷', KWD: '🇰🇼', MYR: '🇲🇾',
        NOK: '🇳🇴', RUB: '🇷🇺', SAR: '🇸🇦', SEK: '🇸🇪', SGD: '🇸🇬',
        THB: '🇹🇭'
    };

    // UI Elements
    const amountInput = document.getElementById('currency-amount');
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const swapBtn = document.getElementById('swap-currency-btn');
    const resultFromDisplay = document.getElementById('result-from-display');
    const resultToDisplay = document.getElementById('result-to-display');
    const rateFormula = document.getElementById('rate-formula');
    const timestampDisplay = document.getElementById('rates-timestamp');
    const searchRates = document.getElementById('search-rates');
    const ratesTableBody = document.getElementById('rates-table-body');
    const copyResultBtn = document.getElementById('copy-result-btn');

    // Radios
    const typeTransferRadio = document.getElementById('type-transfer');
    const typeCashRadio = document.getElementById('type-cash');

    // Preset & Common Table Elements
    const presetButtons = document.querySelectorAll('.preset-btn');
    const commonAmountsCard = document.getElementById('common-amounts-card');
    const commonFromHeader = document.getElementById('common-from-header');
    const commonFromBody = document.getElementById('common-from-body');
    const commonToHeader = document.getElementById('common-to-header');
    const commonToBody = document.getElementById('common-to-body');
    
    // Loaders & Contents
    const converterLoading = document.getElementById('converter-loading');
    const converterContent = document.getElementById('converter-content');
    const tableLoading = document.getElementById('table-loading');
    const tableContent = document.getElementById('table-content');

    // State Variables
    let exchangeRates = [];
    let lastUpdatedTime = '';

    // Chart Elements
    const chartSection = document.getElementById('chart-section');
    const chartCurrencySelect = document.getElementById('chart-currency');
    const chartRateTypeSelect = document.getElementById('chart-rate-type');
    const durationButtons = document.querySelectorAll('#chart-section [data-period]');
    const ratesChartCanvas = document.getElementById('ratesChart');

    // Chart State
    let ratesChartInstance = null;
    let historicalRates = []; // Loaded from assets/data/rates-history.json
    let currentPeriod = 30; // Default to 30 days

    // Translation helper wrapper
    function tr(key, fallback = key) {
        try {
            if (typeof window.t !== 'function') return fallback;
            const val = window.t(key);
            return (!val || val === key) ? fallback : val;
        } catch (_) {
            return fallback;
        }
    }

    // Initialize Page
    fetchExchangeRates();
    loadHistoricalRates();

    // Fetch Vietcombank rates via proxy list
    async function fetchExchangeRates() {
        const proxies = [
            // 1. CorsProxy.io (direct text return)
            {
                url: `https://corsproxy.io/?url=${encodeURIComponent(VCB_XML_URL)}`,
                handler: async (res) => {
                    if (!res.ok) throw new Error('CorsProxy response not OK');
                    return await res.text();
                }
            },
            // 2. Codetabs (direct text return)
            {
                url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(VCB_XML_URL)}`,
                handler: async (res) => {
                    if (!res.ok) throw new Error('Codetabs response not OK');
                    return await res.text();
                }
            },
            // 3. AllOrigins Raw (direct text return)
            {
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent(VCB_XML_URL)}`,
                handler: async (res) => {
                    if (!res.ok) throw new Error('AllOrigins Raw response not OK');
                    return await res.text();
                }
            },
            // 4. AllOrigins JSON (wrapped JSON response)
            {
                url: `https://api.allorigins.win/get?url=${encodeURIComponent(VCB_XML_URL)}`,
                handler: async (res) => {
                    if (!res.ok) throw new Error('AllOrigins JSON response not OK');
                    const json = await res.json();
                    if (!json || !json.contents) throw new Error('AllOrigins JSON content empty');
                    return json.contents;
                }
            }
        ];

        let xmlContent = null;
        let lastError = null;

        for (const proxy of proxies) {
            try {
                console.log(`Attempting to fetch exchange rates via: ${proxy.url}`);
                const response = await fetch(proxy.url);
                xmlContent = await proxy.handler(response);
                if (xmlContent && xmlContent.includes('ExrateList')) {
                    console.log(`Successfully fetched rates via proxy!`);
                    break;
                }
            } catch (err) {
                console.warn(`Proxy failed: ${proxy.url}`, err);
                lastError = err;
            }
        }

        if (xmlContent) {
            parseExchangeRates(xmlContent);
        } else {
            console.error('All proxies failed to fetch rates. Last error:', lastError);
            showErrorState();
        }
    }

    // Parse XML data into exchangeRates array
    function parseExchangeRates(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            // Check parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) throw new Error('XML parsing error');

            const dateElement = xmlDoc.querySelector('DateTime');
            lastUpdatedTime = dateElement ? dateElement.textContent : new Date().toLocaleString();

            const rates = xmlDoc.querySelectorAll('Exrate');
            exchangeRates = [];

            // Explicitly push VND as the base currency
            exchangeRates.push({
                code: 'VND',
                name: 'VIETNAMESE DONG',
                buyCash: 1.0,
                buyTransfer: 1.0,
                sell: 1.0
            });

            rates.forEach(rate => {
                const code = rate.getAttribute('CurrencyCode');
                const name = rate.getAttribute('CurrencyName');
                
                // Parse rate values and clean up commas
                const cleanRate = (val) => {
                    if (!val || val.trim() === '-' || val.trim() === '0') return null;
                    return parseFloat(val.replace(/,/g, ''));
                };

                const buyCash = cleanRate(rate.getAttribute('Buy'));
                const buyTransfer = cleanRate(rate.getAttribute('Transfer'));
                const sell = cleanRate(rate.getAttribute('Sell'));

                exchangeRates.push({
                    code: code,
                    name: name,
                    buyCash: buyCash,
                    buyTransfer: buyTransfer,
                    sell: sell
                });
            });

            // Set UI values
            hideLoaders();
            translateCustomLabels();
            populateSelectors();
            renderRatesTable();
            calculateConversion();
            
            // Save state updates
            if (timestampDisplay) timestampDisplay.textContent = lastUpdatedTime;

        } catch (error) {
            console.error('Error parsing exchange rates XML:', error);
            showErrorState();
        }
    }

    // Hide loading screen and display tools
    function hideLoaders() {
        if (converterLoading) converterLoading.style.display = 'none';
        if (converterContent) converterContent.style.display = 'block';
        if (tableLoading) tableLoading.style.display = 'none';
        if (tableContent) tableContent.style.display = 'block';
        if (commonAmountsCard) commonAmountsCard.style.display = 'block';
    }

    // Display Error Alert to User
    function showErrorState() {
        const errorMsg = tr('currency.fetch_error', 'Không thể tải dữ liệu tỷ giá. Vui lòng thử lại sau.');
        if (typeof window.showAlert === 'function') {
            window.showAlert(errorMsg, 'danger');
        }
        
        if (converterLoading) {
            converterLoading.innerHTML = `
                <div class="text-danger mb-3"><i class="fas fa-exclamation-triangle fa-3x"></i></div>
                <p class="text-danger font-weight-bold">${errorMsg}</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="fas fa-redo me-1"></i> ${tr('error.back', 'Thử lại')}
                </button>
            `;
        }
        if (tableLoading) {
            tableLoading.innerHTML = `
                <p class="text-danger">${errorMsg}</p>
            `;
        }
    }

    // Translate dynamic script-based labels
    function translateCustomLabels() {
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        const texts = LOCALIZED_TEXTS[lang] || LOCALIZED_TEXTS['en'];

        const labelTransactionType = document.getElementById('label-transaction-type');
        if (labelTransactionType) labelTransactionType.textContent = texts.transaction_type;

        const labelTransfer = document.getElementById('label-transfer');
        if (labelTransfer) labelTransfer.textContent = texts.transfer;

        const labelCash = document.getElementById('label-cash');
        if (labelCash) labelCash.textContent = texts.cash;

        const labelPresets = document.getElementById('label-presets');
        if (labelPresets) labelPresets.textContent = texts.popular_presets;

        const labelCommonAmounts = document.getElementById('label-common-amounts');
        if (labelCommonAmounts) labelCommonAmounts.textContent = texts.common_amounts;
    }

    // Populate selectors with option nodes
    function populateSelectors() {
        if (!fromSelect || !toSelect) return;

        let preferredFrom = 'USD';
        let preferredTo = 'VND';
        try {
            preferredFrom = localStorage.getItem('preferredFromCurrency') || 'USD';
            preferredTo = localStorage.getItem('preferredToCurrency') || 'VND';
        } catch (e) {
            console.warn('localStorage is blocked or unavailable:', e);
        }

        const previousFrom = fromSelect.value || preferredFrom;
        const previousTo = toSelect.value || preferredTo;

        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';

        exchangeRates.forEach(rate => {
            const flag = CURRENCY_FLAGS[rate.code] || '🏳️';
            const name = getCurrencyName(rate.code, rate.name);
            const label = `${flag} ${rate.code} - ${name}`;

            const opt1 = new Option(label, rate.code);
            const opt2 = new Option(label, rate.code);

            fromSelect.add(opt1);
            toSelect.add(opt2);
        });

        // Restore values
        fromSelect.value = previousFrom;
        toSelect.value = previousTo;

        // Fallback checks
        if (!fromSelect.value) fromSelect.value = 'USD';
        if (!toSelect.value) toSelect.value = 'VND';
    }

    // Localized Name getter
    function getCurrencyName(code, xmlName = '') {
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        const namesForLang = CURRENCY_NAMES[lang] || CURRENCY_NAMES['en'];
        
        if (namesForLang && namesForLang[code]) {
            return namesForLang[code];
        }
        
        // Capitalize XML Name
        if (xmlName) {
            return xmlName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
        return code;
    }

    // Formatting numbers dynamically
    function formatNumber(num, options = {}) {
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        const locale = lang === 'vi' ? 'vi-VN' :
                       lang === 'en' ? 'en-US' :
                       lang === 'zh' ? 'zh-CN' :
                       lang === 'ko' ? 'ko-KR' : 'ja-JP';
        return new Intl.NumberFormat(locale, options).format(num);
    }

    // Format table exchange rates
    function formatRateValue(val) {
        if (val === null || val === undefined) return '-';
        if (val === 1.0) return '1';
        if (val < 10) return formatNumber(val, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        return formatNumber(val, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Render exchange rates table
    function renderRatesTable(filterText = '') {
        if (!ratesTableBody) return;
        ratesTableBody.innerHTML = '';

        const term = filterText.toLowerCase().trim();

        exchangeRates.forEach(rate => {
            // Exclude base VND from being listed in table rows to save clutter, unless searched explicitly
            if (rate.code === 'VND' && !term) return;

            const name = getCurrencyName(rate.code, rate.name);
            const flag = CURRENCY_FLAGS[rate.code] || '🏳️';

            // Filter logic
            if (term && 
                !rate.code.toLowerCase().includes(term) && 
                !name.toLowerCase().includes(term) && 
                !rate.name.toLowerCase().includes(term)) {
                return;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center font-weight-bold">
                    <span class="me-1">${flag}</span> ${rate.code}
                </td>
                <td>
                    <span class="small text-body">${name}</span>
                </td>
                <td class="text-end font-monospace text-primary">
                    ${formatRateValue(rate.buyCash)}
                </td>
                <td class="text-end font-monospace text-success">
                    ${formatRateValue(rate.buyTransfer)}
                </td>
                <td class="text-end font-monospace text-danger">
                    ${formatRateValue(rate.sell)}
                </td>
            `;

            // Make table rows clickable to set as converter targets
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                if (fromSelect.value !== rate.code) {
                    fromSelect.value = rate.code;
                    try {
                        localStorage.setItem('preferredFromCurrency', rate.code);
                    } catch (e) {
                        console.warn('localStorage is blocked:', e);
                    }
                    calculateConversion();
                    populateSelectors(); // updates text values
                } else {
                    toSelect.value = rate.code;
                    try {
                        localStorage.setItem('preferredToCurrency', rate.code);
                    } catch (e) {
                        console.warn('localStorage is blocked:', e);
                    }
                    calculateConversion();
                    populateSelectors();
                }
            });

            ratesTableBody.appendChild(row);
        });

        if (ratesTableBody.children.length === 0) {
            const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
            const texts = LOCALIZED_TEXTS[lang] || LOCALIZED_TEXTS['en'];
            ratesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        ${texts.no_results}
                    </td>
                </tr>
            `;
        }
    }

    // Core conversion formula runner
    function convertValue(amount, fromCode, toCode, transactionType) {
        const fromRate = exchangeRates.find(r => r.code === fromCode);
        const toRate = exchangeRates.find(r => r.code === toCode);
        if (!fromRate || !toRate) return 0;

        const getRateBuy = (rateObj) => {
            if (transactionType === 'cash') {
                return rateObj.buyCash || rateObj.buyTransfer || 1.0;
            } else {
                return rateObj.buyTransfer || rateObj.buyCash || 1.0;
            }
        };

        const getRateSell = (rateObj) => {
            return rateObj.sell || 1.0;
        };

        const xRate = getRateBuy(fromRate);
        const yRate = getRateSell(toRate);

        if (fromCode === toCode) {
            return amount;
        } else if (fromCode === 'VND') {
            return amount / yRate;
        } else if (toCode === 'VND') {
            return amount * xRate;
        } else {
            return (amount * xRate) / yRate;
        }
    }

    // Core conversion controller
    function calculateConversion() {
        if (exchangeRates.length === 0 || !amountInput || !fromSelect || !toSelect) return;

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount < 0) {
            if (resultFromDisplay) resultFromDisplay.textContent = '';
            if (resultToDisplay) resultToDisplay.textContent = '0';
            return;
        }

        const fromCode = fromSelect.value;
        const toCode = toSelect.value;
        const transactionType = getSelectedTransactionType();

        const finalValue = convertValue(amount, fromCode, toCode, transactionType);

        // Update displays
        const fromFlag = CURRENCY_FLAGS[fromCode] || '🏳️';
        const toFlag = CURRENCY_FLAGS[toCode] || '🏳️';

        const amountFormatted = formatNumber(amount, { maximumFractionDigits: 4 });
        const finalFormatted = formatNumber(finalValue, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 4 
        });

        if (resultFromDisplay) resultFromDisplay.textContent = `${fromFlag} ${amountFormatted} ${fromCode} =`;
        if (resultToDisplay) resultToDisplay.textContent = `${toFlag} ${finalFormatted} ${toCode}`;

        // Update Rate Formula Info
        const singleConvert = convertValue(1.0, fromCode, toCode, transactionType);
        const formulaFormatted = formatNumber(singleConvert, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 4 
        });
        if (rateFormula) {
            rateFormula.textContent = `1 ${fromCode} = ${formulaFormatted} ${toCode}`;
        }

        // Save selected choices to local storage
        try {
            localStorage.setItem('preferredFromCurrency', fromCode);
            localStorage.setItem('preferredToCurrency', toCode);
        } catch (e) {
            console.warn('localStorage is blocked:', e);
        }

        // Render dynamic grid table
        renderCommonConversionTables(fromCode, toCode, transactionType);
    }

    // Populate common rates tables dynamically
    function renderCommonConversionTables(fromCode, toCode, transactionType) {
        if (!commonFromHeader || !commonFromBody || !commonToHeader || !commonToBody) return;

        const fromFlag = CURRENCY_FLAGS[fromCode] || '';
        const toFlag = CURRENCY_FLAGS[toCode] || '';

        // Headers
        commonFromHeader.innerHTML = `<th colspan="2" class="text-center font-weight-bold text-secondary bg-light">${fromFlag} ${fromCode} → ${toFlag} ${toCode}</th>`;
        commonToHeader.innerHTML = `<th colspan="2" class="text-center font-weight-bold text-secondary bg-light">${toFlag} ${toCode} → ${fromFlag} ${fromCode}</th>`;

        // Value steps
        const fromAmounts = fromCode === 'VND' ? [10000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000] : [1, 5, 10, 50, 100, 500, 1000, 5000];
        const toAmounts = toCode === 'VND' ? [10000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000] : [1, 5, 10, 50, 100, 500, 1000, 5000];

        // Populate table from
        commonFromBody.innerHTML = '';
        fromAmounts.forEach(amt => {
            const result = convertValue(amt, fromCode, toCode, transactionType);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="w-50 text-end pe-3 font-weight-bold text-muted">${formatNumber(amt)} ${fromCode}</td>
                <td class="w-50 text-start ps-3 text-primary">${formatNumber(result, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCode}</td>
            `;
            commonFromBody.appendChild(row);
        });

        // Populate table to
        commonToBody.innerHTML = '';
        toAmounts.forEach(amt => {
            const result = convertValue(amt, toCode, fromCode, transactionType);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="w-50 text-end pe-3 font-weight-bold text-muted">${formatNumber(amt)} ${toCode}</td>
                <td class="w-50 text-start ps-3 text-success">${formatNumber(result, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromCode}</td>
            `;
            commonToBody.appendChild(row);
        });
    }

    // Get selected transaction type (Transfer vs. Cash)
    function getSelectedTransactionType() {
        if (typeCashRadio && typeCashRadio.checked) return 'cash';
        return 'transfer';
    }

    // Event Listeners
    if (amountInput) {
        amountInput.addEventListener('input', calculateConversion);
        amountInput.addEventListener('change', function() {
            if (this.value === '' || parseFloat(this.value) < 0) {
                this.value = '1';
            }
            calculateConversion();
        });
    }

    if (fromSelect) {
        fromSelect.addEventListener('change', () => {
            calculateConversion();
            populateSelectors();
        });
    }

    if (toSelect) {
        toSelect.addEventListener('change', () => {
            calculateConversion();
            populateSelectors();
        });
    }

    // Swap Button
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;

            calculateConversion();
            populateSelectors();

            // Animate swap icon spin
            const icon = swapBtn.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 0.4s';
                icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });
    }

    // Presets Buttons
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const from = btn.getAttribute('data-from');
            const to = btn.getAttribute('data-to');
            
            if (fromSelect && toSelect) {
                fromSelect.value = from;
                toSelect.value = to;
                calculateConversion();
                populateSelectors();
            }
        });
    });

    // Radios
    if (typeTransferRadio) typeTransferRadio.addEventListener('change', calculateConversion);
    if (typeCashRadio) typeCashRadio.addEventListener('change', calculateConversion);

    // Search filter
    if (searchRates) {
        searchRates.addEventListener('input', (e) => {
            renderRatesTable(e.target.value);
        });
    }

    // Copy Result Button
    if (copyResultBtn) {
        copyResultBtn.addEventListener('click', () => {
            const resultText = resultToDisplay ? resultToDisplay.textContent : '';
            if (!resultText) return;

            navigator.clipboard.writeText(resultText).then(() => {
                const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
                const texts = LOCALIZED_TEXTS[lang] || LOCALIZED_TEXTS['en'];

                if (typeof window.showAlert === 'function') {
                    window.showAlert(texts.copied, 'success');
                }

                // Visual button feedback
                const icon = copyResultBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check text-success';
                    setTimeout(() => {
                        icon.className = 'fas fa-copy';
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy conversion output:', err);
            });
        });
    }

    // Load historical rates from JSON file
    async function loadHistoricalRates() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/quocthang0507/quocthang0507.github.io/data/assets/data/rates-history.json');
            if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
            historicalRates = await response.json();
            
            if (historicalRates && historicalRates.length > 0) {
                console.log(`Loaded ${historicalRates.length} history data points successfully.`);
                initializeChartUI();
            }
        } catch (err) {
            console.warn('Failed to load exchange rates history:', err.message);
            if (chartSection) chartSection.style.display = 'none';
        }
    }

    // Populate chart filters and show layout
    function initializeChartUI() {
        if (!chartSection || !chartCurrencySelect || !chartRateTypeSelect || !ratesChartCanvas) return;
        
        // Extract all unique currencies present in history (excluding VND)
        const uniqueCurrencies = new Set();
        historicalRates.forEach(day => {
            if (day.rates) {
                Object.keys(day.rates).forEach(code => {
                    if (code !== 'VND') uniqueCurrencies.add(code);
                });
            }
        });
        
        const sortedCurrencies = Array.from(uniqueCurrencies).sort();
        
        // Populate currency dropdown
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        chartCurrencySelect.innerHTML = sortedCurrencies.map(code => {
            const fullName = CURRENCY_NAMES[lang]?.[code] || CURRENCY_NAMES['en']?.[code] || code;
            const flag = CURRENCY_FLAGS[code] || '🏳️';
            return `<option value="${code}">${flag} ${code} - ${fullName}</option>`;
        }).join('');
        
        // Default select target currency from converter 'fromSelect' if possible, otherwise first
        const defaultCurrency = sortedCurrencies.includes(fromSelect.value) ? fromSelect.value : (sortedCurrencies.includes('USD') ? 'USD' : sortedCurrencies[0]);
        chartCurrencySelect.value = defaultCurrency;
        
        // Show chart section
        chartSection.style.display = 'block';
        
        // Initial draw
        updateChart();
        
        // Wire up change events
        chartCurrencySelect.addEventListener('change', updateChart);
        chartRateTypeSelect.addEventListener('change', updateChart);
        
        durationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                durationButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPeriod = parseInt(btn.dataset.period);
                updateChart();
            });
        });

        // Toggle observer on dark mode button to redraw chart with updated theme colors
        const darkModeBtn = document.getElementById('dark-mode-toggle');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', () => {
                setTimeout(updateChart, 50); // slight delay to wait for html theme state update
            });
        }
    }

    // Render rates trend line chart
    function updateChart() {
        if (!ratesChartCanvas || !historicalRates || historicalRates.length === 0) return;
        
        const currency = chartCurrencySelect.value;
        const rateType = chartRateTypeSelect.value;
        
        // Slice the history to match current period selection (last N entries)
        const filteredHistory = historicalRates.slice(-currentPeriod);
        
        // Format labels and data points
        const labels = filteredHistory.map(item => {
            const dateObj = new Date(item.date);
            return dateObj.toLocaleDateString(window.translationSystem?.getCurrentLanguage() || 'vi', {
                day: '2-digit',
                month: '2-digit'
            });
        });
        
        const dataPoints = filteredHistory.map(item => {
            return item.rates?.[currency]?.[rateType] || null;
        });
        
        const hasData = dataPoints.some(val => val !== null);
        if (!hasData) {
            console.warn(`No data points found for ${currency} - ${rateType} in specified range.`);
            return;
        }
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const primaryColor = '#6750A4';
        const textColor = isDark ? '#E6E1E5' : '#2D2D36';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(163, 177, 198, 0.25)';
        const tooltipBg = isDark ? '#33333D' : '#FFFFFF';
        const tooltipBorder = isDark ? '#4F378B' : '#6750A4';
        
        const ctx = ratesChartCanvas.getContext('2d');
        
        // Destroy existing chart to prevent canvas ghosting
        if (ratesChartInstance) {
            ratesChartInstance.destroy();
        }
        
        ratesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currency} - ${tr(`currency.chart_${rateType === 'sell' ? 'sell' : (rateType === 'buyTransfer' ? 'buy_transfer' : 'buy_cash')}`, rateType)}`,
                    data: dataPoints,
                    borderColor: primaryColor,
                    backgroundColor: isDark ? 'rgba(103, 80, 164, 0.15)' : 'rgba(103, 80, 164, 0.05)',
                    borderWidth: 2.5,
                    pointRadius: currentPeriod > 90 ? 0 : 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: isDark ? '#2D2D36' : '#FFFFFF',
                    pointBorderWidth: 1.5,
                    tension: 0.25,
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
                                    label += new Intl.NumberFormat().format(context.parsed.y) + ' VND';
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

    // Listen for language change events dispatched by i18n system
    window.addEventListener('languageChanged', function(event) {
        translateCustomLabels();
        populateSelectors();
        renderRatesTable(searchRates ? searchRates.value : '');
        calculateConversion();
        
        // Update currency options translation and chart label
        if (historicalRates && historicalRates.length > 0) {
            const currentSelected = chartCurrencySelect.value;
            const lang = event.detail.language || 'vi';
            
            const uniqueCurrencies = new Set();
            historicalRates.forEach(day => {
                if (day.rates) {
                    Object.keys(day.rates).forEach(code => {
                        if (code !== 'VND') uniqueCurrencies.add(code);
                    });
                }
            });
            const sortedCurrencies = Array.from(uniqueCurrencies).sort();
            
            chartCurrencySelect.innerHTML = sortedCurrencies.map(code => {
                const fullName = CURRENCY_NAMES[lang]?.[code] || CURRENCY_NAMES['en']?.[code] || code;
                const flag = CURRENCY_FLAGS[code] || '🏳️';
                return `<option value="${code}">${flag} ${code} - ${fullName}</option>`;
            }).join('');
            
            chartCurrencySelect.value = currentSelected;
            updateChart();
        }
    });
});
