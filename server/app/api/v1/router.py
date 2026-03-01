import os
import networkx as nx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Assuming LAST_GRAPH is the in-memory NetworkX DAG generated in Phase 2
import app.engine.parser.ingestor as ingest_module
# Assuming vector_db is initialized ChromaDB instance
from app.engine.ai.vector_db import vector_db

router = APIRouter()

# Schema for incoming request
class SimulationRequest(BaseModel):
    target_file_id: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

@router.post("/simulate-impact")
async def simulate_impact(req: SimulationRequest):
    """
    Executes a graph traversal to find the "Blast Radius".
    Passes the dependent files to Gemini Pro for Architectural Impact Analysis.
    """
    graph = ingest_module.LAST_GRAPH
    if graph is None or req.target_file_id not in graph:
        raise HTTPException(status_code=404, detail="Graph or target file not found.")

    # 1. BFS/DFS Traversal: Find downstream code that relies on the target
    try:
        # We need nodes that have a path TO the target, or FROM the target depending on edge direction.
        # Assuming edges are `Dependency -> Target`. Thus, targets are predecessors.
        dependents = list(nx.ancestors(graph, req.target_file_id))
    except nx.NetworkXError:
        dependents = []

    # 2. AI Reasoning: Gemini Pro orchestrates the Impact Report
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0.2,
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    
    prompt = PromptTemplate.from_template(
        "You are an AI Architect. A developer wants to delete or modify the file: '{target_file}'. "
        "The following files depend on it:\n{dependents}\n\n"
        "Generate a brief, professional 'Blast Radius Risk Report'. "
        "Highlight potential breaking changes and recommend refactoring steps."
    )
    
    chain = prompt | llm
    report_response = await chain.ainvoke({
        "target_file": req.target_file_id,
        "dependents": ", ".join(dependents) if dependents else "None"
    })

    return {
        "target_id": req.target_file_id,
        "blast_radius_ids": dependents,
        "blast_radius_count": len(dependents),
        "ai_risk_report": report_response.content
    }

@router.post("/semantic-search")
async def semantic_search(req: SearchRequest):
    """
    Takes a natural language query, embeds it via ChromaDB, and returns Top-K file nodes.
    Example Query: 'Where is the JWT authentication token validated?'
    """
    try:
        # ChromaDB Query
        results = vector_db.collection.query(
            query_texts=[req.query],
            n_results=req.top_k
        )
        
        # Results format: {'ids': [['file1', 'file2']], 'distances': [[0.1, 0.4]], 'metadatas': [...]}
        matched_files = results['ids'][0] if results['ids'] else []
        distances = results['distances'][0] if 'distances' in results and results['distances'] else []
        
        payload = []
        for file_id, dist in zip(matched_files, distances):
            payload.append({
                "file_id": file_id,
                "confidence_score": 1.0 - float(dist) # Convert Distance to Confidence
            })
            
        return {"query": req.query, "matches": payload}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
