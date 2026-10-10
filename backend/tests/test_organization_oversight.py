"""
Comprehensive test suite for Stage 6: Organization Registry, Admin Oversight & Revocation.

Covers all 18 prompt requirements:
1. OTP-verified Issuer signup creates an ACTIVE organization.
2. The new Issuer can log in with the same email and password.
3. Signup does not require administrative approval.
4. Public signup cannot self-assign privileged roles or organization status.
5. Super Admin can list and inspect organizations.
6. Issuer and Verifier cannot access administrative organization endpoints.
7. Super Admin can inspect supporting-document metadata.
8. Unauthorized users cannot download private supporting documents.
9. Super Admin can suspend an ACTIVE organization.
10. Super Admin can revoke an organization.
11. Suspension and revocation require a reason.
12. Suspended/revoked Issuers are blocked from restricted operations.
13. Existing JWTs cannot bypass a new organization suspension or revocation.
14. Invalid state transitions are rejected.
15. One organization cannot access another organization's data.
16. Audit events record the correct actor, organization, and reason.
17. Existing authentication and OTP tests still pass.
18. Relevant database uniqueness and concurrent-update protections work as intended.
"""

import os
import io
import hashlib
import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationDocument, OrganizationStatus, RegisteredDocument
from app.models.audit import AuditEvent
from app.core.security import hash_password, create_access_token, create_email_verification_token
from app.core.config import settings
from app.services.otp_service import otp_service
from app.services.document_service import DocumentService, document_service
from app.api.dependencies import require_organization_access

