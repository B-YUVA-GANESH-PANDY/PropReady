import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, JSON, Boolean
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="USER", nullable=False)  # ONLY "USER" or "ADMIN"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    documents = relationship("PropertyDocument", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    property_id_code = Column(String(100), index=True, nullable=True)
    address = Column(Text, nullable=True)
    village = Column(String(100), nullable=True)
    taluk = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    survey_number = Column(String(100), index=True, nullable=True)
    sub_survey_number = Column(String(100), nullable=True)
    plot_number = Column(String(100), nullable=True)
    khata_number = Column(String(100), nullable=True)
    patta_number = Column(String(100), nullable=True)
    area_extent = Column(String(100), nullable=True)
    boundaries = Column(Text, nullable=True)
    land_type = Column(String(100), nullable=True)
    current_owner = Column(String(255), nullable=True)
    
    overall_confidence = Column(Float, default=0.0)
    overall_risk_level = Column(String(50), default="NOT_ANALYZED")  # LOW, MEDIUM, HIGH, CRITICAL, NOT_ANALYZED
    verification_status = Column(String(50), default="NOT_ANALYZED") # NOT_ANALYZED, ANALYZING, COMPLETED, NEEDS_REVIEW, HIGH_RISK
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="properties")
    documents = relationship("PropertyDocument", back_populates="property", cascade="all, delete-orphan")
    ownership_events = relationship("OwnershipEvent", back_populates="property", cascade="all, delete-orphan")
    transaction_events = relationship("TransactionEvent", back_populates="property", cascade="all, delete-orphan")
    risk_findings = relationship("RiskFinding", back_populates="property", cascade="all, delete-orphan")
    ai_queries = relationship("AIQuery", back_populates="property", cascade="all, delete-orphan")
    reports = relationship("VerificationReport", back_populates="property", cascade="all, delete-orphan")

class PropertyDocument(Base):
    __tablename__ = "property_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    
    document_type = Column(String(100), default="Other")  # Sale Deed, Gift Deed, EC, Patta, etc.
    classification_confidence = Column(Float, default=0.0)
    classification_reason = Column(Text, nullable=True)
    
    processing_status = Column(String(50), default="UPLOADED", index=True)
    # UPLOADED, VALIDATING, PROCESSING, OCR_PROCESSING, OCR_COMPLETED, CLASSIFYING, EXTRACTING, INDEXING, VERIFYING, COMPLETED, FAILED
    failure_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    property = relationship("Property", back_populates="documents")
    owner = relationship("User", back_populates="documents")
    ocr_pages = relationship("OCRPage", back_populates="document", cascade="all, delete-orphan")
    ocr_blocks = relationship("OCRBlock", back_populates="document", cascade="all, delete-orphan")
    extracted_entities = relationship("ExtractedEntity", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="document", cascade="all, delete-orphan")

class OCRPage(Base):
    __tablename__ = "ocr_pages"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    full_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("PropertyDocument", back_populates="ocr_pages")

class OCRBlock(Base):
    __tablename__ = "ocr_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False, index=True)
    text = Column(Text, nullable=False)
    bounding_box = Column(JSON, nullable=True)  # [x, y, width, height] or polygon coordinates
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("PropertyDocument", back_populates="ocr_blocks")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=True)
    
    entity_type = Column(String(50), nullable=False) # PROPERTY, DOCUMENT, PERSON, TRANSACTION, ENCUMBRANCE
    field_name = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=False)
    source_text = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("PropertyDocument", back_populates="extracted_entities")

class OwnershipEvent(Base):
    __tablename__ = "ownership_events"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, nullable=True)
    
    sequence_order = Column(Integer, default=1)
    transaction_type = Column(String(100), nullable=False)  # Sale Deed, Gift, Inheritance, Partition, etc.
    transfer_date = Column(String(50), nullable=True)
    previous_owner = Column(String(255), nullable=True)
    new_owner = Column(String(255), nullable=False)
    consideration_amount = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    registration_office = Column(String(255), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="ownership_events")

class TransactionEvent(Base):
    __tablename__ = "transaction_events"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, nullable=True)
    
    event_type = Column(String(100), nullable=False)
    party_a = Column(String(255), nullable=True) # Seller / Donor / Mortgagor
    party_b = Column(String(255), nullable=True) # Buyer / Donee / Mortgagee
    date = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="transaction_events")

class RiskFinding(Base):
    __tablename__ = "risk_findings"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="SET NULL"), nullable=True)
    page_number = Column(Integer, nullable=True)
    
    risk_type = Column(String(100), nullable=False, index=True) # Ownership Gap, Survey Mismatch, etc.
    severity = Column(String(50), nullable=False, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    source_text = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="risk_findings")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    page_number = Column(Integer, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    document = relationship("PropertyDocument", back_populates="chunks")

class AIQuery(Base):
    __tablename__ = "ai_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    confidence_score = Column(Float, default=1.0)
    sources = Column(JSON, nullable=True) # List of [{document_id, document_name, page_number, snippet}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="ai_queries")

class VerificationReport(Base):
    __tablename__ = "verification_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    report_title = Column(String(255), nullable=False)
    report_data = Column(JSON, nullable=False)
    pdf_path = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    property = relationship("Property", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    status = Column(String(50), default="SUCCESS")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="audit_logs")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("property_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String(50), default="UPLOADED", index=True)
    stage_progress = Column(Integer, default=0) # 0 to 100 percentage
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    document = relationship("PropertyDocument", back_populates="processing_jobs")
