# Vietnam Holidays Integration

Tích hợp hiển thị ngày lễ Việt Nam vào lịch.

## 📁 Files đã thêm/sửa đổi:

### 1. Data Files
- `_data/vietnam_holidays.json` - Dữ liệu ngày lễ (source file)
- `assets/data/vietnam_holidays.json` - Copy để fetch từ JavaScript

### 2. JavaScript Files
- `assets/js/vietnam-holidays.js` - Logic xử lý và hiển thị ngày lễ
- `assets/js/clock.js` - Đã cập nhật để hiển thị ngày lễ trong modal

### 3. CSS Files
- `_sass/_base.scss` - Thêm styles cho holiday indicators
- `_sass/_dark.scss` - Thêm dark mode styles cho holidays

### 4. HTML Files
- `index.html` - Thêm `vietnam-holidays.js` vào custom_js

## 🎨 Features:

### Trong Calendar:
- **Holiday Indicator**: Dấu chấm/icon nhỏ ở góc phải trên mỗi ngày có lễ
- **Border Highlight**: 
  - Ngày lễ chính thức (công nghỉ): border đỏ
  - Ngày kỷ niệm: border xanh
- **Background Color**: Ngày lễ chính thức có background nhạt đỏ

### Trong Date Details Modal:
Khi click vào một ngày có lễ, modal sẽ hiển thị:
- Tên ngày lễ (tiếng Việt và tiếng Anh)
- Mô tả ngày lễ
- Badges:
  - Loại lễ (chính thức/kỷ niệm)
  - Dương lịch/Âm lịch
  - Số ngày nghỉ (nếu có)

## 📊 Dữ liệu ngày lễ:

### Ngày lễ Âm lịch (13 ngày):
- Tết Nguyên đán (1/1) ⭐
- Giỗ tổ Hùng Vương (10/3) ⭐
- Tết Trung thu (15/8)
- Và các ngày lễ khác...

### Ngày lễ Dương lịch (38 ngày):
- Tết Dương lịch (1/1) ⭐
- Ngày giải phóng miền Nam (30/4) ⭐
- Ngày Quốc tế Lao động (1/5) ⭐
- Ngày Quốc Khánh (2/9) ⭐
- Và các ngày kỷ niệm khác...

⭐ = Ngày lễ chính thức (nghỉ làm)

## 🔧 API Usage:

```javascript
// Check if a date is a holiday
const holiday = window.VietnamHolidays.getHoliday(9, 10, 2025);
if (holiday) {
    console.log(holiday.name); // Tên ngày lễ
    console.log(holiday.is_public_holiday); // true/false
}

// Check if it's a public holiday
const isPublic = window.VietnamHolidays.isPublicHoliday(1, 1, 2025); // true

// Get all holidays data
const allHolidays = window.VietnamHolidays.getAllHolidays();
console.log(allHolidays.solar_holidays);
console.log(allHolidays.lunar_holidays);
```

## 🎨 CSS Classes:

- `.has-holiday` - Ngày có lễ (border xanh)
- `.public-holiday` - Ngày lễ chính thức (border đỏ, background đỏ nhạt)
- `.holiday-indicator` - Icon indicator ở góc ô ngày

## 🌙 Lunar Calendar Integration:

File `vietnam-holidays.js` tự động tích hợp với `lunar-calendar.js`:
- Tự động chuyển đổi ngày dương lịch sang âm lịch
- Kiểm tra xem ngày đó có phải là ngày lễ âm lịch không
- Hiển thị cả ngày lễ dương lịch và âm lịch

## 🔄 Auto-Update:

Mỗi khi calendar được cập nhật (chuyển tháng, reload page), các ngày lễ sẽ tự động được highlight bằng `MutationObserver`.

## 📝 Notes:

- Dữ liệu ngày lễ được load một lần khi page load
- Nếu không load được từ `/_data/`, sẽ fallback sang `/assets/data/`
- Dark mode được hỗ trợ đầy đủ
- Responsive trên mọi thiết bị
