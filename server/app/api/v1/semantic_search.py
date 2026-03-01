from fastapi import APIRouter
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions

router = APIRouter()

# Spin up In-Memory Vector Store for zero lag
chroma_client = chromadb.Client()

# Auto-downloads all-MiniLM-L6-v2 embeddings to local cache. Native math.
sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

# Initialize collection optimized for Semantic routing
collection = chroma_client.get_or_create_collection(
    name="codebase_embeddings",
    embedding_function=sentence_transformer_ef,
    metadata={"hnsw:space": "cosine"} # Enforces dot-product cosine algorithm
)

class NaturalSearch(BaseModel):
    query: str
    limit: int = 3

@router.post("/semantic-search")
async def semantic_search(search: NaturalSearch):
    
    results = collection.query(
        query_texts=[search.query],
        n_results=search.limit
    )
    
    if not results['ids'] or len(results['ids'][0]) == 0:
        return {"matches": []}
        
    compiled_matches = []
    
    for i in range(len(results['ids'][0])):
        file_id = results['ids'][0][i]
        # Invert cosine distance distance -> higher confidence is better
        confidence = 1 - results['distances'][0][i] 
        
        compiled_matches.append({
            "file_id": file_id,
            "confidence_score": round(confidence, 4),
            "content_summary": results['documents'][0][i]
        })
        
    return {"query": search.query, "matches": compiled_matches}

# Call immediately after Groq Map-Reduce phase
def inject_to_vector_db(summaries_map: list[dict]):
    file_ids = [s["file_id"] for s in summaries_map]
    extracted_docs = [s["summary"] for s in summaries_map]
    
    collection.add(
        documents=extracted_docs,
        ids=file_ids
    )
