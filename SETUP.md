# AI-Powered Codebase Intelligence Platform - Setup Guide

This guide covers setting up the LLMs, Vector Database, and outlines the JSON Payload Schema required for the Next.js and Spline integration.

## 1. LLM Setup (Hybrid Approach)

We use a hybrid LLM strategy to balance blazing speed with deep reasoning.

### Environment Variables
You will need to add the following to your `server/.env` file:

```env
GROQ_API_KEY="your_groq_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### LLM Assignments
- **Groq (Llama 3)**: Used exclusively for Map-Reduce file summarization. Its extreme inference speed handles the parallel processing of hundreds of file ASTs.
- **Gemini Pro**: Used for the Impact Analysis Engine and Context-Aware Chatbot. Gemini's large context window handles the complex graph traversal results and blast radius reasoning.

## 2. Vector Database (ChromaDB)

We are using ChromaDB in-memory/local mode for zero latency. No cloud provisioning is required. 
The database will be created directly in a local directory `.chroma_db` inside the `server` folder during ingestion.

## 3. JSON Payload Schema (Backend -> Frontend)

This is the exact JSON structure the FastAPI backend will construct and stream to the Next.js frontend. Use these exact keys when binding variables in your **Spline** 3D templates.

```json
{
  "repositoryName": "repo-name",
  "totalFilesAnalyzed": 142,
  "nodes": [
    {
      "id": "src/auth/AuthService.ts",
      "path": "src/auth/AuthService.ts",
      "name": "AuthService.ts",
      "type": "file", 
      "language": "typescript",
      "summary": "Handles JWT authentication and user session validation.",
      "cyclomatic_complexity": 14,
      "centrality_score": 0.89, 
      "is_core_node": true, 
      "coordinates": {
        "x": 120.5,
        "y": 45.0,
        "z": -15.2
      }
    }
  ],
  "edges": [
    {
      "source": "src/auth/AuthService.ts",
      "target": "src/db/DatabaseConfig.ts",
      "weight": 1.0
    }
  ]
}
```

### Variable Binding in Spline
- `x`, `y`, `z` will directly map to the position of the 3D objects.
- `is_core_node` can be used to toggle the emission/glow material (Focus Mode).
- `centrality_score` can scale the size (scale.x, scale.y, scale.z) of the 3D buildings.
