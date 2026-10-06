import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Property Schemas ---
class PropertyCreate(BaseModel):
    title: str
    address: Optional[str] = None
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: Optional[str] = None
    sub_survey_number: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    patta_number: Optional[str] = None
    area_extent: Optional[str] = None
    boundaries: Optional[str] = None
    land_type: Optional[str] = None

class PropertyResponse(BaseModel):
    id: int
    user_id: int
    title: str
    property_id_code: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: Optional[str] = None
    sub_survey_number: Optional[str] = None
    plot_number: Optional[str] = None
    khata_number: Optional[str] = None
    patta_number: Optional[str] = None
    area_extent: Optional[str] = None
    boundaries: Optional[str] = None
    land_type: Optional[str] = None
    current_owner: Optional[str] = None
    overall_confidence: float
    overall_risk_level: str
    verification_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Document Schemas ---
class PropertyDocumentResponse(BaseModel):
    id: int
    property_id: int
    user_id: int
    original_filename: str
    stored_filename: str
    mime_type: str
    file_size: int
    page_count: int
    document_type: str
    classification_confidence: float
    classification_reason: Optional[str] = None
    processing_status: str
    failure_reason: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- OCR Schemas ---
class OCRBlockResponse(BaseModel):
    id: int
    document_id: int
    page_number: int
    text: str
    bounding_box: Optional[Any] = None
    confidence: float

    class Config:
        from_attributes = True

class OCRPageResponse(BaseModel):
    id: int
    document_id: int
    page_number: int
    full_text: Optional[str] = None
    blocks: List[OCRBlockResponse] = []

    class Config:
        from_attributes = True

# --- Extraction & Risk & Ownership Schemas ---
class ExtractedEntityResponse(BaseModel):
    id: int
    property_id: int
    document_id: int
    page_number: Optional[int] = None
    entity_type: str
    field_name: str
    value: str
    source_text: Optional[str] = None
    confidence: float

    class Config:
        from_attributes = True

class OwnershipEventResponse(BaseModel):
    id: int
    property_id: int
    document_id: Optional[int] = None
    page_number: Optional[int] = None
    sequence_order: int
    transaction_type: str
    transfer_date: Optional[str] = None
    previous_owner: Optional[str] = None
    new_owner: str
    consideration_amount: Optional[str] = None
    registration_number: Optional[str] = None
    registration_office: Optional[str] = None
    confidence: float

    class Config:
        from_attributes = True

class RiskFindingResponse(BaseModel):
    id: int
    property_id: int
    document_id: Optional[int] = None
    page_number: Optional[int] = None
    risk_type: str
    severity: str
    title: str
    description: str
    reason: Optional[str] = None
    source_text: Optional[str] = None
    recommended_action: Optional[str] = None

    class Config:
        from_attributes = True

# --- AI Query Schemas ---
class AIQueryRequest(BaseModel):
    question: str

class AISourceCitation(BaseModel):
    document_id: int
    document_name: str
    document_type: str
    page_number: int
    snippet: str

class AIQueryResponse(BaseModel):
    question: str
    answer: str
    confidence_score: float
    sources: List[AISourceCitation] = []
    disclaimer: str = "AI-Assisted Property Document Analysis. Not a substitute for professional legal verification."

# --- Audit & Monitoring Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[str] = None
    status: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
