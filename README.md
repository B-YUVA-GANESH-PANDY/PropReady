# PropReady — AI-Assisted Property Document Intelligence & Ownership Verification Platform

PropReady is a production-oriented AI-assisted property document intelligence and ownership verification platform designed for Indian property documents (Sale Deeds, Encumbrance Certificates, Patta/Khata extracts, Gift Deeds, Partition Deeds, Tax Receipts, and Mortgages).

The system allows users to upload property documents, run local page-aware OCR, extract structured property entities and transaction details, construct deterministic ownership transfer graphs, perform cross-document consistency checks, calculate dynamic confidence scores, retrieve evidence using local vector embeddings (FAISS), and consult an AI Property Assistant with evidence citations and downloadable analysis reports.

---

## Key Features

1. **Role-Based Access Control & User Data Isolation**:
   - Strictly two roles: `USER` and `ADMIN`.
   - Public registration creates `USER` accounts only.
   - Resource-level ownership checks enforce `user_id == resource.owner_id` on all property, document, OCR, and RAG retrieval endpoints.
   - Password hashing with **Argon2id**.

2. **Page-Aware Local OCR Pipeline**:
   - Integrates **PaddleOCR** and PyMuPDF to extract text with bounding boxes, confidence scores, and page-level evidence tracing.

3. **Intelligent Document Classification & Entity Extraction**:
   - Classifies Indian document types (Sale Deed, Gift Deed, Partition, EC, Patta, Khata, Mutation, Tax Receipt, Mortgage, etc.).
   - Extracts survey numbers, sub-survey numbers, khata, plot numbers, seller/buyer parties, execution dates, consideration amounts, and encumbrances.

4. **Deterministic Ownership Graph Engine**:
   - Builds historical transfer chain (Owner A → Owner B → Owner C) directly from structured document entities.

5. **Cross-Document Risk Engine & Confidence Calculation**:
   - Automatically detects survey number mismatches, title chain gaps, missing release deeds for active bank mortgages, and missing Encumbrance Certificates (EC).
   - Calculates transparent confidence score percentages (0–100%) explaining supporting vs. reducing factors.

6. **Local Open-Weight LLM & FAISS RAG System**:
   - Configurable for local open-weight models (e.g., `Qwen2.5-1.5B-Instruct` via Ollama).
   - FAISS vector database with strict mandatory `user_id` and `property_id` filtering.
   - Prompt injection defense: Uploaded document text treated strictly as static data context.
   - Graceful offline fallback when LLM is unavailable.

7. **Downloadable Analysis Reports**:
   - PDF Property Analysis Report generation with ownership graph, risk findings, document summary, evidence references, and legal disclaimers.

8. **Admin Portal**:
   - System metrics, background processing job queue, AI/RAG diagnostics, user account management, and security audit logs.

---

## Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js v18+ & npm**

### 1. Environment Setup

Copy `.env.example` to `.env` if custom variables are required:
```bash
cp .env.example .env
```

### 2. Backend Dependencies & Admin Initialization

```bash
# Install Python dependencies
pip install fastapi uvicorn sqlalchemy argon2-cffi pyjwt PyMuPDF faiss-cpu sentence-transformers paddleocr opencv-python-headless python-multipart reportlab pydantic-settings

# Initialize Database & Create Default Admin Account
python backend/init_admin.py

# Seed Demo Property Data (Optional)
python backend/seed_data.py
```

*Default Admin Credentials:*
- Email: `admin@propready.local`
- Password: `Admin@PropReady2026`

*Default Demo User Credentials:*
- Email: `user@propready.local`
- Password: `User@PropReady2026`

### 3. Frontend Installation

```bash
cd frontend
npm install
```

---

## Running the Application

### Start Backend Server (Port 8000)
```bash
python backend/run.py
```

### Start Frontend Server (Port 5173)
```bash
cd frontend
npm run dev
```

Open browser at `http://localhost:5173`.

---

## Optional Local LLM Setup (Ollama)

To enable live local LLM response generation:
1. Install [Ollama](https://ollama.ai).
2. Pull model:
   ```bash
   ollama pull qwen2.5:1.5b
   ```
3. Ensure Ollama is running at `http://localhost:11434`.

*(Note: If Ollama is offline, PropReady automatically uses its deterministic RAG evidence synthesis engine without crashing!)*

---

## Running Automated Verification Tests

```bash
python backend/test_app.py
```

---

## Legal Disclaimer

*PropReady provides AI-assisted property document analysis and automated reasoning. It is not a legal opinion, title certificate, or substitute for verification by a qualified legal/property professional.*
