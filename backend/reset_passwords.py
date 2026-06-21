import sys
import os

sys.path.append(os.path.abspath('c:/Users/DELL/OneDrive/Desktop/centleos/backend'))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

admin = db.query(User).filter(User.email == "admin@saasum.com").first()
if admin:
    admin.hashed_password = get_password_hash("CompanyAdmin@123")
    print("Reset admin@saasum.com")

user = db.query(User).filter(User.email == "srujana@gmail.com").first()
if user:
    user.hashed_password = get_password_hash("User@123")
    print("Reset srujana@gmail.com")

db.commit()
db.close()
