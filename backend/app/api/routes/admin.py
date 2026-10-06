from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.core.audit import log_audit_event
from app.models.entities import (
    User, Property, PropertyDocument, ProcessingJob, AuditLog, AIQuery, RiskFinding
)
from app.schemas.dtos import UserResponse, PropertyResponse, PropertyDocumentResponse, AuditLogResponse
from app.services.llm_service import llm_service
from app.services.vector_store_service import vector_store_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/metrics")
def get_admin_metrics(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_properties = db.query(Property).count()
    total_documents = db.query(PropertyDocument).count()
    processing_jobs = db.query(ProcessingJob).filter(ProcessingJob.status.in_(["PROCESSING", "OCR_PROCESSING", "INDEXING"])).count()
    failed_jobs = db.query(ProcessingJob).filter(ProcessingJob.status == "FAILED").count()
    ai_queries_count = db.query(AIQuery).count()
    high_risk_properties = db.query(Property).filter(Property.overall_risk_level.in_(["HIGH", "CRITICAL"])).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_properties": total_properties,
        "total_documents": total_documents,
        "processing_queue": processing_jobs,
        "failed_jobs": failed_jobs,
        "ai_queries": ai_queries_count,
        "high_risk_properties": high_risk_properties
    }

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.get("/properties", response_model=List[PropertyResponse])
def list_all_properties(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    props = db.query(Property).order_by(Property.created_at.desc()).all()
    res = []
    for p in props:
        pr = PropertyResponse.from_orm(p)
        pr.document_count = db.query(PropertyDocument).filter(PropertyDocument.property_id == p.id).count()
        res.append(pr)
    return res

@router.get("/documents", response_model=List[PropertyDocumentResponse])
def list_all_documents(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(PropertyDocument).order_by(PropertyDocument.created_at.desc()).all()

@router.get("/jobs")
def list_processing_jobs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    jobs = db.query(ProcessingJob).order_by(ProcessingJob.started_at.desc()).limit(50).all()
    res = []
    for j in jobs:
        res.append({
            "id": j.id,
            "document_id": j.document_id,
            "property_id": j.property_id,
            "user_id": j.user_id,
            "status": j.status,
            "stage_progress": j.stage_progress,
            "error_message": j.error_message,
            "started_at": j.started_at,
            "completed_at": j.completed_at
        })
    return res

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

@router.get("/monitoring")
def get_system_health(
    admin: User = Depends(require_admin)
):
    llm_status = "ONLINE" if llm_service.is_available() else "OFFLINE (Fallback Active)"
    vector_chunks_count = len(vector_store_service.chunks_metadata)
    
    return {
        "status": "HEALTHY",
        "llm_provider": llm_service.provider,
        "llm_model": llm_service.model_name,
        "llm_availability": llm_status,
        "vector_store": {
            "type": "FAISS",
            "indexed_chunks": vector_chunks_count
        },
        "ocr_engine": "PaddleOCR + PyMuPDF"
    }
