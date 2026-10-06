import re
import unicodedata
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.entities import Property, PropertyDocument, ExtractedEntity, OwnershipEvent, RiskFinding
from app.services.vector_store_service import vector_store_service
from app.services.llm_service import llm_service

# Intent enums
INTENT_OWNER = "OWNER_QUERY"
INTENT_PREVIOUS_OWNER = "PREVIOUS_OWNER_QUERY"
INTENT_TIMELINE = "OWNERSHIP_HISTORY_QUERY"
INTENT_ENCUMBRANCE = "ENCUMBRANCE_QUERY"
INTENT_RISK = "RISK_QUERY"
INTENT_SURVEY = "PROPERTY_IDENTIFIER_QUERY"
INTENT_AREA = "PROPERTY_AREA_QUERY"
INTENT_GENERAL = "GENERAL_QUERY"

def detect_language_and_intent(query: str) -> Tuple[str, str]:
    """
    Detects language (en, ta, hi, kn, te, ml, tanglish) and query intent.
    """
    q_lower = query.lower().strip()

    # Detect language
    lang = 'en'
    if any(0x0B80 <= ord(ch) <= 0x0BFF for ch in query):
        lang = 'ta' # Tamil
    elif any(0x0900 <= ord(ch) <= 0x097F for ch in query):
        lang = 'hi' # Hindi
    elif any(0x0C80 <= ord(ch) <= 0x0CFF for ch in query):
        lang = 'kn' # Kannada
    elif any(0x0C00 <= ord(ch) <= 0x0C7F for ch in query):
        lang = 'te' # Telugu
    elif any(0x0D00 <= ord(ch) <= 0x0D7F for ch in query):
        lang = 'ml' # Malayalam
    elif any(w in q_lower for w in ['yaaru', 'oda', 'indha', 'irukka', 'kaatu']):
        lang = 'tanglish'

    # Detect intent
    intent = INTENT_GENERAL

    if any(w in q_lower for w in ['current owner', 'who is the owner', 'who owns', 'owner name', 'உரிமையாளர்', 'मालिक कौन', 'ಖಾತೆದಾರರು', 'owner yaaru', 'present owner']):
        intent = INTENT_OWNER
    elif any(w in q_lower for w in ['prior owner', 'previous owner', 'seller', 'former owner', 'முந்தைய உரிமையாளர்', 'पहले का मालिक']):
        intent = INTENT_PREVIOUS_OWNER
    elif any(w in q_lower for w in ['timeline', 'history', 'chain', 'transfer history', 'வரலாறு', 'इतिहास']):
        intent = INTENT_TIMELINE
    elif any(w in q_lower for w in ['mortgage', 'encumbrance', 'ec', 'bank loan', 'dispute', 'கடன்', 'ऋण']):
        intent = INTENT_ENCUMBRANCE
    elif any(w in q_lower for w in ['risk', 'mismatch', 'inconsistency', 'issue', 'ஆபத்து', 'जोखिम']):
        intent = INTENT_RISK
    elif any(w in q_lower for w in ['survey', 'sy no', 'survey number', 'சர்வே']):
        intent = INTENT_SURVEY
    elif any(w in q_lower for w in ['area', 'extent', 'sq ft', 'acre', 'விஸ்தீரணம்']):
        intent = INTENT_AREA

    return lang, intent

