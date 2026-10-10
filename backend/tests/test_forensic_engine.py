from app.forensics.engine import analyze_registered_document
from app.models.organization import RegisteredDocument


class FakeQuery:
    def __init__(self, duplicate_count):
        self.duplicate_count = duplicate_count

    def filter(self, *_conditions):
        return self

    def count(self):
        return self.duplicate_count


class FakeDatabase:
    def __init__(self, duplicate_count=0):
        self.duplicate_count = duplicate_count

    def query(self, _model):
        return FakeQuery(self.duplicate_count)


class EmptyModelRegistry:
    def list_models(self):
        return []


def make_record():
    return RegisteredDocument(
        id="00000000-0000-0000-0000-000000000001",
        organization_id=3,
        sha256_hash="a" * 64,
        original_filename="credential.png",
    )


def test_invalid_hash_and_signature_are_high_risk_explainable_signals():
    analysis = analyze_registered_document(
        FakeDatabase(), make_record(), b"not an image", False, False, registry=EmptyModelRegistry()
    )

    assert analysis.risk_score == 100
    assert analysis.risk_level == "CRITICAL"
    assert "REGISTERED_CONTENT_HASH_MISMATCH" in analysis.reason_codes
    assert "ECDSA_SIGNATURE_INVALID" in analysis.reason_codes
    assert analysis.ml_signals == {}


def test_duplicate_hash_is_reported_separately_from_signature_verification():
    valid_png = b"\x89PNG\r\n\x1a\n" + b"content"
    analysis = analyze_registered_document(
        FakeDatabase(duplicate_count=1), make_record(), valid_png, True, True, registry=EmptyModelRegistry()
    )

    assert analysis.hash_matches is True
    assert analysis.signature_valid is True
    assert analysis.risk_score == 10
    assert analysis.reason_codes == ["REGISTERED_HASH_REUSE"]