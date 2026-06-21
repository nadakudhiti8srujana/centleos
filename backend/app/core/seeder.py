import random
import uuid
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models import (
    Company, User, Lead, Contact, Account, Deal, Activity,
    Customer, ERPInvoice, ERPInvoiceItem, ReferralLink,
    Referral, ReferralClick, Reminder, NotificationLog, PipelineStage
)
from app.core.enums import (
    UserRole, LeadStatus, LeadStage, LeadSource,
    ActivityType, DealStatus, ERPInvoiceStatus, ReferralPayoutStatus
)
from app.models.notification_log import NotificationStatus

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

COMPANIES = ["Skill Tank", "Maceco", "Tobofu", "Promtal", "Vriddhi"]
FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
INDUSTRIES = ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail"]
JOB_TITLES = ["CEO", "CTO", "Manager", "Director", "VP of Sales", "Consultant", "Engineer"]
DEAL_NAMES = ["Enterprise License", "Standard Plan", "Consulting Retainer", "Implementation Setup", "Q3 Renewal", "Custom Integration"]
ITEM_NAMES = ["Consulting Hours", "Software License", "Support Package", "Server Setup", "Training Session"]
ACTIVITY_TITLES = ["Follow up call", "Quarterly Sync", "Demo Meeting", "Email outreach", "Proposal Review"]

def generate_phone():
    return f"+1{random.randint(1000000000, 9999999999)}"

def random_date_recent():
    days_ago = random.randint(0, 60)
    return datetime.utcnow() - timedelta(days=days_ago)

def random_date_future():
    days_ahead = random.randint(1, 30)
    return datetime.utcnow() + timedelta(days=days_ahead)

