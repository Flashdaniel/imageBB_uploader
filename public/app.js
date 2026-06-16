document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const filePreviewList = document.getElementById('file-preview-list');
    const uploadBtn = document.getElementById('upload-btn');
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    const btnText = uploadBtn.querySelector('.btn-text');
    const spinner = uploadBtn.querySelector('.spinner');
    const toggleLinksOnly = document.getElementById('toggle-links-only');

    let selectedFiles = [];

    // Load saved API key if exists
    const savedKey = localStorage.getItem('imgbb_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Handle Links Only Toggle
    toggleLinksOnly.addEventListener('change', (e) => {
        if (e.target.checked) {
            resultsGrid.classList.add('links-only-mode');
        } else {
            resultsGrid.classList.remove('links-only-mode');
        }
    });

    // Drag and drop handlers
    // Prevent default drag behaviors on window to avoid accidental file opening
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, (e) => {
            e.preventDefault();
        }, false);
        
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset input to allow selecting the same file again
    });

    function handleFiles(files) {
        // Filter only images
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;
        selectedFiles = [...selectedFiles, ...imageFiles];
        renderFileList();
        updateUploadButton();
    }

    function renderFileList() {
        filePreviewList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const objectUrl = URL.createObjectURL(file);
            
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <div class="file-name" style="display: flex; align-items: center; gap: 12px;">
                    <img src="${objectUrl}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--glass-border);" alt="Preview">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${file.name}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${sizeMB} MB</span>
                    </div>
                </div>
                <button class="remove-btn" data-index="${index}">&times;</button>
            `;
            filePreviewList.appendChild(div);
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                selectedFiles.splice(idx, 1);
                renderFileList();
                updateUploadButton();
            });
        });
    }

    function updateUploadButton() {
        if (selectedFiles.length > 0 && apiKeyInput.value.trim() !== '') {
            uploadBtn.disabled = false;
        } else {
            uploadBtn.disabled = true;
        }
    }

    apiKeyInput.addEventListener('input', updateUploadButton);

    uploadBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey || selectedFiles.length === 0) return;

        // Save key for future
        localStorage.setItem('imgbb_api_key', apiKey);

        // Update UI
        setLoading(true);
        resultsSection.classList.remove('hidden');
        resultsGrid.innerHTML = ''; // Clear previous

        for (const file of selectedFiles) {
            await uploadFile(file, apiKey);
        }

        // Clean up
        selectedFiles = [];
        renderFileList();
        setLoading(false);
        updateUploadButton();
    });

    async function uploadFile(file, apiKey) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                renderResultCard(file.name, data.data.url, true);
            } else {
                renderResultCard(file.name, data.error?.message || 'Upload failed', false);
            }
        } catch (error) {
            renderResultCard(file.name, 'Network error or Invalid Key', false);
        }
    }

    function renderResultCard(fileName, info, isSuccess) {
        const div = document.createElement('div');
        div.className = 'result-card';
        
        let content = '';
        if (isSuccess) {
            content = `
                <img src="${info}" alt="${fileName}" class="result-image">
                <div class="result-info">
                    <span class="result-status status-success">✓ Uploaded Successfully</span>
                    <div class="copy-group">
                        <input type="text" value="${info}" readonly>
                        <button class="copy-btn" title="Copy URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="result-image" style="display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1);">
                    <svg width="32" height="32" stroke="var(--error)" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="result-info">
                    <span class="result-status status-error">✗ Failed</span>
                    <p style="font-size: 0.8rem; color: var(--text-muted)">${info}</p>
                </div>
            `;
        }
        
        div.innerHTML = content;
        resultsGrid.appendChild(div);

        if (isSuccess) {
            const copyBtn = div.querySelector('.copy-btn');
            const input = div.querySelector('input');
            copyBtn.addEventListener('click', () => {
                input.select();
                document.execCommand('copy');
                copyBtn.innerHTML = '✓';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                }, 2000);
            });
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnText.textContent = 'Uploading...';
            spinner.classList.remove('hidden');
            uploadBtn.disabled = true;
            fileInput.disabled = true;
        } else {
            btnText.textContent = 'Upload Images';
            spinner.classList.add('hidden');
            fileInput.disabled = false;
            // updateUploadButton will run later
        }
    }
});