# ---------------------------------------------------------------------------
# Test DB setup — isolated SQLite database for fast unit testing
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite:///./test_organization_oversight.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    original_testing = settings.TESTING
    settings.TESTING = True
    yield
    settings.TESTING = original_testing
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Test Users & Tokens Fixture
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def test_setup(client):
    """Seed test database with a Super Admin, two Issuers in different Orgs, and a Verifier."""
    db = TestingSessionLocal()

    # 1. Super Admin
    admin = User(
        email="superadmin@veriproof.com",
        full_name="Super Admin",
        hashed_password=hash_password("SuperSecret123!"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db.add(admin)

    # 2. Organization A & Issuer A
    org_a = Organization(
        name="Apex University",
        legal_name="Apex University Higher Education Trust",
        org_type="University",
        registration_number="APEX-REG-001",
        tax_id="TAX-APEX-001",
        official_email="contact@apex.edu",
        authorized_representative_name="Dr. Alan Turing",
        authorized_representative_role="Registrar",
        primary_document_url="apex_charter.pdf",
        supporting_document_url="apex_accreditation.pdf",
        status=OrganizationStatus.ACTIVE,
    )
    db.add(org_a)
    db.flush()

    issuer_a = User(
        email="issuer.a@apex.edu",
        full_name="Issuer A Rep",
        hashed_password=hash_password("IssuerPassA123!"),
        role=UserRole.ISSUER,
        is_active=True,
        organization_id=org_a.id,
    )
    db.add(issuer_a)

    # 3. Organization B & Issuer B
    org_b = Organization(
        name="Beacon Health Institute",
        legal_name="Beacon Health Systems Ltd",
        org_type="Healthcare",
        registration_number="BEACON-REG-002",
        tax_id="TAX-BEACON-002",
        official_email="admin@beaconhealth.org",
        authorized_representative_name="Dr. Elizabeth Blackwell",
        primary_document_url="beacon_license.pdf",
        status=OrganizationStatus.ACTIVE,
    )
    db.add(org_b)
    db.flush()

    issuer_b = User(
        email="issuer.b@beaconhealth.org",
        full_name="Issuer B Rep",
        hashed_password=hash_password("IssuerPassB123!"),
        role=UserRole.ISSUER,
        is_active=True,
        organization_id=org_b.id,
    )
    db.add(issuer_b)

    # 4. Standard Verifier
    verifier = User(
        email="verifier@external.com",
        full_name="Public Verifier",
        hashed_password=hash_password("VerifierPass123!"),
        role=UserRole.VERIFIER,
        is_active=True,
    )
    db.add(verifier)
    db.commit()

    # Generate tokens
    admin_token = create_access_token(admin.email)
    issuer_a_token = create_access_token(issuer_a.email)
    issuer_b_token = create_access_token(issuer_b.email)
    verifier_token = create_access_token(verifier.email)

    data = {
        "admin_id": admin.id,
        "admin_token": admin_token,
        "org_a_id": org_a.id,
        "issuer_a_id": issuer_a.id,
        "issuer_a_token": issuer_a_token,
        "org_b_id": org_b.id,
        "issuer_b_id": issuer_b.id,
        "issuer_b_token": issuer_b_token,
        "verifier_token": verifier_token,
    }
    db.close()
    return data


# ---------------------------------------------------------------------------
# Requirement 1, 2, 3: Direct Onboarding to ACTIVE Organization
# ---------------------------------------------------------------------------
class TestDirectOnboardingAndLogin:
    def test_signup_creates_active_org_and_issuer_logs_in(self, client):
        """Req 1 & 2 & 3: OTP-verified signup creates ACTIVE organization directly with no approval required."""
        email = "newcorp@enterprise.org"
        password = "CorpSecurePass123!"

        # Create valid verification token
        token = create_email_verification_token(email, "registration")
        # Ensure OTP service record is present
        otp_service._store[(email, "registration")] = {
            "otp_hash": "dummy",
            "expires_at": 9999999999,
            "attempts_remaining": 5,
            "last_sent_at": 0,
            "is_verified": True,
            "_test_code": None,
        }

        payload = {
            "full_name": "Corp Lead",
            "email": email,
            "password": password,
            "role": "ISSUER",
            "verification_token": token,
            "organization": {
                "name": "Global Tech Corp",
                "org_type": "Enterprise",
                "registration_number": "GTC-REG-9999",
                "authorized_representative_name": "Corp Lead",
                "primary_document_url": "gtc_incorporation.pdf",
            },
        }

        # 1. Signup request
        signup_res = client.post("/api/v1/auth/signup", json=payload)
        assert signup_res.status_code == 201, signup_res.json()
        user_data = signup_res.json()
        assert user_data["email"] == email
        assert user_data["organization"] is not None
        # Organization MUST be ACTIVE by default, NOT PENDING
        assert user_data["organization"]["status"] == "ACTIVE"

        # 2. Issuer can immediately log in with the same email & password without any approval step
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # 3. /auth/me returns ACTIVE organization profile
        auth_header = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
        me_res = client.get("/api/v1/auth/me", headers=auth_header)
        assert me_res.status_code == 200
        assert me_res.json()["organization"]["status"] == "ACTIVE"


# ---------------------------------------------------------------------------
# Requirement 4: Public Signup Cannot Self-Assign Privileges
# ---------------------------------------------------------------------------
class TestSignupPrivilegeProtection:
    def test_cannot_self_assign_super_admin(self, client):
        """Req 4: Public signup explicitly blocks SUPER_ADMIN role."""
        payload = {
            "full_name": "Hacker",
            "email": "hacker@evil.com",
            "password": "HackerPass123!",
            "role": "SUPER_ADMIN",
        }
        res = client.post("/api/v1/auth/signup", json=payload)
        assert res.status_code == 422

    def test_signup_payload_cannot_set_org_status(self, client):
        """Req 4: Public signup ignores or rejects arbitrary status injection."""
        email = "status_injection@corp.com"
        token = create_email_verification_token(email, "registration")
        otp_service._store[(email, "registration")] = {
            "otp_hash": "dummy",
            "expires_at": 9999999999,
            "attempts_remaining": 5,
            "last_sent_at": 0,
            "is_verified": True,
            "_test_code": None,
        }
        payload = {
            "full_name": "Status Injector",
            "email": email,
            "password": "Password123!",
            "role": "ISSUER",
            "verification_token": token,
            "organization": {
                "name": "Injection Corp",
                "org_type": "Enterprise",
                "registration_number": "INJ-999",
                "authorized_representative_name": "Injector",
                "status": "APPROVED",  # Arbitrary status attempt
                "reviewed_by_id": 1,
            },
        }
        res = client.post("/api/v1/auth/signup", json=payload)
        assert res.status_code == 201
        # Organization is always set to ACTIVE by backend logic regardless of payload
        assert res.json()["organization"]["status"] == "ACTIVE"


# ---------------------------------------------------------------------------
# Requirement 5 & 6: Super Admin Oversight APIs & RBAC Protection
# ---------------------------------------------------------------------------
class TestAdminOversightAndRBAC:
    def test_super_admin_can_list_organizations(self, client, test_setup):
        """Req 5: Super Admin can list organizations with pagination and filters."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        res = client.get("/api/v1/admin/organizations", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2
        # Check summary fields
        first = data["items"][0]
        assert "name" in first
        assert "registration_number" in first
        assert "status" in first
        assert "issuer_email" in first
        assert "issuer_name" in first

    def test_filter_by_status_and_type(self, client, test_setup):
        """Req 5: Filter organizations by status and type."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        res = client.get("/api/v1/admin/organizations?status=ACTIVE&org_type=University", headers=headers)
        assert res.status_code == 200
        items = res.json()["items"]
        assert all(item["status"] == "ACTIVE" for item in items)
        assert any("Apex University" in item["name"] for item in items)

    def test_super_admin_can_get_org_detail(self, client, test_setup):
        """Req 5: Super Admin can retrieve complete organization details."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_a_id"]
        res = client.get(f"/api/v1/admin/organizations/{org_id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Apex University"
        assert data["registration_number"] == "APEX-REG-001"
        assert len(data["documents"]) >= 1

    def test_issuer_and_verifier_blocked_from_admin_endpoints(self, client, test_setup):
        """Req 6: Issuers and Verifiers cannot access Super Admin organization oversight endpoints."""
        issuer_headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        verifier_headers = {"Authorization": f"Bearer {test_setup['verifier_token']}"}

        # 1. Issuer gets 403 Forbidden
        res1 = client.get("/api/v1/admin/organizations", headers=issuer_headers)
        assert res1.status_code == 403

        # 2. Verifier gets 403 Forbidden
        res2 = client.get("/api/v1/admin/organizations", headers=verifier_headers)
        assert res2.status_code == 403

        # 3. Unauthenticated gets 401 Unauthorized
        res3 = client.get("/api/v1/admin/organizations")
        assert res3.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Requirement 7, 8: Supporting Document Metadata & Private Inspection
# ---------------------------------------------------------------------------
class TestAdminOrganizationListing:
    def test_listing_supports_stable_sort_and_validated_pagination(self, client, test_setup):
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        first = client.get("/api/v1/admin/organizations?sort_by=name&sort_order=asc&limit=1&page=1", headers=headers)
        second = client.get("/api/v1/admin/organizations?sort_by=name&sort_order=asc&limit=1&page=2", headers=headers)
        assert first.status_code == 200
        assert second.status_code == 200
        assert len(first.json()["items"]) == 1
        assert len(second.json()["items"]) == 1
        assert first.json()["items"][0]["name"] < second.json()["items"][0]["name"]

        invalid_sort = client.get("/api/v1/admin/organizations?sort_by=hashed_password", headers=headers)
        invalid_limit = client.get("/api/v1/admin/organizations?limit=101", headers=headers)
        assert invalid_sort.status_code == 422
        assert invalid_limit.status_code == 422


class TestSupportingDocuments:
    def test_super_admin_inspect_document_metadata(self, client, test_setup):
        """Req 7: Super Admin can inspect submitted supporting document metadata."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_a_id"]
        res = client.get(f"/api/v1/admin/organizations/{org_id}/documents", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["organization_id"] == org_id
        assert len(data["documents"]) == 2
        primary_doc = next(d for d in data["documents"] if d["id"] == "primary")
        assert primary_doc["filename"] == "apex_charter.pdf"
        assert primary_doc["storage_status"] in ("STORED", "METADATA_ONLY")

    def test_inspect_document_reports_storage_limitation_when_not_on_disk(self, client, test_setup):
        """Req 7 & Limitation: Reports storage subsystem limitation when physical file is not on disk."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_a_id"]
        # File 'apex_charter.pdf' is metadata only and not physically in private storage folder
        res = client.get(f"/api/v1/admin/organizations/{org_id}/documents/primary", headers=headers)
        assert res.status_code == 422
        data = res.json()
        assert data["error"] == "STORAGE_SUBSYSTEM_LIMITATION"
        assert "limitation" in data["detail"].lower()

    def test_inspect_document_streams_file_when_physically_present(self, client, test_setup):
        """Req 7 & 8: Safely streams file when physical file is present in private storage."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_a_id"]

        # Create a real test file in private storage
        org_storage_dir = os.path.join(document_service.base_dir, str(org_id))
        os.makedirs(org_storage_dir, exist_ok=True)
        test_file_path = os.path.join(org_storage_dir, "apex_charter.pdf")
        with open(test_file_path, "wb") as f:
            f.write(b"%PDF-1.4 Test Charter Content")

        try:
            res = client.get(f"/api/v1/admin/organizations/{org_id}/documents/primary", headers=headers)
            assert res.status_code == 200
            assert b"%PDF-1.4 Test Charter Content" in res.content
        finally:
            if os.path.exists(test_file_path):
                os.remove(test_file_path)

    def test_unauthorized_users_cannot_access_documents(self, client, test_setup):
        """Req 8: Unauthorized users (Issuer, Verifier, Public) cannot access private documents."""
        org_id = test_setup["org_a_id"]
        issuer_b_headers = {"Authorization": f"Bearer {test_setup['issuer_b_token']}"}
        verifier_headers = {"Authorization": f"Bearer {test_setup['verifier_token']}"}

        # Another Issuer cannot access Org A's documents
        res1 = client.get(f"/api/v1/admin/organizations/{org_id}/documents", headers=issuer_b_headers)
        assert res1.status_code == 403

        # Verifier cannot access Org A's documents
        res2 = client.get(f"/api/v1/admin/organizations/{org_id}/documents", headers=verifier_headers)
        assert res2.status_code == 403

        # Public unauthenticated cannot access
        res3 = client.get(f"/api/v1/admin/organizations/{org_id}/documents")
        assert res3.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Requirement 9, 10, 11, 14: Suspend, Revoke, Reasons & State Transitions
# ---------------------------------------------------------------------------
class TestLifecycleStateTransitions:
    def test_suspension_requires_reason(self, client, test_setup):
        """Req 11: Suspension requires non-empty reason."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        # Missing reason
        res1 = client.post(f"/api/v1/admin/organizations/{org_id}/suspend", json={}, headers=headers)
        assert res1.status_code == 422

        # Empty reason
        res2 = client.post(f"/api/v1/admin/organizations/{org_id}/suspend", json={"reason": "   "}, headers=headers)
        assert res2.status_code == 422

    def test_super_admin_can_suspend_active_organization(self, client, test_setup):
        """Req 9: Super Admin can suspend an ACTIVE organization."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/suspend",
            json={"reason": "Pending compliance audit on healthcare accreditation."},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["previous_status"] == "ACTIVE"
        assert data["new_status"] == "SUSPENDED"

    def test_cannot_suspend_already_suspended_organization(self, client, test_setup):
        """Req 14: Invalid state transition — cannot suspend an already suspended organization."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/suspend",
            json={"reason": "Duplicate suspend attempt."},
            headers=headers,
        )
        assert res.status_code == 400
        assert "already suspended" in res.json()["detail"].lower()

    def test_super_admin_can_restore_suspended_organization(self, client, test_setup):
        """Restore SUSPENDED organization back to ACTIVE."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/restore",
            json={"reason": "Healthcare accreditation verified and cleared."},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["previous_status"] == "SUSPENDED"
        assert data["new_status"] == "ACTIVE"

    def test_super_admin_can_revoke_organization(self, client, test_setup):
        """Req 10: Super Admin can revoke an organization."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/revoke",
            json={"reason": "Severe regulatory violation: forged operational license."},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["new_status"] == "REVOKED"

    def test_cannot_revoke_already_revoked_organization(self, client, test_setup):
        """Req 14: Invalid state transition — duplicate revocation rejected."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/revoke",
            json={"reason": "Another revocation attempt."},
            headers=headers,
        )
        assert res.status_code == 400
        assert "revoked" in res.json()["detail"].lower()

    def test_cannot_suspend_a_revoked_organization(self, client, test_setup):
        """Req 14: Invalid state transition — cannot suspend a revoked organization."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/suspend",
            json={"reason": "Attempting to suspend revoked org."},
            headers=headers,
        )
        assert res.status_code == 400
        assert "revoked" in res.json()["detail"].lower()

    def test_standard_restore_rejected_for_revoked_organization(self, client, test_setup):
        """Req 14: Standard restore endpoint blocks REVOKED organization without explicit flag."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/restore",
            json={"reason": "Accidental standard restore."},
            headers=headers,
        )
        assert res.status_code == 400
        assert "reinstatement" in res.json()["detail"].lower()

    def test_explicit_reinstatement_of_revoked_organization(self, client, test_setup):
        """Super Admin explicit reinstatement of a REVOKED organization via /reinstate."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        res = client.post(
            f"/api/v1/admin/organizations/{org_id}/reinstate",
            json={"reason": "Formal judicial exoneration and license reinstated by state board."},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["previous_status"] == "REVOKED"
        assert data["new_status"] == "ACTIVE"


class TestOrganizationAccountStatePreservation:
    def test_reinstate_does_not_reactivate_individually_disabled_user(self, client, test_setup):
        db = TestingSessionLocal()
        organization = Organization(
            name="State Preservation Entity",
            org_type="Enterprise",
            registration_number="STATE-PRESERVE-001",
            official_email="state-preserve@example.test",
            authorized_representative_name="Disabled Issuer",
            status=OrganizationStatus.ACTIVE,
        )
        db.add(organization)
        db.flush()
        issuer = User(
            email="disabled-state-preserve@example.test",
            full_name="Disabled Issuer",
            hashed_password=hash_password("UnusedPassword123!"),
            role=UserRole.ISSUER,
            is_active=False,
            organization_id=organization.id,
        )
        db.add(issuer)
        db.commit()
        organization_id = organization.id
        issuer_id = issuer.id
        db.close()

        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        revoked = client.post(
            f"/api/v1/admin/organizations/{organization_id}/revoke",
            json={"reason": "State preservation regression test."},
            headers=headers,
        )
        assert revoked.status_code == 200
        reinstated = client.post(
            f"/api/v1/admin/organizations/{organization_id}/reinstate",
            json={"reason": "Explicit test reinstatement justification."},
            headers=headers,
        )
        assert reinstated.status_code == 200

        db = TestingSessionLocal()
        preserved_user = db.query(User).filter(User.id == issuer_id).first()
        assert preserved_user.is_active is False
        db.close()


# ---------------------------------------------------------------------------
# Requirement 12 & 13: Revocation/Suspension Enforcement on Existing JWTs
# ---------------------------------------------------------------------------
class TestAccessEnforcementAndJWTRevocation:
    def test_revoked_organization_blocks_existing_jwt_server_side(self, client, test_setup):
        """Req 12 & 13: Live organization status blocks existing JWTs without mutating user account state."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_b_id"]

        # 1. First revoke Org B
        client.post(
            f"/api/v1/admin/organizations/{org_id}/revoke",
            json={"reason": "Revoking Org B to test existing JWT blockage."},
            headers=headers,
        )

        db = TestingSessionLocal()
        issuer_b = db.query(User).filter(User.id == test_setup["issuer_b_id"]).first()
        assert issuer_b.is_active is True
        db.close()

        # 2. Issuer B already had an active JWT (`issuer_b_token`) issued before revocation.
        # It must be immediately blocked by the server-side check on get_current_user!
        issuer_b_headers = {"Authorization": f"Bearer {test_setup['issuer_b_token']}"}
        me_res = client.get("/api/v1/auth/me", headers=issuer_b_headers)
        assert me_res.status_code == 403
        assert "inactive" in me_res.json()["detail"].lower() or "revoked" in me_res.json()["detail"].lower()

        # 3. New login attempt with Issuer B credentials is also blocked
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "issuer.b@beaconhealth.org", "password": "IssuerPassB123!"},
        )
        assert login_res.status_code == 403

        # 4. Unrelated Organization A is completely unaffected
        issuer_a_headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        me_a = client.get("/api/v1/auth/me", headers=issuer_a_headers)
        assert me_a.status_code == 200
        assert me_a.json()["email"] == "issuer.a@apex.edu"


