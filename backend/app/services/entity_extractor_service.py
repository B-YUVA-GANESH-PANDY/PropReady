import re
import unicodedata
from typing import List, Dict, Any, Optional

# List of header label strings that must NEVER be returned as actual person names
HEADER_LABEL_DISCARD_LIST = {
    "owner name", "owners details", "owner details", "owners name", "identification documents",
    "relevant record excerpt", "buyer name", "seller name", "previous owner", "current owner",
    "purchaser name", "vendor name", "transferee name", "transferor name", "name of owner",
    "father name", "husband name", "patta holder", "khata holder", "schedule property",
    "உரிமையாளர் பெயர்", "மாલિક का नाम", "ಖಾತೆದಾರರ ಹೆಸರು"
}

def clean_person_name(name_str: str) -> Optional[str]:
    """
    Cleans and validates extracted person names.
    Returns None if the extracted string is a generic label or corrupted header.
    """
    if not name_str:
        return None
    name_clean = re.sub(r'[\r\n\t]+', ' ', name_str).strip()
    # Strip leading/trailing punctuation except dots in initials
    name_clean = re.sub(r'^[^\w]+|[^\w]+$', '', name_clean).strip()

    if len(name_clean) < 3:
        return None

    # Check if string matches any header label exactly or closely
    lower_name = name_clean.lower()
    if lower_name in HEADER_LABEL_DISCARD_LIST:
        return None
    for label in HEADER_LABEL_DISCARD_LIST:
        if lower_name == label or lower_name.startswith(label + ":") or lower_name.startswith(label + " -"):
            return None

    # Filter out numeric only or document titles
    if name_clean.replace('.', '').isdigit():
        return None

    return name_clean

