# CodeGraph Intelligence Platform 🚀

**CodeGraph Intelligence Platform** is a powerful 2D/3D codebase visualization and analysis tool designed to help developers and non-technical stakeholders instantly understand complex software architectures. Upload any GitHub repository, and CodeGraph will map out the dependencies, explain what each file does in plain English using AI, and allow you to simulate code changes to see their architectural "Blast Radius."

![CodeGraph Preview](https://via.placeholder.com/1000x500.png?text=CodeGraph+Intelligence+Platform)

## ✨ Key Features

- **🌐 Automated GitHub Ingestion:** Paste any public GitHub repository URL (.zip format supported). The backend instantly parses the AST (Abstract Syntax Tree) to map out dependencies.
- **🗺️ Interactive Architecture Graph:** Visually navigate the entire codebase in a clean React Flow UI. See how modules connect, identify core foundational files (via NetworkX Centrality), and spot complex files (Cyclomatic Complexity).
- **🧠 AI-Powered Narratives:** Every node in the graph comes with an AI-generated summary explaining the file's purpose and usage in simple, non-technical language (Powered by Google Gemini 2.5 Flash).
- **💬 Interactive File Chatbot:** Ask the AI questions like "What does this file do?" or "How does this connect to the database?" and get instant answers based on the file's raw source code.
- **💥 Live "Blast Radius" Simulation:** A built-in code editor lets you simulate code changes (e.g., deleting an import or updating a function). The AI will instantly analyze your code diff and the graph traversal to warn you if your change creates a **High Risk** impact or is **Safe** to deploy.

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Visualization:** React Flow & Framer Motion
- **Icons:** Lucide React
- **Language:** TypeScript

### Backend (Server)
- **Framework:** FastAPI (Python)
- **Graph Processing:** NetworkX (Directed Acyclic Graphs, PageRank Centrality)
- **Code Parsing:** Tree-Sitter & PyParsing (AST Extraction)
- **AI Integration:** LangChain & Google Generative AI (`gemini-2.5-flash`)

## 🚀 Getting Started

Follow these instructions to run the platform locally on your machine.

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A **Google Gemini API Key** (Free Tier works perfectly)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd codegraph-intelligence
```

### 2. Backend Setup (FastAPI & AI)
Open a terminal and navigate to the `server` directory:
```bash
cd server
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Set your API Key
# Create a .env file and add:
# GOOGLE_API_KEY="your_google_gemini_api_key"

# Start the Backend Server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup (Next.js)
Open a second terminal and navigate to the `client` directory:
```bash
cd client
npm install

# Start the Development Server
npm run dev
```

### 4. Run the Application
Open your browser and navigate to `http://localhost:3000`. 
Click **Upload Repo**, paste a GitHub URL (e.g., `https://github.com/OCA/crm`), and watch your codebase come to life!

## 🏗️ Architecture Workflow

Here is how the data flows from a GitHub URL to the visual UI:

```mermaid
flowchart TD
    %% Define Styles
    classDef user fill:#0d9488,stroke:#0f766e,stroke-width:2px,color:#fff
    classDef frontend fill:#115e59,stroke:#0f766e,stroke-width:2px,color:#fff
    classDef backend fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff
    classDef database fill:#0f172a,stroke:#334155,stroke-width:2px,color:#fff
    classDef ai fill:#db2777,stroke:#be185d,stroke-width:2px,color:#fff

    U[Non-Tech User]:::user --> |Uploads GitHub Repo| F[Next.js Dashboard]:::frontend
    F --> |Sends Request| B1[FastAPI Parser]:::backend
    B1 --> |Extracts AST| B2[AST Analyzer]:::backend
    B2 --> |Parses Imports| B3[NetworkX Graph Engine]:::backend
    B3 --> |Calculates Centrality| DB[(In-Memory DAG Cache)]:::database
    B3 --> |Extracts Code snippets| AI1[Google Gemini AI]:::ai
    AI1 --> |Returns '1 Sentence Narrative'| DB
    DB --> |Returns JSON Payload| F
    F --> |Renders Nodes/Edges| F1[React Flow UI]:::frontend
    U --> |Edits Code & Clicks 'Simulate'| F2[NodeOverlay UI]:::frontend
    F2 --> |Submits 'new_code' Diff| B4[Blast Radius Engine]:::backend
    B4 --> |Sends Code Diff + Dependents| AI2[Google Gemini AI]:::ai
    AI2 --> |Returns 'High Risk' or 'Low Risk'| B4
    B4 --> |Color Codes Graph (Red vs Yellow)| F1
```

## ⚠️ Notes on API Limits
The application is configured to intelligently handle Google's Free Tier API Quota Limits. 
- During ingestion, file summarization is batched into a single large payload to prevent `429 Too Many Requests` errors. 
- If you hit rate limits while using the Chatbot or Simulation features, the UI will gracefully inform you to wait 60 seconds.


