import os
import uuid
import fitz
from PIL import Image
from typing import List
from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, enforce_user_ownership
from app.core.audit import log_audit_event
from app.models.entities import (
    User, Property, PropertyDocument, OCRPage, OCRBlock, ExtractedEntity, ProcessingJob
)
from app.schemas.dtos import (
    PropertyDocumentResponse, OCRPageResponse, OCRBlockResponse, ExtractedEntityResponse
)
from app.services.job_processor import process_document_pipeline

router = APIRouter(prefix="", tags=["Documents"])

@router.post("/properties/{property_id}/documents", response_model=PropertyDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_property_document(
    property_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    # 1. Extension check
    orig_filename = os.path.basename(file.filename)
    ext = os.path.splitext(orig_filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Server-generated safe filename
    stored_name = f"doc_{uuid.uuid4().hex}{ext}"
    file_path = os.path.abspath(os.path.join(settings.UPLOAD_DIRECTORY, stored_name))

    # Path traversal safety check
    if not file_path.startswith(settings.UPLOAD_DIRECTORY):
        raise HTTPException(status_code=400, detail="Invalid target filename path traversal attempt.")

    # 3. Read content & File size check
    contents = file.file.read()
    file_size = len(contents)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB.")
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Write file to secure upload directory
    with open(file_path, "wb") as f:
        f.write(contents)

    # 4. File Integrity Validation
    page_count = 1
    if ext == ".pdf":
        try:
            doc_fitz = fitz.open(file_path)
            page_count = len(doc_fitz)
            doc_fitz.close()
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail="Uploaded PDF is corrupted or malformed.")
    else:
        try:
            with Image.open(file_path) as img:
                img.verify()
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail="Uploaded image is corrupted or invalid.")

    # Save metadata to DB
    prop_doc = PropertyDocument(
        property_id=property_id,
        user_id=current_user.id,
        original_filename=orig_filename,
        stored_filename=stored_name,
        file_path=file_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        page_count=page_count,
        document_type="Unclassified",
        processing_status="UPLOADED"
    )
    db.add(prop_doc)
    db.commit()
    db.refresh(prop_doc)

    # Create processing job record
    job = ProcessingJob(
        document_id=prop_doc.id,
        property_id=property_id,
        user_id=current_user.id,
        status="UPLOADED",
        stage_progress=5
    )
    db.add(job)
    db.commit()

    log_audit_event(db, "DOCUMENT_UPLOADED", user_id=current_user.id, resource_type="Document", resource_id=str(prop_doc.id))

    # Dispatch background processing task
    background_tasks.add_task(process_document_pipeline, db, prop_doc.id)

    return prop_doc

@router.get("/properties/{property_id}/documents", response_model=List[PropertyDocumentResponse])
def list_property_documents(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    docs = db.query(PropertyDocument).filter(PropertyDocument.property_id == property_id).order_by(PropertyDocument.created_at.desc()).all()
    return docs

@router.get("/documents/{document_id}", response_model=PropertyDocumentResponse)
def get_document_details(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_user_ownership(doc.user_id, current_user)
    return doc

@router.get("/documents/{document_id}/file")
def download_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_user_ownership(doc.user_id, current_user)

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File content not found on server storage.")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

@router.get("/documents/{document_id}/ocr", response_model=List[OCRPageResponse])
def get_document_ocr(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_user_ownership(doc.user_id, current_user)

    pages = db.query(OCRPage).filter(OCRPage.document_id == document_id).order_by(OCRPage.page_number).all()
    res = []
    for p in pages:
        blocks = db.query(OCRBlock).filter(OCRBlock.document_id == document_id, OCRBlock.page_number == p.page_number).all()
        res.append({
            "id": p.id,
            "document_id": p.document_id,
            "page_number": p.page_number,
            "full_text": p.full_text,
            "blocks": blocks
        })
    return res

@router.get("/documents/{document_id}/extraction", response_model=List[ExtractedEntityResponse])
def get_document_entities(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_user_ownership(doc.user_id, current_user)

    entities = db.query(ExtractedEntity).filter(ExtractedEntity.document_id == document_id).all()
    return entities

@router.post("/documents/{document_id}/reprocess")
@router.post("/documents/{document_id}/retry")
def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_user_ownership(doc.user_id, current_user)

    doc.processing_status = "UPLOADED"
    doc.failure_reason = None
    db.commit()

    background_tasks.add_task(process_document_pipeline, db, document_id)
    return {"message": "Document re-processing pipeline initiated cleanly."}
