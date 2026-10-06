import sys
import os

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.entities import User
from app.core.security import hash_password

def create_initial_admin(email: str = "admin@propready.local", password: str = "Admin@PropReady2026", full_name: str = "PropReady Admin"):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower()).first()
        if existing:
            print(f"Admin user '{email}' already exists.")
            existing.role = "ADMIN"
            existing.password_hash = hash_password(password)
            db.commit()
            print("Admin credentials updated successfully.")
            return

        admin_user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            full_name=full_name,
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print(f"Initial Admin user created successfully:\n  Email: {email}\n  Role: ADMIN")
    except Exception as e:
        db.rollback()
        print(f"Failed to create admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@propready.local"
    password = sys.argv[2] if len(sys.argv) > 2 else "Admin@PropReady2026"
    create_initial_admin(email, password)
