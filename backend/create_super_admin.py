import sys
import os

# Add backend directory to sys.path so we can import app
sys.path.append(os.path.abspath('c:/Users/DELL/OneDrive/Desktop/centleos/backend'))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.enums import UserRole
from app.core.security import get_password_hash

db = SessionLocal()
email = "superadmin@centleos.com"
password = "Password123!"

existing_user = db.query(User).filter(User.email == email).first()
if not existing_user:
    new_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    print("Created super admin user.")
else:
    existing_user.role = UserRole.SUPER_ADMIN
    existing_user.hashed_password = get_password_hash(password)
    db.commit()
    print("Updated existing user to super admin.")
db.close()
