async function loadSettings() {
    const settings = await fetchSettings();
    document.getElementById('jira-base-url').value = settings.jira_base_url || '';
    document.getElementById('jira-email').value = settings.jira_email || '';
    document.getElementById('jira-project').value = settings.default_project_key || '';
    
    document.getElementById('llm-provider-toggle').checked = settings.llm_provider === 'ollama';
    toggleProviderView(settings.llm_provider);

    document.getElementById('history-count').value = settings.history_keep_count || 50;
    document.getElementById('auto-save').checked = settings.auto_save;
}

function toggleProviderView(provider) {
    if (provider === 'groq') {
        document.getElementById('groq-settings').classList.remove('hidden');
        document.getElementById('ollama-settings').classList.add('hidden');
    } else {
        document.getElementById('ollama-settings').classList.remove('hidden');
        document.getElementById('groq-settings').classList.add('hidden');
    }
}

async function handleSaveSettings() {
    const settings = {
        jira_base_url: document.getElementById('jira-base-url').value,
        jira_email: document.getElementById('jira-email').value,
        default_project_key: document.getElementById('jira-project').value,
        llm_provider: document.getElementById('llm-provider-toggle').checked ? 'ollama' : 'groq',
        history_keep_count: parseInt(document.getElementById('history-count').value),
        auto_save: document.getElementById('auto-save').checked
    };
    await saveSettings(settings);
    showToast('Settings saved successfully', 'success');
}
