import datetime
from sqlalchemy.orm import Session
from app.models.entities import PropertyDocument, ProcessingJob, OCRPage, OCRBlock, ExtractedEntity, DocumentChunk
from app.services.ocr_service import ocr_service
from app.services.classifier_service import classifier_service
from app.services.entity_extractor_service import entity_extractor_service
from app.services.vector_store_service import vector_store_service
from app.services.ownership_engine import ownership_engine
from app.services.risk_engine import risk_engine
from app.services.confidence_engine import confidence_engine

def process_document_pipeline(db: Session, document_id: int):
    """
    Executes complete end-to-end background document processing pipeline.
    """
    doc = db.query(PropertyDocument).filter(PropertyDocument.id == document_id).first()
    if not doc:
        return

    job = db.query(ProcessingJob).filter(ProcessingJob.document_id == document_id).first()
    if not job:
        job = ProcessingJob(
            document_id=document_id,
            property_id=doc.property_id,
            user_id=doc.user_id,
            status="PROCESSING",
            stage_progress=10
        )
        db.add(job)
        db.commit()

    try:
        # Stage 1: Validation
        doc.processing_status = "VALIDATING"
        job.status = "VALIDATING"
        job.stage_progress = 15
        db.commit()

        # Stage 2: Page-Aware OCR Processing
        doc.processing_status = "OCR_PROCESSING"
        job.status = "OCR_PROCESSING"
        job.stage_progress = 30
        db.commit()

        page_count, pages_data = ocr_service.process_document(doc.file_path, doc.mime_type)
        doc.page_count = page_count

        # Clear existing OCR data
        db.query(OCRPage).filter(OCRPage.document_id == document_id).delete()
        db.query(OCRBlock).filter(OCRBlock.document_id == document_id).delete()

        all_text_by_page = []
        for p in pages_data:
            ocr_p = OCRPage(
                document_id=document_id,
                page_number=p["page_number"],
                full_text=p["full_text"]
            )
            db.add(ocr_p)
            all_text_by_page.append(p)

            for b in p.get("blocks", []):
                ocr_b = OCRBlock(
                    document_id=document_id,
                    page_number=p["page_number"],
                    text=b["text"],
                    bounding_box=b.get("bounding_box"),
                    confidence=b.get("confidence", 1.0)
                )
                db.add(ocr_b)

        doc.processing_status = "OCR_COMPLETED"
        job.stage_progress = 50
        db.commit()

        # Stage 3: Document Classification
        doc.processing_status = "CLASSIFYING"
        job.status = "CLASSIFYING"
        job.stage_progress = 60
        db.commit()

        class_res = classifier_service.classify(all_text_by_page)
        doc.document_type = class_res["document_type"]
        doc.classification_confidence = class_res["confidence"]
        doc.classification_reason = class_res["reason"]

        # Stage 4: Structured Entity Extraction
        doc.processing_status = "EXTRACTING"
        job.status = "EXTRACTING"
        job.stage_progress = 75
        db.commit()

        # Clear existing entities for this doc
        db.query(ExtractedEntity).filter(ExtractedEntity.document_id == document_id).delete()
        
        extracted = entity_extractor_service.extract_entities(all_text_by_page, doc.document_type)
        for e in extracted:
            ee = ExtractedEntity(
                property_id=doc.property_id,
                document_id=document_id,
                page_number=e["page_number"],
                entity_type=e["entity_type"],
                field_name=e["field_name"],
                value=e["value"],
                source_text=e.get("source_text"),
                confidence=e.get("confidence", 1.0)
            )
            db.add(ee)

        # Stage 5: Document Chunking & FAISS Vector Indexing
        doc.processing_status = "INDEXING"
        job.status = "INDEXING"
        job.stage_progress = 85
        db.commit()

        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        
        chunks_to_index = []
        for p in all_text_by_page:
            p_text = p.get("full_text", "")
            if not p_text.strip():
                continue
            
            # Simple sentence/paragraph chunking
            paragraphs = [para.strip() for para in p_text.split("\n\n") if para.strip()]
            if not paragraphs:
                paragraphs = [p_text]

            for c_idx, para in enumerate(paragraphs):
                dc = DocumentChunk(
                    document_id=document_id,
                    property_id=doc.property_id,
                    user_id=doc.user_id,
                    page_number=p["page_number"],
                    chunk_index=c_idx + 1,
                    chunk_text=para
                )
                db.add(dc)
                
                chunks_to_index.append({
                    "user_id": doc.user_id,
                    "property_id": doc.property_id,
                    "document_id": document_id,
                    "document_name": doc.original_filename,
                    "document_type": doc.document_type,
                    "page_number": p["page_number"],
                    "chunk_index": c_idx + 1,
                    "chunk_text": para
                })

        db.commit()
        vector_store_service.add_chunks(chunks_to_index)

        # Stage 6: Ownership Graph, Cross-Document Verification & Risk Analysis
        doc.processing_status = "VERIFYING"
        job.status = "VERIFYING"
        job.stage_progress = 95
        db.commit()

        ownership_engine.build_ownership_chain(db, doc.property_id)
        risk_engine.analyze_property_risks(db, doc.property_id)
        confidence_engine.calculate_confidence(db, doc.property_id)

        # Stage 7: Pipeline Completed
        doc.processing_status = "COMPLETED"
        job.status = "COMPLETED"
        job.stage_progress = 100
        job.completed_at = datetime.datetime.utcnow()
        db.commit()

    except Exception as e:
        db.rollback()
        error_str = str(e)
        doc.processing_status = "FAILED"
        doc.failure_reason = error_str
        job.status = "FAILED"
        job.error_message = error_str
        db.commit()
        print(f"Pipeline processing failed for document {document_id}: {e}")
