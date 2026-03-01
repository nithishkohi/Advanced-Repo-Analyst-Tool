from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.upload import router as upload_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Codebase Intelligence Platform",
    description="3D Codebase Visualization API Sandbox",
    version="1.0.0"
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api/v1")
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.semantic_search import router as semantic_search_router
app.include_router(sandbox_router, prefix="/api/v1/sandbox")
app.include_router(semantic_search_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Codebase Intelligence API is running. Send a repository ZIP payload to /api/v1/upload-repo"}
