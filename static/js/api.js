const API_BASE = '/api';

async function fetchSettings() {
    const res = await fetch(`${API_BASE}/settings/`);
    return await res.json();
}

async function saveSettings(settings) {
    const res = await fetch(`${API_BASE}/settings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    return await res.json();
}

async function testJiraConnection(baseUrl, email, token) {
    const res = await fetch(`${API_BASE}/jira/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, email: email, api_token: token })
    });
    return await res.json();
}

async function fetchJiraTicket(ticketId) {
    const res = await fetch(`${API_BASE}/jira/ticket/${ticketId}`);
    return await res.json();
}

async function fetchHistory(page = 1, limit = 10, search = '') {
    const url = new URL(`${window.location.origin}${API_BASE}/history/`);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);
    if (search) url.searchParams.append('search', search);
    
    const res = await fetch(url);
    return await res.json();
}

async function getHistoryById(id) {
    const res = await fetch(`${API_BASE}/history/${id}`);
    return await res.json();
}

async function deleteHistory(id) {
    await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
}
