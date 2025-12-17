document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('md-input');
  const preview = document.getElementById('md-preview');
  const copyButton = document.getElementById('copy-html');

  if (!input || !preview || !copyButton) return;

  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    showAlert('Markdown libraries failed to load.', 'danger');
    return;
  }

  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false
  });

  let lastHtml = '';
  let renderTimer = null;

  const render = () => {
    const markdown = input.value || '';
    const rawHtml = marked.parse(markdown);
    const safeHtml = DOMPurify.sanitize(rawHtml);

    lastHtml = safeHtml;
    preview.innerHTML = safeHtml;

    if (typeof trackToolUsage === 'function') {
      trackToolUsage('markdown_preview', 'render');
    }
  };

  const scheduleRender = () => {
    if (renderTimer) window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 80);
  };

  input.addEventListener('input', scheduleRender);

  copyButton.addEventListener('click', () => {
    copyToClipboard(lastHtml);
    if (typeof trackToolUsage === 'function') {
      trackToolUsage('markdown_preview', 'copy_html');
    }
  });

  // Initial content
  input.value = input.value || '# Markdown\n\n- Rendered preview\n- Copy HTML\n\n```js\nconsole.log("Hello");\n```\n';
  render();
});
