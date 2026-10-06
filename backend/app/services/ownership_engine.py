from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import OwnershipEvent, ExtractedEntity, PropertyDocument, Property

HEADER_LABELS = {
    "owner name", "owners details", "owner details", "identification documents",
    "relevant record excerpt", "buyer name", "seller name", "previous owner", "current owner"
}

def is_valid_name(val: Optional[str]) -> bool:
    if not val:
        return False
    clean = val.strip()
    if len(clean) < 3:
        return False
    if clean.lower() in HEADER_LABELS:
        return False
    return True

class OwnershipEngine:
    def build_ownership_chain(self, db: Session, property_id: int) -> List[OwnershipEvent]:
        """
        Constructs deterministic ownership timeline graph from extracted entities.
        """
        # Clear old events for clean rebuild
        db.query(OwnershipEvent).filter(OwnershipEvent.property_id == property_id).delete()
        db.commit()

        entities = db.query(ExtractedEntity).filter(ExtractedEntity.property_id == property_id).all()
        documents = db.query(PropertyDocument).filter(PropertyDocument.property_id == property_id).all()

        doc_map = {d.id: d for d in documents}

        # Group entities by document
        doc_entities: Dict[int, List[ExtractedEntity]] = {}
        for ent in entities:
            doc_entities.setdefault(ent.document_id, []).append(ent)

        events = []
        seq = 1
        latest_owner = None

        for doc_id, ent_list in doc_entities.items():
            doc = doc_map.get(doc_id)
            doc_type = doc.document_type if doc else "Title Deed"

            prev_owner = None
            new_owner = None
            reg_date = None
            reg_no = None
            sro = None
            amount = None

            for e in ent_list:
                if e.field_name == "previous_owner" and is_valid_name(e.value):
                    prev_owner = e.value
                elif e.field_name == "current_owner" and is_valid_name(e.value):
                    new_owner = e.value
                elif e.field_name == "execution_date":
                    reg_date = e.value
                elif e.field_name == "registration_number":
                    reg_no = e.value
                elif e.field_name == "registration_office":
                    sro = e.value
                elif e.field_name == "consideration_amount":
                    amount = e.value

            if new_owner or prev_owner:
                clean_new_owner = new_owner if is_valid_name(new_owner) else "Registered Owner"
                clean_prev_owner = prev_owner if is_valid_name(prev_owner) else "Prior Owner / Transferor"

                event = OwnershipEvent(
                    property_id=property_id,
                    document_id=doc_id,
                    page_number=1,
                    sequence_order=seq,
                    transaction_type=doc_type,
                    transfer_date=reg_date or "Date Not Specified",
                    previous_owner=clean_prev_owner,
                    new_owner=clean_new_owner,
                    consideration_amount=amount,
                    registration_number=reg_no,
                    registration_office=sro,
                    confidence=0.92
                )
                db.add(event)
                events.append(event)
                seq += 1

                if is_valid_name(clean_new_owner) and clean_new_owner != "Registered Owner":
                    latest_owner = clean_new_owner

        # Update Property record with verified current owner
        prop = db.query(Property).filter(Property.id == property_id).first()
        if prop and latest_owner:
            prop.current_owner = latest_owner

        db.commit()
        return events

ownership_engine = OwnershipEngine()
