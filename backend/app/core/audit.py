import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS"
):
    """
    Log security and operational audit events into database.
    Does NOT log passwords, JWT tokens, secrets, or raw private key content.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details,
            ip_address=ip_address,
            status=status,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to record audit log: {e}")
