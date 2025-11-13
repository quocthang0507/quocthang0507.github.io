// Unit Converter functionality
document.addEventListener('DOMContentLoaded', function() {
    let conversionHistory = loadFromLocalStorage('conversionHistory') || [];
    
    // Unit definitions with conversion factors to base unit
    const units = {
        length: {
            name: 'Length',
            base: 'meter',
            units: {
                'meter': { name: 'Meter (m)', factor: 1 },
                'kilometer': { name: 'Kilometer (km)', factor: 1000 },
                'centimeter': { name: 'Centimeter (cm)', factor: 0.01 },
                'millimeter': { name: 'Millimeter (mm)', factor: 0.001 },
                'mile': { name: 'Mile (mi)', factor: 1609.344 },
                'yard': { name: 'Yard (yd)', factor: 0.9144 },
                'foot': { name: 'Foot (ft)', factor: 0.3048 },
                'inch': { name: 'Inch (in)', factor: 0.0254 },
                'nautical_mile': { name: 'Nautical Mile', factor: 1852 }
            }
        },
        weight: {
            name: 'Weight',
            base: 'kilogram',
            units: {
                'kilogram': { name: 'Kilogram (kg)', factor: 1 },
                'gram': { name: 'Gram (g)', factor: 0.001 },
                'milligram': { name: 'Milligram (mg)', factor: 0.000001 },
                'ton': { name: 'Metric Ton (t)', factor: 1000 },
                'pound': { name: 'Pound (lb)', factor: 0.453592 },
                'ounce': { name: 'Ounce (oz)', factor: 0.0283495 },
                'stone': { name: 'Stone (st)', factor: 6.35029 },
                'carat': { name: 'Carat', factor: 0.0002 }
            }
        },
        temperature: {
            name: 'Temperature',
            base: 'celsius',
            units: {
                'celsius': { name: 'Celsius (°C)', factor: 1 },
                'fahrenheit': { name: 'Fahrenheit (°F)', factor: 1 },
                'kelvin': { name: 'Kelvin (K)', factor: 1 }
            },
            convert: function(value, from, to) {
                // Convert to Celsius first
                let celsius = value;
                if (from === 'fahrenheit') {
                    celsius = (value - 32) * 5/9;
                } else if (from === 'kelvin') {
                    celsius = value - 273.15;
                }
                
                // Convert from Celsius to target
                if (to === 'fahrenheit') {
                    return celsius * 9/5 + 32;
                } else if (to === 'kelvin') {
                    return celsius + 273.15;
                }
                return celsius;
            }
        },
        volume: {
            name: 'Volume',
            base: 'liter',
            units: {
                'liter': { name: 'Liter (L)', factor: 1 },
                'milliliter': { name: 'Milliliter (mL)', factor: 0.001 },
                'cubic_meter': { name: 'Cubic Meter (m³)', factor: 1000 },
                'cubic_centimeter': { name: 'Cubic Centimeter (cm³)', factor: 0.001 },
                'gallon_us': { name: 'US Gallon (gal)', factor: 3.78541 },
                'gallon_uk': { name: 'UK Gallon (gal)', factor: 4.54609 },
                'quart': { name: 'Quart (qt)', factor: 0.946353 },
                'pint': { name: 'Pint (pt)', factor: 0.473176 },
                'cup': { name: 'Cup', factor: 0.236588 },
                'fluid_ounce': { name: 'Fluid Ounce (fl oz)', factor: 0.0295735 },
                'tablespoon': { name: 'Tablespoon (tbsp)', factor: 0.0147868 },
                'teaspoon': { name: 'Teaspoon (tsp)', factor: 0.00492892 }
            }
        },
        area: {
            name: 'Area',
            base: 'square_meter',
            units: {
                'square_meter': { name: 'Square Meter (m²)', factor: 1 },
                'square_kilometer': { name: 'Square Kilometer (km²)', factor: 1000000 },
                'square_centimeter': { name: 'Square Centimeter (cm²)', factor: 0.0001 },
                'hectare': { name: 'Hectare (ha)', factor: 10000 },
                'acre': { name: 'Acre', factor: 4046.86 },
                'square_mile': { name: 'Square Mile (mi²)', factor: 2589988.11 },
                'square_yard': { name: 'Square Yard (yd²)', factor: 0.836127 },
                'square_foot': { name: 'Square Foot (ft²)', factor: 0.092903 },
                'square_inch': { name: 'Square Inch (in²)', factor: 0.00064516 }
            }
        },
        speed: {
            name: 'Speed',
            base: 'meter_per_second',
            units: {
                'meter_per_second': { name: 'Meter/second (m/s)', factor: 1 },
                'kilometer_per_hour': { name: 'Kilometer/hour (km/h)', factor: 0.277778 },
                'mile_per_hour': { name: 'Mile/hour (mph)', factor: 0.44704 },
                'foot_per_second': { name: 'Foot/second (ft/s)', factor: 0.3048 },
                'knot': { name: 'Knot (kn)', factor: 0.514444 }
            }
        },
        time: {
            name: 'Time',
            base: 'second',
            units: {
                'second': { name: 'Second (s)', factor: 1 },
                'millisecond': { name: 'Millisecond (ms)', factor: 0.001 },
                'microsecond': { name: 'Microsecond (μs)', factor: 0.000001 },
                'minute': { name: 'Minute (min)', factor: 60 },
                'hour': { name: 'Hour (hr)', factor: 3600 },
                'day': { name: 'Day', factor: 86400 },
                'week': { name: 'Week', factor: 604800 },
                'month': { name: 'Month (30 days)', factor: 2592000 },
                'year': { name: 'Year (365 days)', factor: 31536000 }
            }
        },
        data: {
            name: 'Data Storage',
            base: 'byte',
            units: {
                'bit': { name: 'Bit', factor: 0.125 },
                'byte': { name: 'Byte (B)', factor: 1 },
                'kilobyte': { name: 'Kilobyte (KB)', factor: 1024 },
                'megabyte': { name: 'Megabyte (MB)', factor: 1048576 },
                'gigabyte': { name: 'Gigabyte (GB)', factor: 1073741824 },
                'terabyte': { name: 'Terabyte (TB)', factor: 1099511627776 },
                'petabyte': { name: 'Petabyte (PB)', factor: 1125899906842624 }
            }
        }
    };
    
    // Common conversions by category
    const commonConversions = {
        length: [
            { from: 'kilometer', to: 'mile', fromVal: 1, label: '1 km = 0.621371 mi' },
            { from: 'meter', to: 'foot', fromVal: 1, label: '1 m = 3.28084 ft' },
            { from: 'inch', to: 'centimeter', fromVal: 1, label: '1 in = 2.54 cm' },
            { from: 'mile', to: 'kilometer', fromVal: 1, label: '1 mi = 1.60934 km' }
        ],
        weight: [
            { from: 'kilogram', to: 'pound', fromVal: 1, label: '1 kg = 2.20462 lb' },
            { from: 'pound', to: 'kilogram', fromVal: 1, label: '1 lb = 0.453592 kg' },
            { from: 'ton', to: 'pound', fromVal: 1, label: '1 t = 2204.62 lb' },
            { from: 'ounce', to: 'gram', fromVal: 1, label: '1 oz = 28.3495 g' }
        ],
        temperature: [
            { from: 'celsius', to: 'fahrenheit', fromVal: 0, label: '0°C = 32°F' },
            { from: 'celsius', to: 'fahrenheit', fromVal: 100, label: '100°C = 212°F' },
            { from: 'celsius', to: 'kelvin', fromVal: 0, label: '0°C = 273.15 K' },
            { from: 'fahrenheit', to: 'celsius', fromVal: 32, label: '32°F = 0°C' }
        ],
        volume: [
            { from: 'liter', to: 'gallon_us', fromVal: 1, label: '1 L = 0.264172 gal (US)' },
            { from: 'gallon_us', to: 'liter', fromVal: 1, label: '1 gal (US) = 3.78541 L' },
            { from: 'milliliter', to: 'fluid_ounce', fromVal: 1, label: '1 mL = 0.033814 fl oz' },
            { from: 'cup', to: 'milliliter', fromVal: 1, label: '1 cup = 236.588 mL' }
        ],
        area: [
            { from: 'square_meter', to: 'square_foot', fromVal: 1, label: '1 m² = 10.7639 ft²' },
            { from: 'hectare', to: 'acre', fromVal: 1, label: '1 ha = 2.47105 acres' },
            { from: 'square_kilometer', to: 'square_mile', fromVal: 1, label: '1 km² = 0.386102 mi²' },
            { from: 'acre', to: 'square_meter', fromVal: 1, label: '1 acre = 4046.86 m²' }
        ],
        speed: [
            { from: 'kilometer_per_hour', to: 'mile_per_hour', fromVal: 1, label: '1 km/h = 0.621371 mph' },
            { from: 'meter_per_second', to: 'kilometer_per_hour', fromVal: 1, label: '1 m/s = 3.6 km/h' },
            { from: 'mile_per_hour', to: 'kilometer_per_hour', fromVal: 60, label: '60 mph = 96.56 km/h' },
            { from: 'knot', to: 'kilometer_per_hour', fromVal: 1, label: '1 kn = 1.852 km/h' }
        ],
        time: [
            { from: 'hour', to: 'minute', fromVal: 1, label: '1 hr = 60 min' },
            { from: 'day', to: 'hour', fromVal: 1, label: '1 day = 24 hr' },
            { from: 'week', to: 'day', fromVal: 1, label: '1 week = 7 days' },
            { from: 'year', to: 'day', fromVal: 1, label: '1 year = 365 days' }
        ],
        data: [
            { from: 'megabyte', to: 'gigabyte', fromVal: 1024, label: '1024 MB = 1 GB' },
            { from: 'gigabyte', to: 'terabyte', fromVal: 1024, label: '1024 GB = 1 TB' },
            { from: 'kilobyte', to: 'megabyte', fromVal: 1024, label: '1024 KB = 1 MB' },
            { from: 'byte', to: 'kilobyte', fromVal: 1024, label: '1024 B = 1 KB' }
        ]
    };
    
    let currentCategory = 'length';
    
    // Category info texts
    const categoryInfo = {
        length: 'Chuyển đổi giữa các đơn vị độ dài như mét, kilômét, dặm, feet...',
        weight: 'Chuyển đổi giữa các đơn vị khối lượng như kilôgam, pound, ounce...',
        temperature: 'Chuyển đổi giữa Celsius, Fahrenheit và Kelvin',
        volume: 'Chuyển đổi giữa các đơn vị thể tích như lít, gallon, mililít...',
        area: 'Chuyển đổi giữa các đơn vị diện tích như mét vuông, hecta, acre...',
        speed: 'Chuyển đổi giữa các đơn vị tốc độ như km/h, mph, m/s...',
        time: 'Chuyển đổi giữa giây, phút, giờ, ngày, tuần, năm...',
        data: 'Chuyển đổi giữa các đơn vị dung lượng dữ liệu như byte, KB, MB, GB...'
    };
    
    // Initialize
    populateUnitSelectors();
    updateCommonConversions();
    renderHistory();
    
    // Populate unit selectors based on category
    function populateUnitSelectors() {
        const category = units[currentCategory];
        const fromSelect = document.getElementById('from-unit');
        const toSelect = document.getElementById('to-unit');
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        Object.entries(category.units).forEach(([key, unit]) => {
            const option1 = new Option(unit.name, key);
            const option2 = new Option(unit.name, key);
            fromSelect.add(option1);
            toSelect.add(option2);
        });
        
        // Set default selections
        const unitKeys = Object.keys(category.units);
        if (unitKeys.length > 1) {
            toSelect.selectedIndex = 1;
        }
        
        // Update info text
        const infoElement = document.getElementById('category-info');
        if (infoElement) {
            infoElement.textContent = categoryInfo[currentCategory];
        }
    }
    
    // Convert units
    function convertUnits() {
        const fromUnit = document.getElementById('from-unit').value;
        const toUnit = document.getElementById('to-unit').value;
        const fromValue = parseFloat(document.getElementById('from-value').value);
        
        if (isNaN(fromValue)) {
            document.getElementById('to-value').value = '';
            return;
        }
        
        const category = units[currentCategory];
        let result;
        
        // Special handling for temperature
        if (currentCategory === 'temperature') {
            result = category.convert(fromValue, fromUnit, toUnit);
        } else {
            // Convert to base unit, then to target unit
            const baseValue = fromValue * category.units[fromUnit].factor;
            result = baseValue / category.units[toUnit].factor;
        }
        
        // Format result
        const formattedResult = formatNumber(result);
        document.getElementById('to-value').value = formattedResult;
        
        // Show formula
        showFormula(fromValue, fromUnit, result, toUnit);
        
        // Add to history
        addToHistory(fromValue, fromUnit, result, toUnit);
    }
    
    // Format number for display
    function formatNumber(num) {
        if (Math.abs(num) < 0.000001 && num !== 0) {
            return num.toExponential(6);
        } else if (Math.abs(num) > 1000000000) {
            return num.toExponential(6);
        } else if (Math.abs(num) < 0.01 && num !== 0) {
            return num.toFixed(8).replace(/\.?0+$/, '');
        } else {
            return num.toFixed(6).replace(/\.?0+$/, '');
        }
    }
    
    // Show conversion formula
    function showFormula(fromVal, fromUnit, toVal, toUnit) {
        const category = units[currentCategory];
        const fromUnitName = category.units[fromUnit].name.split('(')[0].trim();
        const toUnitName = category.units[toUnit].name.split('(')[0].trim();
        
        const formulaDisplay = document.getElementById('formula-display');
        const formulaContainer = document.getElementById('conversion-formula');
        
        formulaDisplay.textContent = `${formatNumber(fromVal)} ${fromUnitName} = ${formatNumber(toVal)} ${toUnitName}`;
        formulaContainer.style.display = 'block';
    }
    
    // Add conversion to history
    function addToHistory(fromVal, fromUnit, toVal, toUnit) {
        const category = units[currentCategory];
        const historyItem = {
            category: currentCategory,
            categoryName: category.name,
            fromValue: fromVal,
            fromUnit: fromUnit,
            fromUnitName: category.units[fromUnit].name,
            toValue: toVal,
            toUnit: toUnit,
            toUnitName: category.units[toUnit].name,
            timestamp: new Date().toLocaleString('vi-VN')
        };
        
        conversionHistory.unshift(historyItem);
        if (conversionHistory.length > 50) {
            conversionHistory = conversionHistory.slice(0, 50);
        }
        
        saveToLocalStorage('conversionHistory', conversionHistory);
        renderHistory();
    }
    
    // Render conversion history
    function renderHistory() {
        const historyContainer = document.getElementById('conversion-history');
        
        if (conversionHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-muted text-center">Chưa có lịch sử chuyển đổi</p>';
            return;
        }
        
        historyContainer.innerHTML = conversionHistory.slice(0, 10).map((item, index) => `
            <div class="history-item" onclick="window.applyHistoryItem(${index})">
                <div>
                    <strong>${formatNumber(item.fromValue)}</strong> ${item.fromUnitName.split('(')[0].trim()}
                    → <strong>${formatNumber(item.toValue)}</strong> ${item.toUnitName.split('(')[0].trim()}
                </div>
                <small>${item.categoryName} • ${item.timestamp}</small>
            </div>
        `).join('');
    }
    
    // Apply history item to converter
    window.applyHistoryItem = function(index) {
        const item = conversionHistory[index];
        
        // Change category if needed
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            document.getElementById('category-selector').value = currentCategory;
            populateUnitSelectors();
            updateCommonConversions();
        }
        
        // Set values
        document.getElementById('from-unit').value = item.fromUnit;
        document.getElementById('to-unit').value = item.toUnit;
        document.getElementById('from-value').value = item.fromValue;
        
        convertUnits();
    };
    
    // Update common conversions display
    function updateCommonConversions() {
        const commonContainer = document.getElementById('common-conversions');
        const conversions = commonConversions[currentCategory] || [];
        
        if (conversions.length === 0) {
            commonContainer.innerHTML = '<p class="text-muted text-center">Không có chuyển đổi phổ biến</p>';
            return;
        }
        
        commonContainer.innerHTML = conversions.map((conv, index) => `
            <div class="common-conversion-item" onclick="window.applyCommonConversion(${index})">
                <i class="fas fa-arrow-right text-primary"></i> ${conv.label}
            </div>
        `).join('');
    }
    
    // Apply common conversion
    window.applyCommonConversion = function(index) {
        const conv = commonConversions[currentCategory][index];
        
        document.getElementById('from-unit').value = conv.from;
        document.getElementById('to-unit').value = conv.to;
        document.getElementById('from-value').value = conv.fromVal;
        
        convertUnits();
    };
    
    // Swap units
    function swapUnits() {
        const fromUnit = document.getElementById('from-unit').value;
        const toUnit = document.getElementById('to-unit').value;
        const fromValue = document.getElementById('from-value').value;
        const toValue = document.getElementById('to-value').value;
        
        document.getElementById('from-unit').value = toUnit;
        document.getElementById('to-unit').value = fromUnit;
        document.getElementById('from-value').value = toValue || fromValue;
        
        convertUnits();
    }
    
    // Reset converter
    function resetConverter() {
        document.getElementById('from-value').value = '1';
        const unitKeys = Object.keys(units[currentCategory].units);
        document.getElementById('from-unit').value = unitKeys[0];
        document.getElementById('to-unit').value = unitKeys[1] || unitKeys[0];
        convertUnits();
    }
    
    // Copy result to clipboard
    function copyResult() {
        const result = document.getElementById('to-value').value;
        if (!result) {
            showAlert('Không có kết quả để sao chép!', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(result).then(() => {
            showAlert('Đã sao chép kết quả!', 'success');
        }).catch(() => {
            showAlert('Không thể sao chép!', 'error');
        });
    }
    
    // Clear history
    function clearHistory() {
        if (conversionHistory.length === 0) return;
        
        if (confirm('Bạn có chắc muốn xóa lịch sử chuyển đổi?')) {
            conversionHistory = [];
            saveToLocalStorage('conversionHistory', conversionHistory);
            renderHistory();
            showAlert('Đã xóa lịch sử!', 'success');
        }
    }
    
    // Event listeners
    document.getElementById('category-selector').addEventListener('change', function() {
        currentCategory = this.value;
        populateUnitSelectors();
        updateCommonConversions();
        resetConverter();
    });
    
    document.getElementById('from-unit').addEventListener('change', convertUnits);
    document.getElementById('to-unit').addEventListener('change', convertUnits);
    document.getElementById('from-value').addEventListener('input', convertUnits);
    
    document.getElementById('swap-units-btn').addEventListener('click', swapUnits);
    document.getElementById('reset-converter-btn').addEventListener('click', resetConverter);
    document.getElementById('copy-result-btn').addEventListener('click', copyResult);
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    
    // Initial conversion
    convertUnits();
});
