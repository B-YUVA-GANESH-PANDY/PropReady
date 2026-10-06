import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, enforce_user_ownership
from app.core.audit import log_audit_event
from app.models.entities import User, Property, VerificationReport
from app.services.report_service import report_service

router = APIRouter(prefix="/properties", tags=["Reports"])

@router.post("/{property_id}/reports/generate")
def generate_property_report(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    db_report = report_service.generate_pdf_report(db, property_id, current_user.id)
    log_audit_event(db, "REPORT_GENERATED", user_id=current_user.id, resource_type="Report", resource_id=str(db_report.id))

    return {
        "report_id": db_report.id,
        "title": db_report.report_title,
        "generated_at": db_report.generated_at,
        "download_url": f"/properties/{property_id}/reports/{db_report.id}/download"
    }

@router.get("/{property_id}/reports")
def list_property_reports(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    reports = db.query(VerificationReport).filter(VerificationReport.property_id == property_id).order_by(VerificationReport.generated_at.desc()).all()
    return reports

@router.get("/{property_id}/reports/{report_id}/download")
def download_property_report(
    property_id: int,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    enforce_user_ownership(prop.user_id, current_user)

    rep = db.query(VerificationReport).filter(VerificationReport.id == report_id, VerificationReport.property_id == property_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not rep.pdf_path or not os.path.exists(rep.pdf_path):
        db_report = report_service.generate_pdf_report(db, property_id, current_user.id)
        pdf_file = db_report.pdf_path
    else:
        pdf_file = rep.pdf_path

    filename = os.path.basename(pdf_file)
    return FileResponse(
        path=pdf_file,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
