import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.networkx_graph import get_blast_radius
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import networkx as nx

router = APIRouter()

# Deep-Reasoning Agent for Blast Radius
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.1 # Strictly analytical format
)

mitigation_prompt = PromptTemplate.from_template(
    "You are a Principal AI Architect. A developer just modified the core logic in `{file_id}`. "
    "Graph traversal detected potential cascading architectural effects in these downstream dependents: {dependents}. "
    "Write a high-level 3-bullet 'Blast Radius' impact report and one proposed architectural decoupling strategy.\n\n"
    "Report:"
)

code_analysis_prompt = PromptTemplate.from_template(
    "You are a Senior AI Architect. A developer just modified `{file_id}`.\n"
    "Here is the code they submitted:\n```\n{new_code}\n```\n"
    "Graph traversal detected these downstream dependents might be affected: {dependents}.\n"
    "Analyze the code they submitted. Does it have obvious syntax errors, missing imports, or logic flaws that will break the file or its dependents? "
    "If the code looks broken or breaks dependents, your analysis must end with exactly 'RISK: High'. If the code looks fine (even if it has dependents), it must end with exactly 'RISK: Low'. "
    "Provide a high-level 3-bullet impact report.\n\n"
    "Report:"
)

from app.engine.parser import ingestor

class BlastRadiusPayload(BaseModel):
    file_id: str
    new_code: str | None = None

@router.post("/simulate-impact")
async def execute_blast_simulation(payload: BlastRadiusPayload):
    try:
        file_id = payload.file_id
        dependents = get_blast_radius(ingestor.LAST_GRAPH, file_id) if ingestor.LAST_GRAPH else []
        
        if payload.new_code:
            prompt_str = code_analysis_prompt.format(
                file_id=file_id, 
                new_code=payload.new_code[:3000], 
                dependents=", ".join(dependents) if dependents else "None"
            )
            try:
                impact_report = gemini_llm.invoke(prompt_str)
                report_text = impact_report.content
                risk_level = "High" if "RISK: High" in report_text else "Low"
                report_text = report_text.replace("RISK: High", "").replace("RISK: Low", "").strip()
            except Exception as e:
                # Fallback for 429 Rate Limit
                if dependents:
                    risk_level = "High"
                    report_text = "API Quota Exceeded. Fallback Analysis: Code changes will impact downstream files and cause High Risk architectural drift."
                else:
                    risk_level = "High" 
                    report_text = "API Quota Exceeded. Fallback Analysis: Unable to verify code syntax. Marking as High Risk."
                    
            return {
                "file_id": file_id,
                "impact_count": len(dependents),
                "dependents": dependents,
                "report": report_text,
                "risk_level": risk_level
            }
        else:
            if not dependents:
                return {
                    "file_id": file_id,
                    "impact_count": 0, 
                    "dependents": [],
                    "report": "ISOLATED NODE: Safe to modify. No downstream dependents.",
                    "risk_level": "Low"
                }
                
            prompt_str = mitigation_prompt.format(file_id=file_id, dependents=", ".join(dependents))
            try:
                impact_report = gemini_llm.invoke(prompt_str)
                report_text = impact_report.content
            except Exception:
                report_text = "API Quota Exceeded. Fallback Analysis: Modifying this file inherently introduces architectural drift."
            
            return {
                "file_id": file_id,
                "impact_count": len(dependents),
                "dependents": dependents,
                "report": report_text,
                "risk_level": "High"
            }
    except Exception as e:
        print(f"Simulation 500 Internal Error: {str(e)}")
        return {
            "file_id": payload.file_id,
            "impact_count": 0,
            "dependents": [],
            "report": f"Backend Error: {str(e)}",
            "risk_level": "Error"
        }

class GithubIngestPayload(BaseModel):
    url: str

from app.engine.parser.ingestor import IngestorWorkflow

@router.post("/ingest-github")
async def ingest_github(payload: GithubIngestPayload):
    """
    Downloads the GitHub repository as a ZIP file and processes it through the pipeline.
    """
    repo_path = payload.url.replace("https://github.com/", "")
    if repo_path.endswith(".git"):
        repo_path = repo_path[:-4]
        
    # Try grabbing the main branch zip first
    zip_url_main = f"https://github.com/{repo_path}/archive/refs/heads/main.zip"
    zip_url_master = f"https://github.com/{repo_path}/archive/refs/heads/master.zip"
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Try main
        response = await client.get(zip_url_main)
        if response.status_code != 200:
            # Try master
            response = await client.get(zip_url_master)
            if response.status_code != 200:
                raise httpx.HTTPError(f"Could not find a valid repository zip at {repo_path}")
                
        zip_bytes = response.content
        
    workflow = IngestorWorkflow()
    result = await workflow.ingest_zip(zip_bytes, repo_path)
    
    return result

pr_summary_prompt = PromptTemplate.from_template(
    "You are an AI architect. Summarize the architectural impact of this PR in exactly 2 or 3 words (e.g. 'Database Schema, Auth' or 'UI Components').\n\nPR Title: {title}\nBody: {body}\n\nSummary:"
)

@router.get("/github-prs")
async def fetch_github_prs(repo_url: str):
    # Parse owner/repo from URL
    # e.g. https://github.com/OCA/crm -> OCA/crm
    repo_path = repo_url.replace("https://github.com/", "")
    if repo_path.endswith(".git"):
        repo_path = repo_path[:-4]
        
    api_url = f"https://api.github.com/repos/{repo_path}/pulls?state=open&per_page=3"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url)
        if response.status_code != 200:
            return {"prs": []}
            
        prs_data = response.json()
        
    results = []
    for pr in prs_data:
        title = pr.get("title", "")
        body = pr.get("body", "") or ""
        pr_number = pr.get("number")
        
        prompt_str = pr_summary_prompt.format(title=title, body=body[:500])
        try:
            summary_response = gemini_llm.invoke(prompt_str)
            impact = summary_response.content.strip().replace('"', '')
        except:
            impact = "Unknown Impact"
            
        results.append({
            "id": f"#{pr_number}",
            "title": title,
            "impact": impact
        })
        
    return {"prs": results}

class FileChatPayload(BaseModel):
    file_id: str
    question: str
    raw_text: str

file_chat_prompt = PromptTemplate.from_template(
    "You are a helpful programming assistant bridging the gap for non-technical users. "
    "A user is looking at the source code for the file `{file_id}` and has asked the following question:\n"
    "Question: {question}\n\n"
    "Here is the code context they are looking at:\n{raw_text}\n\n"
    "Answer the user's question clearly, concisely, and without technical jargon. Focus only on their question.\n"
    "Answer:"
)

@router.post("/file-chat")
async def execute_file_chat(payload: FileChatPayload):
    prompt_str = file_chat_prompt.format(
        file_id=payload.file_id, 
        question=payload.question, 
        raw_text=payload.raw_text[:3000] # Limit context window
    )
    
    try:
        chat_response = gemini_llm.invoke(prompt_str)
        return {"answer": chat_response.content}
    except Exception as e:
        return {"answer": "Google API Free Tier Quota Exceeded. Please wait 60 seconds before asking another question."}
