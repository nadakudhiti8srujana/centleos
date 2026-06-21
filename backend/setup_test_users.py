import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.core.enums import UserRole
from app.core.security import get_password_hash

db = SessionLocal()

# 1. Reset Super Admin password
super_admin_email = "superadmin@centleos.com"
super_admin = db.query(User).filter(User.email == super_admin_email).first()
if super_admin:
    super_admin.hashed_password = get_password_hash("SuperAdmin@123")
    print(f"Reset {super_admin_email} password to SuperAdmin@123")

# 2. Identify Company Admin and set password to CompanyAdmin@123 for testing
company_admin = db.query(User).filter(User.role == UserRole.COMPANY_ADMIN).first()
company_admin_email = ""
company_name = ""
if company_admin:
    company = db.query(Company).filter(Company.id == company_admin.company_id).first()
    company_name = company.name if company else "Unknown"
    company_admin.hashed_password = get_password_hash("CompanyAdmin@123")
    company_admin_email = company_admin.email
    print(f"Found Company Admin: {company_admin_email} (Company: {company_name}), reset password to CompanyAdmin@123")
else:
    print("No Company Admin found!")

# 3. Predefined user account creation removed per requirements
print("Predefined user account creation removed.")

db.commit()

# Print all users
print("\n--- ALL USERS ---")
users = db.query(User).all()
for u in users:
    c = db.query(Company).filter(Company.id == u.company_id).first()
    cname = c.name if c else "None"
    print(f"Email: {u.email} | Role: {u.role.value if hasattr(u.role, 'value') else u.role} | Company: {cname}")

db.close()
