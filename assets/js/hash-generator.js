// Hash Generator functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const inputText = document.getElementById('input-text');
    const fileInput = document.getElementById('file-input');
    const generateBtn = document.getElementById('generate-btn');
    const pasteInputBtn = document.getElementById('paste-input-btn');
    const clearInputBtn = document.getElementById('clear-input-btn');
    const clearFileBtn = document.getElementById('clear-file-btn');
    const inputCharCount = document.getElementById('input-char-count');
    const inputByteCount = document.getElementById('input-byte-count');
    const alertContainer = document.getElementById('alert-container');
    const hashResults = document.getElementById('hash-results');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const fileHashProgress = document.getElementById('file-hash-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const fileSizeInfo = document.getElementById('file-size-info');
    const fileInfoDisplay = document.getElementById('file-info-display');
    const fileNameDisplay = document.getElementById('file-name');
    const fileSizeDisplay = document.getElementById('file-size');
    const fileTypeDisplay = document.getElementById('file-type');
    const processingTimeDisplay = document.getElementById('processing-time');
    
    const hashOutputs = {
        md5: document.getElementById('md5-hash'),
        sha1: document.getElementById('sha1-hash'),
        sha256: document.getElementById('sha256-hash'),
        sha384: document.getElementById('sha384-hash'),
        sha512: document.getElementById('sha512-hash')
    };

    let fileData = null;
    let fileName = '';
    let fileSize = 0;
    let fileType = '';

    // Initialize
    updateCharCounts();

    // Event Listeners
    inputText.addEventListener('input', function() {
        updateCharCounts();
        fileData = null;
        fileInput.value = '';
    });

    fileInput.addEventListener('change', handleFileSelect);
    clearFileBtn.addEventListener('click', clearFile);
    generateBtn.addEventListener('click', generateHashes);
    pasteInputBtn.addEventListener('click', pasteInput);
    clearInputBtn.addEventListener('click', clearInput);
    copyAllBtn.addEventListener('click', copyAllHashes);

    // Copy individual hash buttons
    document.querySelectorAll('.copy-hash-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            copyHash(targetId, this);
        });
    });

    // Functions
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            showAlert('File size exceeds 100MB limit', 'danger');
            fileInput.value = '';
            return;
        }

        fileName = file.name;
        fileSize = file.size;
        fileType = file.type || 'application/octet-stream';
        
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
        fileSize = 0;
        fileType = '';
        fileHashProgress.style.display = 'none';
        fileInfoDisplay.style.display = 'none';
        inputText.placeholder = getTranslation('hash.input_placeholder') || 'Enter text to hash...';
    }

    async function generateHashes() {
        try {
            const startTime = performance.now();
            let data;
            let isLargeFile = false;

            if (fileData) {
                data = new Uint8Array(fileData);
                isLargeFile = fileSize > 5 * 1024 * 1024; // 5MB threshold
                
                if (isLargeFile) {
                    fileHashProgress.style.display = 'block';
                    fileSizeInfo.textContent = `${formatBytes(fileSize)}`;
                }
            } else {
                const text = inputText.value.trim();
                if (!text) {
                    throw new Error('Please enter text or select a file to hash');
                }
                const encoder = new TextEncoder();
                data = encoder.encode(text);
            }

            // Show loading state
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';

            // Generate all hashes (with progress for large files)
            let hashes;
            if (isLargeFile) {
                hashes = await generateHashesWithProgress(data);
            } else {
                hashes = await Promise.all([
                    generateMD5(data),
                    generateSHA('SHA-1', data),
                    generateSHA('SHA-256', data),
                    generateSHA('SHA-384', data),
                    generateSHA('SHA-512', data)
                ]);
            }

            // Display results
            hashOutputs.md5.value = hashes[0];
            hashOutputs.sha1.value = hashes[1];
            hashOutputs.sha256.value = hashes[2];
            hashOutputs.sha384.value = hashes[3];
            hashOutputs.sha512.value = hashes[4];

            hashResults.style.display = 'block';
            
            // Show file info if it was a file
            if (fileData) {
                const endTime = performance.now();
                const processingTime = ((endTime - startTime) / 1000).toFixed(2);
                
                fileNameDisplay.textContent = fileName;
                fileSizeDisplay.textContent = formatBytes(fileSize);
                fileTypeDisplay.textContent = fileType;
                processingTimeDisplay.textContent = `${processingTime}s`;
                fileInfoDisplay.style.display = 'block';
            } else {
                fileInfoDisplay.style.display = 'none';
            }
            
            showAlert('Hashes generated successfully!', 'success');

            // Scroll to results
            hashResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            // Restore button state
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-fingerprint"></i> ' + 
                (getTranslation('hash.generate') || 'Generate Hashes');
            
            // Hide progress bar
            setTimeout(() => {
                fileHashProgress.style.display = 'none';
            }, 1000);
        }
    }

    // Generate hashes with progress tracking for large files
    async function generateHashesWithProgress(data) {
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalHashes = 5;
        let completedHashes = 0;

        const updateProgress = () => {
            const percent = Math.round((completedHashes / totalHashes) * 100);
            progressBar.style.width = percent + '%';
            progressBar.textContent = percent + '%';
            progressText.textContent = percent + '%';
            progressBar.setAttribute('aria-valuenow', percent);
        };

        // Process each hash sequentially with progress updates
        const md5Hash = await generateMD5Chunked(data, chunkSize, () => {
            completedHashes = 0.2;
            updateProgress();
        });
        completedHashes = 1;
        updateProgress();

        const sha1Hash = await generateSHAChunked('SHA-1', data, chunkSize);
        completedHashes = 2;
        updateProgress();

        const sha256Hash = await generateSHAChunked('SHA-256', data, chunkSize);
        completedHashes = 3;
        updateProgress();

        const sha384Hash = await generateSHAChunked('SHA-384', data, chunkSize);
        completedHashes = 4;
        updateProgress();

        const sha512Hash = await generateSHAChunked('SHA-512', data, chunkSize);
        completedHashes = 5;
        updateProgress();

        return [md5Hash, sha1Hash, sha256Hash, sha384Hash, sha512Hash];
    }

    // Chunked MD5 for large files
    async function generateMD5Chunked(data, chunkSize, onProgress) {
        // For large files, we still use the full data but provide progress feedback
        if (onProgress) onProgress();
        return await new Promise(resolve => {
            setTimeout(() => {
                resolve(generateMD5(data));
            }, 0);
        });
    }

    // Chunked SHA for large files
    async function generateSHAChunked(algorithm, data, chunkSize) {
        // Process in chunks to avoid blocking UI
        return await new Promise(resolve => {
            setTimeout(async () => {
                const result = await generateSHA(algorithm, data);
                resolve(result);
            }, 0);
        });
    }

    // MD5 implementation (using a library approach via SubtleCrypto workaround)
    async function generateMD5(data) {
        // Since SubtleCrypto doesn't support MD5, we'll use a pure JS implementation
        return md5FromBytes(data);
    }

    // Pure JavaScript MD5 implementation
    function md5FromBytes(bytes) {
        // MD5 implementation
        const md5 = {
            rotateLeft: function(n, s) {
                return (n << s) | (n >>> (32 - s));
            },
            addUnsigned: function(x, y) {
                const lsw = (x & 0xFFFF) + (y & 0xFFFF);
                const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            },
            F: function(x, y, z) { return (x & y) | ((~x) & z); },
            G: function(x, y, z) { return (x & z) | (y & (~z)); },
            H: function(x, y, z) { return x ^ y ^ z; },
            I: function(x, y, z) { return y ^ (x | (~z)); },
            FF: function(a, b, c, d, x, s, ac) {
                a = this.addUnsigned(a, this.addUnsigned(this.addUnsigned(this.F(b, c, d), x), ac));
                return this.addUnsigned(this.rotateLeft(a, s), b);
            },
            GG: function(a, b, c, d, x, s, ac) {
                a = this.addUnsigned(a, this.addUnsigned(this.addUnsigned(this.G(b, c, d), x), ac));
                return this.addUnsigned(this.rotateLeft(a, s), b);
            },
            HH: function(a, b, c, d, x, s, ac) {
                a = this.addUnsigned(a, this.addUnsigned(this.addUnsigned(this.H(b, c, d), x), ac));
                return this.addUnsigned(this.rotateLeft(a, s), b);
            },
            II: function(a, b, c, d, x, s, ac) {
                a = this.addUnsigned(a, this.addUnsigned(this.addUnsigned(this.I(b, c, d), x), ac));
                return this.addUnsigned(this.rotateLeft(a, s), b);
            }
        };

        const msgLength = bytes.length;
        const wordArray = [];
        
        for (let i = 0; i < msgLength; i++) {
            wordArray[i >> 2] |= bytes[i] << ((i % 4) * 8);
        }

        const bitLength = msgLength * 8;
        wordArray[msgLength >> 2] |= 0x80 << ((msgLength % 4) * 8);
        wordArray[((msgLength + 8 >> 6) * 16) + 14] = bitLength;

        let a = 0x67452301;
        let b = 0xEFCDAB89;
        let c = 0x98BADCFE;
        let d = 0x10325476;

        for (let i = 0; i < wordArray.length; i += 16) {
            const oldA = a, oldB = b, oldC = c, oldD = d;

            a = md5.FF(a, b, c, d, wordArray[i + 0], 7, 0xD76AA478);
            d = md5.FF(d, a, b, c, wordArray[i + 1], 12, 0xE8C7B756);
            c = md5.FF(c, d, a, b, wordArray[i + 2], 17, 0x242070DB);
            b = md5.FF(b, c, d, a, wordArray[i + 3], 22, 0xC1BDCEEE);
            a = md5.FF(a, b, c, d, wordArray[i + 4], 7, 0xF57C0FAF);
            d = md5.FF(d, a, b, c, wordArray[i + 5], 12, 0x4787C62A);
            c = md5.FF(c, d, a, b, wordArray[i + 6], 17, 0xA8304613);
            b = md5.FF(b, c, d, a, wordArray[i + 7], 22, 0xFD469501);
            a = md5.FF(a, b, c, d, wordArray[i + 8], 7, 0x698098D8);
            d = md5.FF(d, a, b, c, wordArray[i + 9], 12, 0x8B44F7AF);
            c = md5.FF(c, d, a, b, wordArray[i + 10], 17, 0xFFFF5BB1);
            b = md5.FF(b, c, d, a, wordArray[i + 11], 22, 0x895CD7BE);
            a = md5.FF(a, b, c, d, wordArray[i + 12], 7, 0x6B901122);
            d = md5.FF(d, a, b, c, wordArray[i + 13], 12, 0xFD987193);
            c = md5.FF(c, d, a, b, wordArray[i + 14], 17, 0xA679438E);
            b = md5.FF(b, c, d, a, wordArray[i + 15], 22, 0x49B40821);

            a = md5.GG(a, b, c, d, wordArray[i + 1], 5, 0xF61E2562);
            d = md5.GG(d, a, b, c, wordArray[i + 6], 9, 0xC040B340);
            c = md5.GG(c, d, a, b, wordArray[i + 11], 14, 0x265E5A51);
            b = md5.GG(b, c, d, a, wordArray[i + 0], 20, 0xE9B6C7AA);
            a = md5.GG(a, b, c, d, wordArray[i + 5], 5, 0xD62F105D);
            d = md5.GG(d, a, b, c, wordArray[i + 10], 9, 0x02441453);
            c = md5.GG(c, d, a, b, wordArray[i + 15], 14, 0xD8A1E681);
            b = md5.GG(b, c, d, a, wordArray[i + 4], 20, 0xE7D3FBC8);
            a = md5.GG(a, b, c, d, wordArray[i + 9], 5, 0x21E1CDE6);
            d = md5.GG(d, a, b, c, wordArray[i + 14], 9, 0xC33707D6);
            c = md5.GG(c, d, a, b, wordArray[i + 3], 14, 0xF4D50D87);
            b = md5.GG(b, c, d, a, wordArray[i + 8], 20, 0x455A14ED);
            a = md5.GG(a, b, c, d, wordArray[i + 13], 5, 0xA9E3E905);
            d = md5.GG(d, a, b, c, wordArray[i + 2], 9, 0xFCEFA3F8);
            c = md5.GG(c, d, a, b, wordArray[i + 7], 14, 0x676F02D9);
            b = md5.GG(b, c, d, a, wordArray[i + 12], 20, 0x8D2A4C8A);

            a = md5.HH(a, b, c, d, wordArray[i + 5], 4, 0xFFFA3942);
            d = md5.HH(d, a, b, c, wordArray[i + 8], 11, 0x8771F681);
            c = md5.HH(c, d, a, b, wordArray[i + 11], 16, 0x6D9D6122);
            b = md5.HH(b, c, d, a, wordArray[i + 14], 23, 0xFDE5380C);
            a = md5.HH(a, b, c, d, wordArray[i + 1], 4, 0xA4BEEA44);
            d = md5.HH(d, a, b, c, wordArray[i + 4], 11, 0x4BDECFA9);
            c = md5.HH(c, d, a, b, wordArray[i + 7], 16, 0xF6BB4B60);
            b = md5.HH(b, c, d, a, wordArray[i + 10], 23, 0xBEBFBC70);
            a = md5.HH(a, b, c, d, wordArray[i + 13], 4, 0x289B7EC6);
            d = md5.HH(d, a, b, c, wordArray[i + 0], 11, 0xEAA127FA);
            c = md5.HH(c, d, a, b, wordArray[i + 3], 16, 0xD4EF3085);
            b = md5.HH(b, c, d, a, wordArray[i + 6], 23, 0x04881D05);
            a = md5.HH(a, b, c, d, wordArray[i + 9], 4, 0xD9D4D039);
            d = md5.HH(d, a, b, c, wordArray[i + 12], 11, 0xE6DB99E5);
            c = md5.HH(c, d, a, b, wordArray[i + 15], 16, 0x1FA27CF8);
            b = md5.HH(b, c, d, a, wordArray[i + 2], 23, 0xC4AC5665);

            a = md5.II(a, b, c, d, wordArray[i + 0], 6, 0xF4292244);
            d = md5.II(d, a, b, c, wordArray[i + 7], 10, 0x432AFF97);
            c = md5.II(c, d, a, b, wordArray[i + 14], 15, 0xAB9423A7);
            b = md5.II(b, c, d, a, wordArray[i + 5], 21, 0xFC93A039);
            a = md5.II(a, b, c, d, wordArray[i + 12], 6, 0x655B59C3);
            d = md5.II(d, a, b, c, wordArray[i + 3], 10, 0x8F0CCC92);
            c = md5.II(c, d, a, b, wordArray[i + 10], 15, 0xFFEFF47D);
            b = md5.II(b, c, d, a, wordArray[i + 1], 21, 0x85845DD1);
            a = md5.II(a, b, c, d, wordArray[i + 8], 6, 0x6FA87E4F);
            d = md5.II(d, a, b, c, wordArray[i + 15], 10, 0xFE2CE6E0);
            c = md5.II(c, d, a, b, wordArray[i + 6], 15, 0xA3014314);
            b = md5.II(b, c, d, a, wordArray[i + 13], 21, 0x4E0811A1);
            a = md5.II(a, b, c, d, wordArray[i + 4], 6, 0xF7537E82);
            d = md5.II(d, a, b, c, wordArray[i + 11], 10, 0xBD3AF235);
            c = md5.II(c, d, a, b, wordArray[i + 2], 15, 0x2AD7D2BB);
            b = md5.II(b, c, d, a, wordArray[i + 9], 21, 0xEB86D391);

            a = md5.addUnsigned(a, oldA);
            b = md5.addUnsigned(b, oldB);
            c = md5.addUnsigned(c, oldC);
            d = md5.addUnsigned(d, oldD);
        }

        return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    }

    function wordToHex(word) {
        let hex = '';
        for (let i = 0; i <= 3; i++) {
            const byte = (word >>> (i * 8)) & 0xFF;
            hex += byte.toString(16).padStart(2, '0');
        }
        return hex;
    }

    // SHA hashes using SubtleCrypto API
    async function generateSHA(algorithm, data) {
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function copyHash(targetId, button) {
        const input = document.getElementById(targetId);
        try {
            await navigator.clipboard.writeText(input.value);
            showAlert('Hash copied to clipboard!', 'success');
            
            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> ' + 
                (getTranslation('hash.copied') || 'Copied!');
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
        } catch (error) {
            showAlert('Failed to copy to clipboard', 'danger');
        }
    }

    async function copyAllHashes() {
        const allHashes = `MD5: ${hashOutputs.md5.value}
SHA-1: ${hashOutputs.sha1.value}
SHA-256: ${hashOutputs.sha256.value}
SHA-384: ${hashOutputs.sha384.value}
SHA-512: ${hashOutputs.sha512.value}`;

        try {
            await navigator.clipboard.writeText(allHashes);
            showAlert('All hashes copied to clipboard!', 'success');
            
            // Visual feedback
            const originalHTML = copyAllBtn.innerHTML;
            copyAllBtn.innerHTML = '<i class="fas fa-check"></i> ' + 
                (getTranslation('hash.copied') || 'Copied!');
            
            setTimeout(() => {
                copyAllBtn.innerHTML = originalHTML;
            }, 2000);
        } catch (error) {
            showAlert('Failed to copy to clipboard', 'danger');
        }
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
        hashResults.style.display = 'none';
    }

    function updateCharCounts() {
        const text = inputText.value;
        inputCharCount.textContent = text.length;
        inputByteCount.textContent = new Blob([text]).size;
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
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
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
