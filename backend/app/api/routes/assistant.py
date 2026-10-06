from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, enforce_user_ownership
from app.core.audit import log_audit_event
from app.models.entities import User, Property, AIQuery
from app.schemas.dtos import AIQueryRequest, AIQueryResponse
from app.services.rag_service import rag_service

router = APIRouter(prefix="/properties", tags=["AI Assistant"])

@router.post("/{property_id}/assistant/query", response_model=AIQueryResponse)
def query_ai_assistant(
    property_id: int,
    payload: AIQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG Query Endpoint for PropReady Property Assistant.
    Enforces user ownership & strict RAG retrieval data isolation.
    """
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Execute RAG Pipeline with db, user_id, and property_id filtering
    result = rag_service.answer_question(
        db=db,
        query=payload.question,
        user_id=current_user.id,
        property_id=property_id
    )

    # Record AI Query in DB
    ai_q = AIQuery(
        property_id=property_id,
        user_id=current_user.id,
        question=payload.question,
        answer=result["answer"],
        confidence_score=result["confidence_score"],
        sources=result["sources"]
    )
    db.add(ai_q)
    db.commit()

    log_audit_event(db, "AI_QUERY", user_id=current_user.id, resource_type="Property", resource_id=str(property_id), details=f"Query: {payload.question[:50]}")

    return result