def seed_database(db: Session):
    print("Starting Demo Data Seeder...")
    
    # 1. Create Companies (5)
    company_objects = []
    for name in COMPANIES:
        slug = name.lower().replace(" ", "-")
        c = Company(id=uuid.uuid4(), name=name, slug=slug)
        db.add(c)
        company_objects.append(c)
    db.commit()

    # 2. Create Users (20)
    user_objects = []
    # 1 Super Admin
    super_admin = User(
        id=uuid.uuid4(),
        email="admin@centleos.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True
    )
    db.add(super_admin)
    user_objects.append(super_admin)

    # Distribute remaining 19 users across companies
    roles = [UserRole.COMPANY_ADMIN, UserRole.SALES_REPRESENTATIVE, UserRole.AMBASSADOR]
    for i in range(19):
        company = random.choice(company_objects)
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        role = UserRole.COMPANY_ADMIN if i < 5 else random.choice(roles)
        u = User(
            id=uuid.uuid4(),
            email=f"{fn.lower()}.{ln.lower()}{i}@example.com",
            hashed_password=get_password_hash("password123"),
            full_name=f"{fn} {ln}",
            role=role,
            company_id=company.id,
            is_active=True
        )
        db.add(u)
        user_objects.append(u)
    db.commit()

    # 3. Create Contacts (30) & Accounts (20)
    contact_objects = []
    account_objects = []
    for _ in range(20):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        a = Account(
            id=uuid.uuid4(),
            company_id=comp.id,
            name=f"{random.choice(LAST_NAMES)} Corp",
            industry=random.choice(INDUSTRIES),
            website="https://example.com",
            created_by=owner.id
        )
        db.add(a)
        account_objects.append(a)
    db.commit()

    for _ in range(30):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        c = Contact(
            id=uuid.uuid4(),
            company_id=comp.id,
            first_name=random.choice(FIRST_NAMES),
            last_name=random.choice(LAST_NAMES),
            email=f"contact{random.randint(100,999)}@example.com",
            phone=generate_phone(),
            job_title=random.choice(JOB_TITLES),
            contact_company=f"{random.choice(LAST_NAMES)} LLC",
            created_by=owner.id
        )
        db.add(c)
        contact_objects.append(c)
    db.commit()

    # 4. Create Leads (50)
    lead_objects = []
    stages = list(LeadStage)
    sources = list(LeadSource)
    statuses = list(LeadStatus)
    for _ in range(50):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        l = Lead(
            id=uuid.uuid4(),
            company_id=comp.id,
            name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            email=f"lead{random.randint(1000,9999)}@example.com",
            phone=generate_phone(),
            lead_company=f"{random.choice(LAST_NAMES)} Enterprises",
            stage=random.choice(stages),
            source=random.choice(sources),
            owner_id=owner.id,
            ai_score=random.randint(10, 99),
            ai_next_action="Follow up via email" if random.random() > 0.5 else "Schedule call"
        )
        db.add(l)
        lead_objects.append(l)
    db.commit()

    # 5. Create Deals (15)
    deal_objects = []
    for _ in range(15):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        val = random.randint(1000, 50000)
        d = Deal(
            id=uuid.uuid4(),
            company_id=comp.id,
            name=f"{comp.name} - {random.choice(DEAL_NAMES)}",
            deal_value=val,
            probability=random.randint(10, 90),
            status=random.choice(list(DealStatus)),
            expected_close_date=random_date_future().date(),
            owner_id=owner.id
        )
        db.add(d)
        deal_objects.append(d)
    db.commit()

    # 6. Create Activities (25)
    for _ in range(25):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        is_lead = random.random() > 0.5
        ref_id = None
        if is_lead:
            comp_leads = [l for l in lead_objects if l.company_id == comp.id]
            if comp_leads: ref_id = random.choice(comp_leads).id
        else:
            comp_deals = [d for d in deal_objects if d.company_id == comp.id]
            if comp_deals: ref_id = random.choice(comp_deals).id
            
        a = Activity(
            id=uuid.uuid4(),
            company_id=comp.id,
            activity_type=random.choice(list(ActivityType)),
            title=random.choice(ACTIVITY_TITLES),
            description="Discussed the new requirements and next steps.",
            scheduled_at=random_date_future(),
            completed_at=random_date_recent() if random.random() > 0.5 else None,
            created_by=owner.id,
            lead_id=ref_id if is_lead else None,
            deal_id=ref_id if not is_lead else None
        )
        db.add(a)
    db.commit()

    # 7. Create ERP Invoices & Items (20)
    # First create Customers
    customer_objects = []
    for comp in company_objects:
        cust = Customer(id=uuid.uuid4(), company_id=comp.id, name=f"{comp.name} Default Client", email=f"client@{comp.slug}.com")
        db.add(cust)
        customer_objects.append(cust)
    db.commit()

    for i in range(20):
        comp = random.choice(company_objects)
        cust = next(c for c in customer_objects if c.company_id == comp.id)
        subtotal = random.randint(500, 10000)
        tax = subtotal * 0.10
        total = subtotal + tax
        inv = ERPInvoice(
            id=uuid.uuid4(),
            company_id=comp.id,
            customer_id=cust.id,
            invoice_number=f"INV-{1000+i}-{comp.slug[:3].upper()}",
            issue_date=random_date_recent().date(),
            due_date=random_date_future().date(),
            subtotal=subtotal,
            tax=tax,
            total_amount=total,
            status=random.choice(list(ERPInvoiceStatus))
        )
        db.add(inv)
        db.commit()

        # Items
        for _ in range(random.randint(1, 3)):
            qty = random.randint(1, 5)
            price = random.randint(100, 2000)
            item = ERPInvoiceItem(
                id=uuid.uuid4(),
                erp_invoice_id=inv.id,
                item_name=random.choice(ITEM_NAMES),
                quantity=qty,
                unit_price=price,
                total=qty * price
            )
            db.add(item)
    db.commit()

    # 8. Create Referrals (10 Links, 20 Referrals)
    for comp in company_objects:
        owner = next(u for u in user_objects if u.company_id == comp.id)
        # Link
        link = ReferralLink(
            id=uuid.uuid4(),
            company_id=comp.id,
            ambassador_id=owner.id,
            code=f"REF-{comp.slug.upper()}-{random.randint(100,999)}",
            url=f"https://centleos.com/join?ref=REF-{comp.slug.upper()}",
            click_count=random.randint(5, 15),
            lead_count=random.randint(1, 10),
            conversion_count=random.randint(2, 5),
            commission_rate=10.00,
            is_active=True
        )
        db.add(link)
        db.commit()

        # Referral Clicks
        for _ in range(link.click_count):
            click = ReferralClick(
                id=uuid.uuid4(),
                referral_link_id=link.id,
                company_id=comp.id,
                ip_address="192.168.1.1",
                user_agent="Mozilla/5.0",
                created_at=random_date_recent()
            )
            db.add(click)
        db.commit()
        
        # Referrals
        for _ in range(link.conversion_count):
            ref = Referral(
                id=uuid.uuid4(),
                company_id=comp.id,
                referral_link_id=link.id,
                ambassador_id=owner.id,
                payout_status=random.choice(list(ReferralPayoutStatus)),
                commission_amount=float(random.randint(50, 500))
            )
            db.add(ref)
    db.commit()

    # 9. Create Reminders (15)
    for _ in range(15):
        comp = random.choice(company_objects)
        owner = random.choice([u for u in user_objects if u.company_id == comp.id])
        rem = Reminder(
            id=uuid.uuid4(),
            company_id=comp.id,
            user_id=owner.id,
            title=f"Follow up with client",
            description="Check if they received the proposal.",
            due_date=random_date_future(),
            is_completed=random.choice([True, False]),
            entity_type="lead",
            entity_id=uuid.uuid4() # fake reference
        )
        db.add(rem)
    db.commit()

    # 10. Create Notifications (20)
    for _ in range(20):
        user = random.choice(user_objects)
        n = NotificationLog(
            id=uuid.uuid4(),
            user_id=user.id,
            type=random.choice(["email", "telegram"]),
            channel=random.choice(["smtp", "api"]),
            message=f"System alert: Action required on your account.",
            status=random.choice(list(NotificationStatus)),
            sent_at=random_date_recent() if random.choice([True, False]) else None
        )
        db.add(n)
    db.commit()

    print("\n--- Demo data seeded successfully ---")
    print(f"Companies: {db.query(Company).count()}")
    print(f"Users: {db.query(User).count()}")
    print(f"Leads: {db.query(Lead).count()}")
    print(f"Contacts: {db.query(Contact).count()}")
    print(f"Accounts: {db.query(Account).count()}")
    print(f"Deals: {db.query(Deal).count()}")
    print(f"Invoices: {db.query(ERPInvoice).count()}")
    print(f"Referrals: {db.query(Referral).count()}")
    print(f"Reminders: {db.query(Reminder).count()}")
    print(f"Notifications: {db.query(NotificationLog).count()}")
    print("-------------------------------------\n")
