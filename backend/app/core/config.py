import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PropReady"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/propready.db"
    
    # Security & Auth
    JWT_SECRET: str = "super_secret_jwt_key_propready_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # AI & LLM Configuration
    LLM_PROVIDER: str = "ollama"  # 'ollama', 'huggingface', or 'fallback'
    LLM_MODEL: str = "qwen2.5:1.5b"
    LLM_BASE_URL: str = "http://localhost:11434"
    
    # Embedding Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Storage Paths
    DATA_DIR: str = os.path.abspath("./data")
    VECTOR_DB_PATH: str = os.path.abspath("./data/faiss_index")
    UPLOAD_DIRECTORY: str = os.path.abspath("./data/uploads")
    REPORTS_DIRECTORY: str = os.path.abspath("./data/reports")
    
    # Constraints
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {".pdf", ".jpg", ".jpeg", ".png"}
    
    # Admin creation secret for internal script/init
    ADMIN_INIT_SECRET: str = "admin_init_secret_propready_2026"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(settings.REPORTS_DIRECTORY, exist_ok=True)
