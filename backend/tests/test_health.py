def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["application"] == "running"
    assert payload["database"] in {"healthy", "unavailable"}
    assert payload["migrations"] in {"applied", "not_applied", "unknown"}
    assert "message" in payload

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
