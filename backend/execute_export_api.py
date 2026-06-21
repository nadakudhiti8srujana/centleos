import httpx
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.company_id.isnot(None)).first()
        if not user:
            print("No user found")
            return
            
        token = create_access_token(
            subject=str(user.id),
            extra_claims={
                "email": user.email,
                "role": user.role.value,
                "company_id": str(user.company_id) if user.company_id else None,
            },
        )
        print(f"Generated token for {user.email}")
    finally:
        db.close()
        
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://127.0.0.1:8000/api/v1"
    
    endpoints = {
        "leads": "/leads/export",
        "contacts": "/contacts/export",
        "deals": "/deals/export",
        "invoices": "/erp-invoices/export",
        "referrals": "/referrals/export"
    }
    
    for name, endpoint in endpoints.items():
        url = base_url + endpoint
        try:
            resp = httpx.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                print(f"SUCCESS {name}: Length {len(resp.text)} chars")
                with open(f"{name}_export.csv", "w", encoding="utf-8") as f:
                    f.write(resp.text)
            else:
                print(f"FAILED {name}: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"ERROR {name}: {str(e)}")

if __name__ == "__main__":
    main()
