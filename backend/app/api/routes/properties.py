import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, enforce_user_ownership
from app.core.audit import log_audit_event
from app.models.entities import (
    User, Property, PropertyDocument, OwnershipEvent, RiskFinding
)
from app.schemas.dtos import (
    PropertyCreate, PropertyResponse, OwnershipEventResponse, RiskFindingResponse
)
from app.services.confidence_engine import confidence_engine

router = APIRouter(prefix="/properties", tags=["Properties"])

@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    property_code = f"PRP-{uuid.uuid4().hex[:8].upper()}"
    prop = Property(
        user_id=current_user.id,
        title=payload.title,
        property_id_code=property_code,
        address=payload.address,
        village=payload.village,
        taluk=payload.taluk,
        district=payload.district,
        state=payload.state,
        survey_number=payload.survey_number,
        sub_survey_number=payload.sub_survey_number,
        plot_number=payload.plot_number,
        khata_number=payload.khata_number,
        patta_number=payload.patta_number,
        area_extent=payload.area_extent,
        boundaries=payload.boundaries,
        land_type=payload.land_type,
        overall_confidence=0.0,
        overall_risk_level="NOT_ANALYZED",
        verification_status="NOT_ANALYZED"
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    log_audit_event(db, "PROPERTY_CREATED", user_id=current_user.id, resource_type="Property", resource_id=str(prop.id))
    
    resp = PropertyResponse.from_orm(prop)
    resp.document_count = 0
    return resp

@router.get("", response_model=List[PropertyResponse])
def list_user_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List properties belonging exclusively to the authenticated user (or all if admin)."""
    if current_user.role == "ADMIN":
        props = db.query(Property).order_by(Property.created_at.desc()).all()
    else:
        props = db.query(Property).filter(Property.user_id == current_user.id).order_by(Property.created_at.desc()).all()

    res = []
    for p in props:
        pr = PropertyResponse.from_orm(p)
        pr.document_count = db.query(PropertyDocument).filter(PropertyDocument.property_id == p.id).count()
        res.append(pr)
    return res

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property_details(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    pr = PropertyResponse.from_orm(prop)
    pr.document_count = db.query(PropertyDocument).filter(PropertyDocument.property_id == prop.id).count()
    return pr

@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    db.delete(prop)
    db.commit()
    log_audit_event(db, "PROPERTY_DELETED", user_id=current_user.id, resource_type="Property", resource_id=str(property_id))
    return {"message": "Property deleted successfully."}

@router.get("/{property_id}/ownership", response_model=List[OwnershipEventResponse])
def get_ownership_timeline(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    events = db.query(OwnershipEvent).filter(OwnershipEvent.property_id == property_id).order_by(OwnershipEvent.sequence_order).all()
    return events

@router.get("/{property_id}/risks", response_model=List[RiskFindingResponse])
def get_property_risks(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    risks = db.query(RiskFinding).filter(RiskFinding.property_id == property_id).all()
    return risks

@router.get("/{property_id}/confidence")
def get_property_confidence(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    return confidence_engine.calculate_confidence(db, property_id)
