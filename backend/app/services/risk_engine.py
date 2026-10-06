from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import (
    RiskFinding, Property, PropertyDocument, ExtractedEntity, OwnershipEvent
)

class RiskEngine:
    def analyze_property_risks(self, db: Session, property_id: int) -> List[RiskFinding]:
        """
        Runs deterministic cross-document rules to identify risk findings.
        """
        # Clear existing findings
        db.query(RiskFinding).filter(RiskFinding.property_id == property_id).delete()
        db.commit()

        property_obj = db.query(Property).filter(Property.id == property_id).first()
        documents = db.query(PropertyDocument).filter(PropertyDocument.property_id == property_id).all()
        entities = db.query(ExtractedEntity).filter(ExtractedEntity.property_id == property_id).all()
        events = db.query(OwnershipEvent).filter(OwnershipEvent.property_id == property_id).order_by(OwnershipEvent.sequence_order).all()

        findings = []

        # 1. No documents uploaded rule
        if not documents:
            rf = RiskFinding(
                property_id=property_id,
                risk_type="Document Missing",
                severity="HIGH",
                title="No Property Documents Uploaded",
                description="No title deeds or encumbrance certificates have been uploaded for verification.",
                reason="Analysis cannot proceed without valid deed files.",
                recommended_action="Upload Sale Deed, Encumbrance Certificate, and Khata documents."
            )
            db.add(rf)
            findings.append(rf)

        # 2. Check for survey number mismatches across documents
        survey_numbers = set()
        for e in entities:
            if e.field_name == "survey_number":
                survey_numbers.add((e.value, e.document_id, e.page_number))

        unique_surveys = set(s[0] for s in survey_numbers)
        if len(unique_surveys) > 1:
            rf = RiskFinding(
                property_id=property_id,
                risk_type="Survey Number Mismatch",
                severity="CRITICAL",
                title="Inconsistent Survey Numbers Detected",
                description=f"Multiple conflicting survey numbers found across documents: {', '.join(unique_surveys)}",
                reason="Cross-document verification identified differing survey numbers.",
                recommended_action="Verify boundary survey map (FMB) and revenue mutation records to confirm exact survey number."
            )
            db.add(rf)
            findings.append(rf)

        # 3. Check for Encumbrances / Mortgages without Release Deed
        has_mortgage = False
        has_release = False
        mortgage_doc_id = None

        for d in documents:
            if d.document_type == "Mortgage Document":
                has_mortgage = True
                mortgage_doc_id = d.id
            elif d.document_type == "Mortgage Release":
                has_release = True

        for e in entities:
            if e.entity_type == "ENCUMBRANCE":
                has_mortgage = True
                mortgage_doc_id = e.document_id

        if has_mortgage and not has_release:
            rf = RiskFinding(
                property_id=property_id,
                document_id=mortgage_doc_id,
                risk_type="Mortgage/Encumbrance",
                severity="HIGH",
                title="Unreleased Mortgage / Bank Loan Charge Detected",
                description="Uploaded documents indicate an active mortgage or charge without an accompanying discharge / release deed.",
                reason="A mortgage document or bank encumbrance record was found, but no release deed is uploaded.",
                recommended_action="Obtain and upload a registered Discharge of Mortgage / No Objection Certificate (NOC) from the lending institution."
            )
            db.add(rf)
            findings.append(rf)

        # 4. Check for Ownership Chain Discontinuities
        if len(events) > 1:
            for i in range(len(events) - 1):
                curr_event = events[i]
                next_event = events[i+1]
                
                # If Next Transferor != Current Transferee
                if curr_event.new_owner and next_event.previous_owner:
                    c_owner = curr_event.new_owner.lower()
                    p_owner = next_event.previous_owner.lower()
                    if c_owner not in p_owner and p_owner not in c_owner:
                        rf = RiskFinding(
                            property_id=property_id,
                            document_id=next_event.document_id,
                            risk_type="Ownership Gap",
                            severity="CRITICAL",
                            title="Ownership Chain Link Discontinuity",
                            description=f"Potential title gap between '{curr_event.new_owner}' and '{next_event.previous_owner}'.",
                            reason="The seller in the subsequent deed does not match the buyer in the preceding deed.",
                            recommended_action="Verify intermediate link deeds, partition deeds, or legal heirship certificates."
                        )
                        db.add(rf)
                        findings.append(rf)

        # 5. Check missing Encumbrance Certificate (EC)
        ec_present = any(d.document_type == "Encumbrance Certificate" for d in documents)
        if documents and not ec_present:
            rf = RiskFinding(
                property_id=property_id,
                risk_type="Document Missing",
                severity="MEDIUM",
                title="Encumbrance Certificate (EC) Missing",
                description="Potentially missing supporting document: Form 15/16 Encumbrance Certificate.",
                reason="No Encumbrance Certificate found in uploaded documents for cross-verification.",
                recommended_action="Obtain an updated Encumbrance Certificate for 15-30 years from the Sub-Registrar Office."
            )
            db.add(rf)
            findings.append(rf)

        db.commit()

        # Update property overall risk level
        severities = [f.severity for f in findings]
        if "CRITICAL" in severities:
            property_obj.overall_risk_level = "CRITICAL"
            property_obj.verification_status = "HIGH_RISK"
        elif "HIGH" in severities:
            property_obj.overall_risk_level = "HIGH"
            property_obj.verification_status = "NEEDS_REVIEW"
        elif "MEDIUM" in severities:
            property_obj.overall_risk_level = "MEDIUM"
            property_obj.verification_status = "NEEDS_REVIEW"
        elif documents:
            property_obj.overall_risk_level = "LOW"
            property_obj.verification_status = "COMPLETED"
        else:
            property_obj.overall_risk_level = "NOT_ANALYZED"
            property_obj.verification_status = "NOT_ANALYZED"

        db.commit()
        return findings

risk_engine = RiskEngine()
