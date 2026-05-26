# Intelligent Test Plan Agent 🎯

Welcome to the **Intelligent Test Plan Agent**, a premium, automated QA assistant that dynamically generates comprehensive, enterprise-grade test plans based directly on your JIRA tickets and PDF templates.

Built with a lightning-fast FastAPI backend, an aesthetic Glassmorphism UI, and powerful Large Language Models (LLMs), this tool eliminates hours of manual QA documentation overhead.

<p align="center">
  <img src="assets/ui-screenshot.png" alt="Intelligent Test Plan Agent Dashboard UI" width="800">
  <br>
  <em>(Above: The aesthetic Glassmorphism dashboard)</em>
</p>

---

## 🌟 Key Features

*   **JIRA Integration**: Instantly pull JIRA issues (Epics, Stories, Bugs) via the Atlassian API.
*   **Template Parsing**: Reads corporate QA standards directly from a local `testplan.pdf` file to ensure the AI follows your exact organizational structure.
*   **AI-Powered Generation**: Leverages either ultra-fast **Groq Cloud (Llama 3)** or **Local Ollama** to write deep, analytical, and highly structured test cases, boundary tests, and edge case analyses.
*   **Real-time Streaming**: Watch your test plan generate live in the browser using Server-Sent Events (SSE).

<p align="center">
  <img src="assets/test-plan-screenshot.png" alt="Generated Test Plan Preview" width="800">
  <br>
  <em>(Above: Example of a generated test plan rendered with syntax highlighting)</em>
</p>
*   **Premium UI/UX**: A modern, responsive interface utilizing Tailwind CSS, Lucide Icons, frosted-glass aesthetics, and dynamic micro-animations.
*   **History Dashboard**: Automatically saves all generations to a local SQLite database, allowing you to instantly reload past test plans.
*   **Multi-format Export**: Export your generated test plans seamlessly to **PDF**, **DOCX**, or copy raw **Markdown** to your clipboard.

---

## 🏗️ Architecture

*   **Backend**: Python 3.11+, FastAPI, Uvicorn, aiosqlite, WeasyPrint, python-docx
*   **Frontend**: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS (via CDN), marked.js
*   **AI Engine**: Groq API (Cloud) / Ollama (Local)
*   **Database**: SQLite (`testplan_agent.sqlite`)

---

## 🚀 Getting Started

### Prerequisites
*   **Python 3.11+** installed on your system.
*   **JIRA Account**: You need your JIRA Base URL, account email, and an API Token.
*   *(Optional)* **Groq API Key**: For cloud generation.
*   *(Optional)* **Ollama**: If running models locally.

### 1. Installation

Clone the repository and set up a virtual environment:

```bash
git clone <your-repo-url>
cd intelligent-test-plan-agent

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the `.env.example` file to create your local `.env` file:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials. The JIRA details act as the default fallback for the UI settings:

```ini
GROQ_API_KEY=your_groq_api_key_here
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your_jira_api_token_here
```

### 3. Running the Application

Start the FastAPI server using Uvicorn:

```bash
python main.py
```

The server will start on `http://127.0.0.1:8000`.

---

## 📖 Usage Guide

### First-Time Setup
1.  Open `http://localhost:8000` in your browser.
2.  Navigate to the **Settings** tab.
3.  Ensure your JIRA configuration is correct (it will auto-fill from `.env`).
4.  Select your preferred **AI Engine** (Groq Cloud or Local Ollama).
5.  Click **Save Settings**.

### Generating a Test Plan
1.  Navigate to the **Dashboard** tab.
2.  Enter a JIRA Issue Key (e.g., `KAN-4` or `PROJ-123`) and click the search icon.
3.  Once the ticket details load, click the **Generate Plan** button.
4.  Watch the AI stream a comprehensive, professional test plan in real-time!

### Exporting and History
*   **Export:** Once generation is complete, use the toolbar in the top right to export to PDF, DOCX, or Markdown.
*   **History:** Navigate to the **History** tab to see a beautiful grid of all past generated plans. Click any card to instantly reload it into the Dashboard view.

---

## 🛠️ Troubleshooting

*   **HTTP 500 Error on JIRA Fetch**: Ensure your `JIRA_BASE_URL` in the `.env` file does NOT have a trailing slash and matches your exact Atlassian subdomain (e.g., `https://mycompany.atlassian.net`).
*   **PDF Export Fails**: WeasyPrint requires certain system-level dependencies. Ensure GTK3 is installed on Windows, or use `brew install weasyprint` on macOS.

---
*Built with ❤️ for Quality Assurance.*
