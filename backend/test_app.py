import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal, engine, Base

client = TestClient(app)

def run_tests():
    print("Running PropReady Security & Integration Tests...")
    Base.metadata.create_all(bind=engine)

    # 1. Root Status Test
    resp = client.get("/")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert resp.json()["app"] == "PropReady"
    print("  [PASS] Root endpoint status check")

    # 2. Registration & Public Role Constraint
    import uuid
    uid = uuid.uuid4().hex[:6]
    res_a = client.post("/auth/register", json={
        "email": f"user_a_{uid}@example.com",
        "password": "Password123!",
        "full_name": "Test User A"
    })
    assert res_a.status_code == 201, f"Registration failed: {res_a.text}"
    token_a = res_a.json()["access_token"]
    user_a_role = res_a.json()["user"]["role"]
    assert user_a_role == "USER", "Public registration must assign USER role only"
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print("  [PASS] Registration & USER role enforcement check")

    # 3. User B Registration
    res_b = client.post("/auth/register", json={
        "email": f"user_b_{uid}@example.com",
        "password": "Password123!",
        "full_name": "Test User B"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 4. Property Creation by User A
    p_res = client.post("/properties", json={
        "title": "User A Private Villa",
        "survey_number": "777/2"
    }, headers=headers_a)
    assert p_res.status_code == 201, f"Property creation failed: {p_res.text}"
    prop_a_id = p_res.json()["id"]
    print("  [PASS] Property creation check")

    # 5. User Data Isolation: User B tries to access User A's property
    denied_prop = client.get(f"/properties/{prop_a_id}", headers=headers_b)
    assert denied_prop.status_code == 403, f"Expected 403 Forbidden for User B accessing User A property, got {denied_prop.status_code}"
    print("  [PASS] Resource ownership isolation check (User B -> User A Property: 403 Forbidden)")

    # 6. User Data Isolation: User B tries to query RAG assistant for User A property
    denied_rag = client.post(f"/properties/{prop_a_id}/assistant/query", json={
        "question": "What is the survey number?"
    }, headers=headers_b)
    assert denied_rag.status_code == 403, f"Expected 403 Forbidden for User B RAG query on User A property, got {denied_rag.status_code}"
    print("  [PASS] RAG Retrieval isolation check (User B -> User A RAG: 403 Forbidden)")

    # 7. Privilege Escalation Prevention: User A tries admin metrics endpoint
    admin_denied = client.get("/admin/metrics", headers=headers_a)
    assert admin_denied.status_code == 403, f"Expected 403 Forbidden for User A accessing Admin endpoint, got {admin_denied.status_code}"
    print("  [PASS] Privilege escalation check (User A -> Admin Endpoint: 403 Forbidden)")

    # 8. Report Generation & Authenticated Download by User A
    gen_res = client.post(f"/properties/{prop_a_id}/reports/generate", headers=headers_a)
    assert gen_res.status_code == 200, f"Report generation failed: {gen_res.text}"
    report_id = gen_res.json()["report_id"]
    
    dl_res = client.get(f"/properties/{prop_a_id}/reports/{report_id}/download", headers=headers_a)
    assert dl_res.status_code == 200, f"Report download failed: {dl_res.status_code}"
    assert dl_res.headers["content-type"] == "application/pdf"
    assert len(dl_res.content) > 1000, "PDF content should be non-empty valid PDF bytes"
    print("  [PASS] Report generation & authenticated PDF download check (User A -> PDF: 200 OK)")

    # 9. Unauthenticated Report Download Attempt
    unauth_dl = client.get(f"/properties/{prop_a_id}/reports/{report_id}/download")
    assert unauth_dl.status_code == 401, f"Expected 401 Unauthenticated, got {unauth_dl.status_code}"
    print("  [PASS] Unauthenticated download prevention check (No Bearer Token -> 401 Unauthorized)")

    # 10. Unauthorized Cross-User Report Download Attempt (User B -> User A Report)
    cross_dl = client.get(f"/properties/{prop_a_id}/reports/{report_id}/download", headers=headers_b)
    assert cross_dl.status_code == 403, f"Expected 403 Forbidden for User B accessing User A report, got {cross_dl.status_code}"
    print("  [PASS] Cross-user report download isolation check (User B -> User A Report: 403 Forbidden)")

    print("\nALL 10 INTEGRATION & SECURITY TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    run_tests()

