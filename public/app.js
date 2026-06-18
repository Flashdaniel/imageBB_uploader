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
    const copyAllBtn = document.getElementById('copy-all-btn');
    const copyAllText = copyAllBtn.querySelector('.copy-all-text');
    const clearAllBtn = document.getElementById('clear-all-btn');

    const authOverlay = document.getElementById('auth-overlay');
    const mainApp = document.getElementById('main-app');
    const logoutBtn = document.getElementById('logout-btn');
    const authTitle = document.getElementById('auth-title');
    const authUsername = document.getElementById('auth-username');
    const authPassword = document.getElementById('auth-password');
    const authActionBtn = document.getElementById('auth-action-btn');
    const authBtnText = authActionBtn.querySelector('.btn-text');
    const authSpinner = authActionBtn.querySelector('.spinner');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authToggleText = document.getElementById('auth-toggle-text');
    const authAlert = document.getElementById('auth-alert');

    const navDashboard = document.getElementById('nav-dashboard');
    const navSync = document.getElementById('nav-sync');
    const syncView = document.getElementById('sync-view');
    const topRow = document.querySelector('.top-row');
    const syncUsername = document.getElementById('sync-username');
    const syncPassword = document.getElementById('sync-password');
    const syncActionBtn = document.getElementById('sync-action-btn');
    const syncAlert = document.getElementById('sync-alert');
    const syncSpinner = syncActionBtn.querySelector('.spinner');
    const syncBtnText = syncActionBtn.querySelector('.btn-text');

    function showAlert(element, type, message) {
        element.className = `alert alert-${type}`;
        
        let icon = '';
        if (type === 'error') {
            icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        } else if (type === 'success') {
            icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'info') {
            icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        element.innerHTML = `${icon} <span>${message}</span>`;
        element.classList.remove('hidden');
    }

    function clearAlert(element) {
        element.className = 'alert hidden';
        element.innerHTML = '';
    }

    function clearInputErrors(inputs) {
        inputs.forEach(input => input.classList.remove('input-error'));
    }

    let isLoginMode = true;
    let authToken = localStorage.getItem('imgbb_auth_token');

    let selectedFiles = [];
    let savedUploads = [];

    let currentPage = 1;
    const itemsPerPage = 12;
    const paginationControls = document.getElementById('pagination-controls');
    const pagePrev = document.getElementById('page-prev');
    const pageNext = document.getElementById('page-next');
    const pageInfo = document.getElementById('page-info');

    const modalOverlay = document.getElementById('global-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    let modalCancel = document.getElementById('modal-btn-cancel');
    let modalConfirm = document.getElementById('modal-btn-confirm');

    function showConfirmModal(title, message, confirmText, confirmClass, onConfirm) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirm.textContent = confirmText;
        modalConfirm.className = confirmClass;
        
        modalOverlay.classList.remove('hidden');

        // Remove old listeners by replacing nodes
        const newCancel = modalCancel.cloneNode(true);
        const newConfirm = modalConfirm.cloneNode(true);
        modalCancel.parentNode.replaceChild(newCancel, modalCancel);
        modalConfirm.parentNode.replaceChild(newConfirm, modalConfirm);
        modalCancel = newCancel;
        modalConfirm = newConfirm;

        modalCancel.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        modalConfirm.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
            onConfirm();
        });
    }

    function renderPage(page) {
        if (!savedUploads || savedUploads.length === 0) {
            resultsGrid.innerHTML = '';
            if (paginationControls) paginationControls.classList.add('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');
        resultsGrid.innerHTML = '';

        const totalPages = Math.ceil(savedUploads.length / itemsPerPage);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        sessionStorage.setItem('imgbb_current_page', currentPage);

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = savedUploads.slice(startIndex, endIndex);

        pageItems.forEach(upload => {
            const name = upload.name || upload.fileName || upload.file;
            const url = upload.url || upload.info;
            renderResultCard(upload.id || Date.now() + Math.random().toString(), name, url, upload.isSuccess !== false, false, upload.source || 'upload');
        });

        if (paginationControls) {
            if (totalPages > 1) {
                paginationControls.classList.remove('hidden');
                pageInfo.textContent = `Page ${page} of ${totalPages}`;
                pagePrev.disabled = page === 1;
                pageNext.disabled = page === totalPages;
            } else {
                paginationControls.classList.add('hidden');
            }
        }
    }

    if (pagePrev) pagePrev.addEventListener('click', () => renderPage(currentPage - 1));
    if (pageNext) pageNext.addEventListener('click', () => renderPage(currentPage + 1));


    async function apiFetch(url, options = {}) {
        if (!options.headers) options.headers = {};
        if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
        
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 403) {
            handleLogout();
            throw new Error('Unauthorized');
        }
        return res;
    }

    function checkAuth() {
        if (authToken) {
            authOverlay.classList.add('hidden');
            mainApp.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            loadUploads();
        } else {
            authOverlay.classList.remove('hidden');
            mainApp.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    function handleLogout() {
        authToken = null;
        localStorage.removeItem('imgbb_auth_token');
        savedUploads = [];
        resultsGrid.innerHTML = '';
        resultsSection.classList.add('hidden');
        checkAuth();
    }

    logoutBtn.addEventListener('click', handleLogout);

    authToggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? 'Login' : 'Register';
        authBtnText.textContent = isLoginMode ? 'Sign In' : 'Register';
        authToggleText.textContent = isLoginMode ? "Don't have an account? " : "Already have an account? ";
        authToggleLink.textContent = isLoginMode ? "Register" : "Login";
        clearAlert(authAlert);
        clearInputErrors([authUsername, authPassword]);
    });

    authActionBtn.addEventListener('click', async () => {
        const username = authUsername.value.trim();
        const password = authPassword.value.trim();
        
        clearAlert(authAlert);
        clearInputErrors([authUsername, authPassword]);

        if (!username || !password) {
            if (!username) authUsername.classList.add('input-error');
            if (!password) authPassword.classList.add('input-error');
            showAlert(authAlert, 'error', 'Please enter both username and password.');
            return;
        }

        authActionBtn.disabled = true;
        authBtnText.textContent = isLoginMode ? 'Signing In...' : 'Registering...';
        authSpinner.classList.remove('hidden');

        try {
            const endpoint = isLoginMode ? '/api/login' : '/api/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (data.success) {
                authToken = data.token;
                localStorage.setItem('imgbb_auth_token', authToken);
                clearAlert(authAlert);
                authUsername.value = '';
                authPassword.value = '';
                checkAuth();
            } else {
                showAlert(authAlert, 'error', data.error || 'Authentication failed');
            }
        } catch (err) {
            showAlert(authAlert, 'error', 'Server error. Please try again.');
        } finally {
            authActionBtn.disabled = false;
            authBtnText.textContent = isLoginMode ? 'Sign In' : 'Register';
            authSpinner.classList.add('hidden');
        }
    });

    async function loadUploads() {
        try {
            const res = await apiFetch('/api/metadata');
            const data = await res.json();
            savedUploads = data || [];
            
            if (savedUploads.length > 0) {
                const savedPage = parseInt(sessionStorage.getItem('imgbb_current_page'), 10) || 1;
                renderPage(savedPage);
                
                const scrollPos = sessionStorage.getItem('imgbb_scroll_pos');
                if (scrollPos) {
                    setTimeout(() => window.scrollTo(0, parseInt(scrollPos, 10)), 0);
                }
            }
        } catch (e) {
            console.error('Failed to load metadata', e);
        }
    }

    // Navigation logic
    if (navDashboard && navSync) {
        navDashboard.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            navDashboard.classList.add('active');
            navSync.classList.remove('active');
            topRow.classList.remove('hidden');
            syncView.classList.add('hidden');
            sessionStorage.setItem('imgbb_current_tab', 'dashboard');
        });

        navSync.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            navSync.classList.add('active');
            navDashboard.classList.remove('active');
            topRow.classList.add('hidden');
            syncView.classList.remove('hidden');
            sessionStorage.setItem('imgbb_current_tab', 'sync');
        });
        
        // Restore active tab
        const currentTab = sessionStorage.getItem('imgbb_current_tab');
        if (currentTab === 'sync') {
            navSync.click();
        }
    }
    
    // Save scroll position on refresh
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('imgbb_scroll_pos', window.scrollY);
    });

    // Sync action logic
    if (syncActionBtn) {
        syncActionBtn.addEventListener('click', async () => {
            const username = syncUsername.value.trim();
            const password = syncPassword.value;
            
            clearAlert(syncAlert);
            clearInputErrors([syncUsername, syncPassword]);

            if (!username || !password) {
                if (!username) syncUsername.classList.add('input-error');
                if (!password) syncPassword.classList.add('input-error');
                showAlert(syncAlert, 'error', 'Please provide both username and password.');
                return;
            }

            syncActionBtn.disabled = true;
            syncBtnText.textContent = 'Syncing...';
            syncSpinner.classList.remove('hidden');
            showAlert(syncAlert, 'info', 'Spinning up Puppeteer and syncing... this may take a few seconds.');

            try {
                const res = await apiFetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imgbbUsername: username, imgbbPassword: password })
                });
                const data = await res.json();
                
                if (data.success) {
                    showAlert(syncAlert, 'success', `Sync complete! Found ${data.totalFound} images, added ${data.added} new images.`);
                    syncUsername.value = '';
                    syncPassword.value = '';
                    
                    // Reload the grid
                    resultsGrid.innerHTML = '';
                    loadUploads();
                } else {
                    showAlert(syncAlert, 'error', data.error || 'Sync failed.');
                }
            } catch (err) {
                showAlert(syncAlert, 'error', 'Server error during sync. Check your credentials.');
            } finally {
                syncActionBtn.disabled = false;
                syncBtnText.textContent = 'Start Sync';
                syncSpinner.classList.add('hidden');
            }
        });
    }

    async function saveUploadData(data) {
        try {
            await apiFetch('/api/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error('Failed to save metadata', e);
        }
    }

    async function deleteUploadData(id) {
        try {
            await apiFetch(`/api/metadata/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Failed to delete metadata', e);
        }
    }

    async function clearUploads() {
        try {
            await apiFetch('/api/metadata', { method: 'DELETE' });
        } catch (e) {
            console.error('Failed to clear metadata', e);
        }
    }

    checkAuth();

    // Load saved API key if exists
    const savedKey = localStorage.getItem('imgbb_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Handle Clear All
    clearAllBtn.addEventListener('click', () => {
        showConfirmModal(
            'Clear History',
            'Are you sure you want to clear all history? This cannot be undone.',
            'Clear All',
            'btn-danger',
            () => {
                savedUploads = [];
                clearUploads();
                renderPage(1);
            }
        );
    });

    // Handle Links Only Toggle
    const savedLinksOnly = localStorage.getItem('imgbb_links_only_mode') === 'true';
    if (savedLinksOnly) {
        toggleLinksOnly.checked = true;
        resultsGrid.classList.add('links-only-mode');
    }

    toggleLinksOnly.addEventListener('change', (e) => {
        if (e.target.checked) {
            resultsGrid.classList.add('links-only-mode');
            localStorage.setItem('imgbb_links_only_mode', 'true');
        } else {
            resultsGrid.classList.remove('links-only-mode');
            localStorage.setItem('imgbb_links_only_mode', 'false');
        }
    });

    // Handle Copy All
    copyAllBtn.addEventListener('click', () => {
        const inputs = resultsGrid.querySelectorAll('.copy-group input');
        if (inputs.length === 0) return;
        
        const urls = Array.from(inputs).map(input => input.value).join('\n');
        
        const finishCopy = () => {
            const originalText = copyAllText.textContent;
            copyAllText.textContent = 'Copied!';
            copyAllBtn.style.color = 'var(--success)';
            copyAllBtn.style.borderColor = 'var(--success)';
            setTimeout(() => {
                copyAllText.textContent = originalText;
                copyAllBtn.style.color = 'var(--text-main)';
                copyAllBtn.style.borderColor = 'var(--border-color)';
            }, 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(urls).then(finishCopy);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = urls;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            finishCopy();
        }
    });

    // Drag and drop handlers
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
        e.target.value = '';
    });

    function handleFiles(files) {
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

        localStorage.setItem('imgbb_api_key', apiKey);

        setLoading(true);
        resultsSection.classList.remove('hidden');

        await Promise.all(selectedFiles.map(file => uploadFile(file, apiKey)));

        selectedFiles = [];
        renderFileList();
        setLoading(false);
        updateUploadButton();
        renderPage(1);
    });

    async function uploadFile(file, apiKey) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errMsg = `HTTP Error ${response.status}`;
                try {
                    const errData = await response.json();
                    errMsg = errData.error?.message || errMsg;
                } catch(e) {}
                throw new Error(errMsg);
            }

            const data = await response.json();
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);

            if (data.success) {
                const uploadData = { 
                    id, 
                    name: file.name, 
                    date: new Date().toISOString(),
                    url: data.data.url, 
                    display_url: data.data.display_url,
                    delete_url: data.data.delete_url,
                    isSuccess: true 
                };
                savedUploads.unshift(uploadData);
                saveUploadData(uploadData);
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            const uploadData = { 
                id, 
                name: file.name, 
                date: new Date().toISOString(),
                url: error.message || 'Network error or Invalid Key', 
                isSuccess: false 
            };
            savedUploads.unshift(uploadData);
            saveUploadData(uploadData);
            renderPage(1);
        }
    }

    function renderResultCard(id, fileName, info, isSuccess, prepend = false, source = 'upload') {
        const div = document.createElement('div');
        div.className = 'result-card';
        div.dataset.id = id;
        
        const badgeClass = source === 'sync' ? 'badge-sync' : 'badge-upload';
        const badgeText = source === 'sync' ? 'Synced' : 'Uploaded';
        
        let content = `<button class="card-delete-btn" title="Delete record">×</button>`;
        if (isSuccess) {
            content += `
                <img src="${info}" alt="${fileName}" class="result-image">
                <div class="result-info">
                    <span class="result-status status-success">
                        <span class="result-status-text">✓ Success</span>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </span>
                    <div class="copy-group">
                        <input type="text" value="${info}" readonly>
                        <button class="copy-btn" title="Copy URL">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="download-btn" title="Download Image">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            content += `
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
        if (prepend) {
            if (resultsGrid.firstChild) {
                resultsGrid.insertBefore(div, resultsGrid.firstChild);
            } else {
                resultsGrid.appendChild(div);
            }
        } else {
            resultsGrid.appendChild(div);
        }

        // Handle delete
        const deleteBtn = div.querySelector('.card-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                showConfirmModal(
                    'Delete Image',
                    'Are you sure you want to remove this image from your dashboard?',
                    'Delete',
                    'btn-danger',
                    () => {
                        savedUploads = savedUploads.filter(u => u.id !== id);
                        deleteUploadData(id);
                        renderPage(currentPage);
                    }
                );
            });
        }

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

            const downloadBtn = div.querySelector('.download-btn');
            downloadBtn.addEventListener('click', async () => {
                const originalContent = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<div class="spinner" style="width:14px; height:14px;"></div>';
                try {
                    const response = await fetch(info);
                    if (!response.ok) throw new Error('Fetch failed');
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = fileName || 'image.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
                } catch (err) {
                    console.error('Fetch download failed, falling back to window.open', err);
                    const a = document.createElement('a');
                    a.href = info;
                    a.download = fileName || 'image.png';
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } finally {
                    downloadBtn.innerHTML = originalContent;
                }
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