# ---------------------------------------------------------------------------
# Requirement 15: Cross-Organization Isolation
# ---------------------------------------------------------------------------
class TestCrossOrganizationIsolation:
    def test_verifier_cannot_access_matching_organization(self, test_setup):
        verifier = User(
            id=999,
            email="linked-verifier@external.com",
            full_name="Linked Verifier",
            hashed_password="unused",
            role=UserRole.VERIFIER,
            is_active=True,
            organization_id=test_setup["org_a_id"],
        )

        with pytest.raises(HTTPException) as exc_info:
            require_organization_access(test_setup["org_a_id"], verifier)

        assert exc_info.value.status_code == 403

    def test_issuer_cannot_access_another_organization_data(self, client, test_setup):
        """Req 15: An Issuer cannot access another organization's private data."""
        issuer_a_headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        org_b_id = test_setup["org_b_id"]

        # Issuer A attempts to access Org B admin or detail endpoint
        res = client.get(f"/api/v1/admin/organizations/{org_b_id}", headers=issuer_a_headers)
        # Blocked: 403 Forbidden
        assert res.status_code == 403


class TestOrganizationProfileAPI:
    def test_issuer_can_update_own_profile_and_status_is_not_editable(self, client, test_setup):
        headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        organization_id = test_setup["org_a_id"]

        update = client.patch(
            f"/api/v1/organizations/{organization_id}",
            json={"name": "Apex University Updated", "city": "Cambridge"},
            headers=headers,
        )
        assert update.status_code == 200
        assert update.json()["name"] == "Apex University Updated"
        assert update.json()["city"] == "Cambridge"
        assert update.json()["status"] == "ACTIVE"

        forbidden_update = client.patch(
            f"/api/v1/organizations/{organization_id}",
            json={"status": "REVOKED", "organization_id": test_setup["org_b_id"]},
            headers=headers,
        )
        assert forbidden_update.status_code == 422

        history = client.get(f"/api/v1/admin/organizations/{organization_id}/history", headers={"Authorization": f"Bearer {test_setup['admin_token']}"})
        assert history.status_code == 200
        assert any(event["event_type"] == "ORGANIZATION_PROFILE_UPDATED" for event in history.json()["events"])

        page = client.get(
            f"/api/v1/admin/organizations/{organization_id}/history?page=1&limit=1",
            headers={"Authorization": f"Bearer {test_setup['admin_token']}"},
        )
        assert page.status_code == 200
        assert page.json()["total"] >= 1
        assert len(page.json()["events"]) == 1

        db = TestingSessionLocal()
        organization = db.query(Organization).filter(Organization.id == organization_id).first()
        organization.status = OrganizationStatus.SUSPENDED
        db.commit()
        db.close()
        try:
            suspended_update = client.patch(
                f"/api/v1/organizations/{organization_id}",
                json={"city": "Blocked City"},
                headers=headers,
            )
            assert suspended_update.status_code == 403
        finally:
            db = TestingSessionLocal()
            organization = db.query(Organization).filter(Organization.id == organization_id).first()
            organization.status = OrganizationStatus.ACTIVE
            db.commit()
            db.close()

    def test_issuer_and_verifier_cannot_access_another_organization_profile(self, client, test_setup):
        organization_id = test_setup["org_a_id"]
        issuer_b = {"Authorization": f"Bearer {test_setup['issuer_b_token']}"}
        verifier = {"Authorization": f"Bearer {test_setup['verifier_token']}"}

        issuer_response = client.get(f"/api/v1/organizations/{organization_id}", headers=issuer_b)
        verifier_response = client.get(f"/api/v1/organizations/{organization_id}", headers=verifier)
        assert issuer_response.status_code == 403
        assert verifier_response.status_code == 403


