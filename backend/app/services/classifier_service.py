import re
from typing import Dict, Any, List

DOCUMENT_TYPES = [
    "Sale Deed",
    "Gift Deed",
    "Partition Deed",
    "Settlement Deed",
    "Release Deed",
    "Will",
    "Power of Attorney",
    "Encumbrance Certificate",
    "RTC",
    "Patta",
    "Khata",
    "Mutation Record",
    "Tax Receipt",
    "Registration Document",
    "Mortgage Document",
    "Mortgage Release",
    "Court Order",
    "Agreement",
    "Other"
]

class DocumentClassifierService:
    def classify(self, text_by_page: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Classifies document based on text content across all pages.
        Returns: {
            "document_type": str,
            "confidence": float,
            "reason": str,
            "source_page": int
        }
        """
        combined_text = "\n".join([p.get("full_text", "") for p in text_by_page]).lower()
        
        if not combined_text or len(combined_text.strip()) < 10:
            return {
                "document_type": "Other",
                "confidence": 0.3,
                "reason": "Insufficient legible text extracted.",
                "source_page": 1
            }

        keywords_map = {
            "Sale Deed": [
                r"\bsale deed\b", r"\bdeed of sale\b", r"\babsolute sale\b", r"\bvendor\b", r"\bvendee\b", r"\bpurchaser\b", r"\bconsideration amount\b"
            ],
            "Gift Deed": [
                r"\bgift deed\b", r"\bdeed of gift\b", r"\bdonor\b", r"\bdonee\b", r"\bout of love and affection\b"
            ],
            "Partition Deed": [
                r"\bpartition deed\b", r"\bdeed of partition\b", r"\bcoparceners\b", r"\bjoint family\b", r"\bschedule 'a'\b"
            ],
            "Settlement Deed": [
                r"\bsettlement deed\b", r"\bdeed of settlement\b", r"\bsettlor\b", r"\bsettlee\b"
            ],
            "Release Deed": [
                r"\brelease deed\b", r"\bdeed of release\b", r"\breleasor\b", r"\breleasee\b", r"\brelinquish\b"
            ],
            "Will": [
                r"\blast will and testament\b", r"\btestator\b", r"\btestatrix\b", r"\bbequeath\b", r"\bexecutor\b"
            ],
            "Power of Attorney": [
                r"\bpower of attorney\b", r"\bgeneral power of attorney\b", r"\bgpa\b", r"\bspecial power of attorney\b", r"\bconstituted attorney\b"
            ],
            "Encumbrance Certificate": [
                r"\bencumbrance certificate\b", r"\bform no\. 15\b", r"\bform no\. 16\b", r"\bnil encumbrance\b", r"\bsub-registrar office\b"
            ],
            "Patta": [
                r"\bpatta\b", r"\bpatta number\b", r"\bchitta\b", r"\bpatta transfer\b"
            ],
            "Khata": [
                r"\bkhata certificate\b", r"\bkhata extract\b", r"\be-khata\b", r"\bpid number\b", r"\bbbmp\b"
            ],
            "RTC": [
                r"\brtc\b", r"\bpahani\b", r"\brights, tenancy and crop\b", r"\bform no\. 16\b"
            ],
            "Mutation Record": [
                r"\bmutation\b", r"\bmutation register\b", r"\bnamanthara\b", r"\bmr no\b"
            ],
            "Tax Receipt": [
                r"\bproperty tax\b", r"\btax receipt\b", r"\bchallan\b", r"\bproperty tax receipt\b"
            ],
            "Mortgage Document": [
                r"\bmortgage deed\b", r"\bdeed of mortgage\b", r"\bmortgagor\b", r"\bmortgagee\b", r"\bsimple mortgage\b", r"\bpledge\b"
            ],
            "Mortgage Release": [
                r"\bdischarge of mortgage\b", r"\breconveyance\b", r"\brelease of mortgage\b", r"\bmortgage release\b"
            ],
            "Court Order": [
                r"\bin the court of\b", r"\bdecree\b", r"\bjudgment\b", r"\bsuit no\b", r"\binjunction\b"
            ],
            "Agreement": [
                r"\bagreement for sale\b", r"\bagreement to sell\b", r"\bsale agreement\b", r"\bmemorandum of understanding\b"
            ]
        }

        best_doc_type = "Other"
        max_score = 0
        winning_reason = "General document content."
        best_page = 1

        for doc_type, patterns in keywords_map.items():
            score = 0
            found_words = []
            for page in text_by_page:
                p_text = page.get("full_text", "").lower()
                for pat in patterns:
                    matches = re.findall(pat, p_text)
                    if matches:
                        score += len(matches) * 2
                        found_words.append(matches[0])
            
            if score > max_score:
                max_score = score
                best_doc_type = doc_type
                winning_reason = f"Matched keywords: {', '.join(set(found_words))}"

        confidence = min(0.95, 0.4 + (max_score * 0.15)) if max_score > 0 else 0.5
        
        return {
            "document_type": best_doc_type,
            "confidence": round(confidence, 2),
            "reason": winning_reason,
            "source_page": best_page
        }

classifier_service = DocumentClassifierService()
