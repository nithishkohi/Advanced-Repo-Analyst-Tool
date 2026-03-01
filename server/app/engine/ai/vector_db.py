import chromadb
from sentence_transformers import SentenceTransformer

class VectorDB:
    def __init__(self):
        # Local ephemeral Chroma DB (Resets on restart, perfect for Hackathon)
        self.client = chromadb.Client()
        self.collection = self.client.get_or_create_collection(name="codebase_embeddings")
        # Fast local embedding model
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')

    def embed_and_store(self, filename: str, summary: str, extra_metadata: dict = None):
        """
        Embeds the 1-sentence summary and stores it keyed by filename.
        """
        if not summary or summary == "No summary available":
            return
            
        embedding = self.encoder.encode(summary).tolist()
        
        meta = {"filename": filename}
        if extra_metadata:
            meta.update(extra_metadata)
            
        self.collection.add(
            embeddings=[embedding],
            documents=[summary],
            metadatas=[meta],
            ids=[filename]
        )

    def search(self, query: str, top_k: int = 3) -> list:
        """
        Runs semantic search against the loaded codebase.
        Returns a list of dicts: {"id": filename, "score": distance, "summary": document}
        """
        query_embedding = self.encoder.encode(query).tolist()
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            hits = []
            if results["ids"] and len(results["ids"]) > 0:
                for i in range(len(results["ids"][0])):
                    hits.append({
                        "id": results["ids"][0][i],
                        "summary": results["documents"][0][i],
                        "score": results["distances"][0][i] if "distances" in results else 0,
                    })
            return hits
        except Exception as e:
            print(f"Search error: {e}")
            return []

# Singleton instance per server runtime
vector_db = VectorDB()
