from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Import entities to ensure SQLAlchemy registers all tables
from app.models import entities

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="PropReady AI-assisted property document intelligence and ownership verification platform"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import Routers
from app.api.routes import auth, users, properties, documents, assistant, reports, admin

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(properties.router)
app.include_router(documents.router)
app.include_router(assistant.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/")
def root_status():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "ONLINE",
        "description": "PropReady Property Document Intelligence & Ownership Verification Platform"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
