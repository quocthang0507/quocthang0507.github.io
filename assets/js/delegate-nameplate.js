/* All artwork is generated locally; SVG uses physical cm dimensions. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(`np-${id}`);
  if (!$('form')) return;
  const NS = 'http://www.w3.org/2000/svg';
  const measure = document.createElement('canvas').getContext('2d');
  let logo = '', uploadVersion = 0, front, back, width, height, rows = [], batchError = '', busy = false;
  const t = (key, vars = {}) => {
    const value = window.t ? window.t(`np.${key}`) : '';
    const fallback = window.translationSystem?.translations?.vi?.[`np.${key}`];
    return String(value && value !== `np.${key}` ? value : fallback || key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  };
  const themes = {
    white: ['#ffffff', '#9b1725', '#334155', '#9b1725', '#ffffff'],
    red: ['#a51421', '#ffdf83', '#fff3cd', '#ffdf83', '#a51421'],
    gov_blue: ['#0d2d59', '#ffffff', '#f5d57a', '#d4af37', '#0d2d59'],
    admin_white: ['#ffffff', '#8b131e', '#1e293b', '#a51421', '#ffffff'],
    brass: ['#d8b35a', '#7f111a', '#33210a', '#6e4e12', '#fff8e1'],
    gold: ['#e4c577', '#493313', '#493313', '#80601d', '#ffffff'],
    blue: ['#123c70', '#ffffff', '#e6edf7', '#c7a75a', '#102e53'],
    office_navy: ['#ffffff', '#102a4c', '#475569', '#1d4ed8', '#ffffff'],
    office_slate: ['#f1f5f9', '#0f172a', '#334155', '#0f4c81', '#ffffff'],
    exec_black: ['#181b22', '#f3d27a', '#d6dce6', '#c9a24b', '#181b22'],
    public_green: ['#ffffff', '#14532d', '#374151', '#166534', '#ffffff'],
    split: ['#ffffff', '#143c70', '#143c70', '#143c70', '#ffffff']
  };
  const presets = {
    gov_agency: { size: '24x12', layout: 'gov', order: 'above', theme: 'red', border: 'admin_frame', stroke: '0.8', font: 'Times New Roman', align: 'middle', bold: true, italic: false, uppercase: true, org: 'ỦY BAN NHÂN DÂN · PHÒNG HÀNH CHÍNH' },
    gov_public: { size: '24x10', layout: 'admin', order: 'above', theme: 'gov_blue', border: 'double', stroke: '0.7', font: 'Times New Roman', align: 'middle', bold: true, italic: false, uppercase: true, org: 'SỞ NỘI VỤ · HỘI NGHỊ CÔNG VỤ' },
    gov_paper: { size: '20x8', layout: 'admin', order: 'below', theme: 'admin_white', border: 'double', stroke: '0.6', font: 'Times New Roman', align: 'middle', bold: true, italic: false, uppercase: true, org: 'ỦY BAN NHÂN DÂN · VĂN PHÒNG HĐND & UBND' },
    brass_leader: { size: '24x12', layout: 'gov', order: 'above', theme: 'brass', border: 'brass_corners', stroke: '0.8', font: 'Times New Roman', align: 'middle', bold: true, italic: false, uppercase: true, org: 'BAN LÃNH ĐẠO CƠ QUAN' },
    office_modern: { size: '20x10', layout: 'office', order: 'below', theme: 'office_navy', border: 'header_bar', stroke: '0.6', font: 'Inter', align: 'middle', bold: true, italic: false, uppercase: true, org: 'PHÒNG HÀNH CHÍNH - TỔNG HỢP' },
    office_inox: { size: '20x10', layout: 'office', order: 'below', theme: 'office_slate', border: 'modern', stroke: '0.6', font: 'Tahoma', align: 'start', bold: true, italic: false, uppercase: true, org: 'PHÒNG KẾ HOẠCH - TÀI CHÍNH' },
    exec_dark: { size: '22x10', layout: 'two', order: 'above', theme: 'exec_black', border: 'brass_corners', stroke: '0.7', font: 'Georgia', align: 'middle', bold: true, italic: false, uppercase: true },
    one_stop: { size: '20x10', layout: 'office', order: 'below', theme: 'blue', border: 'single', stroke: '0.6', font: 'Arial', align: 'middle', bold: true, italic: false, uppercase: true, org: 'QUẦY SỐ 01 · BỘ PHẬN MỘT CỬA' }
  };
  const threeTierLayouts = new Set(['admin', 'office', 'gov']);
  function el(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function num(id) { return Number($(id).value); }
  function artwork(isBack, record) {
    const w = width * 100, h = height * 100;
    const svg = el('svg', { xmlns: NS, width: `${width}cm`, height: `${height}cm`, viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': t(isBack ? 'back' : 'front') });
    const add = (tag, attrs, text) => { const n = el(tag, attrs, text); svg.appendChild(n); return n; };
    const accent = $('accent').value, stroke = num('stroke') * 10;
    add('rect', { width: w, height: h, fill: $('bg').value });
    const border = $('border').value, inset = 20 + stroke / 2;
    if (['single', 'rounded', 'double', 'ornament'].includes(border)) {
      add('rect', { x: inset, y: inset, width: w - inset * 2, height: h - inset * 2, rx: border === 'rounded' ? 30 : 0, fill: 'none', stroke: accent, 'stroke-width': stroke });
      if (border === 'double') add('rect', { x: inset + 14, y: inset + 14, width: w - (inset + 14) * 2, height: h - (inset + 14) * 2, fill: 'none', stroke: accent, 'stroke-width': Math.max(1, stroke / 3) });
      if (border === 'ornament') {
        [[inset, inset, 1, 1], [w-inset, inset, -1, 1], [inset, h-inset, 1, -1], [w-inset, h-inset, -1, -1]].forEach(([x,y,sx,sy]) => {
          add('path', { d: 'M 6 55 Q 40 55 40 25 Q 40 8 22 12 Q 5 20 25 32 M 55 6 Q 55 40 25 40', transform: `translate(${x} ${y}) scale(${sx} ${sy})`, fill: 'none', stroke: accent, 'stroke-width': Math.max(2, stroke / 2) });
        });
      }
    }
    if (border === 'admin_frame') {
      const innerGap = 16;
      const step = Math.max(34, Math.min(62, Math.min(w, h) * 0.085));
      add('rect', { x: inset, y: inset, width: w - inset * 2, height: h - inset * 2, fill: 'none', stroke: accent, 'stroke-width': stroke });
      add('rect', { x: inset + innerGap, y: inset + innerGap, width: w - (inset + innerGap) * 2, height: h - (inset + innerGap) * 2, fill: 'none', stroke: accent, 'stroke-width': Math.max(1.5, stroke * 0.4) });
      const s1 = (step * 0.45).toFixed(1), s2 = (step * 0.16).toFixed(1), s3 = (step * 0.34).toFixed(1);
      [[inset, inset, 1, 1], [w - inset, inset, -1, 1], [inset, h - inset, 1, -1], [w - inset, h - inset, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        add('path', { d: `M 0 ${step} H ${s1} V ${s1} H ${step} V 0 M ${s2} ${s2} H ${s3} V ${s3} H ${s2} Z`, transform: `translate(${cx} ${cy}) scale(${sx} ${sy})`, fill: 'none', stroke: accent, 'stroke-width': Math.max(2, stroke * 0.65) });
      });
    }
    if (border === 'brass_corners') {
      const arm = Math.max(45, Math.min(95, Math.min(w, h) * 0.14));
      add('rect', { x: inset + 10, y: inset + 10, width: w - (inset + 10) * 2, height: h - (inset + 10) * 2, fill: 'none', stroke: accent, 'stroke-width': Math.max(1.5, stroke * 0.35), 'stroke-opacity': '0.75' });
      const cornerStroke = Math.max(4, stroke * 1.6);
      const rivetR = Math.max(3, stroke * 0.65);
      [[inset, inset, 1, 1], [w - inset, inset, -1, 1], [inset, h - inset, 1, -1], [w - inset, h - inset, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        add('path', { d: `M 0 ${arm} V 0 H ${arm}`, transform: `translate(${cx} ${cy}) scale(${sx} ${sy})`, fill: 'none', stroke: accent, 'stroke-width': cornerStroke, 'stroke-linecap': 'square' });
        add('circle', { cx: cx + sx * 22, cy: cy + sy * 22, r: rivetR, fill: accent });
      });
    }
    if (border === 'header_bar') {
      const topH = Math.max(22, Math.round(h * 0.055));
      const botH = Math.max(8, Math.round(h * 0.018));
      add('rect', { x: 0, y: 0, width: w, height: topH, fill: accent });
      add('rect', { x: 0, y: h - botH, width: w, height: botH, fill: accent, opacity: '0.85' });
    }
    if (border === 'ribbon_sides') {
      const rw = 24 + stroke;
      add('rect', { x: 0, y: 0, width: rw, height: h, fill: accent });
      add('rect', { x: w - rw, y: 0, width: rw, height: h, fill: accent });
      [inset, h - inset].forEach(ly => add('line', { x1: rw + 14, y1: ly, x2: w - rw - 14, y2: ly, stroke: accent, 'stroke-width': Math.max(1.5, stroke * 0.45), 'stroke-opacity': '0.65' }));
    }
    if (border === 'modern') add('rect', { x: 0, y: 0, width: 24 + stroke, height: h, fill: accent });
    if (border === 'horizontal') [inset, h-inset].forEach(y => add('line', { x1: inset, y1: y, x2: w-inset, y2: y, stroke: accent, 'stroke-width': stroke }));
    const layout = $('layout').value;
    const one = !isBack && layout === 'one';
    const isThreeTier = !isBack && threeTierLayouts.has(layout);
    const band = !one && ($('theme').value === 'split' || layout === 'band');
    const above = $('order').value === 'above';
    const minBorderMx = border === 'ornament' ? 82
      : border === 'admin_frame' ? inset + 58
      : border === 'brass_corners' ? inset + 40
      : border === 'ribbon_sides' ? (24 + stroke + 28)
      : inset + 20;
    const minBorderMy = border === 'header_bar' ? Math.max(22, Math.round(h * 0.055)) + 20
      : border === 'admin_frame' ? inset + 34
      : border === 'brass_corners' ? inset + 32
      : inset + 20;
    const mx = Math.max(num('margin-x') * 10, minBorderMx);
    const my = Math.max(num('margin-y') * 10, minBorderMy);
    let x = mx, y = my, cw = w - 2 * mx, ch = h - 2 * my;
    if (border === 'modern' && x < 24 + stroke + 16) {
      const shift = 24 + stroke + 16 - x;
      x += shift;
      cw -= shift;
    }
    if (logo) {
      if ($('logo-position').value === 'left') {
        const lw = Math.min(cw * .18, ch * .65);
        add('image', { href: logo, x, y: y + (ch-lw)/2, width: lw, height: lw, preserveAspectRatio: 'xMidYMid meet' });
        x += lw + 25; cw -= lw + 25;
      } else {
        const lh = ch * .24;
        add('image', { href: logo, x: x + (cw-lh)/2, y, width: lh, height: lh, preserveAspectRatio: 'xMidYMid meet' });
        y += lh + 15; ch -= lh + 15;
      }
    }
    const name = isBack ? record?.backTitle || $('back-title').value : record ? record.name : $('name').value;
    const role = isBack ? record?.backNote || $('back-note').value : record ? record.role : $('role').value;
    const org = isBack ? '' : (record?.org || ($('org') ? $('org').value : ''));
    function addStar(cx, cy, outerR, fill) {
      const innerR = outerR * 0.4;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * 36 - 90) * Math.PI / 180;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
      }
      add('polygon', { points: pts.join(' '), fill });
    }
    function splitLines(text, maxLines = 4) {
      if (!text) return [];
      return String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, maxLines);
    }
    function roleRatio(text, baseRatio) {
      const count = splitLines(text).length;
      if (count >= 3) return Math.min(0.5, baseRatio + 0.14);
      if (count === 2) return Math.min(0.45, baseRatio + 0.09);
      return baseRatio;
    }
    function textLine(value, centerY, maxH, size, color, opts) {
      if (!value) return;
      const cfg = typeof opts === 'boolean'
        ? { field: opts ? 'name' : 'role', weight: opts && $('bold').checked ? '700' : '400', style: opts && $('italic').checked ? 'italic' : 'normal', uppercase: opts && $('uppercase').checked, multiline: !opts }
        : opts;
      const rawLines = cfg.multiline ? splitLines(value) : [String(value)];
      if (rawLines.length === 0) return;
      const lines = rawLines.map(line => cfg.uppercase ? line.toLocaleUpperCase('vi-VN') : line);
      const weight = cfg.weight || '400';
      const style = cfg.style || 'normal';
      // Measure the actual glyph bounds, including accents and italic overhang.
      // A binary search finds the largest font whose ink stays inside its region.
      const metrics = (fontSize, lineText) => {
        measure.font = `${style} ${weight} ${fontSize}px "${$('font').value}"`;
        const m = measure.measureText(lineText);
        return { left: Math.max(0, m.actualBoundingBoxLeft), right: Math.max(m.width, m.actualBoundingBoxRight), ascent: Math.max(0, m.actualBoundingBoxAscent), descent: Math.max(0, m.actualBoundingBoxDescent) };
      };
      const regionW = cfg.regionW ?? cw;
      const regionX = cfg.regionX ?? x;
      const align = cfg.align ?? $('align').value;
      const lineGapFactor = 0.24;
      let low = 0, high = $('fit').value === 'smart' ? maxH * 3 : size * 3.52778;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2;
        const measured = lines.map(line => metrics(mid, line));
        const fitsWidth = measured.every(m => m.left + m.right <= regionW - 12);
        const totalHeight = measured.reduce((sum, m) => sum + m.ascent + m.descent, 0) + (lines.length - 1) * mid * lineGapFactor;
        if (fitsWidth && totalHeight <= maxH - 8) low = mid;
        else high = mid;
      }
      const fontSize = low;
      const measured = lines.map(line => metrics(fontSize, line));
      if (lines.length === 1) {
        const m = measured[0], textWidth = m.left + m.right;
        const left = align === 'start' ? regionX + 6 : align === 'end' ? regionX + regionW - 6 - textWidth : regionX + (regionW - textWidth) / 2;
        add('text', { x: left + m.left, y: centerY + (m.ascent - m.descent) / 2, 'text-anchor': 'start', 'font-family': $('font').value, 'font-size': fontSize, 'font-weight': weight, 'font-style': style, fill: color, 'data-field': cfg.field }, lines[0]);
        return;
      }
      const lineGap = fontSize * lineGapFactor;
      const totalHeight = measured.reduce((sum, m) => sum + m.ascent + m.descent, 0) + (lines.length - 1) * lineGap;
      let cursorY = centerY - totalHeight / 2;
      lines.forEach((line, idx) => {
        const m = measured[idx], textWidth = m.left + m.right;
        const left = align === 'start' ? regionX + 6 : align === 'end' ? regionX + regionW - 6 - textWidth : regionX + (regionW - textWidth) / 2;
        add('text', { x: left + m.left, y: cursorY + m.ascent, 'text-anchor': 'start', 'font-family': $('font').value, 'font-size': fontSize, 'font-weight': weight, 'font-style': style, fill: color, 'data-field': cfg.field }, line);
        cursorY += m.ascent + m.descent + lineGap;
      });
    }
    function drawDivider(ly, len) {
      const align = $('align').value;
      const x1 = align === 'start' ? x + 6 : align === 'end' ? x + cw - 6 - len : x + (cw - len) / 2;
      add('line', { x1, y1: ly, x2: x1 + len, y2: ly, stroke: accent, 'stroke-width': Math.max(2, stroke * 0.45), 'stroke-opacity': '0.78' });
    }
    if (one) {
      textLine(name, y + ch/2, ch, num('name-size'), $('ink').value, true);
    } else if (isThreeTier && layout === 'office') {
      const orgText = org.trim();
      const headerText = orgText || role;
      const oh = ch * 0.25, gapAfterBar = Math.min(20, ch * 0.045);
      add('rect', { x, y, width: cw, height: oh, rx: 8, fill: accent });
      textLine(headerText, y + oh / 2, oh * 0.78, Math.max(10, Math.round(num('role-size') * 0.85)), $('band-ink').value, { field: orgText ? 'org' : 'role', weight: '700', style: 'normal', uppercase: true, multiline: true, regionX: x + 10, regionW: Math.max(40, cw - 20) });
      const by = y + oh + gapAfterBar, bh = y + ch - by;
      if (orgText && role.trim()) {
        const rh = bh * roleRatio(role, 0.32), gap = Math.min(22, bh * 0.08), nh = bh - rh - gap;
        const ry = above ? by : by + nh + gap, ny = above ? by + rh + gap : by;
        const sepY = above ? by + rh + gap / 2 : by + nh + gap / 2;
        drawDivider(sepY, Math.min(cw * 0.28, 300));
        textLine(name, ny + nh / 2, nh, num('name-size'), $('ink').value, true);
        textLine(role, ry + rh / 2, rh * 0.86, num('role-size'), $('role-color').value, false);
      } else {
        textLine(name, by + bh / 2, bh * 0.9, num('name-size'), $('ink').value, true);
      }
    } else if (isThreeTier && layout === 'gov') {
      const orgText = org.trim();
      const starR = Math.max(9, Math.min(18, ch * 0.025));
      let by = y;
      if (orgText) {
        const oh = ch * 0.19;
        textLine(orgText, y + oh / 2, oh * 0.84, Math.max(10, Math.round(num('role-size') * 0.78)), $('role-color').value, { field: 'org', weight: '700', style: 'normal', uppercase: true, multiline: true });
        const divY = y + oh + Math.max(starR + 4, ch * 0.032);
        const cx = x + cw / 2, half = Math.min(cw * 0.36, 420);
        add('line', { x1: cx - half, y1: divY, x2: cx - starR - 14, y2: divY, stroke: accent, 'stroke-width': Math.max(2, stroke * 0.45), 'stroke-opacity': '0.85' });
        add('line', { x1: cx + starR + 14, y1: divY, x2: cx + half, y2: divY, stroke: accent, 'stroke-width': Math.max(2, stroke * 0.45), 'stroke-opacity': '0.85' });
        addStar(cx, divY, starR, accent);
        by = divY + starR + Math.min(14, ch * 0.028);
      } else {
        const divY = y + starR + 4;
        const cx = x + cw / 2, half = Math.min(cw * 0.3, 340);
        add('line', { x1: cx - half, y1: divY, x2: cx - starR - 14, y2: divY, stroke: accent, 'stroke-width': Math.max(2, stroke * 0.45), 'stroke-opacity': '0.85' });
        add('line', { x1: cx + starR + 14, y1: divY, x2: cx + half, y2: divY, stroke: accent, 'stroke-width': Math.max(2, stroke * 0.45), 'stroke-opacity': '0.85' });
        addStar(cx, divY, starR, accent);
        by = divY + starR + Math.min(16, ch * 0.035);
      }
      const bh = y + ch - by;
      const rh = bh * roleRatio(role, 0.34), gap = Math.min(16, bh * 0.05), nh = bh - rh - gap;
      const ry = above ? by : by + nh + gap, ny = above ? by + rh + gap : by;
      if (band) add('rect', { x, y: ry, width: cw, height: rh, fill: accent });
      textLine(name, ny + nh / 2, nh, num('name-size'), $('ink').value, true);
      textLine(role, ry + rh / 2, rh * 0.86, num('role-size'), band ? $('band-ink').value : $('role-color').value, false);
    } else if (isThreeTier && layout === 'admin') {
      const orgText = org.trim();
      let by = y;
      if (orgText) {
        const oh = ch * 0.2;
        textLine(orgText, y + oh / 2, oh * 0.84, Math.max(10, Math.round(num('role-size') * 0.78)), $('role-color').value, { field: 'org', weight: '600', style: 'normal', uppercase: true, multiline: true });
        const divY = y + oh + Math.min(12, ch * 0.024);
        drawDivider(divY, Math.min(cw * 0.42, 480));
        by = divY + Math.min(16, ch * 0.032);
      }
      const bh = y + ch - by;
      const rh = bh * roleRatio(role, 0.34), gap = Math.min(16, bh * 0.05), nh = bh - rh - gap;
      const ry = above ? by : by + nh + gap, ny = above ? by + rh + gap : by;
      if (band) add('rect', { x, y: ry, width: cw, height: rh, fill: accent });
      textLine(name, ny + nh / 2, nh, num('name-size'), $('ink').value, true);
      textLine(role, ry + rh / 2, rh * 0.86, num('role-size'), band ? $('band-ink').value : $('role-color').value, false);
    } else {
      const rh = ch * roleRatio(role, 0.32), gap = Math.min(20, ch * .05), nh = ch - rh - gap;
      const ry = above ? y : y + nh + gap, ny = above ? y + rh + gap : y;
      if (band) add('rect', { x, y: ry, width: cw, height: rh, fill: accent });
      textLine(name, ny + nh/2, nh, num('name-size'), $('ink').value, true);
      textLine(role, ry + rh/2, rh * (splitLines(role).length > 1 ? 0.88 : 0.8), num('role-size'), band ? $('band-ink').value : $('role-color').value, false);
    }
    return svg;
  }
  let orgDirty = false;
  function applyThemeColors(themeKey) {
    const palette = themes[themeKey];
    if (!palette) return;
    ['bg', 'ink', 'role-color', 'accent', 'band-ink'].forEach((id, i) => $(id).value = palette[i]);
  }
  function setActivePreset(presetKey) {
    document.querySelectorAll('#np-presets .np-preset-btn').forEach(btn => {
      const active = Boolean(presetKey && btn.dataset.preset === presetKey);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function applyPreset(presetKey) {
    const preset = presets[presetKey];
    if (!preset || busy) return;
    $('size').value = preset.size;
    $('layout').value = preset.layout;
    $('order').value = preset.order;
    $('theme').value = preset.theme;
    applyThemeColors(preset.theme);
    $('border').value = preset.border;
    $('stroke').value = preset.stroke;
    $('font').value = preset.font;
    $('align').value = preset.align;
    $('bold').checked = preset.bold;
    $('italic').checked = preset.italic;
    $('uppercase').checked = preset.uppercase;
    if (preset.org && $('org') && (!orgDirty || !$('org').value.trim())) {
      $('org').value = preset.org;
    }
    setActivePreset(presetKey);
    render();
  }
  function render() {
    if (busy) return;
    const custom = $('size').value === 'custom', duplex = $('layout').value === 'duplex';
    const isThreeTier = threeTierLayouts.has($('layout').value);
    const batch = $('mode').value === 'batch';
    $('batch-controls').hidden = $('batch-actions').hidden = !batch;
    $('name').disabled = $('role').disabled = batch;
    $('name-size').disabled = $('role-size').disabled = $('fit').value === 'smart';
    $('custom').hidden = !custom;
    $('width').disabled = $('height').disabled = !custom;
    $('role-controls').hidden = $('layout').value === 'one';
    if ($('org-controls')) $('org-controls').hidden = !isThreeTier;
    $('back-controls').hidden = $('back-wrap').hidden = $('download-back').hidden = !duplex;
    $('layout-help').textContent = t(`help_${$('layout').value}`);
    const valid = $('form').checkValidity();
    [width, height] = custom ? [num('width'), num('height')] : $('size').value.split('x').map(Number);
    const safe = valid && num('margin-x') * 2 < width * 10 - 20 && num('margin-y') * 2 < height * 10 - 15 && (!batch || rows.length > 0 && !batchError);
    ['download', 'download-back', 'print', 'download-batch', 'print-batch'].forEach(id => $(id).disabled = !safe);
    if (!safe) { $('status').textContent = batch && (batchError || !rows.length) ? batchError || t('batch_empty') : t('invalid'); front = back = null; $('preview').replaceChildren(); $('back-preview').replaceChildren(); $('fit-info').textContent = ''; return; }
    $('status').textContent = '';
    const record = batch ? rows[Number($('batch-select').value) || 0] : undefined;
    front = artwork(false, record); back = duplex ? artwork(true, record) : null;
    $('preview').replaceChildren(front); $('back-preview').replaceChildren(...(back ? [back] : []));
    $('dimensions').textContent = t('dimensions', {w: width, h: height});
    const fieldLabel = field => field === 'name' ? 'name' : field === 'org' ? 'org_label' : 'role_color';
    const seenFields = new Set();
    $('fit-info').textContent = Array.from(front.querySelectorAll('text')).filter(n => {
      if (seenFields.has(n.dataset.field)) return false;
      seenFields.add(n.dataset.field);
      return true;
    }).map(n => `${t(fieldLabel(n.dataset.field))}: ${(Number(n.getAttribute('font-size')) / 3.52778).toFixed(1)} pt`).join(' · ');
    $('dpi').disabled = $('format').value === 'svg';
    const pw = Math.round(width / 2.54 * num('dpi')), ph = Math.round(height / 2.54 * num('dpi'));
    $('export-info').textContent = $('format').value === 'svg' ? t('vector_info', {w: width, h: height}) : t('raster_info', {w: pw, h: ph, dpi: num('dpi')});
    if ($('format').value !== 'svg' && pw * ph > 32000000) {
      $('download').disabled = $('download-back').disabled = $('download-batch').disabled = true;
      $('status').textContent = t('oversized');
    }
  }
  function serialize(svg) { return new XMLSerializer().serializeToString(svg); }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function imageBlob(svg, format, w, h, dpi) {
    const blob = new Blob([serialize(svg)], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') return blob;
    let url;
    try {
      await document.fonts.ready;
      const img = new Image(); url = URL.createObjectURL(blob);
      img.src = url; await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w / 2.54 * dpi); canvas.height = Math.round(h / 2.54 * dpi);
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const result = await new Promise(resolve => canvas.toBlob(resolve, format === 'jpg' ? 'image/jpeg' : 'image/png', .95));
      if (!result) throw new Error('Empty image');
      return result;
    }
    finally { if (url) URL.revokeObjectURL(url); }
  }
  async function exportImage(isBack) {
    const svg = isBack ? back : front;
    if (!svg || $('download').disabled) return;
    const format = $('format').value;
    try {
      const blob = await imageBlob(svg, format, width, height, num('dpi'));
      download(blob, `bang-ten-${isBack ? 'mat-sau' : 'mat-truoc'}.${format}`);
      $('status').textContent = t('export_done');
    } catch { $('status').textContent = t('export_error'); }
  }
  function parseBatch() {
    const selected = $('batch-select').value;
    rows = []; batchError = '';
    const text = $('batch-input').value;
    if (text.length > 200000) batchError = t('batch_limit');
    else {
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(lines[i].includes('\t') ? '\t' : '|').map(s => s.trim());
        if (!cols[0] || cols.length > 5 || cols.some((s, j) => s.length > (j === 0 || j === 2 ? 150 : 300))) {
          batchError = t('batch_invalid', {row: i + 1}); break;
        }
        const decodeBreaks = s => s.replace(/\\n/g, '\n');
        rows.push({name: cols[0], role: decodeBreaks(cols[1] || ''), backTitle: cols[2] || '', backNote: decodeBreaks(cols[3] || ''), org: decodeBreaks(cols[4] || '')});
        if (rows.length > 200) { batchError = t('batch_limit'); break; }
      }
    }
    if (batchError) rows = [];
    $('batch-select').replaceChildren(...rows.map((r, i) => new Option(`${i + 1}. ${r.name}`, String(i))));
    if (Number(selected) < rows.length) $('batch-select').value = selected;
    $('batch-status').textContent = batchError || t('batch_count', {count: rows.length});
  }
  async function exportBatch() {
    if ($('download-batch').disabled || busy) return;
    const format = $('format').value, dpi = num('dpi'), duplex = $('layout').value === 'duplex';
    const controls = Array.from(document.querySelectorAll('.nameplate-tool input, .nameplate-tool select, .nameplate-tool textarea, .nameplate-tool button')).map(n => [n, n.disabled]);
    busy = true; controls.forEach(([n]) => n.disabled = true);
    let message;
    try {
      await document.fonts.ready;
      const files = []; let bytes = 0;
      for (let i = 0; i < rows.length; i++) {
        for (const isBack of duplex ? [false, true] : [false]) {
          const blob = await imageBlob(artwork(isBack, rows[i]), format, width, height, dpi);
          bytes += blob.size;
          if (bytes > 100 * 1024 * 1024) throw new Error('batch-size');
          files.push({name: `${String(i + 1).padStart(3, '0')}-${isBack ? 'back' : 'front'}.${format}`, blob});
        }
        $('status').textContent = t('batch_progress', {done: i + 1, total: rows.length});
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      download(await window.nameplateZip(files), 'bang-ten-dai-bieu.zip');
      message = t('batch_done', {count: rows.length});
    } catch (error) { message = t(error.message === 'batch-size' ? 'batch_size' : 'export_error'); }
    finally { busy = false; controls.forEach(([n, disabled]) => n.disabled = disabled); render(); $('status').textContent = message; }
  }
  $('form').addEventListener('submit', e => e.preventDefault());
  $('form').addEventListener('input', e => {
    if (e.target === $('org')) orgDirty = true;
    if (e.target === $('batch-input')) parseBatch();
    if (e.target !== $('logo')) render();
  });
  $('theme').addEventListener('change', () => {
    applyThemeColors($('theme').value); setActivePreset(''); render();
  });
  ['size', 'layout', 'order', 'border'].forEach(id => $(id).addEventListener('change', () => setActivePreset('')));
  document.querySelectorAll('#np-presets .np-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });
  ['format', 'dpi'].forEach(id => $(id).addEventListener('change', render));
  $('logo').addEventListener('change', async () => {
    const version = ++uploadVersion, file = $('logo').files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      $('status').textContent = t('logo_invalid'); $('logo').value = ''; return;
    }
    let url;
    try {
      url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      if (version !== uploadVersion) return;
      logo = canvas.toDataURL('image/png'); render();
    } catch { if (version === uploadVersion) $('status').textContent = t('logo_error'); }
    finally { if (url) URL.revokeObjectURL(url); }
  });
  $('remove-logo').addEventListener('click', () => { uploadVersion++; logo = ''; $('logo').value = ''; render(); });
  $('download').addEventListener('click', () => exportImage(false));
  $('download-back').addEventListener('click', () => exportImage(true));
  function printPlates(all) {
    if (!front || busy) return;
    const area = document.getElementById('np-print-area');
    document.body.appendChild(area);
    const plates = all ? rows.flatMap(r => [artwork(false, r), ...(back ? [artwork(true, r)] : [])]) : [front.cloneNode(true), ...(back ? [back.cloneNode(true)] : [])];
    area.replaceChildren(...plates);
    let style = document.getElementById('np-print-style');
    if (!style) { style = document.createElement('style'); style.id = 'np-print-style'; document.head.appendChild(style); }
    style.textContent = `@media print { @page { size: ${width}cm ${height}cm; margin: 0; } }`;
    window.print();
  }
  $('print').addEventListener('click', () => printPlates(false));
  $('print-batch').addEventListener('click', () => printPlates(true));
  $('download-batch').addEventListener('click', exportBatch);
  $('batch-example').addEventListener('click', () => {
    if ($('batch-input').value.trim()) return;
    $('batch-input').value = 'NGUYỄN VĂN AN | GIÁM ĐỐC | ĐẠI BIỂU | 01\nTRẦN THỊ MINH | TRƯỞNG PHÒNG ĐÀO TẠO | ĐẠI BIỂU | 02';
    parseBatch(); render();
  });
  $('batch-input').addEventListener('input', () => { $('batch-example').disabled = Boolean($('batch-input').value.trim()); });
  function refreshLanguage() { if (!busy) { parseBatch(); render(); } }
  window.addEventListener('languageChanged', refreshLanguage);
  window.addEventListener('translationsReady', refreshLanguage);
  document.fonts.ready.then(render);
  parseBatch();
  render();
});
