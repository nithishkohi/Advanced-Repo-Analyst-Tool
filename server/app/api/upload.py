from fastapi import APIRouter, UploadFile, File, HTTPException
import zipfile
import io
from app.engine.parser.ingestor import IngestorWorkflow

router = APIRouter(tags=["Upload"])

@router.post("/upload-repo")
async def upload_repo(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
    
    zip_bytes = await file.read()
    workflow = IngestorWorkflow()
    
    result = await workflow.ingest_zip(zip_bytes, file.filename)
    
    return result
