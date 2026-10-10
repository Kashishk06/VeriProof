"""
FastAPI dependencies for authentication and RBAC.
Import these in route handlers to enforce authentication.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

# HTTPBearer auto-reads the "Authorization: Bearer <token>" header
_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the bearer JWT, look up the user in PostgreSQL, and return the ORM object.
    Raises HTTP 401 on any invalid/expired token or missing user.
    """
    token = credentials.credentials
    email = decode_access_token(token)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    # Server-side check: immediately block users belonging to a REVOKED organization
    if user.organization_id:
        from app.models.organization import Organization, OrganizationStatus
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org and org.status == OrganizationStatus.REVOKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization authority has been revoked. Access is prohibited.",
            )

    return user


def require_role(*roles: UserRole):
    """
    Factory dependency that enforces one or more allowed roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(UserRole.SUPER_ADMIN))])
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return current_user
    return _check


def require_active_issuer(
    current_user: User = Depends(require_role(UserRole.ISSUER)),
    db: Session = Depends(get_db),
) -> User:
    """
    Enforces that an Issuer account belongs to an ACTIVE organization before
    granting access to document issuance and restricted operations.
    Blocks SUSPENDED and REVOKED organizations server-side.
    """
    from app.models.organization import Organization, OrganizationStatus

    if current_user.role != UserRole.ISSUER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Issuer role required.",
        )

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Issuer has no associated organization profile.",
        )

    org = db.query(Organization).filter(Organization.id == current_user.organization_id).with_for_update().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Associated organization profile does not exist.",
        )

    if org.status == OrganizationStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Issuer organization is suspended. Document issuance and operations are restricted.",
        )

    if org.status == OrganizationStatus.REVOKED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Issuer organization authority has been revoked. All operations are prohibited.",
        )

    if org.status != OrganizationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Issuer organization is not active (status: {org.status.value}).",
        )

    return current_user


# Backward-compatibility alias
require_approved_issuer = require_active_issuer


def require_organization_access(
    organization_id: int,
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verifies that the current user has authorization to access the specified organization.
    Super Admins can access any organization.
    Issuers may only access their own organization.
    Verifiers and unauthorized parties are rejected.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user

    if current_user.role == UserRole.ISSUER and current_user.organization_id == organization_id:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access another organization's records.",
    )

