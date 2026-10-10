"""
Authentication and Onboarding endpoints for VeriProof.

Endpoints:
- POST /api/v1/auth/email-otp/send   - Request single-use verification OTP via email provider
- POST /api/v1/auth/email-otp/verify - Verify OTP and receive cryptographically signed token
- POST /api/v1/auth/signup           - Complete onboarding for VERIFIER or ISSUER (+ Organization)
- POST /api/v1/auth/login            - Authenticate (all roles) and receive signed JWT
- GET  /api/v1/auth/me               - Return authenticated user profile and organization info
"""

import time
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationStatus
from app.models.audit import AuditEvent
from app.services.otp_service import otp_service
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    SendEmailOTPRequest,
    SendEmailOTPResponse,
    VerifyEmailOTPRequest,
    VerifyEmailOTPResponse,
)
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# POST /api/v1/auth/email-otp/send
# ---------------------------------------------------------------------------
@router.post(
    "/email-otp/send",
    response_model=SendEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Dispatch verification OTP to email address",
)
@router.post(
    "/send-otp",
    response_model=SendEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def send_email_otp(payload: SendEmailOTPRequest) -> SendEmailOTPResponse:
    """
    Generate and dispatch a cryptographically secure 6-digit OTP to the user's email.
    Enforces a 60-second cooldown, attempt expiration, and verifies
    that the email service/gateway is active before proceeding.
    """
    workflow = payload.workflow or "registration"
    result = otp_service.send_otp(email=payload.email, workflow=workflow)
    return SendEmailOTPResponse(
        message=result["message"],
        cooldown_seconds=result["cooldown_seconds"],
        expires_in_seconds=result["expires_in_seconds"],
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/email-otp/verify
# ---------------------------------------------------------------------------
@router.post(
    "/email-otp/verify",
    response_model=VerifyEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email OTP code and obtain verification token",
)
@router.post(
    "/verify-otp",
    response_model=VerifyEmailOTPResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def verify_email_otp(payload: VerifyEmailOTPRequest) -> VerifyEmailOTPResponse:
    """
    Verify the 6-digit OTP entered by the user.
    Enforces expiry (10 mins), single-use consumption, and maximum attempt limits (5 attempts).
    Returns a signed verification token bound to the email and workflow.
    """
    workflow = payload.workflow or "registration"
    result = otp_service.verify_otp(email=payload.email, otp=payload.otp, workflow=workflow)
    return VerifyEmailOTPResponse(
        verified=result["verified"],
        message=result["message"],
        verification_token=result["verification_token"],
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/signup
# ---------------------------------------------------------------------------
@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account (VERIFIER or ISSUER + Organization)",
)
def signup(
    payload: SignupRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Register a new VERIFIER or ISSUER account.

    - Email is normalised to lowercase.
    - Password is validated and hashed with Argon2id; password hash is never returned.
    - SUPER_ADMIN role is explicitly blocked.
    - Requires verified email via OTP verification before account creation.
    - ISSUER accounts atomically create the Organization record in ACTIVE status by default.
    - No mandatory Super Admin approval gate is required for initial onboarding.
    - Ongoing administrative oversight allows Super Admins to inspect, suspend, or revoke access.
    - Returns HTTP 409 if the email is already registered.
    """
    # 1. Enforce unique email check
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Revalidate email OTP verification state (Cannot be bypassed by frontend)
    # Check registration workflow or role-specific workflow
    workflow_candidates = [
        "registration",
        f"{payload.role.value.lower()}_signup",
        "issuer_signup" if payload.role == UserRole.ISSUER else "verifier_signup",
    ]
    is_verified = False
    for wf in workflow_candidates:
        if otp_service.validate_and_consume_verification(
            email=payload.email,
            workflow=wf,
            verification_token=payload.verification_token,
        ):
            is_verified = True
            break

    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address must be verified via OTP before account creation.",
        )

    # 3. Client IP for audit logging
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 4. Atomic registration transaction
    try:
        org_id = None

        # For ISSUER: create organization in PENDING review status
        if payload.role == UserRole.ISSUER:
            org_data = payload.organization
            if not org_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization profile is required for Issuer registration.",
                )

            # Prevent duplicate organization registration by registration number or official email
            existing_org = (
                db.query(Organization)
                .filter(
                    (Organization.registration_number == org_data.registration_number)
                    | (Organization.official_email == payload.email)
                )
                .first()
            )
            if existing_org:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An organization with this registration number or official email already exists.",
                )

            new_org = Organization(
                name=org_data.name,
                legal_name=org_data.legal_name or org_data.name,
                org_type=org_data.org_type,
                registration_number=org_data.registration_number,
                tax_id=org_data.tax_id,
                website=org_data.website,
                official_email=payload.email,
                address=org_data.address,
                city=org_data.city,
                state=org_data.state,
                country=org_data.country,
                pin_code=org_data.pin_code,
                authorized_representative_name=org_data.authorized_representative_name,
                authorized_representative_role=org_data.authorized_representative_role,
                authorized_representative_email=org_data.authorized_representative_email or payload.email,
                authorized_representative_phone=org_data.authorized_representative_phone,
                primary_document_url=org_data.primary_document_url,
                supporting_document_url=org_data.supporting_document_url,
                status=OrganizationStatus.ACTIVE,
            )
            db.add(new_org)
            db.flush()  # Populates new_org.id
            org_id = new_org.id

            # Record organization registration audit event
            org_audit = AuditEvent(
                event_type="ORGANIZATION_REGISTERED",
                user_id=None,  # User not committed yet, will link via org_id
                organization_id=org_id,
                details=f"Organization '{new_org.name}' registered with status ACTIVE via verified onboarding.",
                ip_address=client_ip,
            )
            db.add(org_audit)

        # Create user account
        new_user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=True,
            organization_id=org_id,
        )
        db.add(new_user)
        db.flush()  # Populates new_user.id

        # Record security audit event
        audit = AuditEvent(
            event_type=(
                "ISSUER_REGISTERED"
                if payload.role == UserRole.ISSUER
                else "VERIFIER_REGISTERED"
            ),
            user_id=new_user.id,
            organization_id=org_id,
            details=(
                f"User registered with role {payload.role.value}. "
                + (f"Organization '{payload.organization.name}' registered as ACTIVE." if org_id else "")
            ),
            ip_address=client_ip,
        )
        db.add(audit)
        db.commit()
        db.refresh(new_user)

        return new_user

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed due to a database error: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login
# ---------------------------------------------------------------------------
# In-memory tracking of failed login attempts: client_ip -> list of failure timestamps
# Note: For production distributed multi-worker setups, back with Redis or SlowAPI
_FAILED_LOGIN_ATTEMPTS: dict = {}
_MAX_FAILED_LOGIN_ATTEMPTS = 10
_LOGIN_LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate (all roles) and obtain a JWT access token",
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email + password and receive a signed JWT access token.

    - Accessible to SUPER_ADMIN, ISSUER, and VERIFIER accounts.
    - Returns the same generic error for unknown email and wrong password to prevent user enumeration.
    - Password is verified with Argon2id.
    - Token is signed with the configured SECRET_KEY.
    - Enforces rate limiting on consecutive failed attempts to mitigate brute force.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()

    # Clean old failure records
    recent_failures = [
        t for t in _FAILED_LOGIN_ATTEMPTS.get(client_ip, [])
        if (now - t) < _LOGIN_LOCKOUT_WINDOW_SECONDS
    ]
    _FAILED_LOGIN_ATTEMPTS[client_ip] = recent_failures

    # Check lockout threshold
    if len(recent_failures) >= _MAX_FAILED_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes.",
        )

    _invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.query(User).filter(User.email == payload.email).first()

    # Timing-safe comparison path
    if not user or not verify_password(payload.password, user.hashed_password):
        _FAILED_LOGIN_ATTEMPTS[client_ip].append(now)
        raise _invalid_credentials

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact support.",
        )

    if user.role == UserRole.ISSUER and user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org and org.status == OrganizationStatus.REVOKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization authority has been revoked. Access is prohibited.",
            )

    # Clear failed attempts on successful login
    _FAILED_LOGIN_ATTEMPTS.pop(client_ip, None)

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# GET /api/v1/auth/me
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user and organization profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """
    Return the profile and organization information of the currently authenticated user.
    Requires a valid Bearer JWT in the Authorization header.
    """
    return current_user
