import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.core.enums import UserRole
from app.core.security import get_password_hash

db = SessionLocal()

COMPANIES = [
    {"slug": "skill-tank", "name": "Skill Tank", "domain": "skilltank.com"},
    {"slug": "tobofu", "name": "Tobofu", "domain": "tobofu.com"},
    {"slug": "saasum", "name": "Saasum", "domain": "saasum.com"},
    {"slug": "promtal", "name": "Promtal", "domain": "promtal.com"},
    {"slug": "vriddhi", "name": "Vriddhi", "domain": "vriddhi.com"},
    {"slug": "maceco", "name": "Maceco", "domain": "maceco.com"}
]

print("Seeding Companies and Company Admins...")

for c in COMPANIES:
    company = db.query(Company).filter(Company.slug == c["slug"]).first()
    if not company:
        company = Company(name=c["name"], slug=c["slug"], is_active=True)
        db.add(company)
        db.commit()
        db.refresh(company)
        print(f"Created company: {c['name']}")

    admin_email = f"admin@{c['domain']}"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("CompanyAdmin@123"),
            full_name=f"{c['name']} Admin",
            role=UserRole.COMPANY_ADMIN,
            company_id=company.id,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        print(f"Created company admin: {admin_email}")
    else:
        admin_user.hashed_password = get_password_hash("CompanyAdmin@123")
        admin_user.role = UserRole.COMPANY_ADMIN
        admin_user.company_id = company.id
        print(f"Updated company admin: {admin_email}")

db.commit()

print("Seeding Super Admin...")
super_admin_email = "superadmin@centleos.com"
super_admin = db.query(User).filter(User.email == super_admin_email).first()
if not super_admin:
    super_admin = User(
        email=super_admin_email,
        hashed_password=get_password_hash("SuperAdmin@123"),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(super_admin)
    print(f"Created super admin: {super_admin_email}")
else:
    super_admin.hashed_password = get_password_hash("SuperAdmin@123")
    super_admin.role = UserRole.SUPER_ADMIN
    print(f"Updated super admin: {super_admin_email}")

db.commit()
db.close()
print("Done.")