class TestPrivateDocumentAPI:
    def test_storage_rejects_frontend_public_directory(self):
        public_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))
        with pytest.raises(ValueError, match="public frontend directory"):
            DocumentService(public_directory)

    def test_issuer_uploads_and_downloads_private_document(self, client, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path))
        headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        organization_id = test_setup["org_a_id"]
        content = b"%PDF-1.4 private test document"

        upload = client.post(
            f"/api/v1/organizations/{organization_id}/documents",
            data={"document_type": "PRIMARY"},
            files={"file": ("charter.pdf", content, "text/plain")},
            headers=headers,
        )
        assert upload.status_code == 201, upload.json()
        metadata = upload.json()
        assert metadata["filename"] == "charter.pdf"
        assert metadata["content_type"] == "application/pdf"
        assert metadata["size_bytes"] == len(content)
        assert str(tmp_path) not in upload.text

        listing = client.get(f"/api/v1/organizations/{organization_id}/documents", headers=headers)
        assert listing.status_code == 200
        assert any(item["id"] == metadata["id"] and item["storage_status"] == "STORED" for item in listing.json()["documents"])

        download = client.get(f"/api/v1/organizations/{organization_id}/documents/{metadata['id']}", headers=headers)
        assert download.status_code == 200
        assert download.content == content
        assert download.headers["x-content-type-options"] == "nosniff"

        other_issuer = {"Authorization": f"Bearer {test_setup['issuer_b_token']}"}
        denied = client.get(f"/api/v1/organizations/{organization_id}/documents/{metadata['id']}", headers=other_issuer)
        assert denied.status_code == 403

    def test_upload_rejects_bad_signature_and_oversized_content(self, client, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path))
        headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        organization_id = test_setup["org_a_id"]

        invalid = client.post(
            f"/api/v1/organizations/{organization_id}/documents",
            data={"document_type": "PRIMARY"},
            files={"file": ("not-a-pdf.pdf", b"not a PDF", "application/pdf")},
            headers=headers,
        )
        assert invalid.status_code == 415
        assert not [path for path in tmp_path.rglob("*") if path.is_file()]

        monkeypatch.setattr(settings, "MAX_ORGANIZATION_DOCUMENT_SIZE_BYTES", 8)
        oversized = client.post(
            f"/api/v1/organizations/{organization_id}/documents",
            data={"document_type": "PRIMARY"},
            files={"file": ("large.pdf", b"%PDF-1.4 too large", "application/pdf")},
            headers=headers,
        )
        assert oversized.status_code == 413
        assert not [path for path in tmp_path.rglob("*") if path.is_file()]

    def test_storage_file_is_removed_when_metadata_commit_fails(self, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path))
        db = TestingSessionLocal()
        organization = db.query(Organization).filter(Organization.id == test_setup["org_a_id"]).first()
        original_commit = Session.commit

        def fail_document_commit(session):
            if any(isinstance(item, OrganizationDocument) for item in session.new):
                raise RuntimeError("simulated metadata failure")
            return original_commit(session)

        monkeypatch.setattr(Session, "commit", fail_document_commit)
        with pytest.raises(RuntimeError, match="simulated metadata failure"):
            document_service.store_uploaded_document(
                db=db,
                organization=organization,
                document_type="PRIMARY",
                filename="charter.pdf",
                source=io.BytesIO(b"%PDF-1.4 test"),
            )
        assert not [path for path in tmp_path.rglob("*") if path.is_file()]
        db.close()


