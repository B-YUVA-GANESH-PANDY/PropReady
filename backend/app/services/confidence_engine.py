from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Property, PropertyDocument, RiskFinding, OwnershipEvent

class ConfidenceEngine:
    def calculate_confidence(self, db: Session, property_id: int) -> Dict[str, Any]:
        """
        Calculates a transparent confidence score percentage (0-100%) and explains reasons.
        """
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        documents = db.query(PropertyDocument).filter(PropertyDocument.property_id == property_id).all()
        risks = db.query(RiskFinding).filter(RiskFinding.property_id == property_id).all()
        events = db.query(OwnershipEvent).filter(OwnershipEvent.property_id == property_id).all()

        if not documents:
            property_obj.overall_confidence = 0.0
            db.commit()
            return {
                "score": 0.0,
                "supporting_factors": [],
                "reducing_factors": ["No documents uploaded yet."]
            }

        score = 100.0
        supporting = []
        reducing = []

        # 1. Document count bonus/penalty
        doc_count = len(documents)
        if doc_count >= 3:
            supporting.append(f"{doc_count} property documents uploaded & analyzed.")
        else:
            score -= (3 - doc_count) * 10
            reducing.append(f"Only {doc_count} document(s) available; historical verification limited.")

        # 2. Risk severity deduction
        critical_count = sum(1 for r in risks if r.severity == "CRITICAL")
        high_count = sum(1 for r in risks if r.severity == "HIGH")
        medium_count = sum(1 for r in risks if r.severity == "MEDIUM")

        if critical_count > 0:
            score -= critical_count * 25
            reducing.append(f"{critical_count} critical risk finding(s) detected (e.g. title chain gap/survey mismatch).")
        if high_count > 0:
            score -= high_count * 15
            reducing.append(f"{high_count} high risk finding(s) identified (e.g. unreleased mortgage).")
        if medium_count > 0:
            score -= medium_count * 5
            reducing.append(f"{medium_count} medium risk finding(s) noted.")

        # 3. Ownership chain check
        if events and len(events) >= 2:
            supporting.append("Multi-event historical ownership chain constructed.")
        elif not events:
            score -= 10
            reducing.append("No clear ownership transfer events extracted.")

        # 4. Encumbrance certificate check
        has_ec = any(d.document_type == "Encumbrance Certificate" for d in documents)
        if has_ec:
            supporting.append("Form 15/16 Encumbrance Certificate verified.")
        else:
            score -= 10
            reducing.append("Missing historical Encumbrance Certificate (EC).")

        final_score = max(5.0, min(99.0, round(score, 1)))

        property_obj.overall_confidence = final_score
        db.commit()

        return {
            "score": final_score,
            "supporting_factors": supporting,
            "reducing_factors": reducing
        }

confidence_engine = ConfidenceEngine()