class EntityExtractorService:
    def extract_entities(self, text_by_page: List[Dict[str, Any]], doc_type: str) -> List[Dict[str, Any]]:
        """
        Extracts structured property, person, transaction, document, and encumbrance entities.
        """
        extracted = []

        for page in text_by_page:
            page_num = page.get("page_number", 1)
            raw_text = page.get("full_text", "")
            if not raw_text:
                continue

            # Apply Unicode normalization
            text = unicodedata.normalize('NFC', raw_text)

            # 1. Survey Number & Sub-Survey Number
            survey_match = re.search(
                r'(?:survey\s*(?:no|number)|sy\.?\s*no\.?|சர்வே\s*எண்|सर्वे\s*नंबर|ಸರ್ವೇ\s*ನಂಬರ್)\s*[:\-\s]*([0-9]+(?:\/[0-9A-Za-z]+)?)',
                text, re.IGNORECASE
            )
            if survey_match:
                full_s_no = survey_match.group(1).strip()
                parts = full_s_no.split('/')
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "survey_number",
                    "value": parts[0],
                    "source_text": survey_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.95
                })
                if len(parts) > 1:
                    extracted.append({
                        "entity_type": "PROPERTY",
                        "field_name": "sub_survey_number",
                        "value": parts[1],
                        "source_text": survey_match.group(0),
                        "page_number": page_num,
                        "confidence": 0.95
                    })

            # 2. Khata / Patta Number
            khata_match = re.search(
                r'(?:khata\s*(?:no|number)|e-khata|खाता\s*संख्या|ಖಾತೆ\s*ಸಂಖ್ಯೆ)\s*[:\-\s]*([A-Za-z0-9\/-]+)',
                text, re.IGNORECASE
            )
            if khata_match:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "khata_number",
                    "value": khata_match.group(1).strip(),
                    "source_text": khata_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.90
                })

            patta_match = re.search(
                r'(?:patta\s*(?:no|number)|பட்டா\s*எண்)\s*[:\-\s]*([A-Za-z0-9\/-]+)',
                text, re.IGNORECASE
            )
            if patta_match:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "patta_number",
                    "value": patta_match.group(1).strip(),
                    "source_text": patta_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.90
                })

            # 3. Extent / Area
            area_match = re.search(
                r'(?:extent|area|measuring|விஸ்தீரணம்|क्षेत्रफल)\s*[:\-\s]*([0-9\.]+\s*(?:sq\.?\s*ft|sq\.?\s*meters|acres?|guntas?|cents?|hectares?))',
                text, re.IGNORECASE
            )
            if area_match:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "area_extent",
                    "value": area_match.group(1).strip(),
                    "source_text": area_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.90
                })

            # 4. Village, Taluk, District
            village_match = re.search(r'(?:village|grama|கிராமம்|गाँव)\s*[:\-\s]*([A-Za-z\u0900-\u0D7F\s]+?)(?:,|\.|\n|taluk|hobli)', text, re.IGNORECASE)
            if village_match and len(village_match.group(1).strip()) > 2:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "village",
                    "value": village_match.group(1).strip(),
                    "source_text": village_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.85
                })

            taluk_match = re.search(r'(?:taluk|taluka|tehsil|தாலுகா)\s*[:\-\s]*([A-Za-z\u0900-\u0D7F\s]+?)(?:,|\.|\n|district)', text, re.IGNORECASE)
            if taluk_match and len(taluk_match.group(1).strip()) > 2:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "taluk",
                    "value": taluk_match.group(1).strip(),
                    "source_text": taluk_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.85
                })

            district_match = re.search(r'(?:district|dist\.?|மாவட்டம்|जिला)\s*[:\-\s]*([A-Za-z\u0900-\u0D7F\s]+?)(?:,|\.|\n|state)', text, re.IGNORECASE)
            if district_match and len(district_match.group(1).strip()) > 2:
                extracted.append({
                    "entity_type": "PROPERTY",
                    "field_name": "district",
                    "value": district_match.group(1).strip(),
                    "source_text": district_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.85
                })

            # 5. Document / Registration Number & Office
            doc_no_match = re.search(r'(?:doc(?:ument)?\s*(?:no|number)|registered\s*as\s*no\.?|பத்திர\s*எண்)\s*[:\-\s]*([A-Za-z0-9\/-]+)', text, re.IGNORECASE)
            if doc_no_match:
                extracted.append({
                    "entity_type": "DOCUMENT",
                    "field_name": "registration_number",
                    "value": doc_no_match.group(1).strip(),
                    "source_text": doc_no_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.95
                })

            sro_match = re.search(r'(?:sub-registrar|sro|registered\s*at|சார்\s*பதிவாளர்)\s*[:\-\s]*([A-Za-z0-9\u0900-\u0D7F\s,\.]+?)(?:\n|\.|$)', text, re.IGNORECASE)
            if sro_match and len(sro_match.group(1).strip()) > 3:
                extracted.append({
                    "entity_type": "DOCUMENT",
                    "field_name": "registration_office",
                    "value": sro_match.group(1).strip()[:100],
                    "source_text": sro_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.85
                })

            # 6. Dates
            date_matches = re.findall(r'\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b', text, re.IGNORECASE)
            if date_matches:
                extracted.append({
                    "entity_type": "DOCUMENT",
                    "field_name": "execution_date",
                    "value": date_matches[0],
                    "source_text": f"Date: {date_matches[0]}",
                    "page_number": page_num,
                    "confidence": 0.90
                })

            # 7. Person / Owner Extraction Logic (Seller / Previous Owner vs Buyer / Current Owner)
            # Pattern 1: Key-Value format (e.g. "Owner Name: Ramesh Kumar", "Vendee: Suresh Kumar")
            owner_kv_matches = re.finditer(
                r'(?:current\s*owner|owner\s*name|vendee|purchaser|buyer|donee|transferee|khata\s*holder|patta\s*holder|உரிமையாளர்|मालिक|ಖಾತೆದಾರರು)\s*[:\-\s]+([A-Z\u0900-\u0D7F][a-z\u0900-\u0D7F]+(?:\s+[A-Z\u0900-\u0D7F][a-z\u0900-\u0D7F]+)+)',
                text, re.IGNORECASE
            )
            for m in owner_kv_matches:
                clean_name = clean_person_name(m.group(1))
                if clean_name:
                    extracted.append({
                        "entity_type": "PERSON",
                        "field_name": "current_owner",
                        "value": clean_name,
                        "source_text": m.group(0),
                        "page_number": page_num,
                        "confidence": 0.92
                    })

            seller_kv_matches = re.finditer(
                r'(?:previous\_owner|seller|vendor|donor|transferor|mortgagor|விற்பனையாளர்|विक्रेता|ಮಾರಾಟಗಾರರು)\s*[:\-\s]+([A-Z\u0900-\u0D7F][a-z\u0900-\u0D7F]+(?:\s+[A-Z\u0900-\u0D7F][a-z\u0900-\u0D7F]+)+)',
                text, re.IGNORECASE
            )
            for m in seller_kv_matches:
                clean_name = clean_person_name(m.group(1))
                if clean_name:
                    extracted.append({
                        "entity_type": "PERSON",
                        "field_name": "previous_owner",
                        "value": clean_name,
                        "source_text": m.group(0),
                        "page_number": page_num,
                        "confidence": 0.88
                    })

            # 8. Consideration Amount
            val_match = re.search(r'(?:consideration|value|sale\s*price|amount)\s*(?:of|is)?\s*[:\-\s]*(?:rs\.?|inr)?\s*([0-9,]+(?:\/\-|\s*rupees)?)', text, re.IGNORECASE)
            if val_match:
                extracted.append({
                    "entity_type": "TRANSACTION",
                    "field_name": "consideration_amount",
                    "value": val_match.group(1).strip(),
                    "source_text": val_match.group(0),
                    "page_number": page_num,
                    "confidence": 0.85
                })

            # 9. Encumbrances / Mortgages
            mortgage_match = re.search(r'\b(mortgage|bank\s*loan|hypothecation|charge|court\s*order|dispute|injunction|lis\s*pendens)\b', text, re.IGNORECASE)
            if mortgage_match:
                extracted.append({
                    "entity_type": "ENCUMBRANCE",
                    "field_name": "encumbrance_type",
                    "value": mortgage_match.group(1).strip().title(),
                    "source_text": text[max(0, text.find(mortgage_match.group(0))-50):min(len(text), text.find(mortgage_match.group(0))+100)],
                    "page_number": page_num,
                    "confidence": 0.90
                })

        return extracted

entity_extractor_service = EntityExtractorService()
