/**
 * Security Utilities
 * Functions for sanitizing and securing user input
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';

    // Also escape quotes so the result is safe inside attribute values
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapes all HTML by encoding via textContent (does not preserve HTML tags)
 * @param {string} html - The string to HTML-encode
 * @returns {string} - The HTML-encoded string
 */
function sanitizeHtml(html) {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This automatically escapes HTML
    
    return temp.innerHTML;
}

/**
 * Safely sets element text content (always avoids unsafe HTML injection)
 * @param {HTMLElement} element - The element to update
 * @param {string} html - The content to display safely as text
 */
function safeSetInnerHTML(element, html) {
    if (!element) return;
    element.textContent = html == null ? '' : String(html);
}

/**
 * Validates and sanitizes URL to prevent javascript:, data:, vbscript:, or control-char bypasses
 * @param {string} url - The URL to validate
 * @returns {string|null} - The sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') return null;

    const trimmed = url.trim();
    if (!trimmed) return null;

    // Strip ASCII control characters and whitespace when inspecting scheme to block "java\tscript:"
    const collapsed = trimmed.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();

    if (
        collapsed.startsWith('javascript:') ||
        collapsed.startsWith('data:') ||
        collapsed.startsWith('vbscript:') ||
        collapsed.startsWith('file:')
    ) {
        console.warn('Blocked potentially dangerous URL:', url);
        return null;
    }

    // Allow safe same-page anchors and relative paths
    if (trimmed.startsWith('#') || (trimmed.startsWith('/') && !trimmed.startsWith('//')) || trimmed.startsWith('./') || trimmed.startsWith('../')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed, 'https://example.invalid');
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            console.warn('Blocked disallowed URL protocol:', parsed.protocol);
            return null;
        }
        return trimmed;
    } catch (_) {
        return null;
    }
}

/**
 * Validates that a data URL represents a safe raster image (blocks image/svg+xml and arbitrary data)
 * @param {string} url - Candidate data URL
 * @returns {boolean} - True if safe raster image data URL
 */
function isSafeDataImageUrl(url) {
    if (typeof url !== 'string') return false;
    return /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url.trim());
}

/**
 * Sanitizes error messages to prevent XSS through error stack traces
 * @param {Error|string} error - The error object or message
 * @returns {string} - A safe error message
 */
function sanitizeError(error) {
    if (!error) return 'An unknown error occurred';
    
    const message = error.message || error.toString();
    return escapeHtml(message);
}

/**
 * Creates a safe alert with sanitized message
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 * @param {HTMLElement} container - Container element for the alert
 */
function showSafeAlert(message, type, container) {
    if (!container) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    
    // Create text node for message (safe from XSS)
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('data-bs-dismiss', 'alert');
    closeBtn.setAttribute('aria-label', 'Close');
    
    alertDiv.appendChild(messageSpan);
    alertDiv.appendChild(closeBtn);
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Validates input against common injection patterns
 * @param {string} input - The input to validate
 * @returns {boolean} - True if input is safe
 */
function isInputSafe(input) {
    if (!input) return true;
    
    // Normalize input for checking (lowercase, remove whitespace variations)
    const normalized = input.toLowerCase().replace(/\s+/g, ' ');
    
    // Check for dangerous keywords and patterns
    const dangerousKeywords = [
        '<script',
        'javascript:',
        'onerror=',
        'onload=',
        'onclick=',
        '<iframe',
        '<object',
        '<embed',
        'eval(',
        'expression('
    ];
    
    return !dangerousKeywords.some(keyword => normalized.includes(keyword));
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        sanitizeHtml,
        safeSetInnerHTML,
        sanitizeUrl,
        sanitizeError,
        showSafeAlert,
        isInputSafe,
        isSafeDataImageUrl
    };
}
