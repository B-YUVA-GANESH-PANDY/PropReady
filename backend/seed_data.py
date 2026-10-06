import sys
import os
import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.entities import (
    User, Property, PropertyDocument, OCRPage, OCRBlock, ExtractedEntity,
    OwnershipEvent, RiskFinding, DocumentChunk
)
from app.core.security import hash_password
from app.services.vector_store_service import vector_store_service

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Demo User
        demo_user = db.query(User).filter(User.email == "user@propready.local").first()
        if not demo_user:
            demo_user = User(
                email="user@propready.local",
                password_hash=hash_password("User@PropReady2026"),
                full_name="Rajesh Kumar",
                role="USER",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Created Demo User: user@propready.local")

        # 2. Demo Property
        existing_prop = db.query(Property).filter(Property.user_id == demo_user.id).first()
        if not existing_prop:
            prop = Property(
                user_id=demo_user.id,
                title="Greenfield Enclave Plot 42",
                property_id_code="PRP-8842A190",
                address="Plot No. 42, 5th Main Road, Whitefield",
                village="Hoodi",
                taluk="Bengaluru East",
                district="Bengaluru Urban",
                state="Karnataka",
                survey_number="142",
                sub_survey_number="3B",
                plot_number="42",
                khata_number="KHT-2024-9912",
                patta_number="PT-88120",
                area_extent="2,400 sq.ft",
                boundaries="North: Road, South: Plot 43, East: Survey 143, West: Plot 41",
                land_type="Residential Non-Agricultural",
                current_owner="Ananya Sharma",
                overall_confidence=85.0,
                overall_risk_level="MEDIUM",
                verification_status="NEEDS_REVIEW"
            )
            db.add(prop)
            db.commit()
            db.refresh(prop)
            print(f"Created Demo Property ID: {prop.id}")

            # 3. Demo Documents
            doc1 = PropertyDocument(
                property_id=prop.id,
                user_id=demo_user.id,
                original_filename="Absolute_Sale_Deed_2019.pdf",
                stored_filename="doc_sale_deed_2019.pdf",
                file_path=os.path.abspath("./data/uploads/doc_sale_deed_2019.pdf"),
                mime_type="application/pdf",
                file_size=2450000,
                page_count=6,
                document_type="Sale Deed",
                classification_confidence=0.95,
                classification_reason="Matched keywords: sale deed, vendor, vendee, consideration",
                processing_status="COMPLETED"
            )
            doc2 = PropertyDocument(
                property_id=prop.id,
                user_id=demo_user.id,
                original_filename="Encumbrance_Certificate_Form15.pdf",
                stored_filename="doc_ec_form15.pdf",
                file_path=os.path.abspath("./data/uploads/doc_ec_form15.pdf"),
                mime_type="application/pdf",
                file_size=1800000,
                page_count=3,
                document_type="Encumbrance Certificate",
                classification_confidence=0.92,
                classification_reason="Matched keywords: encumbrance certificate, form 15, sub-registrar",
                processing_status="COMPLETED"
            )
            db.add_all([doc1, doc2])
            db.commit()

            # 4. OCR Pages & Blocks
            p1_text = (
                "ABSOLUTE SALE DEED\n"
                "This Deed of Absolute Sale executed on 14th August 2019 at Sub-Registrar Office Bengaluru East.\n"
                "VENDOR: Suresh Reddy, son of Ramaiah, residing at Hoodi, Bengaluru.\n"
                "VENDEE: Ananya Sharma, daughter of V. Sharma, residing at Indiranagar, Bengaluru.\n"
                "PROPERTY SCHEDULE: All that piece and parcel of residential land in Survey No. 142/3B, Plot No. 42, "
                "measuring 2,400 sq.ft situated at Hoodi Village, Bengaluru East Taluk. Khata No. KHT-2024-9912.\n"
                "CONSIDERATION: Total sale consideration of Rs. 65,00,000/- (Rupees Sixty Five Lakhs Only) paid in full.\n"
                "PREVIOUS TITLE: The Vendor purchased the property from Ramesh Rao under Registered Sale Deed No. 4512/2007."
            )
            ocr1 = OCRPage(document_id=doc1.id, page_number=1, full_text=p1_text)
            db.add(ocr1)

            p2_text = (
                "FORM NO. 15 - ENCUMBRANCE CERTIFICATE\n"
                "Search Period: 01/01/2000 to 31/12/2024. Sub-Registrar Office Bengaluru East.\n"
                "Entry 1: Sale Deed Doc No. 1204/2001. Seller: K. Gowda -> Buyer: Ramesh Rao. Survey 142/3B.\n"
                "Entry 2: Sale Deed Doc No. 4512/2007. Seller: Ramesh Rao -> Buyer: Suresh Reddy. Survey 142/3B.\n"
                "Entry 3: Mortgage Deed Doc No. 8920/2015. Mortgagor: Suresh Reddy -> Mortgagee: State Bank of India. Amount: Rs. 25,00,000.\n"
                "Entry 4: Sale Deed Doc No. 7821/2019. Seller: Suresh Reddy -> Buyer: Ananya Sharma. Survey 142/3B."
            )
            ocr2 = OCRPage(document_id=doc2.id, page_number=1, full_text=p2_text)
            db.add(ocr2)
            db.commit()

            # 5. Extracted Entities
            entities_list = [
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="PROPERTY", field_name="survey_number", value="142", source_text="Survey No. 142/3B", confidence=0.95),
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="PROPERTY", field_name="sub_survey_number", value="3B", source_text="Survey No. 142/3B", confidence=0.95),
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="PROPERTY", field_name="area_extent", value="2,400 sq.ft", source_text="measuring 2,400 sq.ft", confidence=0.9),
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="PERSON", field_name="previous_owner", value="Suresh Reddy", source_text="VENDOR: Suresh Reddy", confidence=0.9),
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="PERSON", field_name="current_owner", value="Ananya Sharma", source_text="VENDEE: Ananya Sharma", confidence=0.9),
                ExtractedEntity(property_id=prop.id, document_id=doc1.id, page_number=1, entity_type="DOCUMENT", field_name="registration_number", value="7821/2019", source_text="Doc No. 7821/2019", confidence=0.95),
                ExtractedEntity(property_id=prop.id, document_id=doc2.id, page_number=1, entity_type="ENCUMBRANCE", field_name="encumbrance_type", value="Mortgage", source_text="Mortgage Deed Doc No. 8920/2015 State Bank of India", confidence=0.95),
            ]
            db.add_all(entities_list)
            db.commit()

            # 6. Ownership Chain Events
            ev1 = OwnershipEvent(property_id=prop.id, document_id=doc2.id, page_number=1, sequence_order=1, transaction_type="Sale Deed", transfer_date="15/05/2001", previous_owner="K. Gowda", new_owner="Ramesh Rao", registration_number="1204/2001", confidence=0.9)
            ev2 = OwnershipEvent(property_id=prop.id, document_id=doc2.id, page_number=1, sequence_order=2, transaction_type="Sale Deed", transfer_date="10/09/2007", previous_owner="Ramesh Rao", new_owner="Suresh Reddy", registration_number="4512/2007", confidence=0.9)
            ev3 = OwnershipEvent(property_id=prop.id, document_id=doc1.id, page_number=1, sequence_order=3, transaction_type="Sale Deed", transfer_date="14/08/2019", previous_owner="Suresh Reddy", new_owner="Ananya Sharma", registration_number="7821/2019", consideration_amount="Rs. 65,00,000", confidence=0.95)
            db.add_all([ev1, ev2, ev3])
            db.commit()

            # 7. Risk Finding
            rf1 = RiskFinding(
                property_id=prop.id,
                document_id=doc2.id,
                page_number=1,
                risk_type="Mortgage/Encumbrance",
                severity="HIGH",
                title="Unreleased Mortgage Charge (State Bank of India)",
                description="Encumbrance Certificate lists a Mortgage Deed (Doc No. 8920/2015) in favor of State Bank of India without a registered Mortgage Release deed.",
                reason="No Discharge of Mortgage Deed or bank NOC has been uploaded.",
                source_text="Mortgage Deed Doc No. 8920/2015",
                recommended_action="Obtain NOC / Registered Release Deed from State Bank of India to clear charge."
            )
            rf2 = RiskFinding(
                property_id=prop.id,
                risk_type="Document Missing",
                severity="MEDIUM",
                title="Patta / Mutation Record Missing",
                description="Potentially missing supporting document: Revenue Patta / Mutation Extract.",
                reason="Only Sale Deed and EC uploaded; revenue mutation certificate not attached.",
                recommended_action="Upload latest e-Khata certificate and Revenue Mutation Extract."
            )
            db.add_all([rf1, rf2])
            db.commit()

            # 8. Index Vector Chunks
            chunks = [
                {
                    "user_id": demo_user.id,
                    "property_id": prop.id,
                    "document_id": doc1.id,
                    "document_name": doc1.original_filename,
                    "document_type": doc1.document_type,
                    "page_number": 1,
                    "chunk_index": 1,
                    "chunk_text": p1_text
                },
                {
                    "user_id": demo_user.id,
                    "property_id": prop.id,
                    "document_id": doc2.id,
                    "document_name": doc2.original_filename,
                    "document_type": doc2.document_type,
                    "page_number": 1,
                    "chunk_index": 1,
                    "chunk_text": p2_text
                }
            ]
            vector_store_service.add_chunks(chunks)
            print("Successfully seeded demo data for Greenfield Enclave Plot 42!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