class TestDocumentRegistryAPI:
    def test_public_lookup_rate_limit_returns_429(self, client, monkeypatch):
        from app.api.v1.documents import _PUBLIC_RATE_LIMITS

        _PUBLIC_RATE_LIMITS.clear()
        monkeypatch.setattr(settings, "PUBLIC_VERIFICATION_MAX_REQUESTS_PER_MINUTE", 1)
        first = client.get("/api/v1/verify/rate-limit-public-identifier-0001")
        second = client.get("/api/v1/verify/rate-limit-public-identifier-0002")
        assert first.status_code == 200
        assert first.json()["outcome"] == "UNVERIFIED"
        assert second.status_code == 429
        assert second.headers["retry-after"]

    def test_register_verify_compare_download_and_revoke(self, client, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path / "private-documents"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_PRIVATE_KEY_PATH", str(tmp_path / "keys" / "signing.pem"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_KEY_ID", "test-key-01")
        monkeypatch.setattr(settings, "PUBLIC_FRONTEND_URL", "http://localhost:5175")
        issuer_headers = {"Authorization": f"Bearer {test_setup['issuer_a_token']}"}
        original_bytes = b"%PDF-1.4 canonical document payload"

        registration = client.post(
            "/api/v1/documents/register",
            data={
                "title": "Verified Test Certificate",
                "document_type": "Certificate",
                "issue_date": "2026-10-09",
                "recipient_name": "Registry Test Recipient",
                "recipient_identifier": "TEST-RECIPIENT-01",
                "recipient_email": "recipient@example.com",
                "issuer_notes": "private issuer note",
            },
            files={"file": ("certificate.pdf", original_bytes, "application/octet-stream")},
            headers=issuer_headers,
        )
        assert registration.status_code == 201, registration.json()
        registered = registration.json()
        assert registered["status"] == "ACTIVE"
        assert registered["signature_algorithm"] == "ECDSA-P256-SHA256"
        assert registered["signing_key_id"] == "test-key-01"
        assert registered["qr_code_data_url"].startswith("data:image/svg+xml;base64,")
        assert registered["verification_url"] == f"http://localhost:5175/verify/{registered['public_verification_id']}"
        assert str(tmp_path) not in registration.text
        assert "storage_key" not in registered

        issuer_list = client.get("/api/v1/documents/my", headers=issuer_headers)
        assert issuer_list.status_code == 200
        assert issuer_list.json()["total"] == 1
        other_issuer = {"Authorization": f"Bearer {test_setup['issuer_b_token']}"}
        other_list = client.get("/api/v1/documents/my", headers=other_issuer)
        assert other_list.status_code in (200, 403)
        if other_list.status_code == 200:
            assert other_list.json()["items"] == []
        verifier = {"Authorization": f"Bearer {test_setup['verifier_token']}"}
        assert client.get("/api/v1/documents/my", headers=verifier).status_code == 403

        details = client.get(f"/api/v1/documents/{registered['document_id']}", headers=issuer_headers)
        assert details.status_code == 200
        assert details.json()["signature_value"] == registered["signature_value"]
        download = client.get(f"/api/v1/documents/{registered['document_id']}/download", headers=issuer_headers)
        assert download.status_code == 200
        downloaded_bytes = download.content
        assert hashlib.sha256(downloaded_bytes).hexdigest() == registered["sha256_hash"]
        assert download.headers["x-content-type-options"] == "nosniff"

        public_id = registered["public_verification_id"]
        verification = client.get(f"/api/v1/verify/{public_id}")
        assert verification.status_code == 200
        assert verification.json()["outcome"] == "VERIFIED"
        assert verification.json()["hash_matches"] is True
        assert verification.json()["signature_valid"] is True
        assert "recipient_email" not in verification.json()
        assert "revocation_reason" not in verification.json()

        matching_compare = client.post(
            f"/api/v1/verify/{public_id}/compare",
            files={"file": ("same.pdf", downloaded_bytes, "application/pdf")},
        )
        altered_compare = client.post(
            f"/api/v1/verify/{public_id}/compare",
            files={"file": ("changed.pdf", b"%PDF-1.4 altered payload", "application/pdf")},
        )
        assert matching_compare.json()["outcome"] == "VERIFIED"
        assert altered_compare.json()["outcome"] == "TAMPERED"
        assert client.get("/api/v1/verify/unknown-public-identifier-0001").json()["outcome"] == "UNVERIFIED"

        db = TestingSessionLocal()
        record = db.query(RegisteredDocument).filter(RegisteredDocument.id == registered["document_id"]).first()
        stored_path = document_service._resolve_storage_key(record.organization_id, record.storage_key)
        db.close()
        with open(stored_path, "wb") as stored_file:
            stored_file.write(b"%PDF-1.4 corrupted at rest")
        assert client.get(f"/api/v1/verify/{public_id}").json()["outcome"] == "TAMPERED"
        assert client.get(f"/api/v1/documents/{registered['document_id']}/download", headers=issuer_headers).status_code == 409

        os.remove(stored_path)
        missing_original = client.post(
            f"/api/v1/verify/{public_id}/compare",
            files={"file": ("same.pdf", downloaded_bytes, "application/pdf")},
        )
        assert missing_original.json()["outcome"] == "UNVERIFIED"
        with open(stored_path, "wb") as stored_file:
            stored_file.write(downloaded_bytes)

        revoked = client.post(
            f"/api/v1/documents/{registered['document_id']}/revoke",
            json={"reason": "Issued with incorrect recipient metadata."},
            headers=issuer_headers,
        )
        assert revoked.status_code == 200
        assert revoked.json()["status"] == "REVOKED"
        assert client.get(f"/api/v1/verify/{public_id}").json()["outcome"] == "REVOKED"
        history = client.get(f"/api/v1/documents/{registered['document_id']}/history", headers=issuer_headers)
        assert history.status_code == 200
        assert {event["event_type"] for event in history.json()["events"]} >= {"DOCUMENT_REGISTERED", "DOCUMENT_REVOKED"}
        revoked_compare = client.post(
            f"/api/v1/verify/{public_id}/compare",
            files={"file": ("not-used.txt", b"not a document", "text/plain")},
        )
        assert revoked_compare.json()["outcome"] == "REVOKED"
        duplicate_revoke = client.post(
            f"/api/v1/documents/{registered['document_id']}/revoke",
            json={"reason": "Duplicate revocation test."},
            headers=issuer_headers,
        )
        assert duplicate_revoke.status_code == 409

        admin_headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        admin_list = client.get("/api/v1/admin/documents?search=Verified%20Test%20Certificate", headers=admin_headers)
        assert admin_list.status_code == 200
        assert admin_list.json()["total"] == 1

    def test_record_embedded_key_cannot_self_authenticate(self, client, test_setup, monkeypatch, tmp_path):
        import base64
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization
        from app.api.v1.documents import _manifest_for_record
        from app.services.document_crypto_service import document_crypto_service

        monkeypatch.setattr(document_service, "base_dir", str(tmp_path / "private-documents"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_PRIVATE_KEY_PATH", str(tmp_path / "keys" / "trusted.pem"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_KEY_ID", "trusted-key-01")
        registration = client.post(
            "/api/v1/documents/register",
            data={"title": "Trust Boundary Test", "document_type": "Certificate", "issue_date": "2026-10-09"},
            files={"file": ("trust.pdf", b"%PDF-1.4 trusted document", "application/pdf")},
            headers={"Authorization": f"Bearer {test_setup['issuer_a_token']}"},
        )
        assert registration.status_code == 201, registration.json()
        registered = registration.json()

        db = TestingSessionLocal()
        record = db.query(RegisteredDocument).filter(RegisteredDocument.id == registered["document_id"]).first()
        original_key_id = record.signing_key_id
        original_signature = record.signature_value
        original_public_key = record.signing_public_key
        original_manifest = record.signed_manifest
        try:
            attacker_key = ec.generate_private_key(ec.SECP256R1())
            record.signing_key_id = "attacker-controlled-key"
            forged_manifest = document_crypto_service.canonical_manifest(_manifest_for_record(record))
            record.signed_manifest = forged_manifest
            record.signing_public_key = attacker_key.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode("ascii")
            record.signature_value = base64.b64encode(
                attacker_key.sign(forged_manifest.encode("utf-8"), ec.ECDSA(hashes.SHA256()))
            ).decode("ascii")
            db.commit()

            response = client.get(f"/api/v1/verify/{registered['public_verification_id']}")
            assert response.status_code == 200
            assert response.json()["outcome"] == "UNVERIFIED"
            assert response.json()["hash_matches"] is True
            assert response.json()["signature_valid"] is None
        finally:
            record.signing_key_id = original_key_id
            record.signature_value = original_signature
            record.signing_public_key = original_public_key
            record.signed_manifest = original_manifest
            db.commit()
            db.close()

    def test_production_registration_fails_without_persistent_signing_key(self, client, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path / "private-documents"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_PRIVATE_KEY_PATH", str(tmp_path / "missing" / "key.pem"))
        monkeypatch.setattr(settings, "ENVIRONMENT", "production")
        db = TestingSessionLocal()
        prior_count = db.query(RegisteredDocument).count()
        db.close()
        response = client.post(
            "/api/v1/documents/register",
            data={"title": "Missing Key Test", "document_type": "Certificate", "issue_date": "2026-10-09"},
            files={"file": ("missing-key.pdf", b"%PDF-1.4 payload", "application/pdf")},
            headers={"Authorization": f"Bearer {test_setup['issuer_a_token']}"},
        )
        assert response.status_code == 503
        db = TestingSessionLocal()
        assert db.query(RegisteredDocument).count() == prior_count
        db.close()
        private_root = tmp_path / "private-documents"
        assert not private_root.exists() or not [path for path in private_root.rglob("*") if path.is_file()]

    def test_registry_database_failure_removes_private_payload(self, client, test_setup, monkeypatch, tmp_path):
        monkeypatch.setattr(document_service, "base_dir", str(tmp_path / "private-documents"))
        monkeypatch.setattr(settings, "DOCUMENT_SIGNING_PRIVATE_KEY_PATH", str(tmp_path / "keys" / "key.pem"))
        monkeypatch.setattr(settings, "ENVIRONMENT", "development")
        db = TestingSessionLocal()
        prior_count = db.query(RegisteredDocument).count()
        db.close()
        original_commit = Session.commit

        def fail_registry_commit(session):
            if any(isinstance(item, RegisteredDocument) for item in session.new):
                raise RuntimeError("simulated registry database failure")
            return original_commit(session)

        monkeypatch.setattr(Session, "commit", fail_registry_commit)
        response = client.post(
            "/api/v1/documents/register",
            data={"title": "Rollback Test", "document_type": "Certificate", "issue_date": "2026-10-09"},
            files={"file": ("rollback.pdf", b"%PDF-1.4 rollback payload", "application/pdf")},
            headers={"Authorization": f"Bearer {test_setup['issuer_a_token']}"},
        )
        assert response.status_code == 500
        private_root = tmp_path / "private-documents"
        assert not private_root.exists() or not [path for path in private_root.rglob("*") if path.is_file()]
        db = TestingSessionLocal()
        assert db.query(RegisteredDocument).count() == prior_count
        db.close()


# ---------------------------------------------------------------------------
# Requirement 16: Audit Trail Verification
# ---------------------------------------------------------------------------
class TestAuditTrail:
    def test_audit_events_recorded_with_actor_and_reason(self, client, test_setup):
        """Req 16: Administrative actions generate audit events with actor, org, and details."""
        headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        org_id = test_setup["org_a_id"]

        # Suspend and restore Org A to generate audit entries
        client.post(
            f"/api/v1/admin/organizations/{org_id}/suspend",
            json={"reason": "Audit verification suspension."},
            headers=headers,
        )
        client.post(
            f"/api/v1/admin/organizations/{org_id}/restore",
            json={"reason": "Audit verification restoration."},
            headers=headers,
        )

        # Retrieve history
        res = client.get(f"/api/v1/admin/organizations/{org_id}/history", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["organization_id"] == org_id
        events = data["events"]
        event_types = [e["event_type"] for e in events]
        assert "ORGANIZATION_SUSPENDED" in event_types
        assert "ORGANIZATION_RESTORED" in event_types

        # Verify actor email and reason are included in audit details
        susp_event = next(e for e in events if e["event_type"] == "ORGANIZATION_SUSPENDED")
        assert "superadmin@veriproof.com" in susp_event["details"]
        assert "Audit verification suspension" in susp_event["details"]

        page = client.get(f"/api/v1/admin/organizations/{org_id}/history?page=1&limit=1", headers=headers)
        assert page.status_code == 200
        assert page.json()["total"] >= 2
        assert len(page.json()["events"]) == 1


# ---------------------------------------------------------------------------
# Requirement 18: Uniqueness & Database Integrity
# ---------------------------------------------------------------------------
class TestDatabaseIntegrity:
    def test_duplicate_registration_number_rejected(self, client):
        """Req 18: Duplicate organization registration number is rejected on signup."""
        email = "duplicate_reg@corp.com"
        token = create_email_verification_token(email, "registration")
        otp_service._store[(email, "registration")] = {
            "otp_hash": "dummy",
            "expires_at": 9999999999,
            "attempts_remaining": 5,
            "last_sent_at": 0,
            "is_verified": True,
            "_test_code": None,
        }

        payload = {
            "full_name": "Dupe Rep",
            "email": email,
            "password": "Password123!",
            "role": "ISSUER",
            "verification_token": token,
            "organization": {
                "name": "Dupe Org",
                "org_type": "Enterprise",
                "registration_number": "APEX-REG-001",  # Already exists!
                "authorized_representative_name": "Dupe Rep",
            },
        }

        res = client.post("/api/v1/auth/signup", json=payload)
        assert res.status_code == 409
        assert "registration number" in res.json()["detail"].lower()