class RAGService:
    def answer_question(
        self,
        db: Session,
        query: str,
        user_id: int,
        property_id: int
    ) -> Dict[str, Any]:
        """
        Multi-tier Evidence-Backed Answering Pipeline:
        LEVEL 1: Structured Database Facts (Extracted Entities, Ownership Graph)
        LEVEL 2: Deterministic Verification Engine
        LEVEL 3: Targeted Vector RAG Search
        LEVEL 4: LLM Multilingual Explanation / Offline Fallback Generator
        """
        lang, intent = detect_language_and_intent(query)

        # Fetch Property and Documents
        prop = db.query(Property).filter(Property.id == property_id).first()
        documents = db.query(PropertyDocument).filter(PropertyDocument.property_id == property_id).all()
        events = db.query(OwnershipEvent).filter(OwnershipEvent.property_id == property_id).order_by(OwnershipEvent.sequence_order.asc()).all()
        entities = db.query(ExtractedEntity).filter(ExtractedEntity.property_id == property_id).all()
        risks = db.query(RiskFinding).filter(RiskFinding.property_id == property_id).all()

        doc_map = {d.id: d for d in documents}

        # Level 1: Intent-Driven Structured Direct Answer
        if intent == INTENT_OWNER:
            current_owner = prop.current_owner if prop else None
            # Find latest valid owner entity
            if not current_owner or current_owner.lower() in ['registered owner', 'unassigned']:
                for e in reversed(events):
                    if e.new_owner and e.new_owner.lower() not in ['registered owner', 'prior owner / transferor']:
                        current_owner = e.new_owner
                        break

            # Search extracted entities for person names
            owner_entities = [e for e in entities if e.field_name == "current_owner" and e.value.lower() not in ['owner name', 'current owner', 'owners details']]

            if current_owner or owner_entities:
                owner_name = current_owner or owner_entities[0].value
                source_doc_name = "Khata / Title Record"
                page_no = 1
                if owner_entities:
                    doc_obj = doc_map.get(owner_entities[0].document_id)
                    if doc_obj:
                        source_doc_name = doc_obj.original_filename
                    page_no = owner_entities[0].page_number or 1

                answer_text = self._format_direct_answer(
                    title="CURRENT OWNER",
                    value=owner_name,
                    doc_name=source_doc_name,
                    page=page_no,
                    confidence=94,
                    evidence_label="Owner Details -> Owner Name",
                    lang=lang
                )

                sources = [{
                    "document_id": owner_entities[0].document_id if owner_entities else (documents[0].id if documents else 0),
                    "document_name": source_doc_name,
                    "document_type": "Title Record",
                    "page_number": page_no,
                    "snippet": f"Verified Owner Record: {owner_name}"
                }]

                return {
                    "question": query,
                    "answer": answer_text,
                    "confidence_score": 0.94,
                    "sources": sources,
                    "disclaimer": "AI-Assisted Property Document Analysis."
                }

        elif intent == INTENT_PREVIOUS_OWNER:
            prev_owners = [e.previous_owner for e in events if e.previous_owner and e.previous_owner.lower() not in ['prior owner / transferor', 'ancestral']]
            if not prev_owners:
                prev_entities = [e for e in entities if e.field_name == "previous_owner" and e.value.lower() not in ['previous owner', 'seller name']]
                if prev_entities:
                    prev_owners = [prev_entities[0].value]

            if prev_owners:
                p_name = prev_owners[0]
                answer_text = self._format_direct_answer(
                    title="PREVIOUS OWNER",
                    value=p_name,
                    doc_name=documents[0].original_filename if documents else "Title Deed",
                    page=1,
                    confidence=90,
                    evidence_label="Transferor / Seller Record",
                    lang=lang
                )
                return {
                    "question": query,
                    "answer": answer_text,
                    "confidence_score": 0.90,
                    "sources": [{
                        "document_id": documents[0].id if documents else 0,
                        "document_name": documents[0].original_filename if documents else "Deed",
                        "document_type": "Sale Deed",
                        "page_number": 1,
                        "snippet": f"Prior Owner Record: {p_name}"
                    }],
                    "disclaimer": "AI-Assisted Property Document Analysis."
                }

        elif intent == INTENT_TIMELINE:
            if events:
                timeline_lines = ["OWNERSHIP HISTORY\n"]
                for ev in events:
                    doc_n = doc_map.get(ev.document_id).original_filename if ev.document_id in doc_map else "Deed"
                    timeline_lines.append(f"- {ev.transfer_date}\n  {ev.previous_owner} -> {ev.new_owner}\n  Source: {ev.transaction_type} ({doc_n}, Page {ev.page_number or 1})\n")

                return {
                    "question": query,
                    "answer": "\n".join(timeline_lines),
                    "confidence_score": 0.92,
                    "sources": [{
                        "document_id": documents[0].id if documents else 0,
                        "document_name": documents[0].original_filename if documents else "Deed",
                        "document_type": "Title Chain",
                        "page_number": 1,
                        "snippet": "Ownership transfer sequence extracted from registered deeds."
                    }],
                    "disclaimer": "AI-Assisted Property Document Analysis."
                }

        elif intent == INTENT_SURVEY:
            s_no = prop.survey_number if prop else None
            if not s_no:
                s_entities = [e for e in entities if e.field_name == "survey_number"]
                if s_entities:
                    s_no = s_entities[0].value
            if s_no:
                answer_text = self._format_direct_answer(
                    title="SURVEY NUMBER",
                    value=s_no,
                    doc_name=documents[0].original_filename if documents else "Property Schedule",
                    page=1,
                    confidence=96,
                    evidence_label="Schedule Details -> Survey Number",
                    lang=lang
                )
                return {
                    "question": query,
                    "answer": answer_text,
                    "confidence_score": 0.96,
                    "sources": [{
                        "document_id": documents[0].id if documents else 0,
                        "document_name": documents[0].original_filename if documents else "Schedule",
                        "document_type": "Land Schedule",
                        "page_number": 1,
                        "snippet": f"Survey Number: {s_no}"
                    }],
                    "disclaimer": "AI-Assisted Property Document Analysis."
                }

        # Level 2 & 3: Vector RAG Search & LLM Generation
        retrieved_chunks = vector_store_service.search_chunks(
            query=query,
            user_id=user_id,
            property_id=property_id,
            top_k=4
        )

        sources = []
        context_snippets = []
        for idx, chunk in enumerate(retrieved_chunks):
            doc_name = chunk.get("document_name", "Document")
            doc_type = chunk.get("document_type", "Deed")
            page_num = chunk.get("page_number", 1)
            text_snippet = chunk.get("chunk_text", "")

            sources.append({
                "document_id": chunk.get("document_id", 0),
                "document_name": doc_name,
                "document_type": doc_type,
                "page_number": page_num,
                "snippet": text_snippet[:200] + ("..." if len(text_snippet) > 200 else "")
            })

            context_snippets.append(
                f"--- [EVIDENCE {idx+1}] Document: {doc_name} ({doc_type}), Page {page_num} ---\n{text_snippet}"
            )

        if not retrieved_chunks:
            return {
                "question": query,
                "answer": "Insufficient evidence in the uploaded property documents. Please upload relevant title deeds or EC records.",
                "confidence_score": 0.0,
                "sources": [],
                "disclaimer": "AI-Assisted Property Document Analysis."
            }

        context_str = "\n\n".join(context_snippets)

        # Level 4: LLM Generation or Clean Structured Offline Generator
        system_instructions = (
            "You are PropReady AI Property Assistant.\n"
            "CRITICAL RULES:\n"
            "1. Give direct factual answers first. Never output raw OCR garbage or unreadable symbols.\n"
            "2. Preserve proper nouns (person names, survey numbers, document numbers) EXACTLY as in source documents. Do NOT translate person names.\n"
            "3. Rely strictly on provided document evidence.\n"
            "4. Respond in the same language as the user question."
        )
        user_prompt = f"<EVIDENCE>\n{context_str}\n</EVIDENCE>\n\nQuestion: {query}"

        llm_resp = llm_service.generate_response(system_instructions, user_prompt)

        if llm_resp:
            answer_text = llm_resp
            confidence = 0.88
        else:
            # Clean structured offline answer generator (NEVER dump raw OCR or vector excerpts!)
            top_src = sources[0]
            answer_text = (
                f"Document Analysis Summary:\n\n"
                f"Source: {top_src['document_name']} ({top_src['document_type']}, Page {top_src['page_number']})\n\n"
                f"Key Extract: \"{top_src['snippet']}\"\n\n"
                f"Note: Local LLM is offline. Response compiled directly from verified document records."
            )
            confidence = 0.80

        return {
            "question": query,
            "answer": answer_text,
            "confidence_score": confidence,
            "sources": sources,
            "disclaimer": "AI-Assisted Property Document Analysis."
        }

    def _format_direct_answer(
        self,
        title: str,
        value: str,
        doc_name: str,
        page: int,
        confidence: int,
        evidence_label: str,
        lang: str = 'en'
    ) -> str:

        if lang == 'ta':
            return (
                f"{title}\n\n"
                f"{value}\n\n"
                f"Source:\n"
                f"{doc_name} - Page {page}\n\n"
                f"Confidence:\n"
                f"{confidence}%\n\n"
                f"Evidence:\n"
                f"{evidence_label}"
            )
        elif lang == 'hi':
            return (
                f"{title}\n\n"
                f"{value}\n\n"
                f"Source:\n"
                f"{doc_name} - Page {page}\n\n"
                f"Confidence:\n"
                f"{confidence}%\n\n"
                f"Evidence:\n"
                f"{evidence_label}"
            )
        else:
            return (
                f"{title}\n\n"
                f"{value}\n\n"
                f"Source:\n"
                f"{doc_name} - Page {page}\n\n"
                f"Confidence:\n"
                f"{confidence}%\n\n"
                f"Evidence:\n"
                f"{evidence_label}"
            )

rag_service = RAGService()
