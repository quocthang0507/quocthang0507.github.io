// Global Command Palette Switcher Controller
document.addEventListener('DOMContentLoaded', function() {
  const SYSTEM_TOOLS = [
    { titleKey: 'nav.delegate_nameplate', url: './delegate-nameplate/', icon: 'fas fa-id-card' },
    { titleKey: 'nav.home', url: './', icon: 'fas fa-home' },
    { titleKey: 'nav.random_number', url: './random-number/', icon: 'fas fa-random' },
    { titleKey: 'nav.random_wheel', url: './random-wheel/', icon: 'fas fa-dharmachakra' },
    { titleKey: 'nav.password_generator', url: './password-generator/', icon: 'fas fa-key' },
    { titleKey: 'nav.world_clocks', url: './world-clocks/', icon: 'fas fa-clock' },
    { titleKey: 'nav.unit_converter', url: './unit-converter/', icon: 'fas fa-exchange-alt' },
    { titleKey: 'nav.currency_converter', url: './currency-converter/', icon: 'fas fa-calculator' },
    { titleKey: 'nav.gold_price', url: './gold-price/', icon: 'fas fa-coins' },
    { titleKey: 'nav.qr_generator', url: './qr-generator/', icon: 'fas fa-qrcode' },
    { titleKey: 'nav.encoder_decoder', url: './encoder-decoder/', icon: 'fas fa-terminal' },
    { titleKey: 'nav.hash_generator', url: './hash-generator/', icon: 'fas fa-hashtag' },
    { titleKey: 'nav.color_picker', url: './color-picker/', icon: 'fas fa-palette' },
    { titleKey: 'nav.date_calculator', url: './date-calculator/', icon: 'fas fa-calendar-alt' },
    { titleKey: 'nav.case_converter', url: './case-converter/', icon: 'fas fa-text-height' },
    { titleKey: 'nav.regex_tester', url: './regex-tester/', icon: 'fas fa-search' },
    { titleKey: 'nav.markdown_preview', url: './markdown-preview/', icon: 'fab fa-markdown' },
    { titleKey: 'nav.latex_editor', url: './latex-editor/', icon: 'fas fa-square-root-alt' },
    { titleKey: 'nav.json_formatter', url: './json-formatter/', icon: 'fas fa-code' }
  ];

  const TOOL_DESCRIPTIONS = {
      vi: {
          'nav.delegate_nameplate': 'Thiết kế bảng tên đại biểu sự kiện, logo, xuất SVG PNG JPG',
          'nav.home': 'Đồng hồ & Lịch âm dương hiện tại',
          'nav.random_number': 'Tạo số ngẫu nhiên với nhiều tùy chọn',
          'nav.random_wheel': 'Vòng quay may mắn chọn ngẫu nhiên',
          'nav.password_generator': 'Tạo mật khẩu bảo mật và mạnh mẽ',
          'nav.world_clocks': 'Đồng hồ xem giờ các thành phố thế giới',
          'nav.unit_converter': 'Chuyển đổi các đơn vị đo lường cơ bản',
          'nav.currency_converter': 'Chuyển đổi tiền tệ tỷ giá trực tuyến Vietcombank',
          'nav.qr_generator': 'Tạo mã QR có logo và đổi kiểu dáng',
          'nav.encoder_decoder': 'Mã hóa và giải mã Base64, URL, HTML',
          'nav.hash_generator': 'Tạo mã băm MD5, SHA-1, SHA-256',
          'nav.color_picker': 'Bộ chọn màu sắc phối màu và kiểm tra độ tương phản',
          'nav.date_calculator': 'Tính ngày giờ, khoảng cách ngày và tuổi',
          'nav.case_converter': 'Chuyển đổi chữ hoa, chữ thường, camelCase',
          'nav.regex_tester': 'Kiểm tra biểu thức chính quy (Regex) trực quan',
          'nav.markdown_preview': 'Xem trước định dạng Markdown thời gian thực',
          'nav.latex_editor': 'Soạn thảo và vẽ công thức toán học LaTeX',
          'nav.json_formatter': 'Định dạng, nén JSON và chuyển đổi dữ liệu CSV'
      },
      en: {
          'nav.home': 'Clock & Solar/Lunar Calendar',
          'nav.random_number': 'Generate random numbers with options',
          'nav.random_wheel': 'Decision picker spin wheel',
          'nav.password_generator': 'Secure strong password generator',
          'nav.world_clocks': 'Time zones viewer',
          'nav.unit_converter': 'Multi-category measurement converter',
          'nav.currency_converter': 'Live exchange rates from Vietcombank',
          'nav.qr_generator': 'Styled QR code builder with logo support',
          'nav.encoder_decoder': 'Base64, URL, HTML encoder/decoder',
          'nav.hash_generator': 'MD5, SHA-1, SHA-256 builder',
          'nav.color_picker': 'Harmonies, contrast ratios & gradients',
          'nav.date_calculator': 'Date differences & age calculations',
          'nav.case_converter': 'Uppercase, lowercase, camelCase converter',
          'nav.regex_tester': 'Regex expression matches & explanations',
          'nav.markdown_preview': 'Realtime MD markdown viewer',
          'nav.latex_editor': 'Math LaTeX formula rendering',
          'nav.json_formatter': 'Format, minify JSON and convert CSV'
      },
      zh: {
          'nav.home': '时钟与当前阴阳历',
          'nav.random_number': '生成带自定义参数的随机数',
          'nav.random_wheel': '幸运转盘决策选择器',
          'nav.password_generator': '创建安全且复杂的密码',
          'nav.world_clocks': '世界各地城市时区查看器',
          'nav.unit_converter': '多种类物理量单位换算',
          'nav.currency_converter': 'Vietcombank 实时汇率换算',
          'nav.qr_generator': '生成带标志和样式的二维码',
          'nav.encoder_decoder': 'Base64、URL 和 HTML 编码解码',
          'nav.hash_generator': '计算 MD5、SHA-1 和 SHA-256 哈希值',
          'nav.color_picker': '取色器、对比度检查及渐变工具',
          'nav.date_calculator': '日期差值、添加天数和年龄计算',
          'nav.case_converter': '大小写、驼峰命名规范转换',
          'nav.regex_tester': '正则表达式可视化匹配及解析',
          'nav.markdown_preview': '实时 Markdown 排版渲染',
          'nav.latex_editor': 'LaTeX 数学公式编辑及图片导出',
          'nav.json_formatter': 'JSON 格式化美化及 CSV 双向转码'
      },
      ko: {
          'nav.home': '시계 및 현재 음양력 달력',
          'nav.random_number': '다양한 옵션으로 난수 생성',
          'nav.random_wheel': '추첨 및 의사결정을 위한 행운의 바퀴',
          'nav.password_generator': '보안성이 높고 강력한 비밀번호 생성',
          'nav.world_clocks': '세계 주요 도시 시간대 시계',
          'nav.unit_converter': '멀티 카테고리 측정 단위 변환',
          'nav.currency_converter': '실시간 외환 환율 변환기 (Vietcombank 고시)',
          'nav.qr_generator': '로고 및 스타일 커스텀 QR 코드 생성',
          'nav.encoder_decoder': 'Base64, URL, HTML 인코더/디코더',
          'nav.hash_generator': 'MD5, SHA-1, SHA-256 해시값 생성',
          'nav.color_picker': '색상 추출, 보색 조화 및 대비율 검사',
          'nav.date_calculator': '날짜 계산기, 나이 및 일수 차이 계산',
          'nav.case_converter': '대소문자, 카멜케이스 텍스트 변환',
          'nav.regex_tester': '정규표현식(Regex) 테스트 및 구문 해석',
          'nav.markdown_preview': '실시간 마크다운 프리뷰어',
          'nav.latex_editor': '수학 LaTeX 수식 편집 및 미리보기',
          'nav.json_formatter': 'JSON 포맷터, 압축 및 CSV 이중 변환기'
      },
      ja: {
          'nav.home': 'デジタル時計と現在地の陰陽暦カレンダー',
          'nav.random_number': 'カスタム範囲での乱数生成ツール',
          'nav.random_wheel': '意思決定のためのルーレット',
          'nav.password_generator': '強力で安全なパスワードを自動生成',
          'nav.world_clocks': '世界各国の主要都市タイムゾーン時計',
          'nav.unit_converter': '長さ・重さ・温度などの単位換算',
          'nav.currency_converter': 'リアルタイム為替レート換算 (Vietcombank公表)',
          'nav.qr_generator': 'ロゴ挿入・スタイル変更対応のQRコード作成',
          'nav.encoder_decoder': 'Base64、URL、HTMLエンコーダ・デコーダ',
          'nav.hash_generator': 'MD5、SHA-1、SHA-256ハッシュ生成',
          'nav.color_picker': '配色パレット、コントラスト比検証、グラデーション',
          'nav.date_calculator': '日付計算、年齢、日数差の算出',
          'nav.case_converter': '大文字・小文字・キャメルケースへのテキスト変換',
          'nav.regex_tester': '正規表現 (Regex) のテストと構文解析',
          'nav.markdown_preview': 'リアルタイムMarkdownエディタプレビュー',
          'nav.latex_editor': 'LaTeX数式エディタと画像保存',
          'nav.json_formatter': 'JSON整形、ミニファイ、CSVへの相互変換'
      }
  };

  // UI Elements
  const overlay = document.getElementById('command-palette-overlay');
  const input = document.getElementById('command-palette-input');
  const resultsContainer = document.getElementById('command-palette-results');
  let activeIndex = -1;
  let filteredTools = [];

  // Translation helpers
  function tr(key, fallback = key) {
    try {
      if (typeof window.t !== 'function') return fallback;
      const val = window.t(key);
      return (!val || val === key) ? fallback : val;
    } catch (_) {
      return fallback;
    }
  }

  // Determine site base path relative url helper
  function getRelativeUrl(path) {
    const currentScript = document.querySelector('script[src*="command-palette"]');
    const base = currentScript ? currentScript.src.split('/assets/js/')[0] : '';
    // Strip domain details if it is a absolute browser URL
    const pathname = base ? new URL(base).pathname : '';
    return pathname.endsWith('/') ? `${pathname}${path.replace(/^\.\//, '')}` : `${pathname}/${path.replace(/^\.\//, '')}`;
  }

  // Toggle Command Palette
  function togglePalette(forceState) {
    if (!overlay) return;
    const shouldOpen = (forceState !== undefined) ? forceState : (overlay.style.display === 'none');
    
    if (shouldOpen) {
      overlay.style.display = 'flex';
      input.value = '';
      activeIndex = -1;
      filterTools('');
      setTimeout(() => input.focus(), 50);
    } else {
      overlay.style.display = 'none';
    }
  }

  // Filter tools based on query
  function filterTools(query) {
    const q = query.toLowerCase().trim();
    const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
    const descs = TOOL_DESCRIPTIONS[lang] || TOOL_DESCRIPTIONS['en'];

    filteredTools = SYSTEM_TOOLS.filter(tool => {
      const title = tr(tool.titleKey).toLowerCase();
      const desc = (descs[tool.titleKey] || '').toLowerCase();
      const url = tool.url.toLowerCase();
      return title.includes(q) || desc.includes(q) || url.includes(q);
    });

    renderResults();
  }

  // Render list items
  function renderResults() {
    resultsContainer.innerHTML = '';
    
    if (filteredTools.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center text-muted py-4 small">
          ${tr('palette.no_results', 'Không tìm thấy công cụ phù hợp')}
        </div>
      `;
      return;
    }

    const lang = window.translationSystem ? window.translationSystem.getCurrentLanguage() : 'vi';
    const descs = TOOL_DESCRIPTIONS[lang] || TOOL_DESCRIPTIONS['en'];

    filteredTools.forEach((tool, index) => {
      const title = tr(tool.titleKey);
      const desc = descs[tool.titleKey] || '';
      const url = getRelativeUrl(tool.url);

      const item = document.createElement('a');
      item.href = url;
      item.className = 'command-palette-item';
      if (index === activeIndex) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <i class="${tool.icon}"></i>
        <div class="cp-item-details">
          <span class="cp-item-title">${title}</span>
          <span class="cp-item-desc">${desc}</span>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = url;
      });

      resultsContainer.appendChild(item);
    });

    // Auto-scroll selected element into viewport
    const activeElement = resultsContainer.querySelector('.command-palette-item.active');
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' });
    }
  }

  // Keyboard navigation controller
  function handleKeyDown(e) {
    if (overlay.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % filteredTools.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + filteredTools.length) % filteredTools.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredTools.length) {
        const url = getRelativeUrl(filteredTools[activeIndex].url);
        window.location.href = url;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      togglePalette(false);
    }
  }

  // Event Listeners
  // Trigger overlay via shortcuts Cmd+K or Ctrl+K
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
    }
  });

  if (input) {
    input.addEventListener('input', (e) => {
      activeIndex = filteredTools.length > 0 ? 0 : -1;
      filterTools(e.target.value);
    });
    input.addEventListener('keydown', handleKeyDown);
  }

  // Close modal when clicking outside modal box
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        togglePalette(false);
      }
    });
  }

  // Search button in navigation drawer (if dynamically added or present)
  document.addEventListener('click', (e) => {
    const searchBtn = e.target.closest('.navbar-search-btn');
    if (searchBtn) {
      e.preventDefault();
      togglePalette(true);
    }
  });

  // Re-render description lists on translation updates
  window.addEventListener('languageChanged', () => {
    if (overlay && overlay.style.display !== 'none') {
      renderResults();
    }
  });
});
