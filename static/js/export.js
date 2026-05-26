async function exportDocument(type) {
    if (!window.generatedMarkdown) {
        showToast("No generated plan to export", "error");
        return;
    }
    
    const ticketId = document.getElementById('jira-id-input').value || "Unknown";
    
    try {
        const response = await fetch(`${API_BASE}/export/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                markdown_content: window.generatedMarkdown,
                jira_id: ticketId
            })
        });
        
        if (!response.ok) throw new Error("Export failed");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TestPlan_${ticketId}.${type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast(`${type.toUpperCase()} exported successfully!`, "success");
    } catch (e) {
        showToast(e.message, "error");
    }
}

async function copyMarkdown() {
    if (window.generatedMarkdown) {
        await navigator.clipboard.writeText(window.generatedMarkdown);
        showToast("Markdown copied to clipboard", "success");
    }
}
