import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.ocr_service import is_text_corrupted, normalize_unicode
from app.services.rag_service import rag_service
from app.models.entities import Property, User

def run_tests():
    print("=== PROPREADY PIPELINE TEST SUITE ===")
    
    # 1. Test Unicode Garbage Detection
    corrupted_sample = "ެߐ߄ߐ ߋޚ⁔ῡ ´ߍޫ ⁎߈߄ެ߇ߐ Identification Documents..."
    clean_sample = "ABSOLUTE SALE DEED. VENDOR: Suresh Reddy. VENDEE: Ananya Sharma. Survey No. 142/3B."
    
    print("\n[Test 1] Garbage Text Detection:")
    print("Corrupted Sample check:", is_text_corrupted(corrupted_sample))
    print("Clean Sample check:", is_text_corrupted(clean_sample))
    assert is_text_corrupted(corrupted_sample) == True, "Garbage sample failed detection!"
    assert is_text_corrupted(clean_sample) == False, "Clean sample wrongly marked corrupted!"
    print("[PASS] Garbage Text Detection Passed!")

    # 2. Test Direct Owner Intent & Answer Generation
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "user@propready.local").first()
        prop = db.query(Property).filter(Property.user_id == user.id).first()
        
        print(f"\n[Test 2] Query: 'Who is the current owner?' for Property #{prop.id}")
        res_en = rag_service.answer_question(
            db=db,
            query="Who is the current owner?",
            user_id=user.id,
            property_id=prop.id
        )
        print("Answer output:")
        print("----------------------------------------")
        print(res_en["answer"])
        print("----------------------------------------")
        assert "Ananya Sharma" in res_en["answer"], "Owner name missing from answer!"
        assert "CURRENT OWNER" in res_en["answer"], "Answer formatting error!"
        print("[PASS] English Owner Query Test Passed!")

        print("\n[Test 3] Multilingual Tamil Query Test:")
        res_ta = rag_service.answer_question(
            db=db,
            query="\u0b87\u0ba8\u0bcd\u0ba4 \u0b9a\u0bca\u0ba4\u0bcd\u0ba4\u0bbf\u0ba9\u0bcd \u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc8\u0baf \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0baf\u0bbe\u0bb3\u0bb0\u0bcd \u0baf\u0bbe\u0bb0\u0bcd?",
            user_id=user.id,
            property_id=prop.id
        )
        assert "Ananya Sharma" in res_ta["answer"], "Owner name missing from Tamil answer!"
        print("Tamil Query Answer returned clean owner name: Ananya Sharma")
        print("[PASS] Multilingual Query Test Passed!")

    finally:
        db.close()

    print("\nALL PIPELINE TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
