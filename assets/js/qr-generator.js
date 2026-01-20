// QR Code Generator functionality
document.addEventListener('DOMContentLoaded', function() {
    let qrHistory = loadFromLocalStorage('qrHistory') || [];
    let currentQRCode = null;
    let currentQRData = null;
    let currentQRStyling = null;
    let logoImage = null;
    let logoDataUrl = null;
    
    // Initialize
    renderHistory();
    updateSizeValue();
    
    // Get QR settings
    function getQRSettings(forPreview = true) {
        const userSize = parseInt(document.getElementById('qr-size').value);
        // Use smaller size for preview (max 256px) for fast rendering
        const size = forPreview ? Math.min(userSize, 256) : userSize;
        
        return {
            width: size,
            height: size,
            colorDark: document.getElementById('qr-color').value,
            colorLight: document.getElementById('qr-bgcolor').value,
            correctLevel: document.getElementById('qr-error-level').value
        };
    }

    function getQRStyleSettings() {
        const dotsType = document.getElementById('qr-pattern')?.value || 'square';
        const cornerSquareType = document.getElementById('qr-corner-square')?.value || 'square';
        const cornerDotType = document.getElementById('qr-corner-dot')?.value || 'dot';

        return {
            dotsType,
            cornerSquareType,
            cornerDotType
        };
    }
    
    // Get content based on type
    function getQRContent() {
        const type = document.querySelector('input[name="qr-type"]:checked').value;
        let content = '';
        
        switch(type) {
            case 'url':
                content = document.getElementById('url-input').value.trim();
                if (content && !content.startsWith('http://') && !content.startsWith('https://')) {
                    content = 'https://' + content;
                }
                break;
                
            case 'text':
                content = document.getElementById('text-input').value.trim();
                break;
                
            case 'email':
                const email = document.getElementById('email-input').value.trim();
                const subject = document.getElementById('email-subject').value.trim();
                const body = document.getElementById('email-body').value.trim();
                content = `mailto:${email}`;
                if (subject || body) {
                    content += '?';
                    if (subject) content += `subject=${encodeURIComponent(subject)}`;
                    if (subject && body) content += '&';
                    if (body) content += `body=${encodeURIComponent(body)}`;
                }
                break;
                
            case 'phone':
                const phone = document.getElementById('phone-input').value.trim();
                content = `tel:${phone}`;
                break;
                
            case 'vcard':
                const firstname = document.getElementById('vcard-firstname').value.trim();
                const lastname = document.getElementById('vcard-lastname').value.trim();
                const org = document.getElementById('vcard-org').value.trim();
                const title = document.getElementById('vcard-title').value.trim();
                const vcardPhone = document.getElementById('vcard-phone').value.trim();
                const vcardEmail = document.getElementById('vcard-email').value.trim();
                const website = document.getElementById('vcard-website').value.trim();
                const address = document.getElementById('vcard-address').value.trim();
                
                content = 'BEGIN:VCARD\n';
                content += 'VERSION:3.0\n';
                if (firstname || lastname) {
                    content += `N:${lastname};${firstname};;;\n`;
                    content += `FN:${firstname} ${lastname}\n`;
                }
                if (org) content += `ORG:${org}\n`;
                if (title) content += `TITLE:${title}\n`;
                if (vcardPhone) content += `TEL:${vcardPhone}\n`;
                if (vcardEmail) content += `EMAIL:${vcardEmail}\n`;
                if (website) content += `URL:${website}\n`;
                if (address) content += `ADR:;;${address};;;;\n`;
                content += 'END:VCARD';
                break;
        }
        
        return content;
    }
    
    // Generate QR Code
    async function generateQRCode() {
        const content = getQRContent();
        
        if (!content) {
            showAlert('Vui lòng nhập nội dung!', 'warning');
            return;
        }
        
        // Clear previous QR code
        const container = document.getElementById('qr-code-display');
        container.innerHTML = '';
        
        try {
            const settings = getQRSettings();

            const styleSettings = getQRStyleSettings();
            
            // Create QR code using QRCodeStyling (supports patterns)
            if (typeof QRCodeStyling !== 'undefined') {
                currentQRStyling = new QRCodeStyling({
                    width: settings.width,
                    height: settings.height,
                    type: 'canvas',
                    data: content,
                    qrOptions: {
                        errorCorrectionLevel: settings.correctLevel
                    },
                    dotsOptions: {
                        color: settings.colorDark,
                        type: styleSettings.dotsType
                    },
                    backgroundOptions: {
                        color: settings.colorLight
                    },
                    cornersSquareOptions: {
                        color: settings.colorDark,
                        type: styleSettings.cornerSquareType
                    },
                    cornersDotOptions: {
                        color: settings.colorDark,
                        type: styleSettings.cornerDotType
                    },
                    image: logoDataUrl || undefined,
                    imageOptions: {
                        crossOrigin: 'anonymous',
                        margin: 5,
                        imageSize: 0.2,
                        hideBackgroundDots: true
                    }
                });

                currentQRStyling.append(container);
                currentQRCode = currentQRStyling;
            } else {
                // Fallback to qrcodejs if QRCodeStyling isn't available
                currentQRCode = new QRCode(container, {
                    text: content,
                    width: settings.width,
                    height: settings.height,
                    colorDark: settings.colorDark,
                    colorLight: settings.colorLight,
                    correctLevel: QRCode.CorrectLevel[settings.correctLevel]
                });
            }
            
            currentQRData = {
                content: content,
                type: document.querySelector('input[name="qr-type"]:checked').value,
                settings: settings,
                style: styleSettings,
                timestamp: new Date().toISOString()
            };

            // Show display container
            document.getElementById('qr-display-container').style.display = 'block';

            // If we're using fallback canvas mode, still draw logo manually
            if (!currentQRStyling && logoImage) {
                await addLogoToQR({
                    colorLight: settings.colorLight
                });
            }

            // Add to history (after logo compositing)
            addToHistory(currentQRData);
            
            // Track generation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'qr_generated', {
                    event_category: 'qr_generator',
                    event_label: currentQRData.type
                });
            }
            
            showAlert('Đã tạo mã QR thành công!', 'success');
        } catch (error) {
            showAlert('Lỗi khi tạo mã QR: ' + error.message, 'error');
        }
    }
    
    function waitForCanvas(selector, timeoutMs = 1500) {
        const start = performance.now();
        return new Promise((resolve, reject) => {
            function tick() {
                const canvas = document.querySelector(selector);
                if (canvas) {
                    resolve(canvas);
                    return;
                }

                if (performance.now() - start > timeoutMs) {
                    reject(new Error('QR canvas not found'));
                    return;
                }

                requestAnimationFrame(tick);
            }
            tick();
        });
    }

    async function decodeImage(img) {
        if (!img) return;
        if (img.decode) {
            try {
                await img.decode();
                return;
            } catch (_) {
                // Fall back to onload checks below
            }
        }
        if (img.complete && img.naturalWidth > 0) return;
        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Logo image failed to load'));
        });
    }

    // Add logo to QR code and sync preview <img>
    async function addLogoToQR(settingsOverride) {
        if (!logoImage) return;

        const canvas = await waitForCanvas('#qr-code-display canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await decodeImage(logoImage);

        const settings = settingsOverride || getQRSettings();

        // qrcodejs sometimes renders an <img> from canvas; ensure we export after compositing
        const qrSize = Math.min(canvas.width, canvas.height);
        const targetSize = Math.round(qrSize * 0.2);
        const padding = Math.max(4, Math.round(qrSize * 0.02));

        const aspect = logoImage.naturalWidth && logoImage.naturalHeight
            ? logoImage.naturalWidth / logoImage.naturalHeight
            : 1;

        let drawW = targetSize;
        let drawH = targetSize;
        if (aspect > 1) {
            drawH = Math.round(targetSize / aspect);
        } else {
            drawW = Math.round(targetSize * aspect);
        }

        const logoX = Math.round((canvas.width - drawW) / 2);
        const logoY = Math.round((canvas.height - drawH) / 2);

        // Background behind logo (use current light/background color)
        ctx.save();
        ctx.fillStyle = settings.colorLight || '#ffffff';
        ctx.fillRect(
            Math.round((canvas.width - targetSize) / 2) - padding,
            Math.round((canvas.height - targetSize) / 2) - padding,
            targetSize + padding * 2,
            targetSize + padding * 2
        );
        ctx.restore();

        // Draw logo
        ctx.drawImage(logoImage, logoX, logoY, drawW, drawH);

        // Sync the preview image (qrcodejs often shows <img> instead of <canvas>)
        const img = document.querySelector('#qr-code-display img');
        if (img) {
            try {
                img.src = canvas.toDataURL('image/png');
            } catch (_) {
                // If canvas becomes tainted, ignore (shouldn't happen with local uploads)
            }
        }
    }
    
    // Download as PNG - Generate high quality version
    function downloadPNG() {
        if (!currentQRData) {
            showAlert('Chưa có mã QR để tải!', 'warning');
            return;
        }

        // Generate high-quality version (512px) for download
        const highQualitySize = 512;
        const settings = getQRSettings();
        const styleSettings = getQRStyleSettings();
        
        if (typeof QRCodeStyling !== 'undefined') {
            const qrCode = new QRCodeStyling({
                width: highQualitySize,
                height: highQualitySize,
                type: 'canvas',
                data: currentQRData.content,
                qrOptions: {
                    errorCorrectionLevel: settings.correctLevel
                },
                dotsOptions: {
                    color: settings.colorDark,
                    type: styleSettings.dotsType
                },
                backgroundOptions: {
                    color: settings.colorLight
                },
                cornersSquareOptions: {
                    color: settings.colorDark,
                    type: styleSettings.cornerSquareType
                },
                cornersDotOptions: {
                    color: settings.colorDark,
                    type: styleSettings.cornerDotType
                },
                image: logoDataUrl || undefined,
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 5,
                    imageSize: 0.2,
                    hideBackgroundDots: true
                }
            });

            qrCode.download({
                name: `qrcode-${Date.now()}`,
                extension: 'png'
            });
            showAlert('Đã tải xuống PNG chất lượng cao!', 'success');
        } else {
            // Fallback to preview canvas
            const canvas = document.querySelector('#qr-code-display canvas');
            if (!canvas) {
                showAlert('Chưa có mã QR để tải!', 'warning');
                return;
            }

            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `qrcode-${Date.now()}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showAlert('Đã tải xuống PNG!', 'success');
            });
        }
    }
    
    // Download as SVG
    function downloadSVG() {
        if (currentQRStyling && typeof currentQRStyling.download === 'function') {
            currentQRStyling.download({
                name: `qrcode-${Date.now()}`,
                extension: 'svg'
            });
            showAlert('Đã tải xuống SVG!', 'success');
            return;
        }

        // Fallback: old SVG generation
        const canvas = document.querySelector('#qr-code-display canvas');
        if (!canvas) {
            showAlert('Chưa có mã QR để tải!', 'warning');
            return;
        }

        const settings = getQRSettings();
        const size = settings.width;
        const content = currentQRData.content;

        const qr = qrcode(0, document.getElementById('qr-error-level').value);
        qr.addData(content);
        qr.make();

        const moduleCount = qr.getModuleCount();
        const cellSize = size / moduleCount;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`;
        svg += `<rect width="100%" height="100%" fill="${settings.colorLight}"/>`;

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${settings.colorDark}"/>`;
                }
            }
        }

        if (logoDataUrl) {
            const logoSize = size * 0.2;
            const padding = Math.max(4, size * 0.02);
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            svg += `<rect x="${x - padding}" y="${y - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="${settings.colorLight}"/>`;
            svg += `<image x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" href="${logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
        }

        svg += '</svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showAlert('Đã tải xuống SVG!', 'success');
    }
    
    // Batch generation
    function batchGenerate() {
        const batchInput = document.getElementById('batch-input').value.trim();
        if (!batchInput) {
            showAlert('Vui lòng nhập danh sách URL/văn bản!', 'warning');
            return;
        }
        
        const items = batchInput.split('\n').filter(item => item.trim());
        if (items.length === 0) {
            showAlert('Không có mục nào để tạo!', 'warning');
            return;
        }
        
        if (items.length > 50) {
            showAlert('Tối đa 50 mã QR mỗi lần!', 'warning');
            return;
        }
        
        const resultsContainer = document.getElementById('batch-results');
        resultsContainer.innerHTML = '';
        
        const settings = getQRSettings();
        
        items.forEach((item, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-3 col-sm-4 col-6';
            
            const card = document.createElement('div');
            card.className = 'batch-qr-item';
            
            const qrContainer = document.createElement('div');
            qrContainer.id = `batch-qr-${index}`;
            
            try {
                new QRCode(qrContainer, {
                    text: item,
                    width: 200,
                    height: 200,
                    colorDark: settings.colorDark,
                    colorLight: settings.colorLight,
                    correctLevel: settings.correctLevel
                });
                
                card.appendChild(qrContainer);
                
                const label = document.createElement('div');
                label.className = 'small text-muted mt-2';
                label.textContent = item.length > 30 ? item.substring(0, 30) + '...' : item;
                card.appendChild(label);
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-sm btn-primary mt-2';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> PNG';
                downloadBtn.onclick = function() {
                    const canvas = qrContainer.querySelector('canvas');
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `qrcode-${index + 1}.png`;
                        link.href = url;
                        link.click();
                        URL.revokeObjectURL(url);
                    });
                };
                card.appendChild(downloadBtn);
                
                col.appendChild(card);
                resultsContainer.appendChild(col);
            } catch (error) {
                console.error('Error generating QR for:', item, error);
            }
        });
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('batchModal'));
        modal.show();
        
        showAlert(`Đã tạo ${items.length} mã QR!`, 'success');
        
        // Track batch generation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'batch_qr_generated', {
                event_category: 'qr_generator',
                event_label: 'batch',
                value: items.length
            });
        }
    }
    
    // Download all batch QR codes (simplified - downloads one by one)
    function downloadAllBatch() {
        const qrContainers = document.querySelectorAll('#batch-results canvas');
        if (qrContainers.length === 0) {
            showAlert('Không có mã QR nào để tải!', 'warning');
            return;
        }
        
        qrContainers.forEach((canvas, index) => {
            setTimeout(() => {
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `qrcode-batch-${index + 1}.png`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
            }, index * 200); // Stagger downloads
        });
        
        showAlert(`Đang tải ${qrContainers.length} mã QR...`, 'info');
    }
    
    // Add to history
    function addToHistory(qrData) {
        // Create a copy with rendered image data
        if (currentQRStyling && typeof currentQRStyling.getRawData === 'function') {
            currentQRStyling.getRawData('png').then(blob => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const historyItem = {
                        ...qrData,
                        imageData: reader.result,
                        id: Date.now()
                    };

                    qrHistory.unshift(historyItem);
                    if (qrHistory.length > 20) {
                        qrHistory = qrHistory.slice(0, 20);
                    }

                    saveToLocalStorage('qrHistory', qrHistory);
                    renderHistory();
                };
                reader.readAsDataURL(blob);
            }).catch(() => {
                // Fallback to canvas
                const canvas = document.querySelector('#qr-code-display canvas');
                if (!canvas) return;
                const historyItem = {
                    ...qrData,
                    imageData: canvas.toDataURL(),
                    id: Date.now()
                };

                qrHistory.unshift(historyItem);
                if (qrHistory.length > 20) {
                    qrHistory = qrHistory.slice(0, 20);
                }

                saveToLocalStorage('qrHistory', qrHistory);
                renderHistory();
            });

            return;
        }

        const canvas = document.querySelector('#qr-code-display canvas');
        if (!canvas) return;

        const historyItem = {
            ...qrData,
            imageData: canvas.toDataURL(),
            id: Date.now()
        };

        qrHistory.unshift(historyItem);
        if (qrHistory.length > 20) {
            qrHistory = qrHistory.slice(0, 20);
        }

        saveToLocalStorage('qrHistory', qrHistory);
        renderHistory();
    }
    
    // Render history
    function renderHistory() {
        const container = document.getElementById('qr-history');
        
        if (qrHistory.length === 0) {
            container.innerHTML = '<p class="text-muted text-center col-12">Chưa có lịch sử tạo mã QR</p>';
            return;
        }
        
        container.innerHTML = qrHistory.map((item, index) => `
            <div class="col-lg-2 col-md-3 col-sm-4 col-6">
                <div class="qr-history-item">
                    <img src="${item.imageData}" alt="QR Code">
                    <div class="small text-muted">${item.type.toUpperCase()}</div>
                    <div class="small text-truncate" title="${item.content}">
                        ${item.content.length > 20 ? item.content.substring(0, 20) + '...' : item.content}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.reloadQR(${index})">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="window.downloadHistoryQR(${index})">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="window.deleteHistoryQR(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Reload QR from history
    window.reloadQR = function(index) {
        const item = qrHistory[index];
        if (!item) return;
        
        // Set type
        document.querySelector(`input[name="qr-type"][value="${item.type}"]`).checked = true;
        switchQRType();
        
        // Set content based on type
        if (item.type === 'url') {
            document.getElementById('url-input').value = item.content;
        } else if (item.type === 'text') {
            document.getElementById('text-input').value = item.content;
        }
        
        // Set customization
        document.getElementById('qr-size').value = item.settings.width;
        document.getElementById('qr-color').value = item.settings.colorDark;
        document.getElementById('qr-bgcolor').value = item.settings.colorLight;
        updateSizeValue();
        
        // Generate
        generateQRCode();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Download QR from history
    window.downloadHistoryQR = function(index) {
        const item = qrHistory[index];
        if (!item) return;
        
        const link = document.createElement('a');
        link.download = `qrcode-history-${Date.now()}.png`;
        link.href = item.imageData;
        link.click();
        
        showAlert('Đã tải xuống!', 'success');
    };
    
    // Delete QR from history
    window.deleteHistoryQR = function(index) {
        qrHistory.splice(index, 1);
        saveToLocalStorage('qrHistory', qrHistory);
        renderHistory();
        showAlert('Đã xóa khỏi lịch sử!', 'success');
    };
    
    // Clear history
    function clearHistory() {
        if (qrHistory.length === 0) return;
        
        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
            qrHistory = [];
            saveToLocalStorage('qrHistory', qrHistory);
            renderHistory();
            showAlert('Đã xóa lịch sử!', 'success');
        }
    }
    
    // Clear QR display
    function clearQR() {
        document.getElementById('qr-code-display').innerHTML = '';
        document.getElementById('qr-display-container').style.display = 'none';
        currentQRCode = null;
        currentQRStyling = null;
        currentQRData = null;
    }
    
    // Switch QR type
    function switchQRType() {
        const type = document.querySelector('input[name="qr-type"]:checked').value;
        
        // Hide all input sections
        document.querySelectorAll('.input-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(`input-${type}`).style.display = 'block';
    }
    
    // Update size value display
    function updateSizeValue() {
        const size = document.getElementById('qr-size').value;
        document.getElementById('size-value').textContent = size;
    }
    
    // Reset customization
    function resetCustomization() {
        document.getElementById('qr-size').value = 256;
        document.getElementById('qr-color').value = '#000000';
        document.getElementById('qr-bgcolor').value = '#ffffff';
        document.getElementById('qr-error-level').value = 'M';
        if (document.getElementById('qr-pattern')) document.getElementById('qr-pattern').value = 'square';
        if (document.getElementById('qr-corner-square')) document.getElementById('qr-corner-square').value = 'square';
        if (document.getElementById('qr-corner-dot')) document.getElementById('qr-corner-dot').value = 'dot';
        document.getElementById('qr-logo').value = '';
        logoImage = null;
        logoDataUrl = null;
        updateSizeValue();
        
        if (currentQRCode) {
            generateQRCode();
        }
    }
    
    // Event listeners
    document.getElementById('generate-qr-btn').addEventListener('click', generateQRCode);
    document.getElementById('clear-qr-btn').addEventListener('click', clearQR);
    document.getElementById('download-png-btn').addEventListener('click', downloadPNG);
    document.getElementById('download-svg-btn').addEventListener('click', downloadSVG);
    document.getElementById('batch-generate-btn').addEventListener('click', batchGenerate);
    document.getElementById('download-all-btn').addEventListener('click', downloadAllBatch);
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    document.getElementById('reset-customization-btn').addEventListener('click', resetCustomization);
    
    // QR type change
    document.querySelectorAll('input[name="qr-type"]').forEach(radio => {
        radio.addEventListener('change', switchQRType);
    });
    
    // Size slider
    document.getElementById('qr-size').addEventListener('input', updateSizeValue);
    
    // Auto-generate on customization change
    ['qr-size', 'qr-color', 'qr-bgcolor', 'qr-error-level', 'qr-pattern', 'qr-corner-square', 'qr-corner-dot'].forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            if (currentQRCode) {
                generateQRCode();
            }
        });
    });
    
    // Color presets
    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('qr-color').value = this.dataset.fg;
            document.getElementById('qr-bgcolor').value = this.dataset.bg;
            if (currentQRCode) {
                generateQRCode();
            }
        });
    });
    
    // Logo upload
    document.getElementById('qr-logo').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // Resize logo to fixed maximum dimensions
                    const maxLogoSize = 200; // Fixed max size for logo
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    // Scale down if larger than max
                    if (width > maxLogoSize || height > maxLogoSize) {
                        const ratio = Math.min(maxLogoSize / width, maxLogoSize / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Create new image from resized canvas
                    const resizedImg = new Image();
                    resizedImg.onload = function() {
                        logoImage = resizedImg;
                        logoDataUrl = canvas.toDataURL('image/png');
                        if (currentQRCode) {
                            generateQRCode();
                        }
                    };
                    resizedImg.src = canvas.toDataURL('image/png');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            logoImage = null;
            logoDataUrl = null;
        }
    });
    
    // Enter key to generate
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.matches('input[type="text"], input[type="url"], input[type="email"], input[type="tel"]')) {
            generateQRCode();
        }
    });
});
