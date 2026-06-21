import sys
import os

sys.path.append(os.path.abspath('c:/Users/DELL/OneDrive/Desktop/centleos/backend'))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

user = db.query(User).filter(User.email == "audituser@saasum.com").first()
if user:
    user.hashed_password = get_password_hash("User@123")
    print("Reset audituser@saasum.com")

db.commit()
db.close()
