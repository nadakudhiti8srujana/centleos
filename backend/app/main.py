from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import engine, SessionLocal
from app.models import Base, Company

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if db.query(Company).count() == 0:
            from app.core.seeder import seed_database
            seed_database(db)

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()

    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Tenant CRM + ERP + Referral Management Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/attachments", exist_ok=True)
os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/static/logos", StaticFiles(directory="uploads/logos"), name="logos")
app.mount("/static/avatars", StaticFiles(directory="uploads/avatars"), name="avatars")
# For attachments we will NOT serve them statically to maintain tenant isolation!
# They will be served via the /attachments endpoint with Auth dependencies.

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }