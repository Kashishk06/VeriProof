#!/usr/bin/env python
"""
VeriProof - Privileged Super Admin Bootstrap Utility
Secure command-line provisioning for initial platform administrator.

Usage in PowerShell:
    python bootstrap_admin.py
"""

import sys
import os
import re
import getpass
from typing import Optional

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.audit import AuditEvent
from app.core.security import hash_password


EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_password_strength(pw: str) -> Optional[str]:
    """Validate administrator password complexity."""
    if len(pw) < 10:
        return "Password must be at least 10 characters long."
    if not re.search(r"[A-Z]", pw):
        return "Password must include at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", pw):
        return "Password must include at least one lowercase letter (a-z)."
    if not re.search(r"\d", pw):
        return "Password must include at least one numeric digit (0-9)."
    if not re.search(r"[^A-Za-z0-9]", pw):
        return "Password must include at least one special character (!@#$%^&*...)."
    return None


from sqlalchemy.orm import Session as DBSession

def bootstrap_super_admin(
    full_name: Optional[str] = None,
    email: Optional[str] = None,
    password: Optional[str] = None,
    interactive: bool = True,
    db: Optional[DBSession] = None,
) -> bool:
    print("=" * 64)
    print(" VeriProof - Privileged Super Admin Bootstrap Utility")
    print("=" * 64)

    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # 1. Prevent duplicate Super Admin provisioning
        existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing_admin:
            print("\n[ERROR] A Super Admin account already exists in PostgreSQL:")
            print(f"        Active Administrator Email: {existing_admin.email}")
            print("[INFO]  Accidental duplicate administrator creation is blocked.")
            print("        Super Admin accounts cannot be recreated or overwritten via bootstrap.")
            return False

        # 2. Collect Full Name
        if not full_name:
            if interactive and sys.stdin.isatty():
                entered_name = input("\nEnter Super Admin Full Name [System Administrator]: ").strip()
                full_name = entered_name or "System Administrator"
            else:
                full_name = os.getenv("SUPER_ADMIN_NAME", "System Administrator")

        # 3. Collect Email
        if not email:
            if interactive and sys.stdin.isatty():
                email = input("Enter Super Admin Email Address: ").strip()
            else:
                email = os.getenv("SUPER_ADMIN_EMAIL", "").strip()

        if not email or not EMAIL_REGEX.match(email):
            print("\n[ERROR] Invalid email address format. Aborting bootstrap.")
            return False

        email = email.lower()

        # 4. Prevent elevating existing non-admin user
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"\n[ERROR] An account with email '{email}' already exists with role '{existing_user.role.value}'.")
            print("        Silently elevating existing accounts to Super Admin is prohibited.")
            print("        Please provide a unique, dedicated administrative email address.")
            return False

        # 5. Collect Password (Hidden input, never on CLI arguments)
        if not password:
            if interactive and sys.stdin.isatty():
                while True:
                    pw = getpass.getpass("Enter Super Admin Password (hidden): ")
                    err = validate_password_strength(pw)
                    if err:
                        print(f"[ERROR] {err} Please try again.")
                        continue
                    pw_confirm = getpass.getpass("Confirm Super Admin Password: ")
                    if pw != pw_confirm:
                        print("[ERROR] Passwords do not match. Please try again.")
                        continue
                    password = pw
                    break
            else:
                password = os.getenv("SUPER_ADMIN_PASSWORD", "")

        err = validate_password_strength(password)
        if err:
            print(f"\n[ERROR] Provided password does not meet security requirements: {err}")
            return False

        # 6. Hash password with Argon2id and store in PostgreSQL
        hashed = hash_password(password)

        new_admin = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(new_admin)
        db.flush()

        # 7. Record security audit event
        audit = AuditEvent(
            event_type="SUPER_ADMIN_PROVISIONED",
            user_id=new_admin.id,
            details=f"Initial Super Admin account provisioned for '{email}'.",
            ip_address="127.0.0.1",
        )
        db.add(audit)
        db.commit()

        print("\n" + "-" * 64)
        print("[SUCCESS] Super Admin account created successfully!")
        print(f"  Account Email: {email}")
        print(f"  Role:          {UserRole.SUPER_ADMIN.value}")
        print("  Status:        ACTIVE")
        print("  Login Route:   POST /api/v1/auth/login")
        print("-" * 64)
        print("[NOTICE] Credentials have been securely hashed using Argon2id.")
        print("         Passwords and secrets are never printed or stored in plaintext.")
        return True

    except Exception as exc:
        db.rollback()
        print(f"\n[CRITICAL] Database error during Super Admin provisioning: {exc}")
        return False
    finally:
        if should_close_db:
            db.close()


if __name__ == "__main__":
    success = bootstrap_super_admin()
    sys.exit(0 if success else 1)
