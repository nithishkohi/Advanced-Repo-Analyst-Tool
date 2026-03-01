import zipfile
import io
import asyncio
from typing import Dict, Any

from app.engine.parser.treesitter_ast import ASTParser
from app.engine.graph.networkx_graph import GraphEngine
from app.engine.ai.groq_summarizer import GroqSummarizer
from app.engine.ai.vector_db import vector_db

# Hackathon persistent state for Sandbox inference
LAST_GRAPH = None

class IngestorWorkflow:
    def __init__(self):
        self.ast = ASTParser()
        self.graph = GraphEngine()
        self.ai = GroqSummarizer()
        
        self.allowed_extensions = {".py", ".ts", ".js", ".tsx", ".jsx"}

    async def ingest_zip(self, zip_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Runs the full ingestion pipeline entirely in memory.
        """
        # 1. Extraction & Parsing
        files_data = []
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
            for file_info in archive.infolist():
                if file_info.is_dir():
                    continue
                
                ext = "." + file_info.filename.split(".")[-1] if "." in file_info.filename else ""
                if ext not in self.allowed_extensions:
                    continue
                
                # Exclude node_modules, dist, etc
                if "node_modules" in file_info.filename or "dist/" in file_info.filename or ".venv" in file_info.filename:
                    continue
                
                content = archive.read(file_info.filename)
                
                # Try to decode safely for snippets
                try:
                    str_content = content.decode('utf-8')
                except:
                    str_content = ""
                    
                parsed = self.ast.parse_file(file_info.filename, content, ext)
                files_data.append({
                    "id": file_info.filename,
                    "path": file_info.filename,
                    "name": file_info.filename.split("/")[-1],
                    "type": "file",
                    "language": ext[1:],
                    "imports": parsed["imports"],
                    "signatures": parsed["signatures"],
                    "raw_text": str_content
                })
        
        total_files = len(files_data)

        # 2. Graph Construction
        for file in files_data:
            self.graph.add_node(file["id"], {"name": file["name"]})
            
            # Very primitive dependency mapping for hackathon speed:
            # If an import string matches part of another file's path, link them.
            # In production, use strict module resolution rules.
            for imp in file["imports"]:
                for target_file in files_data:
                    if target_file["id"] == file["id"]: continue
                    # Rough heuristic
                    target_name_no_ext = target_file["name"].split(".")[0]
                    if target_name_no_ext in imp:
                        self.graph.add_edge(file["id"], target_file["id"])

        graph_metrics = self.graph.calculate_metrics_and_positions()
        edges = self.graph.get_edges()

        # 3. AI Summarization Phase (Throttled for large repos)
        # Sort files by centrality to only summarize the most important ones if there are too many
        sorted_files = sorted(files_data, key=lambda f: graph_metrics.get(f["id"], {}).get("centrality_score", 0), reverse=True)
        top_files = sorted_files[:30] # Limit to 30 to avoid Groq Free Tier limits
        
        summaries = {}
        target_summaries = [(f["id"], f["raw_text"]) for f in top_files]
        
        if target_summaries:
            try:
                summaries = await self.ai.batch_summarize(target_summaries)
            except Exception as e:
                print(f"Batch summarization failed: {e}")
            
        # Store in VectorDB for Semantic Search
        for f in top_files:
            summary = summaries.get(f["id"], "No summary available")
            if summary != "No summary available":
                vector_db.embed_and_store(f["id"], summary, {"path": f["path"], "language": f["language"]})

        # Save to global Hackathon cache
        global LAST_GRAPH
        LAST_GRAPH = self.graph.graph

        # 4. JSON Payload Assembly
        nodes = []
        for file in files_data:
            node_id = file["id"]
            metrics = graph_metrics.get(node_id, {})
            # Construct final payload object
            nodes.append({
                "id": node_id,
                "path": file["path"],
                "name": file["name"],
                "type": file["type"],
                "language": file["language"],
                "summary": summaries.get(node_id, "No summary available"),
                "cyclomatic_complexity": len(file["signatures"]), # Proxy for complexity using signatures count
                "centrality_score": metrics.get("centrality_score", 0.0),
                "is_core_node": metrics.get("is_core_node", False),
                "cluster_id": metrics.get("cluster_id", 0),
                "coordinates": metrics.get("coordinates", {"x":0.0, "y":0.0, "z":0.0}),
                "raw_text": file.get("raw_text", "")
            })

        return {
            "repositoryName": filename,
            "totalFilesAnalyzed": total_files,
            "nodes": nodes,
            "edges": edges
        }
