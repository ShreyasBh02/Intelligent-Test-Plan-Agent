function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Toast premium styling
    const baseClasses = "toast p-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border backdrop-blur-md";
    if (type === 'error') {
        toast.className = `${baseClasses} bg-rose-500/10 border-rose-500/30 text-rose-300`;
        toast.innerHTML = `<i data-lucide="alert-circle" class="h-5 w-5"></i> ${message}`;
    } else {
        toast.className = `${baseClasses} bg-emerald-500/10 border-emerald-500/30 text-emerald-300`;
        toast.innerHTML = `<i data-lucide="check-circle" class="h-5 w-5"></i> ${message}`;
    }
    
    toastContainer.appendChild(toast);
    lucide.createIcons({ root: toast }); // Initialize icon inside toast

    setTimeout(() => { 
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300); // Wait for fadeOut animation
    }, 4000);
}

function switchTab(tabId) {
    // Hide all views
    ['dashboard-view', 'settings-view', 'history-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
        document.getElementById('tab-btn-' + id)?.classList.remove('active', 'text-white', 'bg-white/10');
        document.getElementById('tab-btn-' + id)?.classList.add('text-gray-400');
    });
    
    // Show selected view
    document.getElementById(tabId).classList.remove('hidden');
    const activeBtn = document.getElementById('tab-btn-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-white', 'bg-white/10');
        activeBtn.classList.remove('text-gray-400');
    }
    
    if (tabId === 'settings-view') loadSettings();
    if (tabId === 'history-view') loadHistory();
}

