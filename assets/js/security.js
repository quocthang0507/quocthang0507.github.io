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
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitizes HTML string by removing script tags and event handlers
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - The sanitized HTML string
 */
function sanitizeHtml(html) {
    if (!html) return '';
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.textContent = html; // This automatically escapes HTML
    
    return temp.innerHTML;
}

/**
 * Safely sets innerHTML with automatic sanitization
 * @param {HTMLElement} element - The element to update
 * @param {string} html - The HTML content (will be sanitized)
 */
function safeSetInnerHTML(element, html) {
    if (!element) return;
    
    // For simple text, use textContent (safer)
    if (!/<[^>]+>/.test(html)) {
        element.textContent = html;
        return;
    }
    
    // For HTML content, sanitize first
    element.innerHTML = sanitizeHtml(html);
}

/**
 * Validates and sanitizes URL to prevent javascript: or data: schemes
 * @param {string} url - The URL to validate
 * @returns {string|null} - The sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
    if (!url) return null;
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:') || 
        trimmed.startsWith('data:') || 
        trimmed.startsWith('vbscript:')) {
        console.warn('Blocked potentially dangerous URL:', url);
        return null;
    }
    
    return url;
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
        isInputSafe
    };
}
