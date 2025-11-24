// Encoder/Decoder functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const fileInput = document.getElementById('file-input');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const swapBtn = document.getElementById('swap-btn');
    const copyOutputBtn = document.getElementById('copy-output-btn');
    const downloadOutputBtn = document.getElementById('download-output-btn');
    const pasteInputBtn = document.getElementById('paste-input-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const clearFileBtn = document.getElementById('clear-file-btn');
    const inputCharCount = document.getElementById('input-char-count');
    const inputByteCount = document.getElementById('input-byte-count');
    const outputCharCount = document.getElementById('output-char-count');
    const outputByteCount = document.getElementById('output-byte-count');
    const alertContainer = document.getElementById('alert-container');

    let currentFormat = 'base64';
    let fileData = null;
    let fileName = '';

    // Initialize
    updateCharCounts();

    // Event Listeners
    formatRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentFormat = this.value;
        });
    });

    inputText.addEventListener('input', function() {
        updateCharCounts();
        fileData = null;
        fileInput.value = '';
    });

    outputText.addEventListener('input', function() {
        updateOutputCounts();
    });

    fileInput.addEventListener('change', handleFileSelect);
    clearFileBtn.addEventListener('click', clearFile);
    encodeBtn.addEventListener('click', () => processData('encode'));
    decodeBtn.addEventListener('click', () => processData('decode'));
    swapBtn.addEventListener('click', swapInputOutput);
    copyOutputBtn.addEventListener('click', copyOutput);
    downloadOutputBtn.addEventListener('click', downloadOutput);
    pasteInputBtn.addEventListener('click', pasteInput);
    clearInputBtn.addEventListener('click', clearInput);

    // Functions
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            showAlert('File size exceeds 10MB limit', 'danger');
            fileInput.value = '';
            return;
        }

        fileName = file.name;
        const reader = new FileReader();

        reader.onload = function(event) {
            fileData = event.target.result;
            inputText.value = '';
            inputText.placeholder = `File loaded: ${fileName} (${formatBytes(file.size)})`;
            updateCharCounts();
        };

        reader.readAsArrayBuffer(file);
    }

    function clearFile() {
        fileInput.value = '';
        fileData = null;
        fileName = '';
        inputText.placeholder = getTranslation('encoder.input_placeholder') || 'Enter text to encode/decode...';
    }

    function processData(action) {
        try {
            let result;
            
            if (action === 'encode') {
                result = encode();
            } else {
                result = decode();
            }

            if (result !== null) {
                outputText.value = result;
                updateOutputCounts();
                copyOutputBtn.disabled = false;
                downloadOutputBtn.disabled = false;
                showAlert(`Successfully ${action}d!`, 'success');
            }
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
            outputText.value = '';
            updateOutputCounts();
        }
    }

    function encode() {
        let data;
        
        if (fileData) {
            // URL encoding doesn't support file uploads
            if (currentFormat === 'url') {
                throw new Error('URL encoding only supports text input, not files');
            }
            
            // Encode file data
            const uint8Array = new Uint8Array(fileData);
            if (currentFormat === 'base64') {
                return arrayBufferToBase64(uint8Array);
            } else {
                return arrayBufferToHex(uint8Array);
            }
        } else {
            // Encode text
            const text = inputText.value.trim();
            if (!text) {
                throw new Error('Please enter text or select a file to encode');
            }

            // Handle URL encoding separately (text only)
            if (currentFormat === 'url') {
                return encodeURIComponent(text);
            }

            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(text);
            
            if (currentFormat === 'base64') {
                return arrayBufferToBase64(uint8Array);
            } else {
                return arrayBufferToHex(uint8Array);
            }
        }
    }

    function decode() {
        const text = inputText.value.trim();
        if (!text) {
            throw new Error('Please enter text to decode');
        }

        // Handle URL decoding separately
        if (currentFormat === 'url') {
            try {
                return decodeURIComponent(text);
            } catch (error) {
                throw new Error('Invalid URL-encoded string');
            }
        }

        let uint8Array;
        
        if (currentFormat === 'base64') {
            uint8Array = base64ToArrayBuffer(text);
        } else {
            uint8Array = hexToArrayBuffer(text);
        }

        // Try to decode as text
        try {
            const decoder = new TextDecoder('utf-8', { fatal: true });
            return decoder.decode(uint8Array);
        } catch {
            // If not valid UTF-8, return hex representation
            return arrayBufferToHex(uint8Array);
        }
    }

    function arrayBufferToBase64(uint8Array) {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        try {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch (error) {
            throw new Error('Invalid Base64 string');
        }
    }

    function arrayBufferToHex(uint8Array) {
        return Array.from(uint8Array)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    function hexToArrayBuffer(hex) {
        // Remove spaces and validate
        hex = hex.replace(/\s/g, '');
        
        if (!/^[0-9A-Fa-f]*$/.test(hex)) {
            throw new Error('Invalid hexadecimal string');
        }
        
        if (hex.length % 2 !== 0) {
            throw new Error('Hexadecimal string must have even length');
        }

        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    function swapInputOutput() {
        const temp = inputText.value;
        inputText.value = outputText.value;
        outputText.value = temp;
        
        // Clear file data when swapping
        clearFile();
        
        updateCharCounts();
        updateOutputCounts();
        
        if (outputText.value) {
            copyOutputBtn.disabled = false;
            downloadOutputBtn.disabled = false;
        } else {
            copyOutputBtn.disabled = true;
            downloadOutputBtn.disabled = true;
        }
    }

    async function copyOutput() {
        try {
            await navigator.clipboard.writeText(outputText.value);
            showAlert('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalText = copyOutputBtn.innerHTML;
            copyOutputBtn.innerHTML = '<i class="fas fa-check"></i> ' + 
                (getTranslation('encoder.copied') || 'Copied!');
            
            setTimeout(() => {
                copyOutputBtn.innerHTML = originalText;
            }, 2000);
        } catch (error) {
            showAlert('Failed to copy to clipboard', 'danger');
        }
    }

    function downloadOutput() {
        const text = outputText.value;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = currentFormat === 'base64' ? 'base64.txt' : 'hex.txt';
        a.download = fileName ? `${fileName}.${extension}` : `output.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('File downloaded!', 'success');
    }

    async function pasteInput() {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            clearFile();
            updateCharCounts();
            showAlert('Pasted from clipboard!', 'success');
        } catch (error) {
            showAlert('Failed to read clipboard', 'danger');
        }
    }

    function clearInput() {
        inputText.value = '';
        clearFile();
        updateCharCounts();
    }

    function updateCharCounts() {
        const text = inputText.value;
        inputCharCount.textContent = text.length;
        inputByteCount.textContent = new Blob([text]).size;
    }

    function updateOutputCounts() {
        const text = outputText.value;
        outputCharCount.textContent = text.length;
        outputByteCount.textContent = new Blob([text]).size;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        
        // Safely set text content (prevents XSS)
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('data-bs-dismiss', 'alert');
        closeBtn.setAttribute('aria-label', 'Close');
        
        alertDiv.appendChild(messageSpan);
        alertDiv.appendChild(closeBtn);
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    function getTranslation(key) {
        // Try to get translation from i18n if available
        if (typeof window.translations !== 'undefined' && window.translations[key]) {
            return window.translations[key];
        }
        return null;
    }
});
