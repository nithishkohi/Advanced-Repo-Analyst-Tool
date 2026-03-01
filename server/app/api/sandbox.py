from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

# Assuming the NetworkX Graph from the latest ingestion is stored in memory.
# In a real app with concurrent users, this would be tied to a session ID.
# For the hackathon, we use a global store populated by ingestor.py
from app.engine.parser.ingestor import LAST_GRAPH 
from app.engine.ai.vector_db import vector_db
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import networkx as nx
import os

router = APIRouter(tags=["Sandbox"])

class SimulateRequest(BaseModel):
    file_id: str
    action: str = "delete" # 'delete' or 'refactor'

class SearchRequest(BaseModel):
    query: str

@router.post("/simulate-impact")
async def simulate_impact(req: SimulateRequest):
    if LAST_GRAPH is None or req.file_id not in LAST_GRAPH.nodes:
        raise HTTPException(status_code=404, detail="Graph not loaded or file not found.")

    graph: nx.DiGraph = LAST_GRAPH
    
    # 1. Graph Traversal: Find Blast Radius (Nodes that depend on the target)
    try:
        # For a DiGraph representing dependencies (A relies on B: A -> B),
        # ancestors are the files that depend ON req.file_id.
        blast_radius_set = nx.ancestors(graph, req.file_id) 
        blast_radius = list(blast_radius_set)
    except Exception as e:
        blast_radius = []
        
    # 2. Extract context for Gemini Reasoning
    affected_context = ""
    for node in blast_radius:
        # retrieve summary if possible
        data = graph.nodes[node]
        affected_context += f"- {node}: {data.get('summary', 'Unknown function')}\n"

    # 3. Ask Gemini to Reason over the Blast Radius
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and len(blast_radius) > 0:
        llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=api_key, temperature=0.2)
        prompt = PromptTemplate.from_template(
            "You are an Elite AI Architect analyzing a codebase.\n"
            "Action: The user wants to {action} the file '{file_id}'.\n"
            "The following files depend on it (Blast Radius):\n{context}\n\n"
            "Respond strictly in JSON format with no markdown wrappers:\n"
            '{{"risk_level": "High|Medium|Low", "broken_features": ["Feature A", "Feature B"], "explanation": "Brief reasoning"}}'
        )
        try:
            chain = prompt | llm
            # Using synchronous invoke for simplicity in this endpoint, 
            # though async ainvoke is better for high throughput.
            reasoning = chain.invoke({"action": req.action, "file_id": req.file_id, "context": affected_context}).content
        except Exception as e:
             reasoning = f'{{"risk_level": "Unknown", "broken_features": [], "explanation": "Failed to reason: {str(e)}"}}'
    else:
        # Fallback if no dependents or no key
        if len(blast_radius) == 0:
            reasoning = '{"risk_level": "Low", "broken_features": [], "explanation": "No direct internal dependencies detected in this module."}'
        else:
            reasoning = '{"risk_level": "High", "broken_features": ["Multiple"], "explanation": "API Key missing, cannot run deep reasoning."}'

    return {
        "target_node": req.file_id,
        "blast_radius_nodes": blast_radius,
        "ai_analysis": reasoning # Frontend parses this JSON string
    }

@router.post("/semantic-search")
async def semantic_search(req: SearchRequest):
    results = vector_db.search(req.query, top_k=3)
    return {"results": results}
