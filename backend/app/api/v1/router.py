from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1 import auth as auth_router
from app.api.v1 import admin as admin_router
from app.api.v1 import documents as documents_router
from app.api.v1 import forensics as forensics_router
from app.api.v1 import ml as ml_router
from app.api.v1 import bulk as bulk_router
from app.api.v1 import organizations as organizations_router
from app.db.session import engine

api_router = APIRouter()

# Include authentication endpoints at /api/v1/auth/...
api_router.include_router(auth_router.router)

# Include Super Admin oversight endpoints at /api/v1/admin/...
api_router.include_router(admin_router.router)

# Organization-owned profile and private supporting-document endpoints.
api_router.include_router(organizations_router.router)

# Authenticated document registry and public verification endpoints.
api_router.include_router(documents_router.router)
api_router.include_router(forensics_router.router)
api_router.include_router(forensics_router.model_router)
api_router.include_router(ml_router.router)
api_router.include_router(bulk_router.router)


@api_router.get("/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            migration_table = connection.execute(
                text(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alembic_version')"
                )
            ).scalar()
    except SQLAlchemyError:
        return {
            "status": "degraded",
            "application": "running",
            "database": "unavailable",
            "migrations": "unknown",
            "message": "The API process is running, but PostgreSQL is not reachable.",
        }

    return {
        "status": "ok",
        "application": "running",
        "database": "healthy",
        "migrations": "applied" if migration_table else "not_applied",
        "message": "VeriProof API and PostgreSQL are healthy.",
    }
