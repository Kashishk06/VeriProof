"""Document manifest signing, verification, and QR generation."""

import base64
import io
import json
import os
from datetime import datetime, timezone
from typing import Any

import qrcode
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from qrcode.image.svg import SvgPathImage

from app.core.config import settings


class SigningConfigurationError(RuntimeError):
    """Raised when no persistent document signing key is configured."""


class DocumentCryptoService:
    def _key_path(self) -> str:
        if settings.DOCUMENT_SIGNING_PRIVATE_KEY_PATH:
            return os.path.abspath(settings.DOCUMENT_SIGNING_PRIVATE_KEY_PATH)
        backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        return os.path.join(backend_root, "storage", "keys", "document-signing-key.pem")

    def _load_or_create_private_key(self) -> ec.EllipticCurvePrivateKey:
        key_path = self._key_path()
        if os.path.isfile(key_path):
            try:
                with open(key_path, "rb") as key_file:
                    key = serialization.load_pem_private_key(key_file.read(), password=None)
            except (OSError, ValueError, TypeError) as exc:
                raise SigningConfigurationError("The configured document signing key cannot be loaded.") from exc
            if not isinstance(key, ec.EllipticCurvePrivateKey) or not isinstance(key.curve, ec.SECP256R1):
                raise SigningConfigurationError("The configured document key must be an ECDSA P-256 private key.")
            try:
                os.chmod(key_path, 0o600)
            except OSError:
                if os.name != "nt":
                    raise SigningConfigurationError("The document signing key permissions could not be secured.")
            return key

        if settings.ENVIRONMENT.lower() != "development":
            raise SigningConfigurationError("A persistent document signing key must be configured outside development.")

        key = ec.generate_private_key(ec.SECP256R1())
        key_bytes = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        os.makedirs(os.path.dirname(key_path), mode=0o700, exist_ok=True)
        try:
            descriptor = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            return self._load_or_create_private_key()
        except OSError as exc:
            raise SigningConfigurationError("The persistent development signing key could not be created.") from exc
        try:
            with os.fdopen(descriptor, "wb") as key_file:
                key_file.write(key_bytes)
                key_file.flush()
                os.fsync(key_file.fileno())
        except OSError as exc:
            try:
                os.remove(key_path)
            except OSError:
                pass
            raise SigningConfigurationError("The persistent development signing key could not be written.") from exc
        return key

    @staticmethod
    def canonical_manifest(manifest: dict[str, Any]) -> str:
        return json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

    @staticmethod
    def utc_timestamp(value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    def sign_manifest(self, manifest: dict[str, Any]) -> tuple[str, str, str, str]:
        canonical = self.canonical_manifest(manifest)
        private_key = self._load_or_create_private_key()
        signature = private_key.sign(canonical.encode("utf-8"), ec.ECDSA(hashes.SHA256()))
        public_key = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("ascii")
        trusted_key = self.trusted_public_key(settings.DOCUMENT_SIGNING_KEY_ID)
        if trusted_key != public_key:
            raise SigningConfigurationError("The configured public key does not match the document signing key.")
        return (
            canonical,
            base64.b64encode(signature).decode("ascii"),
            public_key,
            settings.DOCUMENT_SIGNING_KEY_ID,
        )

    def trusted_public_key(self, key_id: str) -> str | None:
        """Resolve a verification key from configured trust, never from the record itself."""
        configured_keys = settings.DOCUMENT_SIGNING_PUBLIC_KEYS_JSON
        if configured_keys:
            try:
                key_ring = json.loads(configured_keys)
                if not isinstance(key_ring, dict):
                    return None
                pem = key_ring.get(key_id)
                if not isinstance(pem, str):
                    return None
                public_key = serialization.load_pem_public_key(pem.encode("ascii"))
            except (ValueError, TypeError, UnicodeError, json.JSONDecodeError):
                return None
        else:
            if key_id != settings.DOCUMENT_SIGNING_KEY_ID or not os.path.isfile(self._key_path()):
                return None
            try:
                public_key = self._load_or_create_private_key().public_key()
            except SigningConfigurationError:
                return None

        if not isinstance(public_key, ec.EllipticCurvePublicKey) or not isinstance(public_key.curve, ec.SECP256R1):
            return None
        return public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("ascii")

    @staticmethod
    def verify_manifest(canonical_manifest: str, signature_value: str, public_key_pem: str) -> bool:
        try:
            parsed = json.loads(canonical_manifest)
            if DocumentCryptoService.canonical_manifest(parsed) != canonical_manifest:
                return False
            public_key = serialization.load_pem_public_key(public_key_pem.encode("ascii"))
            if not isinstance(public_key, ec.EllipticCurvePublicKey):
                return False
            signature = base64.b64decode(signature_value, validate=True)
            public_key.verify(
                signature,
                canonical_manifest.encode("utf-8"),
                ec.ECDSA(hashes.SHA256()),
            )
            return True
        except (InvalidSignature, ValueError, TypeError, UnicodeError, json.JSONDecodeError):
            return False

    @staticmethod
    def qr_svg_data_url(verification_url: str) -> str:
        qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
        qr.add_data(verification_url)
        qr.make(fit=True)
        image = qr.make_image(image_factory=SvgPathImage, fill_color="black", back_color="white")
        buffer = io.BytesIO()
        image.save(buffer)
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/svg+xml;base64,{encoded}"


document_crypto_service = DocumentCryptoService()
