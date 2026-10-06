from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password
from app.core.audit import log_audit_event
from app.models.entities import User
from app.schemas.dtos import UserResponse

router = APIRouter(prefix="/users", tags=["User Profile"])

class ProfileUpdate(BaseModel):
    full_name: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.full_name = payload.full_name
    db.commit()
    db.refresh(current_user)
    log_audit_event(db, "PROFILE_UPDATED", user_id=current_user.id)
    return current_user

@router.put("/me/password")
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    log_audit_event(db, "PASSWORD_CHANGED", user_id=current_user.id)
    return {"message": "Password changed successfully."}
