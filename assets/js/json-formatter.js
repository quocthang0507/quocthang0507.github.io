// JSON Formatter and CSV Converter Functionality
document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const indentSelect = document.getElementById('indent-select');
    const validationStatus = document.getElementById('json-validation-status');

    // Buttons
    const formatBtn = document.getElementById('format-json-btn');
    const minifyBtn = document.getElementById('minify-json-btn');
    const validateBtn = document.getElementById('validate-json-btn');
    const jsonToCsvBtn = document.getElementById('json-to-csv-btn');
    const csvToJsonBtn = document.getElementById('csv-to-json-btn');
    
    const loadJsonSampleBtn = document.getElementById('load-json-sample-btn');
    const loadCsvSampleBtn = document.getElementById('load-csv-sample-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');

    // Labels for custom elements
    const labelIndent = document.getElementById('label-json-indent');
    const labelInput = document.getElementById('label-json-input');
    const labelOutput = document.getElementById('label-json-output');

    // Translations fallback mapping
    const LOCALIZED_TEXTS = {
        vi: {
            indent: 'Khoảng cách thụt lề:',
            input_label: 'Dữ liệu đầu vào (JSON hoặc CSV):',
            output_label: 'Kết quả:',
            valid: '✓ Dữ liệu JSON hợp lệ!',
            invalid: '✗ Dữ liệu JSON không hợp lệ!',
            copied: 'Đã sao chép kết quả!',
            clear_alert: 'Đã xóa toàn bộ dữ liệu.',
            parse_error: 'Lỗi cú pháp:',
            empty_input: 'Vui lòng nhập dữ liệu đầu vào!',
            csv_convert_error: 'Lỗi chuyển đổi CSV: Dữ liệu JSON phải là một mảng các đối tượng.'
        },
        en: {
            indent: 'Indentation:',
            input_label: 'Input Data (JSON or CSV):',
            output_label: 'Result:',
            valid: '✓ Valid JSON!',
            invalid: '✗ Invalid JSON!',
            copied: 'Copied output to clipboard!',
            clear_alert: 'Data cleared.',
            parse_error: 'Syntax Error:',
            empty_input: 'Please enter input data!',
            csv_convert_error: 'CSV Conversion Error: JSON data must be an array of objects.'
        },
        zh: {
            indent: '缩进空格:',
            input_label: '输入数据 (JSON 或 CSV):',
            output_label: '输出结果:',
            valid: '✓ 有效的 JSON 数据！',
            invalid: '✗ 无效的 JSON 数据！',
            copied: '已复制输出结果到剪贴板！',
            clear_alert: '数据已清空。',
            parse_error: '语法错误:',
            empty_input: '请输入输入数据！',
            csv_convert_error: 'CSV 转换错误: JSON 数据必须是对象数组。'
        },
        ko: {
            indent: '들여쓰기 너비:',
            input_label: '입력 데이터 (JSON 또는 CSV):',
            output_label: '결과:',
            valid: '✓ 유효한 JSON입니다!',
            invalid: '✗ 유효하지 않은 JSON입니다!',
            copied: '클립보드에 결과가 복사되었습니다!',
            clear_alert: '데이터가 초기화되었습니다.',
            parse_error: '구문 오류:',
            empty_input: '입력 데이터를 입력하세요!',
            csv_convert_error: 'CSV 변환 오류: JSON 데이터는 객체 배열 형태여야 합니다.'
        },
        ja: {
            indent: 'インデント幅:',
            input_label: '入力データ (JSON または CSV):',
            output_label: '変換結果:',
            valid: '✓ 有效な JSON データです！',
            invalid: '✗ 無効な JSON データです！',
            copied: '変換結果をクリップボードにコピーしました！',
            clear_alert: 'データをクリアしました。',
            parse_error: '構文エラー:',
            empty_input: '入力データを選択してください！',
            csv_convert_error: 'CSV変換エラー: JSONデータはオブジェクトの配列である必要があります。'
        }
    };

    // Sample data strings
    const SAMPLE_JSON = `{
  "projectName": "Utility Hub Website",
  "version": "1.2.0",
  "active": true,
  "developer": {
    "name": "Quoc Thang",
    "role": "Fullstack Developer",
    "skills": ["JavaScript", "HTML5", "CSS3", "Jekyll"]
  },
  "modules": [
    { "id": 1, "name": "Password Generator", "status": "Ready" },
    { "id": 2, "name": "Online Currency Converter", "status": "Ready" },
    { "id": 3, "name": "JSON Formatter", "status": "Testing" }
  ]
}`;

    const SAMPLE_CSV = `id,name,role,active,rating
1,Quoc Thang,Developer,true,5.0
2,Jane Doe,Designer,false,4.5
3,John Smith,Manager,true,4.2
4,Bob Johnson,Tester,true,3.8`;

    // Localized translate helper
    function getTranslations() {
        const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
        return LOCALIZED_TEXTS[lang] || LOCALIZED_TEXTS['en'];
    }

    function translateDynamicLabels() {
        const texts = getTranslations();
        if (labelIndent) labelIndent.textContent = texts.indent;
        if (labelInput) labelInput.textContent = texts.input_label;
        if (labelOutput) labelOutput.textContent = texts.output_label;
    }

    // Get Indent format spacing
    function getIndentSpacing() {
        const val = indentSelect.value;
        if (val === 'tab') return '\t';
        return parseInt(val) || 4;
    }

    // Display validation alert banner
    function showValidationBanner(isValid, message = '') {
        if (!validationStatus) return;
        validationStatus.style.display = 'block';
        if (isValid) {
            validationStatus.className = 'alert alert-success py-2 px-3 mb-3';
            validationStatus.textContent = message || getTranslations().valid;
        } else {
            validationStatus.className = 'alert alert-danger py-2 px-3 mb-3';
            validationStatus.textContent = message || getTranslations().invalid;
        }
    }

    function clearValidationBanner() {
        if (validationStatus) {
            validationStatus.style.display = 'none';
            validationStatus.innerHTML = '';
        }
    }

    // Core Formatting logic
    function formatJSON() {
        const input = jsonInput.value.trim();
        if (!input) {
            showError(getTranslations().empty_input);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const indent = getIndentSpacing();
            const formatted = JSON.stringify(parsed, null, indent);
            jsonOutput.value = formatted;
            showValidationBanner(true);
        } catch (e) {
            showValidationBanner(false, `${getTranslations().invalid} ${getTranslations().parse_error} ${e.message}`);
            jsonOutput.value = '';
        }
    }

    // Core Minifying logic
    function minifyJSON() {
        const input = jsonInput.value.trim();
        if (!input) {
            showError(getTranslations().empty_input);
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            jsonOutput.value = minified;
            showValidationBanner(true);
        } catch (e) {
            showValidationBanner(false, `${getTranslations().invalid} ${getTranslations().parse_error} ${e.message}`);
            jsonOutput.value = '';
        }
    }

    // Core Validation check
    function validateJSON() {
        const input = jsonInput.value.trim();
        if (!input) {
            showError(getTranslations().empty_input);
            return;
        }

        try {
            JSON.parse(input);
            showValidationBanner(true);
        } catch (e) {
            showValidationBanner(false, `${getTranslations().invalid} ${getTranslations().parse_error} ${e.message}`);
        }
    }

    // JSON to CSV converter
    function convertJsonToCsv() {
        const input = jsonInput.value.trim();
        if (!input) {
            showError(getTranslations().empty_input);
            return;
        }

        try {
            let parsed = JSON.parse(input);
            
            // If parsed is a single object, wrap it in an array
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                parsed = [parsed];
            }

            if (!Array.isArray(parsed)) {
                throw new Error(getTranslations().csv_convert_error);
            }

            const csvResult = arrayToCSV(parsed);
            jsonOutput.value = csvResult;
            showValidationBanner(true, '✓ JSON → CSV successful!');
        } catch (e) {
            showValidationBanner(false, `${getTranslations().invalid} ${e.message}`);
            jsonOutput.value = '';
        }
    }

    // CSV parser & objects transformer
    function convertCsvToJson() {
        const input = jsonInput.value.trim();
        if (!input) {
            showError(getTranslations().empty_input);
            return;
        }

        try {
            const csvData = parseCSV(input);
            if (csvData.length < 1) {
                throw new Error('CSV is empty or invalid.');
            }

            const headers = csvData[0];
            const rows = csvData.slice(1);
            
            const resultList = rows.map(row => {
                let obj = {};
                headers.forEach((header, index) => {
                    let val = row[index] !== undefined ? row[index].trim() : '';
                    
                    // Auto-parse numeric/boolean types
                    if (val.toLowerCase() === 'true') val = true;
                    else if (val.toLowerCase() === 'false') val = false;
                    else if (val !== '' && !isNaN(Number(val))) val = Number(val);

                    obj[header.trim()] = val;
                });
                return obj;
            });

            const indent = getIndentSpacing();
            jsonOutput.value = JSON.stringify(resultList, null, indent);
            showValidationBanner(true, '✓ CSV → JSON successful!');
        } catch (e) {
            showValidationBanner(false, `✗ CSV Parsing Error: ${e.message}`);
            jsonOutput.value = '';
        }
    }

    // Array of objects to CSV converter
    function arrayToCSV(arr) {
        if (arr.length === 0) return '';
        
        const flattenObj = (obj) => {
            let flat = {};
            for (let k in obj) {
                if (typeof obj[k] === 'object' && obj[k] !== null) {
                    flat[k] = JSON.stringify(obj[k]);
                } else {
                    flat[k] = obj[k];
                }
            }
            return flat;
        };

        const flatArr = arr.map(item => {
            if (typeof item !== 'object' || item === null) {
                return { value: item };
            }
            return flattenObj(item);
        });

        // Extract all headers
        const headers = [...new Set(flatArr.reduce((acc, val) => acc.concat(Object.keys(val)), []))];

        const escapeCSVValue = (val) => {
            if (val === null || val === undefined) return '';
            let str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                str = '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        let csv = headers.map(h => escapeCSVValue(h)).join(',') + '\n';
        flatArr.forEach(row => {
            const vals = headers.map(h => escapeCSVValue(row[h]));
            csv += vals.join(',') + '\n';
        });

        return csv.trim();
    }

    // CSV Parser supporting quotes and comma escaping
    function parseCSV(text) {
        let lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            let c = text[i];
            let next = text[i+1];
            if (c === '"') {
                if (inQuotes && next === '"') {
                    row[row.length - 1] += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                row.push('');
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
                if (c === '\r' && next === '\n') {
                    i++;
                }
                lines.push(row);
                row = [''];
            } else {
                row[row.length - 1] += c;
            }
        }
        if (row.length > 1 || row[0] !== '') {
            lines.push(row);
        }
        return lines;
    }

    // Copy to clipboard with success feedback
    function copyOutput() {
        const text = jsonOutput.value.trim();
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const texts = getTranslations();
            if (typeof window.showAlert === 'function') {
                window.showAlert(texts.copied, 'success');
            }

            // Visual feedback on button icon
            const icon = copyOutputBtn.querySelector('i');
            const span = copyOutputBtn.querySelector('span');
            if (icon && span) {
                const originalIconClass = icon.className;
                const originalText = span.textContent;
                
                icon.className = 'fas fa-check text-success';
                span.textContent = tr('password.copied_short', 'Đã sao chép');
                
                setTimeout(() => {
                    icon.className = originalIconClass;
                    span.textContent = originalText;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy formatted text:', err);
        });
    }

    function showError(msg) {
        if (typeof window.showAlert === 'function') {
            window.showAlert(msg, 'warning');
        } else {
            alert(msg);
        }
    }

    // Event Listeners
    if (formatBtn) formatBtn.addEventListener('click', formatJSON);
    if (minifyBtn) minifyBtn.addEventListener('click', minifyJSON);
    if (validateBtn) validateBtn.addEventListener('click', validateJSON);
    if (jsonToCsvBtn) jsonToCsvBtn.addEventListener('click', convertJsonToCsv);
    if (csvToJsonBtn) csvToJsonBtn.addEventListener('click', convertCsvToJson);

    if (loadJsonSampleBtn) {
        loadJsonSampleBtn.addEventListener('click', () => {
            jsonInput.value = SAMPLE_JSON;
            jsonOutput.value = '';
            clearValidationBanner();
        });
    }

    if (loadCsvSampleBtn) {
        loadCsvSampleBtn.addEventListener('click', () => {
            jsonInput.value = SAMPLE_CSV;
            jsonOutput.value = '';
            clearValidationBanner();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            jsonInput.value = '';
            jsonOutput.value = '';
            clearValidationBanner();
            if (typeof window.showAlert === 'function') {
                window.showAlert(getTranslations().clear_alert, 'info');
            }
        });
    }

    if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', copyOutput);
    }

    // Listen for window language change events
    window.addEventListener('languageChanged', () => {
        translateDynamicLabels();
        clearValidationBanner();
    });

    // Initial label display translation load
    translateDynamicLabels();
});
