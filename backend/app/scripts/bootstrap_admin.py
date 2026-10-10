"""
Super Admin bootstrap entrypoint.
"""
from bootstrap_admin import bootstrap_super_admin

if __name__ == "__main__":
    import sys
    success = bootstrap_super_admin()
    sys.exit(0 if success else 1)
