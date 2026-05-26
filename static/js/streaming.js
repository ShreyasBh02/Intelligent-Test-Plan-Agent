async function startGeneration(ticketId) {
    const outputDiv = document.getElementById('output-markdown');
    outputDiv.innerHTML = '';
    
    const exportBar = document.getElementById('export-bar');
    exportBar.classList.add('hidden'); // Use class instead of inline style
    
    const btn = document.getElementById('generate-btn');

    let markdownContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/llm/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticketId })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to start generation");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        
        let done = false;
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            
            if (value) {
                const chunkStr = decoder.decode(value, { stream: true });
                const events = chunkStr.split('\n\n');
                
                for (let evt of events) {
                    if (evt.startsWith('data: ')) {
                        const dataStr = evt.substring(6);
                        try {
                            const dataObj = JSON.parse(dataStr);
                            if (dataObj.type === 'chunk') {
                                markdownContent += dataObj.data;
                                outputDiv.innerHTML = marked.parse(markdownContent);
                            } else if (dataObj.type === 'done') {
                                done = true;
                                exportBar.classList.remove('hidden');
                                window.generatedMarkdown = markdownContent; 
                                saveToHistory(ticketId, markdownContent);
                            } else if (dataObj.type === 'error') {
                                showToast('Error: ' + dataObj.data, 'error');
                                done = true;
                            }
                        } catch (e) {
                            console.error("Error parsing SSE chunk", e);
                        }
                    }
                }
            }
        }
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        // Reset button state
        btn.classList.remove('generating');
        btn.querySelector('span').innerHTML = `<i data-lucide="sparkles" class="h-5 w-5"></i> Generate Plan`;
        lucide.createIcons({ root: btn });
    }
}

async function saveToHistory(ticketId, markdown) {
    const settings = await fetchSettings();
    if (settings.auto_save) {
        await fetch(`${API_BASE}/history/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jira_id: ticketId,
                jira_summary: "Generated Plan",
                llm_provider: settings.llm_provider,
                llm_model: settings.llm_provider === 'groq' ? settings.groq_model : settings.ollama_model,
                output_markdown: markdown
            })
        });
        showToast("Auto-saved to history", "success");
    }
}
