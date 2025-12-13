// Regex Tester
document.addEventListener('DOMContentLoaded', function () {
  const patternInput = document.getElementById('regex-pattern');
  const flagsInput = document.getElementById('regex-flags');
  const textInput = document.getElementById('regex-text');
  const highlightEl = document.getElementById('regex-highlight');
  const matchCountEl = document.getElementById('match-count');
  const errorEl = document.getElementById('regex-error');

  const replacementInput = document.getElementById('regex-replacement');
  const runReplaceBtn = document.getElementById('run-replace');
  const replaceOutput = document.getElementById('regex-replace-output');
  const explainEl = document.getElementById('regex-explain');

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeFlags(flags) {
    const allowed = new Set(['g', 'i', 'm', 's', 'u', 'y']);
    const out = [];
    for (const ch of (flags || '')) {
      if (allowed.has(ch) && !out.includes(ch)) out.push(ch);
    }
    return out.join('');
  }

  function compile() {
    const flags = normalizeFlags(flagsInput.value);
    flagsInput.value = flags;

    const pattern = patternInput.value || '';
    try {
      const re = new RegExp(pattern, flags);
      errorEl.textContent = '';
      return re;
    } catch (e) {
      errorEl.textContent = (e && e.message) ? e.message : 'Invalid regex';
      return null;
    }
  }

  function buildExplain(pattern, flags) {
    const items = [];

    if (!pattern) return '';

    // Very basic heuristics
    const has = (re) => re.test(pattern);

    if (has(/\./)) items.push('`.` matches any character (except newline unless `s` flag)');
    if (has(/\\d/)) items.push('`\\d` matches a digit');
    if (has(/\\w/)) items.push('`\\w` matches a word character');
    if (has(/\\s/)) items.push('`\\s` matches whitespace');
    if (has(/\[/)) items.push('`[...]` is a character class');
    if (has(/\(/)) items.push('`(...)` is a capturing group');
    if (has(/\?:\)/)) items.push('`(?:...)` is a non-capturing group');
    if (has(/\*|\+|\?/)) items.push('`* + ?` are quantifiers');
    if (has(/\{\d+(,\d*)?\}/)) items.push('`{m,n}` is a repetition quantifier');
    if (has(/\^/)) items.push('`^` anchors to start of text/line (with `m`)');
    if (has(/\$/)) items.push('`$` anchors to end of text/line (with `m`)');
    if (has(/\|/)) items.push('`|` is alternation (OR)');

    const flagsParts = [];
    if (flags.includes('g')) flagsParts.push('`g` global (find all)');
    if (flags.includes('i')) flagsParts.push('`i` ignore case');
    if (flags.includes('m')) flagsParts.push('`m` multiline');
    if (flags.includes('s')) flagsParts.push('`s` dotAll');
    if (flags.includes('u')) flagsParts.push('`u` unicode');
    if (flags.includes('y')) flagsParts.push('`y` sticky');

    const lines = [];
    if (flagsParts.length) lines.push(`Flags: ${flagsParts.join(', ')}`);
    if (items.length) lines.push(items.join('<br>'));

    return lines.join('<br><br>');
  }

  function renderMatches() {
    const re = compile();
    const text = textInput.value || '';

    explainEl.innerHTML = buildExplain(patternInput.value || '', normalizeFlags(flagsInput.value));

    if (!re) {
      matchCountEl.textContent = '0';
      highlightEl.innerHTML = escapeHtml(text);
      return;
    }

    // For highlighting, ensure we can iterate all matches
    const flags = re.flags.includes('g') ? re.flags : (re.flags + 'g');
    let all;
    try {
      all = new RegExp(re.source, flags);
    } catch {
      all = re;
    }

    const matches = [];
    if (text.length) {
      for (const m of text.matchAll(all)) {
        if (m.index == null) continue;
        // Avoid infinite loops on zero-length matches
        if (m[0] === '') {
          matches.push({ start: m.index, end: m.index, value: '' });
          if (all.lastIndex === m.index) all.lastIndex++;
          continue;
        }
        matches.push({ start: m.index, end: m.index + m[0].length, value: m[0] });
      }
    }

    matchCountEl.textContent = String(matches.filter(m => m.end > m.start).length);

    // Build highlighted HTML
    let out = '';
    let last = 0;
    for (const m of matches) {
      if (m.end <= m.start) continue;
      out += escapeHtml(text.slice(last, m.start));
      out += `<mark>${escapeHtml(text.slice(m.start, m.end))}</mark>`;
      last = m.end;
    }
    out += escapeHtml(text.slice(last));
    highlightEl.innerHTML = out;
  }

  function runReplace() {
    const re = compile();
    if (!re) {
      replaceOutput.value = '';
      return;
    }
    const text = textInput.value || '';
    const replacement = replacementInput.value ?? '';

    try {
      replaceOutput.value = text.replace(re, replacement);
      if (typeof trackToolUsage === 'function') {
        trackToolUsage('regex_tester', 'replace');
      }
    } catch (e) {
      replaceOutput.value = '';
      if (typeof showAlert === 'function') {
        showAlert((e && e.message) ? e.message : 'Replace error', 'danger');
      }
    }
  }

  patternInput.addEventListener('input', renderMatches);
  flagsInput.addEventListener('input', renderMatches);
  textInput.addEventListener('input', renderMatches);

  runReplaceBtn.addEventListener('click', runReplace);
  replacementInput.addEventListener('input', () => {
    // keep output responsive if already computed
    if (replaceOutput.value) runReplace();
  });

  // Defaults
  if (!patternInput.value) patternInput.value = '\\b\\w+\\b';
  if (!flagsInput.value) flagsInput.value = 'g';
  if (!textInput.value) textInput.value = 'Hello API v2: regex_test-123';

  renderMatches();
  runReplace();
});
