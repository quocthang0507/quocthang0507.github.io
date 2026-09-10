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
    gold: ['#e4c577', '#493313', '#493313', '#80601d', '#ffffff'],
    blue: ['#123c70', '#ffffff', '#e6edf7', '#c7a75a', '#102e53'],
    split: ['#ffffff', '#143c70', '#143c70', '#143c70', '#ffffff']
  };
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
    if (border === 'modern') add('rect', { x: 0, y: 0, width: 24 + stroke, height: h, fill: accent });
    if (border === 'horizontal') [inset, h-inset].forEach(y => add('line', { x1: inset, y1: y, x2: w-inset, y2: y, stroke: accent, 'stroke-width': stroke }));
    const one = !isBack && $('layout').value === 'one';
    const band = !one && ($('theme').value === 'split' || $('layout').value === 'band');
    const above = $('order').value === 'above';
    const mx = Math.max(num('margin-x') * 10, border === 'ornament' ? 82 : inset + 20);
    const my = Math.max(num('margin-y') * 10, inset + 20);
    let x = mx, y = my, cw = w - 2 * mx, ch = h - 2 * my;
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
    function textLine(value, centerY, maxH, size, color, isName) {
      if (!value) return;
      value = isName && $('uppercase').checked ? value.toLocaleUpperCase('vi-VN') : value;
      const weight = isName && $('bold').checked ? '700' : '400';
      const style = isName && $('italic').checked ? 'italic' : 'normal';
      // Measure the actual glyph bounds, including accents and italic overhang.
      // A binary search finds the largest font whose ink stays inside its region.
      const metrics = fontSize => {
        measure.font = `${style} ${weight} ${fontSize}px "${$('font').value}"`;
        const m = measure.measureText(value);
        return { left: Math.max(0, m.actualBoundingBoxLeft), right: Math.max(m.width, m.actualBoundingBoxRight), ascent: Math.max(0, m.actualBoundingBoxAscent), descent: Math.max(0, m.actualBoundingBoxDescent) };
      };
      let low = 0, high = $('fit').value === 'smart' ? maxH * 3 : size * 3.52778;
      for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2, m = metrics(mid);
        if (m.left + m.right <= cw - 12 && m.ascent + m.descent <= maxH - 8) low = mid;
        else high = mid;
      }
      const fontSize = low, m = metrics(fontSize), textWidth = m.left + m.right;
      const align = $('align').value;
      const left = align === 'start' ? x + 6 : align === 'end' ? x+cw-6-textWidth : x+(cw-textWidth)/2;
      add('text', { x: left + m.left, y: centerY + (m.ascent-m.descent)/2, 'text-anchor': 'start', 'font-family': $('font').value, 'font-size': fontSize, 'font-weight': weight, 'font-style': style, fill: color, 'data-field': isName ? 'name' : 'role' }, value);
    }
    if (one) textLine(name, y + ch/2, ch, num('name-size'), $('ink').value, true);
    else {
      const rh = ch * .32, gap = Math.min(20, ch * .05), nh = ch - rh - gap;
      const ry = above ? y : y + nh + gap, ny = above ? y + rh + gap : y;
      if (band) add('rect', { x, y: ry, width: cw, height: rh, fill: accent });
      textLine(name, ny + nh/2, nh, num('name-size'), $('ink').value, true);
      textLine(role, ry + rh/2, rh * .8, num('role-size'), band ? $('band-ink').value : $('role-color').value, false);
    }
    return svg;
  }
  function render() {
    if (busy) return;
    const custom = $('size').value === 'custom', duplex = $('layout').value === 'duplex';
    const batch = $('mode').value === 'batch';
    $('batch-controls').hidden = $('batch-actions').hidden = !batch;
    $('name').disabled = $('role').disabled = batch;
    $('name-size').disabled = $('role-size').disabled = $('fit').value === 'smart';
    $('custom').hidden = !custom;
    $('width').disabled = $('height').disabled = !custom;
    $('role-controls').hidden = $('layout').value === 'one';
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
    $('fit-info').textContent = Array.from(front.querySelectorAll('text')).map(n => `${t(n.dataset.field === 'name' ? 'name' : 'role_color')}: ${(Number(n.getAttribute('font-size')) / 3.52778).toFixed(1)} pt`).join(' · ');
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
        if (!cols[0] || cols.length > 4 || cols.some((s, j) => s.length > (j % 2 === 0 ? 150 : 200))) {
          batchError = t('batch_invalid', {row: i + 1}); break;
        }
        rows.push({name: cols[0], role: cols[1] || '', backTitle: cols[2] || '', backNote: cols[3] || ''});
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
    if (e.target === $('batch-input')) parseBatch();
    if (e.target !== $('logo')) render();
  });
  $('theme').addEventListener('change', () => {
    ['bg', 'ink', 'role-color', 'accent', 'band-ink'].forEach((id, i) => $(id).value = themes[$('theme').value][i]); render();
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
