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

async function loadHistory() {
    const grid = document.getElementById('history-grid');
    grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10"><i data-lucide="loader-2" class="h-8 w-8 animate-spin mx-auto mb-3 text-secondary"></i> Loading history...</div>`;
    lucide.createIcons({ root: grid });
    
    try {
        const res = await fetchHistory(1, 50);
        if (res.status === 'success') {
            const data = res.data || [];
            if (data.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">No history found. Generate a test plan first!</div>`;
                return;
            }
            
            grid.innerHTML = data.map(item => `
                <div onclick="viewHistoryItem(${item.id})" class="bg-glass backdrop-blur-md p-5 rounded-2xl border border-glassBorder shadow-lg group hover:border-secondary transition-all cursor-pointer">
                    <div class="flex justify-between items-start mb-3">
                        <span class="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-md font-medium font-mono">${item.jira_id}</span>
                        <span class="text-xs text-slate-500">${timeAgo(item.created_at)}</span>
                    </div>
                    <h3 class="font-medium text-slate-200 mb-4 line-clamp-2">${item.jira_summary || 'Generated Test Plan'}</h3>
                    <div class="flex justify-between items-center mt-auto border-t border-glassBorder pt-3">
                        <span class="text-xs text-slate-400 flex items-center gap-1"><i data-lucide="cpu" class="h-3 w-3"></i> ${item.llm_model}</span>
                        <button class="text-secondary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium flex items-center gap-1">
                            View <i data-lucide="arrow-right" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            lucide.createIcons({ root: grid });
        }
    } catch (e) {
        grid.innerHTML = `<div class="col-span-full text-center text-rose-400 py-10">Failed to load history</div>`;
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
});
