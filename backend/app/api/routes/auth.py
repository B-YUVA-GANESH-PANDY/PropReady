from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.core.audit import log_audit_event
from app.models.entities import User
from app.schemas.dtos import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    SECURITY RULE: Always assigns 'USER' role. Never allows registering as 'ADMIN'.
    """
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        log_audit_event(db, "REGISTER_FAILED", details=f"Email {payload.email} already exists", ip_address=request.client.host, status="FAILURE")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role="USER",  # STRICT MANDATORY USER ROLE ASSIGNMENT
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(db, "REGISTER_SUCCESS", user_id=user.id, resource_type="User", resource_id=str(user.id), ip_address=request.client.host)

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        log_audit_event(db, "LOGIN_FAILED", details=f"Invalid credentials for {payload.email}", ip_address=request.client.host, status="FAILURE")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated."
        )

    log_audit_event(db, "LOGIN_SUCCESS", user_id=user.id, ip_address=request.client.host)

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout_user(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(db, "LOGOUT", user_id=current_user.id, ip_address=request.client.host)
    return {"message": "Successfully logged out."}