function timeAgo(dateString) {
    const date = new Date(dateString + 'Z'); // SQLite assumes UTC
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function clearHistoryFilters() {
    const searchInput = document.getElementById('history-search-input');
    const filterProvider = document.getElementById('history-filter-provider');
    const filterDate = document.getElementById('history-filter-date');
    if (searchInput) searchInput.value = '';
    if (filterProvider) filterProvider.value = '';
    if (filterDate) filterDate.value = '';
    loadHistory();
}

function showLogsTip() {
    showToast("Check terminal output or logs/app.log file for error details", "info");
}

async function loadHistory() {
    const grid = document.getElementById('history-grid');
    const refreshBtn = document.getElementById('refresh-history-btn');
    
    // Animate Refresh Button
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.querySelector('span').innerText = 'Refreshing...';
        refreshBtn.querySelector('i')?.classList.add('animate-spin');
    }

    // Render skeleton loaders (3 pulse cards)
    grid.innerHTML = `
        <div class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            ${[1, 2, 3].map(() => `
                <div class="bg-glass backdrop-blur-md p-5 rounded-2xl border border-glassBorder/50 shadow-lg animate-pulse">
                    <div class="flex justify-between items-center mb-4">
                        <div class="h-5 bg-slate-700/50 rounded-md w-20"></div>
                        <div class="h-3 bg-slate-700/50 rounded-md w-16"></div>
                    </div>
                    <div class="space-y-2 mb-6">
                        <div class="h-4 bg-slate-700/50 rounded-md w-full"></div>
                        <div class="h-4 bg-slate-700/50 rounded-md w-5/6"></div>
                    </div>
                    <div class="flex justify-between items-center border-t border-glassBorder/30 pt-3">
                        <div class="h-3 bg-slate-700/50 rounded-md w-24"></div>
                        <div class="h-4 bg-slate-700/50 rounded-md w-10"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Read input search and filter values
    const searchVal = document.getElementById('history-search-input')?.value.trim() || '';
    const providerVal = document.getElementById('history-filter-provider')?.value || '';
    const dateVal = document.getElementById('history-filter-date')?.value || '';
    
    try {
        const res = await fetchHistory(1, 50, searchVal);
        
        if (res.status === 'success') {
            const rawData = res.data || [];
            
            // Client-side filtering for provider and date
            let filteredData = rawData;
            
            if (providerVal) {
                filteredData = filteredData.filter(item => 
                    item.llm_provider?.toLowerCase() === providerVal.toLowerCase()
                );
            }
            
            if (dateVal) {
                const now = new Date();
                filteredData = filteredData.filter(item => {
                    if (!item.created_at) return false;
                    const itemDate = new Date(item.created_at + 'Z');
                    const diffMs = now - itemDate;
                    const diffDays = diffMs / (1000 * 60 * 60 * 24);
                    
                    if (dateVal === 'today') return diffDays <= 1;
                    if (dateVal === 'week') return diffDays <= 7;
                    if (dateVal === 'month') return diffDays <= 30;
                    return true;
                });
            }
            
            // Dynamic Stats Update
            const totalPlansEl = document.getElementById('stats-total-plans');
            if (totalPlansEl) {
                totalPlansEl.innerText = rawData.length;
            }
            
            // Last Generated Plan
            const lastGeneratedEl = document.getElementById('stats-last-generated');
            if (lastGeneratedEl) {
                const mostRecent = rawData[0]; // SQLite order by created_at desc
                if (mostRecent) {
                    lastGeneratedEl.innerText = mostRecent.jira_id;
                    lastGeneratedEl.title = mostRecent.jira_summary || '';
                } else {
                    lastGeneratedEl.innerText = '-';
                }
            }
            
            // Database Status Badge
            const dbStatusEl = document.getElementById('stats-db-status');
            if (dbStatusEl) {
                dbStatusEl.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Connected`;
                dbStatusEl.className = 'text-sm font-semibold text-emerald-400 flex items-center gap-1.5';
            }
            
            // Render Cards or Empty States
            if (filteredData.length === 0) {
                if (searchVal || providerVal || dateVal) {
                    // Search/Filter Empty State
                    grid.innerHTML = `
                        <div class="col-span-full flex flex-col items-center justify-center py-12 px-4">
                            <div class="bg-glass border border-glassBorder rounded-2xl p-8 max-w-md w-full text-center shadow-lg backdrop-blur-md">
                                <div class="inline-flex p-3 rounded-full bg-slate-500/10 text-slate-400 mb-4">
                                    <i data-lucide="search-code" class="h-8 w-8"></i>
                                </div>
                                <h3 class="font-display text-lg font-bold text-white mb-2">No Matching Results</h3>
                                <p class="text-sm text-slate-400 mb-6 leading-relaxed">
                                    We couldn't find any test plans matching your search query or selected filters.
                                </p>
                                <button onclick="clearHistoryFilters()" class="bg-glass hover:bg-white/10 text-slate-200 border border-glassBorder px-5 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 mx-auto">
                                    <i data-lucide="x" class="h-4 w-4"></i> Clear Filters
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    // General Empty State
                    grid.innerHTML = `
                        <div class="col-span-full flex flex-col items-center justify-center py-16 px-4">
                            <div class="bg-glass border border-glassBorder rounded-2xl p-10 max-w-md w-full text-center shadow-xl backdrop-blur-md relative overflow-hidden">
                                <div class="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>
                                <div class="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-5">
                                    <i data-lucide="clock" class="h-10 w-10"></i>
                                </div>
                                <h3 class="font-display text-xl font-bold text-white mb-2">No History Yet</h3>
                                <p class="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
                                    Your generated test plans will appear here after your first generation.
                                </p>
                                <button onclick="switchTab('dashboard-view')" class="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary/25 mx-auto">
                                    <i data-lucide="plus" class="h-5 w-5"></i> Generate First Plan
                                </button>
                            </div>
                        </div>
                    `;
                }
                lucide.createIcons({ root: grid });
                return;
            }
            
            // Render beautiful cards
            grid.innerHTML = filteredData.map(item => `
                <div onclick="viewHistoryItem(${item.id})" class="bg-glass backdrop-blur-md p-5 rounded-2xl border border-glassBorder shadow-lg group hover:border-secondary transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                    <div class="absolute -top-12 -right-12 w-24 h-24 bg-secondary/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-secondary/15"></div>
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-md font-medium font-mono">${item.jira_id}</span>
                            <span class="text-xs text-slate-500 flex items-center gap-1"><i data-lucide="clock" class="h-3 w-3"></i> ${timeAgo(item.created_at)}</span>
                        </div>
                        <h3 class="font-medium text-slate-200 mb-4 line-clamp-2 group-hover:text-white transition-colors leading-snug">${item.jira_summary || 'Generated Test Plan'}</h3>
                    </div>
                    <div class="flex justify-between items-center mt-auto border-t border-glassBorder/30 pt-3">
                        <span class="text-xs text-slate-400 flex items-center gap-1.5"><i data-lucide="cpu" class="h-3.5 w-3.5 text-indigo-400"></i> ${item.llm_model}</span>
                        <button class="text-secondary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-sm font-semibold flex items-center gap-1">
                            View <i data-lucide="arrow-right" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            lucide.createIcons({ root: grid });
        }
    } catch (e) {
        console.error("History fetch error:", e);
        
        // Dynamic Stats Error state
        const dbStatusEl = document.getElementById('stats-db-status');
        if (dbStatusEl) {
            dbStatusEl.innerHTML = `<span class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span> Disconnected`;
            dbStatusEl.className = 'text-sm font-semibold text-rose-400 flex items-center gap-1.5';
        }
        
        // Render Premium Error Card
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 px-4">
                <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-xl backdrop-blur-md relative overflow-hidden">
                    <div class="absolute -top-10 -left-10 w-24 h-24 bg-rose-500/25 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div class="inline-flex p-3 rounded-full bg-rose-500/20 text-rose-400 mb-4 animate-bounce">
                        <i data-lucide="alert-triangle" class="h-8 w-8"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white mb-2">Failed to Load History</h3>
                    <p class="text-sm text-rose-200/70 mb-6 leading-relaxed">
                        Could not connect to the database. Check that the app has write permissions to the project folder.
                    </p>
                    <div class="flex justify-center gap-3">
                        <button onclick="loadHistory()" class="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 mx-auto">
                            <i data-lucide="refresh-cw" class="h-4 w-4"></i> Retry
                        </button>
                        <button onclick="showLogsTip()" class="bg-glass hover:bg-white/10 text-slate-300 border border-glassBorder px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 mx-auto">
                            <i data-lucide="file-text" class="h-4 w-4"></i> View Logs
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons({ root: grid });
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.querySelector('span').innerText = 'Refresh';
            refreshBtn.querySelector('i')?.classList.remove('animate-spin');
        }
    }
}

async function viewHistoryItem(id) {
    try {
        const res = await getHistoryById(id);
        if (res.status === 'success') {
            const item = res.data;
            window.generatedMarkdown = item.output_markdown;
            
            const outputDiv = document.getElementById('output-markdown');
            outputDiv.innerHTML = marked.parse(item.output_markdown);
            document.getElementById('export-bar').classList.remove('hidden');
            
            // Switch back to dashboard to view it
            switchTab('dashboard-view');
            showToast(`Loaded ${item.jira_id} from history`, "success");
        }
    } catch (e) {
        showToast("Failed to load history item", "error");
    }
}

async function handleFetchTicket() {
    let ticketId = document.getElementById('jira-id-input').value.trim();
    if (ticketId.includes('browse/')) ticketId = ticketId.split('browse/').pop().split('?')[0];
    
    if (!ticketId) {
        showToast("Please enter a JIRA ID", "error");
        return;
    }
    
    const fetchBtn = document.getElementById('fetch-ticket-btn');
    const originalHtml = fetchBtn.innerHTML;
    fetchBtn.innerHTML = `<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>`;
    fetchBtn.disabled = true;
    lucide.createIcons({ root: fetchBtn });
    
    try {
        const res = await fetchJiraTicket(ticketId);
        if (res.status === 'success') {
            const t = res.data;
            document.getElementById('ticket-preview').classList.remove('hidden');
            document.getElementById('tp-id-summary').innerText = `${t.key}: ${t.summary}`;
            document.getElementById('tp-status').innerHTML = `<i data-lucide="activity" class="h-3 w-3"></i> ${t.status}`;
            document.getElementById('tp-priority').innerHTML = `<i data-lucide="alert-triangle" class="h-3 w-3"></i> ${t.priority}`;
            document.getElementById('generate-btn').disabled = false;
            
            // Re-init icons for the new elements
            lucide.createIcons({ root: document.getElementById('ticket-preview') });
            showToast("Ticket fetched successfully", "success");
        } else {
            showToast(res.detail, "error");
        }
    } catch (e) {
        showToast("Failed to fetch ticket", "error");
    } finally {
        fetchBtn.innerHTML = originalHtml;
        fetchBtn.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fetch-ticket-btn').addEventListener('click', handleFetchTicket);
    
    document.getElementById('generate-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        btn.classList.add('generating');
        btn.querySelector('span').innerHTML = `<i data-lucide="loader-2" class="h-5 w-5 animate-spin"></i> Generating...`;
        lucide.createIcons({ root: btn });
        
        let ticketId = document.getElementById('jira-id-input').value.trim();
        if (ticketId.includes('browse/')) ticketId = ticketId.split('browse/').pop().split('?')[0];
        
        // Disable toolbar during generation
        document.getElementById('export-bar').classList.add('hidden');
        
        startGeneration(ticketId);
    });
    
    document.getElementById('export-pdf-btn').addEventListener('click', () => exportDocument('pdf'));
    document.getElementById('export-docx-btn').addEventListener('click', () => exportDocument('docx'));
    document.getElementById('copy-md-btn').addEventListener('click', copyMarkdown);
    
    document.getElementById('save-settings-btn').addEventListener('click', handleSaveSettings);
    
    document.getElementById('llm-provider-toggle').addEventListener('change', (e) => {
        toggleProviderView(e.target.checked ? 'ollama' : 'groq');
    });

    // Wire up History tab live search and client filters
    const searchInput = document.getElementById('history-search-input');
    const filterProvider = document.getElementById('history-filter-provider');
    const filterDate = document.getElementById('history-filter-date');
    
    if (searchInput) {
        let searchDebounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => {
                loadHistory();
            }, 300);
        });
    }
    
    filterProvider?.addEventListener('change', () => loadHistory());
    filterDate?.addEventListener('change', () => loadHistory());
});
